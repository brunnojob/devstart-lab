from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1] / 'dist'


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []

    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if value and key in ('href', 'src'):
                self.urls.append(value)


checked = 0
for document in (ROOT / 'proofs').rglob('*.html'):
    parser = Links()
    parser.feed(document.read_text())
    for address in parser.urls:
        url = urlsplit(address)
        if url.scheme or url.netloc or not url.path:
            continue
        path = unquote(url.path)
        if path.startswith('/devstart-lab/'):
            target = ROOT / path[len('/devstart-lab/'):]
        elif path.startswith('/'):
            target = ROOT / path.lstrip('/')
        else:
            target = document.parent / path
        assert target.resolve().is_relative_to(ROOT), (document, address)
        assert target.exists(), (document, address)
        if target.is_dir():
            assert (target / 'index.html').exists(), (document, address)
        checked += 1
print(f'PASS: {checked} generated local links')
