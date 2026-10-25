import { uiEnglish } from '../data/ui.en';
import { projects } from '../data/projects';
import { roadmap } from '../data/roadmap';
import { projectEnglish } from '../data/projects.en';
import { roadmapEnglish } from '../data/roadmap.en';

export type Language = 'pt' | 'en';
const english: Record<string, string> = { ...uiEnglish };
for (const project of projects) {
  const entry = projectEnglish[project.id];
  if (!entry) throw new Error(`Missing project translation: ${project.id}`);
  english[project.title] = entry[0];
  english[project.summary] = entry[1];
  english[project.stretch] = entry[3];
  project.requirements.forEach((value, index) => {
    english[value] = entry[2][index];
  });
}
for (const step of roadmap) {
  const entry = roadmapEnglish[step.id];
  if (!entry) throw new Error(`Missing roadmap translation: ${step.id}`);
  english[step.title] = entry[0];
  english[step.summary] = entry[1];
  english[step.deliverable] = entry[2];
  english[step.resourceLabel] = entry[3];
  if (step.exercise && entry[4]) english[step.exercise] = entry[4];
}
export function translate(value: string, language: Language): string {
  if (language === 'pt') return value;
  const trimmed = value.trim();
  let translated = english[trimmed] ?? english[trimmed.replace(/\s+/g, ' ')];
  if (!translated) {
    const progress = /^(\d+) de (\d+) etapas concluídas$/.exec(trimmed);
    const count = /^(\d+) ideias? para explorar$/.exec(trimmed);
    if (progress)
      translated = `${progress[1]} of ${progress[2]} steps completed`;
    else if (count)
      translated = `${count[1]} ${count[1] === '1' ? 'idea' : 'ideas'} to explore`;
    else {
      for (const [prefix, replacement] of [
        ['Entrega: ', 'Deliverable: '],
        ['Próximo nível: ', 'Next level: '],
        ['Concluir etapa ', 'Complete step '],
        ['Salvar ideia: ', 'Save idea: '],
        ['Remover dos salvos: ', 'Remove saved idea: '],
        ['Sugestão: ', 'Suggestion: '],
      ]) {
        if (trimmed.startsWith(prefix)) {
          translated =
            replacement + translate(trimmed.slice(prefix.length), language);
          break;
        }
      }
      if (!translated && trimmed.endsWith(' ↗'))
        translated = translate(trimmed.slice(0, -2), language) + ' ↗';
    }
  }
  return translated ? value.replace(trimmed, translated) : value;
}

type Source = { original: string; output: string };
const textSources = new WeakMap<Node, Source>();
const attributeSources = new WeakMap<Element, Map<string, Source>>();
export function translateDOM(root: HTMLElement, language: Language): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (
      node.parentElement?.closest(
        'pre, code, script, style, [data-no-translate]',
      )
    )
      continue;
    const current = node.nodeValue ?? '';
    const previous = textSources.get(node);
    const original =
      previous && current === previous.output ? previous.original : current;
    const output = translate(original, language);
    if (current !== output) node.nodeValue = output;
    textSources.set(node, { original, output });
  }
  for (const element of [
    root,
    ...root.querySelectorAll<HTMLElement>(
      '[aria-label], [aria-valuetext], [placeholder]',
    ),
  ]) {
    const sources = attributeSources.get(element) ?? new Map<string, Source>();
    for (const name of ['aria-label', 'aria-valuetext', 'placeholder']) {
      const current = element.getAttribute(name);
      if (current === null) continue;
      const previous = sources.get(name);
      const original =
        previous && current === previous.output ? previous.original : current;
      const output = translate(original, language);
      if (current !== output) element.setAttribute(name, output);
      sources.set(name, { original, output });
    }
    attributeSources.set(element, sources);
  }
}
