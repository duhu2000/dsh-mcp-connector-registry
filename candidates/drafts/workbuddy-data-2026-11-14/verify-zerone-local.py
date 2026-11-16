#!/usr/bin/env python3
"""Local one-call acceptance. Never accepts a key in argv, env or files."""
import datetime
import getpass
import hashlib
import json
import os
from pathlib import Path
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

ENDPOINT = "https://ai.zerone.com.cn/mcp/pe"
RUN_ID = "zerone-pe-20261116-once"
LIMIT = 2_000_000


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def receive(response, request_id):
    if "text/event-stream" not in response.headers.get("Content-Type", ""):
        raw = response.read(LIMIT + 1)
        if len(raw) > LIMIT:
            raise ValueError("oversize")
        value = json.loads(raw)
        if value.get("id") != request_id:
            raise ValueError("response id mismatch")
        return value
    data, size, started = [], 0, time.monotonic()
    while True:
        line = response.readline(LIMIT + 1)
        size += len(line)
        if size > LIMIT or time.monotonic() - started > 60:
            raise ValueError("response limit")
        if line.strip() == b"":
            if data:
                value = json.loads(b"\n".join(data))
                if value.get("id") == request_id:
                    return value
                data = []
            if not line:
                raise ValueError("missing response")
        elif line.startswith(b"data:"):
            data.append(line[5:].strip())


def table_count(value):
    """Count documented table descriptors; never export names or contents."""
    tables = set()

    def walk(item, depth=0):
        if depth > 30:
            return
        if isinstance(item, dict):
            name = item.get("table_name")
            if isinstance(name, str) and re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]{0,127}", name):
                tables.add(name)
            for key, child in item.items():
                if key == "text" and isinstance(child, str):
                    try:
                        walk(json.loads(child), depth + 1)
                    except (ValueError, RecursionError):
                        pass
                else:
                    walk(child, depth + 1)
        elif isinstance(item, list):
            for child in item:
                walk(child, depth + 1)

    walk(value)
    return len(tables)


def rpc(opener, url, headers, method, params, request_id=None):
    payload = {"jsonrpc": "2.0", "method": method, "params": params}
    if request_id is not None:
        payload["id"] = request_id
    request = urllib.request.Request(url, json.dumps(payload).encode(), headers, method="POST")
    with opener.open(request, timeout=30) as response:
        session = response.headers.get("Mcp-Session-Id")
        if session:
            headers["Mcp-Session-Id"] = session
        if request_id is None:
            return None
        result = receive(response, request_id)
        if result.get("jsonrpc") != "2.0" or "error" in result or "result" not in result:
            raise ValueError("protocol failure")
        return result["result"]


def main():
    if len(sys.argv) != 1 or not sys.stdin.isatty():
        print("请直接在本机终端运行脚本；不接受参数、管道或环境变量中的 Key。")
        return 2
    folder = Path.home() / ".dsh" / "acceptance"
    folder.mkdir(mode=0o700, parents=True, exist_ok=True)
    claim = folder / (RUN_ID + ".claim")
    report_path = folder / (RUN_ID + ".json")
    if claim.exists():
        print("本次一次性调用许可已使用或结果待确认；不会重试。请先核对现有验收报告。")
        return 2
    print("仅 PE get_available_tables 一次，按实际单次扣费；不重试、不查企业、不下载。")
    print("输入的 Key 不显示、不落盘；仅发送给 ai.zerone.com.cn。")
    key = getpass.getpass("在本机粘贴执中 Key（输入隐藏）：").strip()
    if not key:
        print("未输入 Key，未发送请求。")
        return 2
    url = ENDPOINT + "?" + urllib.parse.urlencode({"api_key": key})
    headers = {"Content-Type": "application/json", "Accept": "application/json, text/event-stream"}
    opener = urllib.request.build_opener(NoRedirect())
    report = {"endpoint": ENDPOINT, "checkedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
              "credentialSource": "local-hidden-input", "tool": "get_available_tables", "arguments": {},
              "businessCallAttempts": 0, "automaticRetries": 0, "status": "not-run",
              "scope": "PE table-directory only; base and all other tools untested",
              "billing": "User approved one actual-price call; actual charge not independently verified"}
    phase = "initialize"
    try:
        init = rpc(opener, url, headers, "initialize", {"protocolVersion": "2025-03-26", "capabilities": {},
                   "clientInfo": {"name": "dsh-zerone-local-acceptance", "version": "1.0.0"}}, 1)
        headers["MCP-Protocol-Version"] = init["protocolVersion"]
        rpc(opener, url, headers, "notifications/initialized", {})
        phase = "tools/list"
        listing = rpc(opener, url, headers, "tools/list", {}, 2)
        names = {item.get("name") for item in listing.get("tools", [])}
        report["discoveredToolCount"] = len(names)
        if "get_available_tables" not in names:
            raise ValueError("approved tool unavailable")
        # Claim BEFORE sending. A lost response cannot trigger an accidental second charge.
        fd = os.open(claim, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        os.close(fd)
        report["businessCallAttempts"] = 1
        phase = "tools/call"
        result = rpc(opener, url, headers, "tools/call", {"name": "get_available_tables", "arguments": {}}, 3)
        report["responseSha256"] = hashlib.sha256(json.dumps(result, sort_keys=True).encode()).hexdigest()
        report["isError"] = result.get("isError") is True
        report["tableDescriptorCount"] = table_count(result)
        # Transport success alone is not a business PASS. Reviewer checks this bounded evidence.
        report["status"] = "tool-error" if report["isError"] else "needs-review"
        report["structuredTableDirectoryObserved"] = report["tableDescriptorCount"] > 0 and not report["isError"]
    except Exception as error:
        report["status"] = "failed-or-unknown"
        report["phase"] = phase
        report["errorType"] = type(error).__name__
        if isinstance(error, urllib.error.HTTPError):
            report["httpStatus"] = error.code
        # Never print exception text, URLs, response bodies or headers: they may contain the Key.
    finally:
        key = url = None
        headers.clear()
    fd = os.open(report_path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w") as stream:
        json.dump(report, stream, ensure_ascii=False, indent=2)
        stream.write("\n")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    print("脱敏验收报告：", report_path)
    return 0 if report["status"] == "needs-review" else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (KeyboardInterrupt, EOFError):
        print("\n已中止；如已发送业务调用，保留一次性标记，不自动重试。")
