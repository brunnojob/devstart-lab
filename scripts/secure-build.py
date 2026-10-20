import re
from html import escape
from pathlib import Path


def secure_document(document):
    source = document.read_text(encoding='utf-8')
    wasm = (document.parent / 'program.wasm').is_file()
    scripts = "'self' 'wasm-unsafe-eval'" if wasm else "'self'"
    connect = "'self' https://api.github.com" if document.parent.parent.name == 'proofs' else "'self'"
    workers = "'self'" if wasm else "'none'"
    policy = '; '.join([
        "default-src 'none'", f'script-src {scripts}',
        "style-src 'self' https://fonts.googleapis.com",
        "font-src https://fonts.gstatic.com", "img-src 'self' data:",
        f'connect-src {connect}', f'worker-src {workers}',
        "base-uri 'none'", "object-src 'none'", "form-action 'none'"
    ])
    if re.search(r'<meta\s+http-equiv=["\']Content-Security-Policy', source, re.I):
        raise ValueError(f'Duplicate security policy: {document}')
    meta = f'<meta http-equiv="Content-Security-Policy" content="{escape(policy, quote=True)}"><meta name="referrer" content="strict-origin-when-cross-origin">'
    secured, count = re.subn(r'(<head\b[^>]*>\s*<meta\s+charset=[^>]+>)', lambda match: match[1] + meta, source, count=1, flags=re.I)
    if count != 1:
        raise ValueError(f'Missing early charset declaration: {document}')
    document.write_text(secured, encoding='utf-8')


if __name__ == '__main__':
    documents = list(Path('dist').rglob('*.html'))
    if not documents:
        raise ValueError('No production HTML found')
    for document in documents:
        secure_document(document)
    print(f'Applied security policy to {len(documents)} HTML documents')
