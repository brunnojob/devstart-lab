import importlib.util
import json
import tempfile
import unittest
from pathlib import Path


def load(name):
    spec = importlib.util.spec_from_file_location(name.replace('-', '_'), Path('scripts') / f'{name}.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


builder = load('build-proofs')
security = load('secure-build')
auditor = load('check-build')


class SecurityTests(unittest.TestCase):
    def test_catalog_rejects_path_traversal_and_active_urls(self):
        builder.validate_catalog(builder.CATALOG)
        for field, value in [('name', '../escape'), ('name', 'x" onclick="alert(1)'), ('run_url', 'javascript:alert(1)'), ('sha', 'main'), ('workflow', '../secret'), ('branch', 'main" autofocus'), ('parent', '../escape')]:
            item = dict(builder.CATALOG[0], **{field: value})
            with self.subTest(field=field, value=value), self.assertRaises(ValueError):
                builder.validate_catalog([item])

    def test_generated_policy_restricts_scripts_and_wasm(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            document = root / 'index.html'
            source = '<!doctype html><html><head><meta charset="utf-8"></head><body><script src="./app.js"></script></body></html>'
            document.write_text(source)
            security.secure_document(document)
            auditor.check_build(root)
            self.assertNotIn('wasm-unsafe-eval', document.read_text())
            document.write_text(source)
            (root / 'program.wasm').write_bytes(b'wasm')
            security.secure_document(document)
            self.assertIn('wasm-unsafe-eval', document.read_text())

    def test_build_rejects_injected_executable_markup(self):
        for markup in ['<script>alert(1)</script>', '<script src="https://example.com/code.js"></script>', '<img src="x" onerror="alert(1)">', '<iframe srcdoc="x"></iframe>', '<a href="javascript:alert(1)">x</a>']:
            with self.subTest(markup=markup), tempfile.TemporaryDirectory() as temporary:
                root = Path(temporary)
                document = root / 'index.html'
                document.write_text('<html><head><meta charset="utf-8"></head><body>' + markup + '</body></html>')
                security.secure_document(document)
                with self.assertRaises(ValueError):
                    auditor.check_build(root)

    def test_workflows_pin_actions_and_limit_credentials(self):
        import re
        for workflow in Path('.github/workflows').glob('*.yml'):
            content = workflow.read_text()
            for reference in re.findall(r'uses:\s*(\S+)', content):
                self.assertRegex(reference, r'^[\w-]+/[\w-]+@[a-f0-9]{40}$')
            self.assertIn('persist-credentials: false', content)


if __name__ == '__main__':
    unittest.main()
