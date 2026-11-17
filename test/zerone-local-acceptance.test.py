import contextlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import urllib.parse

SOURCE = Path(__file__).resolve().parents[1] / 'candidates/drafts/workbuddy-data-2026-11-14/verify-zerone-local.py'
SPEC = importlib.util.spec_from_file_location('zerone_probe', SOURCE)
probe = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(probe)
BASE_SPEC = importlib.util.spec_from_file_location('zerone_base_probe', SOURCE.with_name('verify-zerone-base-local.py'))
base_probe = importlib.util.module_from_spec(BASE_SPEC)
BASE_SPEC.loader.exec_module(base_probe)


class AcceptanceTests(unittest.TestCase):
    def run_local(self, home, fail=False):
        key = 'test secret +/?&=中文'
        calls = []

        def rpc(opener, url, headers, method, params, request_id=None):
            self.assertEqual(urllib.parse.parse_qs(urllib.parse.urlsplit(url).query)['api_key'], [key])
            calls.append((method, params))
            if method == 'initialize':
                return {'protocolVersion': '2025-03-26'}
            if method == 'tools/list':
                return {'tools': [{'name': 'get_available_tables'}]}
            if method == 'tools/call':
                if fail:
                    raise RuntimeError('Error at ' + url + ' ' + key)
                return {'content': [{'type': 'text', 'text': json.dumps([{'table_name': 'fund'}, {'table_name': 'fund'}])}]}

        output = io.StringIO()
        with patch.object(probe.Path, 'home', return_value=home), patch.object(probe.sys, 'argv', ['probe']), \
             patch.object(probe.sys.stdin, 'isatty', return_value=True), \
             patch.object(probe.getpass, 'getpass', return_value=key), \
             patch.object(probe, 'rpc', side_effect=rpc), contextlib.redirect_stdout(output):
            result = probe.main()
        self.assertNotIn(key, output.getvalue())
        self.assertNotIn('api_key=', output.getvalue())
        return result, calls

    def test_exactly_one_call_and_no_secret_saved(self):
        with tempfile.TemporaryDirectory() as directory:
            home = Path(directory)
            result, calls = self.run_local(home)
            self.assertEqual(result, 0)
            business = [p for m, p in calls if m == 'tools/call']
            self.assertEqual(business, [{'name': 'get_available_tables', 'arguments': {}}])
            report = json.loads((home / '.dsh/acceptance' / (probe.RUN_ID + '.json')).read_text())
            self.assertEqual(report['tableDescriptorCount'], 1)
            self.assertEqual(report['status'], 'needs-review')
            self.assertTrue(report['structuredTableDirectoryObserved'])
            result, calls = self.run_local(home)
            self.assertEqual((result, calls), (2, []))
            for file in (home / '.dsh/acceptance').iterdir():
                self.assertNotIn('api_key=', file.read_text())
                self.assertNotIn('test secret', file.read_text())
                self.assertEqual(file.stat().st_mode & 0o777, 0o600)

    def test_ambiguous_network_failure_consumes_once_permission(self):
        with tempfile.TemporaryDirectory() as directory:
            home = Path(directory)
            result, calls = self.run_local(home, fail=True)
            self.assertEqual(result, 1)
            self.assertEqual(sum(m == 'tools/call' for m, _ in calls), 1)
            result, calls = self.run_local(home)
            self.assertEqual((result, calls), (2, []))

    def test_redirect_is_not_followed(self):
        self.assertIsNone(probe.NoRedirect().redirect_request(None, None, 302, '', {}, 'https://other.example/?api_key=test'))

    def test_refuses_echoing_key_input(self):
        with tempfile.TemporaryDirectory() as directory, \
             patch.object(probe.Path, 'home', return_value=Path(directory)), \
             patch.object(probe.sys, 'argv', ['probe']), \
             patch.object(probe.sys.stdin, 'isatty', return_value=True), \
             patch.object(probe.getpass, 'getpass', side_effect=probe.getpass.GetPassWarning()), \
             patch.object(probe, 'rpc') as rpc, contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(probe.main(), 2)
            rpc.assert_not_called()

    def test_patent_report_preserves_sampling_without_exporting_records(self):
        result = {'content': [{'type': 'text', 'text': json.dumps({'items': [{'title': 'private sample', 'person': 'not exported'}], 'count': 100, 'sampled': True})}]}
        summary = base_probe.patent_summary(result)
        self.assertEqual(summary['patentResultShapes'], [{'itemsLength': 1, 'count': 100, 'sampled': True}])
        self.assertTrue(summary['structuredPatentResultObserved'])
        self.assertNotIn('private sample', json.dumps(summary))
        self.assertNotIn('person', json.dumps(summary))
        self.assertIn('needs-review', summary['resultInterpretation'])

    def test_patent_error_and_empty_result_never_auto_pass(self):
        for result in [{'isError': True, 'structuredContent': {'items': []}}, {'content': [{'type': 'text', 'text': 'not JSON'}]}]:
            self.assertFalse(base_probe.patent_summary(result)['structuredPatentResultObserved'])
        empty = base_probe.patent_summary({'structuredContent': {'items': [], 'count': 0}})
        self.assertEqual(empty['patentResultShapes'], [{'itemsLength': 0, 'count': 0}])
        self.assertIn('needs-review', empty['resultInterpretation'])

    def test_sse_ignores_unrelated_ids(self):
        response = io.BytesIO(b'data: {"id":99,"result":{}}\n\ndata: {"id":3,"result":{"ok":true}}\n\n')
        response.headers = {'Content-Type': 'text/event-stream'}
        self.assertEqual(probe.receive(response, 3)['result'], {'ok': True})


if __name__ == '__main__':
    unittest.main()
