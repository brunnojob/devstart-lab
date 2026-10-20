import gzip
from html.parser import HTMLParser
from pathlib import Path


class Audit(HTMLParser):
    def __init__(self):
        super().__init__()
        self.policies = []
        self.script = False

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == 'meta' and values.get('http-equiv', '').lower() == 'content-security-policy':
            self.policies.append(values['content'])
        if tag == 'script':
            if not values.get('src') or values['src'].startswith(('http:', 'https:', '//')):
                raise ValueError('Inline or remote executable script')
            self.script = True
        for name, value in attrs:
            if name.lower().startswith('on') or name.lower() == 'srcdoc':
                raise ValueError('Inline event handler or embedded HTML')
            if name in ('src', 'href', 'action') and value and value.strip().lower().startswith(('javascript:', 'http:')):
                raise ValueError('Unsafe URL')


def check_build(root):
    documents = list(root.rglob('*.html'))
    if not documents:
        raise ValueError('No HTML to audit')
    for document in documents:
        audit = Audit()
        audit.feed(document.read_text(encoding='utf-8'))
        if len(audit.policies) != 1:
            raise ValueError(f'Missing unique CSP: {document}')
        policy = audit.policies[0]
        for directive in ("default-src 'none'", "object-src 'none'", "base-uri 'none'", "form-action 'none'"):
            if directive not in policy:
                raise ValueError(f'Missing {directive}: {document}')
        if "'unsafe-eval'" in policy or "'unsafe-inline'" in policy:
            raise ValueError(f'Unsafe CSP: {document}')
    if list(root.rglob('*.map')):
        raise ValueError('Production source maps must not be published')
    total = sum(path.stat().st_size for path in root.rglob('*') if path.is_file())
    if total > 50 * 1024 * 1024:
        raise ValueError('Published site exceeds the 50 MiB budget')
    main_assets = list((root / 'assets').glob('*'))
    compressed = sum(len(gzip.compress(path.read_bytes())) for path in main_assets if path.is_file())
    if compressed > 150 * 1024:
        raise ValueError('Main application exceeds the 150 KiB gzip budget')
    print(f'PASS: {len(documents)} HTML policies; site {total:,} bytes; application assets {compressed:,} bytes gzip')


if __name__ == '__main__':
    check_build(Path('dist'))
