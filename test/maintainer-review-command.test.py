import importlib.util
import unittest
from pathlib import Path
from unittest.mock import Mock

path = Path(__file__).resolve().parents[1] / "scripts/record-maintainer-review.py"
spec = importlib.util.spec_from_file_location("registry_review_command", path)
command = importlib.util.module_from_spec(spec)
spec.loader.exec_module(command)
sha = "a" * 40
pr = {"state": "open", "draft": False, "node_id": "PR_9", "head": {
    "sha": sha, "ref": "card", "repo": {"full_name": "external/registry"}}}


class ReviewCommand(unittest.TestCase):
    def test_missing_feedback_and_wrong_head_do_not_publish(self):
        api = Mock()
        for feedback in ("", " https://github.com/up/repo/pull/8 "):
            with self.assertRaises(ValueError):
                command.record(api, 9, sha, "pass", feedback)
        api.request.assert_not_called()
        api.request.return_value = pr
        with self.assertRaises(ValueError):
            command.record(api, 9, "b" * 40, "pass", "Scope verified")
        self.assertEqual(api.request.call_count, 1)

    def test_withdrawal_blocks_ready_pr_before_publishing(self):
        api = Mock()
        api.request.side_effect = [pr, {"data": {"convertPullRequestToDraft": {"pullRequest": {"isDraft": True}}}},
                                   dict(pr, draft=True), {"id": 10, "commit_id": sha, "state": "COMMENTED",
                                    "html_url": "https://github.com/" + command.REPO + "/pull/9#pullrequestreview-10"}]
        command.record(api, 9, sha, "withdraw", "Check the listed scope")
        calls = api.request.call_args_list
        self.assertEqual(calls[1].args[0], "graphql")
        self.assertEqual(calls[3].args[2]["event"], "COMMENT")
        self.assertEqual(calls[3].args[2]["commit_id"], sha)

    def test_refresh_reuses_only_the_original_named_run_and_gate(self):
        api = Mock()
        run = {"id": 5, "head_sha": sha, "head_branch": "card", "head_repository": pr["head"]["repo"],
               "display_title": "Registry CI / PR #9", "status": "completed", "run_attempt": 1, "html_url": "run/5"}
        api.request.side_effect = [pr, {"workflow_runs": [run, dict(run, id=8, display_title="Registry CI / PR #8")]},
                                   {"jobs": [{"id": 7, "name": "validate"}]}, None]
        command.refresh(api, 9, sha)
        self.assertTrue(api.request.call_args_list[2].args[0].endswith("runs/5/jobs?filter=latest&per_page=100"))
        self.assertEqual(api.request.call_args_list[3].args, (command.ROOT + "actions/jobs/7/rerun", "POST"))


if __name__ == "__main__":
    unittest.main()
