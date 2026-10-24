import translations from './translations.mjs';

const reverse = Object.fromEntries(Object.entries(translations).map(([pt, en]) => [en, pt]));
let language = 'pt';
try { language = localStorage.getItem('devstart-language') === 'en' ? 'en' : 'pt'; } catch {}
const requested = new URL(location.href).searchParams.get('lang');
if (requested === 'en' || requested === 'pt') language = requested;
try { localStorage.setItem('devstart-language', language); } catch {}
export const locale = language;
export function t(value) {
  const dictionary = language === 'en' ? translations : reverse;
  if (dictionary[value]) return dictionary[value];
  if (value.endsWith(' | Brunno Dev')) return t(value.slice(0, -13)) + ' | Brunno Dev';
  const eyebrow = /^(.*?) \/ (Demo executável|Execução registrada|código original do repositório)$/.exec(value);
  if (eyebrow) return `${eyebrow[1]} / ${t(eyebrow[2])}`;
  const count = /^(\d+) projetos encontrados$/.exec(value);
  if (count) return language === 'en' ? `${count[1]} projects found` : value;
  const exit = /^Saída: (\d+) · esperada: (\d+) · (.+) s$/.exec(value);
  if (exit && language === 'en') return `Exit: ${exit[1]} · expected: ${exit[2]} · ${exit[3]} s`;
  return value.split(/(?<=\.)\s+(?=[A-ZÀ-Ú])/u).map(part => dictionary[part] ?? part).join(' ');
}
const sources = new WeakMap();
function translateNode(node) {
  const current = node.nodeValue;
  const previous = sources.get(node);
  const original = previous && previous.output === current ? previous.original : current;
  const trimmed = original.trim();
  const output = trimmed ? original.replace(trimmed, t(trimmed)) : original;
  if (current !== output) node.nodeValue = output;
  sources.set(node, { original, output });
}
function translatePage() {
  document.documentElement.lang = language === 'en' ? 'en' : 'pt-BR';
  const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.parentElement?.closest('script, style, pre, code, [data-no-translate]')) translateNode(node);
  }
  for (const element of document.querySelectorAll('[placeholder], [aria-label], meta[name="description"]')) {
    for (const attr of ['placeholder', 'aria-label', 'content']) {
      if (element.hasAttribute(attr)) element.setAttribute(attr, t(element.getAttribute(attr)));
    }
  }
  for (const link of document.querySelectorAll('a[href]')) {
    const url = new URL(link.getAttribute('href'), location.href);
    if (url.origin !== location.origin || !url.pathname.endsWith('/')) continue;
    url.searchParams.set('lang', language);
    if (link.href !== url.href) link.href = url.href;
  }
}
translatePage();
const selector = document.querySelector('#locale');
if (selector) {
  selector.value = language;
  selector.addEventListener('change', () => {
    const url = new URL(location.href);
    url.searchParams.set('lang', selector.value);
    location.href = url.href;
  });
}
new MutationObserver(translatePage).observe(document.body, { childList: true, subtree: true, characterData: true });
