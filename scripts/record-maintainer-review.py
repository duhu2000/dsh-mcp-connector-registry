#!/usr/bin/env python3
"""Record a maintainer review or refresh the original read-only PR validation."""
import argparse
import json
import os
import re
import subprocess
import time
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import HTTPRedirectHandler, Request, build_opener

REPO = "duhu2000/dsh-mcp-connector-registry"
API = "https://api.github.com/"
ROOT = "repos/" + REPO + "/"


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, *args):
        return None


class Registry:
    def __init__(self):
        self.token = os.environ.get("GH_TOKEN")
        if not self.token:
            result = subprocess.run(
                ["git", "credential", "fill"], input="protocol=https\nhost=github.com\n\n",
                text=True, capture_output=True, check=True,
            )
            self.token = dict(line.split("=", 1) for line in result.stdout.splitlines() if "=" in line)["password"]
        self.http = build_opener(NoRedirect())

    def request(self, path, method="GET", payload=None):
        req = Request(API + path, method=method, headers={
            "Authorization": "Bearer " + self.token, "Accept": "application/vnd.github+json",
            "User-Agent": "Registry-maintainer-review", "Content-Type": "application/json",
        }, data=json.dumps(payload).encode() if payload is not None else None)
        with self.http.open(req, timeout=30) as response:
            body = response.read()
            return json.loads(body) if body else None


def current_pr(api, number, sha):
    pr = api.request(ROOT + f"pulls/{number}")
    if pr["state"] != "open" or pr["head"]["sha"] != sha:
        raise ValueError("PR closed or head changed; verify the current revision first.")
    return pr


def record(api, number, sha, decision, feedback):
    if not feedback.strip() or re.fullmatch(r"https?://\S+", feedback.strip(), re.I):
        raise ValueError("Include the public scope or requested correction in the review itself.")
    pr = current_pr(api, number, sha)
    # Block merging immediately while the asynchronous required check is refreshed.
    if decision == "withdraw" and not pr["draft"]:
        data = api.request("graphql", "POST", {
            "query": "mutation($id:ID!){convertPullRequestToDraft(input:{pullRequestId:$id}){pullRequest{isDraft}}}",
            "variables": {"id": pr["node_id"]},
        })
        if not (data.get("data", {}).get("convertPullRequestToDraft") or {}).get("pullRequest", {}).get("isDraft"):
            raise RuntimeError("Could not confirm the draft interlock; stop and inspect the PR.")
    current_pr(api, number, sha)
    review = api.request(ROOT + f"pulls/{number}/reviews", "POST", {
        "event": "COMMENT", "commit_id": sha, "body": f"Registry verification: {decision}\n\n{feedback.strip()}",
    })
    url = f"https://github.com/{REPO}/pull/{number}#pullrequestreview-{review['id']}"
    if review["html_url"] != url or review["commit_id"] != sha or review["state"] != "COMMENTED":
        raise RuntimeError("Could not verify the published feedback on this PR.")
    print("Feedback:", url, flush=True)


def refresh(api, number, sha):
    # Multiple notifications for a SHA may overlap. A caller only finishes once
    # GitHub has accepted a new evaluation after it observed the review.
    deadline = time.monotonic() + 600
    while time.monotonic() < deadline:
        pr = current_pr(api, number, sha)
        listing = api.request(ROOT + f"actions/workflows/ci.yml/runs?event=pull_request&head_sha={sha}&per_page=100")
        matches = [r for r in listing["workflow_runs"] if r["head_sha"] == sha
                   and r["display_title"] == f"Registry CI / PR #{number}"
                   and (r.get("head_repository") or {}).get("full_name") == pr["head"]["repo"]["full_name"]
                   and r["head_branch"] == pr["head"]["ref"]]
        if not matches:
            time.sleep(4)
            continue
        run = max(matches, key=lambda r: r["id"])
        if run["status"] != "completed":
            time.sleep(4)
            continue
        jobs = api.request(ROOT + f"actions/runs/{run['id']}/jobs?filter=latest&per_page=100")["jobs"]
        gate = next((j for j in jobs if j["name"] == "validate"), None)
        if gate is None:
            raise RuntimeError("The original PR run has no validate job.")
        try:
            api.request(ROOT + f"actions/jobs/{gate['id']}/rerun", "POST")
        except HTTPError as error:
            if error.code not in (403, 409, 422):
                raise
            other = api.request(ROOT + f"actions/runs/{run['id']}")
            if other["status"] == "completed" and other["run_attempt"] == run["run_attempt"]:
                raise
            continue
        print("Validation queued:", run["html_url"], "after attempt", run["run_attempt"], flush=True)
        return
    raise RuntimeError("Timed out waiting for the original PR run. Refresh the same PR and SHA again.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=("refresh", "pass", "withdraw"))
    parser.add_argument("pr", type=int)
    parser.add_argument("sha")
    parser.add_argument("feedback", type=Path, nargs="?")
    args = parser.parse_args()
    if args.pr < 1 or not re.fullmatch("[0-9a-f]{40}", args.sha):
        parser.error("A positive PR number and a full lowercase commit SHA are required.")
    if bool(args.feedback) != (args.action != "refresh"):
        parser.error("Supply a UTF-8 feedback file for pass or withdraw.")
    api = Registry()
    if args.feedback:
        record(api, args.pr, args.sha, args.action, args.feedback.read_text(encoding="utf-8-sig"))
    refresh(api, args.pr, args.sha)


if __name__ == "__main__":
    main()
