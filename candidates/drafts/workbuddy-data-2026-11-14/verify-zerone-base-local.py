#!/usr/bin/env python3
"""One separately approved patent query; reuses hidden input and no-retry safeguards."""
import importlib.util
import json
import os
from pathlib import Path
import selectors
import shutil
import subprocess
import urllib.parse

spec = importlib.util.spec_from_file_location("zerone_acceptance", Path(__file__).with_name("verify-zerone-local.py"))
acceptance = importlib.util.module_from_spec(spec)
spec.loader.exec_module(acceptance)


def patent_summary(result):
    # Export only numeric/boolean structural facts, never patent/customer/person details.
    observations = []

    def walk(value, depth=0):
        if depth > 30:
            return
        if isinstance(value, dict):
            if isinstance(value.get("items"), list):
                item = {"itemsLength": len(value["items"])}
                if type(value.get("count")) is int and value["count"] >= 0:
                    item["count"] = value["count"]
                if type(value.get("sampled")) is bool:
                    item["sampled"] = value["sampled"]
                observations.append(item)
            for key, child in value.items():
                if key == "text" and isinstance(child, str):
                    try:
                        walk(json.loads(child), depth + 1)
                    except (ValueError, RecursionError):
                        pass
                elif key != "items":
                    walk(child, depth + 1)
        elif isinstance(value, list):
            for child in value:
                walk(child, depth + 1)

    walk(result)
    return {"acceptanceTransport": "stdio-bridge" if os.environ.get("DSH_ZERONE_BRIDGE_SCRIPT") else "direct-http",
            "patentResultShapes": observations[:10],
            "structuredPatentResultObserved": bool(observations) and result.get("isError") is not True,
            "resultInterpretation": "needs-review; empty items can be valid, but do not prove patents exist"}


class LocalBridge:
    """Exercise the actual stdio bridge; credential is passed in child env only."""
    def __init__(self, script):
        self.script = str(Path(script).resolve(strict=True))
        self.process = None

    def rpc(self, opener, url, headers, method, params, request_id=None):
        if self.process is None:
            node = shutil.which("node")
            if not node:
                raise RuntimeError("node required")
            env = dict(os.environ)
            env["ZERONE_API_KEY"] = urllib.parse.parse_qs(urllib.parse.urlsplit(url).query)["api_key"][0]
            try:
                self.process = subprocess.Popen([node, self.script, "--service", "base"], env=env,
                                                stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                                stderr=subprocess.DEVNULL, bufsize=0)
            finally:
                env.pop("ZERONE_API_KEY", None)
        message = {"jsonrpc": "2.0", "method": method, "params": params}
        if request_id is not None:
            message["id"] = request_id
        self.process.stdin.write((json.dumps(message) + "\n").encode())
        self.process.stdin.flush()
        if request_id is None:
            return None
        with selectors.DefaultSelector() as selector:
            selector.register(self.process.stdout, selectors.EVENT_READ)
            raw = bytearray()
            deadline = acceptance.time.monotonic() + 70
            while b"\n" not in raw:
                remaining = deadline - acceptance.time.monotonic()
                if remaining <= 0 or not selector.select(remaining):
                    raise TimeoutError("bridge response timeout")
                chunk = os.read(self.process.stdout.fileno(), 65536)
                if not chunk:
                    raise RuntimeError("bridge ended")
                raw.extend(chunk)
                if len(raw) > acceptance.LIMIT:
                    raise ValueError("response too large")
        response = json.loads(raw)
        if response.get("id") != request_id or "error" in response or "result" not in response:
            raise ValueError("bridge protocol error")
        return response["result"]

    def close(self):
        if self.process is None:
            return
        try:
            self.process.stdin.close()
            self.process.wait(timeout=5)
        except (BrokenPipeError, subprocess.TimeoutExpired):
            self.process.kill()
            self.process.wait()


if __name__ == "__main__":
    bridge = None
    try:
        if os.environ.get("DSH_ZERONE_BRIDGE_SCRIPT"):
            bridge = LocalBridge(os.environ["DSH_ZERONE_BRIDGE_SCRIPT"])
            acceptance.rpc = bridge.rpc
        raise SystemExit(acceptance.main(
            endpoint="https://ai.zerone.com.cn/mcp/base",
            run_id="zerone-base-20261116-once", tool="get_patent_info",
            arguments={"searchKey": "宁德时代新能源科技股份有限公司", "patent_type": "发明授权", "status": "有效"},
            scope="base get_patent_info single-company query only; no entity_search, pagination or fulltext download",
            summarize=patent_summary, confirm_charge=True,
        ))
    except (KeyboardInterrupt, EOFError):
        print("\n已中止；如已发送业务请求，保留一次性标记，不自动重试。")
    finally:
        if bridge:
            bridge.close()
