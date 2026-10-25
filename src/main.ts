import './styles.css';
import { createPage } from './ui/page';
import { translateDOM, type Language } from './lib/i18n';
import { roadmap } from './data/roadmap';
import { projects, type Difficulty, type Project } from './data/projects';
import { achievements } from './data/achievements';
import { filterProjects, recommendProject } from './lib/catalog';
import { gitCommands, gitDefaults, type GitFlow } from './lib/git-commands';
import {
  parseProgress,
  readProgress,
  writeProgress,
  type Progress,
} from './lib/storage';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Elemento principal não encontrado.');

let language: Language = 'pt';
let theme: 'light' | 'dark' = 'dark';
try {
  language = localStorage.getItem('devstart-language') === 'en' ? 'en' : 'pt';
  const storedTheme = localStorage.getItem('devstart-theme');
  if (storedTheme === 'light' || storedTheme === 'dark') theme = storedTheme;
} catch {}
const requestedLanguage = new URL(location.href).searchParams.get('lang');
if (requestedLanguage === 'pt' || requestedLanguage === 'en')
  language = requestedLanguage;
try {
  localStorage.setItem('devstart-language', language);
} catch {}

function refreshTranslations(): void {
  document.documentElement.lang = language === 'pt' ? 'pt-BR' : 'en';
  document.documentElement.dataset.theme = theme;
  document.title =
    language === 'pt'
      ? 'DevStart Lab — da lógica ao primeiro PR'
      : 'DevStart Lab — from logic to your first PR';
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute(
      'content',
      language === 'pt'
        ? 'Aprenda lógica de programação e GitHub com exercícios, exemplos, ideias de projetos e uma trilha para o primeiro PR.'
        : 'Learn programming logic and GitHub with exercises, examples, project ideas and a path to your first PR.',
    );
  translateDOM(document.body, language);
  document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((link) => {
    if (link.origin === location.origin && link.pathname.endsWith('/proofs/'))
      link.search = `?lang=${language}`;
    if (link.hostname === 'docs.github.com')
      link.pathname = link.pathname.replace(
        /^\/(pt|en)\//,
        `/${language === 'en' ? 'en' : 'pt'}/`,
      );
  });
  document
    .querySelector<HTMLSelectElement>('#language-select')
    ?.querySelectorAll('option')
    .forEach((option) => {
      option.selected = option.value === language;
    });
}

const MAX_IMPORT_BYTES = 100_000;
const TOAST_DURATION = 4_000;
const stepIds = roadmap.map((step) => step.id);
const projectIds = projects.map((project) => project.id);
const validStepIds = new Set(stepIds);
const validProjectIds = new Set(projectIds);
const progressStorageKeys = new Set<string>();

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key) {
      return values.get(key) ?? null;
    },
    key(index) {
      return [...values.keys()][index] ?? null;
    },
    removeItem(key) {
      values.delete(key);
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

let browserStorage: Storage | null = null;
try {
  browserStorage = window.localStorage;
} catch {
  browserStorage = null;
}

const memoryStorage = createMemoryStorage();
const trackedStorage: Storage = {
  get length() {
    return (browserStorage ?? memoryStorage).length;
  },
  clear() {
    (browserStorage ?? memoryStorage).clear();
  },
  getItem(key) {
    progressStorageKeys.add(key);
    return (browserStorage ?? memoryStorage).getItem(key);
  },
  key(index) {
    return (browserStorage ?? memoryStorage).key(index);
  },
  removeItem(key) {
    (browserStorage ?? memoryStorage).removeItem(key);
  },
  setItem(key, value) {
    progressStorageKeys.add(key);
    (browserStorage ?? memoryStorage).setItem(key, value);
  },
};

function normalizeProgress(value: Progress): Progress {
  return {
    ...value,
    completedSteps: [...new Set(value.completedSteps)].filter((id) =>
      validStepIds.has(id),
    ),
    savedProjects: [...new Set(value.savedProjects)].filter((id) =>
      validProjectIds.has(id),
    ),
  };
}

function loadProgress(): Progress {
  try {
    return normalizeProgress(readProgress(trackedStorage, stepIds, projectIds));
  } catch {
    browserStorage = null;
    return normalizeProgress(readProgress(memoryStorage, stepIds, projectIds));
  }
}

let progress = loadProgress();
let activeFilter = { search: '', category: '', difficulty: '' };
let highlightedProject = '';
let toastTimer: number | undefined;
let importVersion = 0;
let currentCommands = '';

app.innerHTML = createPage({
  stepCount: roadmap.length,
  projectCount: projects.length,
  defaults: gitDefaults[language],
});
function byId<T extends HTMLElement>(id: string): T {
  const element = app?.querySelector<HTMLElement>(`#${id}`);
  if (!element) throw new Error(`Elemento ausente: ${id}`);
  return element as T;
}

function text<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  value: string,
  className?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  element.textContent = value;
  if (className) element.className = className;
  return element;
}

function externalLink(href: string, label: string): HTMLAnchorElement {
  const link = text('a', `${label} ↗`, 'inline-link');
  try {
    const url = new URL(href, document.baseURI);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      throw new Error('Protocolo inválido.');
    }
    link.href = url.href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  } catch {
    link.setAttribute('aria-disabled', 'true');
  }
  return link;
}

const ui = {
  toast: byId<HTMLDivElement>('toast'),
  roadmap: byId<HTMLDivElement>('roadmap-list'),
  progressLabel: byId('progress-label'),
  progressFill: byId('progress-fill'),
  progressBar: byId('progress-bar'),
  projectGrid: byId<HTMLDivElement>('project-grid'),
  projectCount: byId('project-count'),
  projectEmpty: byId('project-empty'),
  search: byId<HTMLInputElement>('project-search'),
  category: byId<HTMLSelectElement>('category-filter'),
  difficulty: byId<HTMLSelectElement>('difficulty-filter'),
  recommend: byId<HTMLButtonElement>('recommend'),
  achievements: byId<HTMLDivElement>('achievement-grid'),
  gitFlow: byId<HTMLSelectElement>('git-flow'),
  gitOwner: byId<HTMLInputElement>('git-owner'),
  gitRepo: byId<HTMLInputElement>('git-repo'),
  gitBranch: byId<HTMLInputElement>('git-branch'),
  commandError: byId('command-error'),
  commandOutput: byId<HTMLPreElement>('command-output'),
  copyCommands: byId<HTMLButtonElement>('copy-commands'),
  exportProgress: byId<HTMLButtonElement>('export-progress'),
  importProgress: byId<HTMLInputElement>('import-progress'),
};

function notify(message: string): void {
  window.clearTimeout(toastTimer);
  ui.toast.textContent = message;
  refreshTranslations();
  ui.toast.classList.add('visible');
  toastTimer = window.setTimeout(() => {
    ui.toast.classList.remove('visible');
    ui.toast.textContent = '';
  }, TOAST_DURATION);
}

function persist(): boolean {
  try {
    writeProgress(trackedStorage, progress);
    if (!browserStorage) throw new Error('Armazenamento indisponível.');
    return true;
  } catch {
    notify(
      'Progresso mantido nesta página. Exporte o JSON para não perder suas alterações.',
    );
    return false;
  }
}

function toggleId(ids: string[], id: string, enabled: boolean): string[] {
  const next = new Set(ids);
  if (enabled) next.add(id);
  else next.delete(id);
  return [...next];
}

function updateProgressViews(): void {
  const completed = new Set(progress.completedSteps);
  const total = roadmap.length;
  const count = stepIds.filter((id) => completed.has(id)).length;
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  ui.progressLabel.textContent = `${count} de ${total} etapas concluídas`;
  ui.progressFill.style.width = `${percentage}%`;
  ui.progressBar.setAttribute('aria-valuemax', String(total));
  ui.progressBar.setAttribute('aria-valuenow', String(count));
  ui.progressBar.setAttribute(
    'aria-valuetext',
    `${count} de ${total} etapas concluídas`,
  );

  ui.roadmap.querySelectorAll<HTMLElement>('[data-step-id]').forEach((item) => {
    const done = completed.has(item.dataset.stepId ?? '');
    item.classList.toggle('done', done);
    const checkbox = item.querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    );
    const label = item.querySelector<HTMLElement>('.check-label span');
    if (checkbox) checkbox.checked = done;
    if (label) label.textContent = done ? 'Concluída' : 'Marcar feita';
  });
  refreshTranslations();
}

function renderRoadmap(): void {
  const fragment = document.createDocumentFragment();
  let currentPhase: string | undefined;

  roadmap.forEach((step, index) => {
    if (step.phase !== currentPhase) {
      currentPhase = step.phase;
      fragment.append(text('h3', currentPhase, 'phase-title'));
    }

    const item = document.createElement('article');
    item.className = 'roadmap-item';
    item.dataset.stepId = step.id;
    item.id = `step-${step.id}`;
    const content = document.createElement('div');
    content.className = 'step-content';
    content.append(
      text('h4', step.title),
      text('p', step.summary),
      text('p', `Entrega: ${step.deliverable}`, 'deliverable'),
      externalLink(step.resource, step.resourceLabel),
    );

    if (step.exercise && step.example) {
      const details = document.createElement('details');
      details.className = 'logic-example';
      details.append(
        text('summary', 'Pratique com um exemplo'),
        text('p', step.exercise),
      );
      const sample = document.createElement('pre');
      sample.append(text('code', step.example));
      details.append(sample);
      content.append(details);
    }
    const label = document.createElement('label');
    label.className = 'check-label';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.setAttribute('aria-label', `Concluir etapa ${step.title}`);
    label.append(checkbox, text('span', 'Marcar feita'));
    item.append(
      text('span', String(index + 1).padStart(2, '0'), 'step-number'),
      content,
      label,
    );
    fragment.append(item);
  });

  ui.roadmap.replaceChildren(fragment);
  updateProgressViews();
}

function updateSaveButton(button: HTMLButtonElement): void {
  const id = button.dataset.projectId ?? '';
  const saved = progress.savedProjects.includes(id);
  const project = projects.find((entry) => entry.id === id);
  button.classList.toggle('saved', saved);
  button.textContent = saved ? '★ Salvo' : '☆ Salvar ideia';
  button.setAttribute('aria-pressed', String(saved));
  button.setAttribute(
    'aria-label',
    `${saved ? 'Remover dos salvos' : 'Salvar ideia'}: ${project?.title ?? id}`,
  );
  translateDOM(button, language);
}

function updateSavedProjects(): void {
  ui.projectGrid
    .querySelectorAll<HTMLButtonElement>('button[data-project-id]')
    .forEach(updateSaveButton);
}

function createProjectCard(project: Project): HTMLElement {
  const card = document.createElement('article');
  card.className = `project-card${project.id === highlightedProject ? ' highlighted' : ''}`;
  card.id = `projeto-${project.id}`;
  card.tabIndex = -1;

  const top = document.createElement('div');
  top.className = 'project-top';
  top.append(
    text('span', project.category, 'category-pill'),
    text('span', project.hours, 'project-hours'),
  );
  card.append(
    top,
    text('h3', project.title),
    text('p', project.summary, 'project-summary'),
  );

  const meta = document.createElement('div');
  meta.className = 'project-meta';
  meta.append(text('span', project.difficulty, 'level-pill'));
  project.stack.forEach((tag) => meta.append(text('span', tag, 'tech-tag')));
  card.append(meta, text('p', 'O que construir', 'card-kicker'));

  const list = document.createElement('ul');
  project.requirements.forEach((requirement) =>
    list.append(text('li', requirement)),
  );
  card.append(list, text('p', `Próximo nível: ${project.stretch}`, 'stretch'));

  const save = document.createElement('button');
  save.type = 'button';
  save.className = 'save-button';
  save.dataset.projectId = project.id;
  updateSaveButton(save);
  card.append(save);
  return card;
}

function renderProjects(): void {
  const visible = filterProjects(projects, activeFilter);
  const fragment = document.createDocumentFragment();
  visible.forEach((project) => fragment.append(createProjectCard(project)));
  ui.projectGrid.replaceChildren(fragment);
  ui.projectCount.textContent = `${visible.length} ${visible.length === 1 ? 'ideia para explorar' : 'ideias para explorar'}`;
  ui.projectEmpty.hidden = visible.length > 0;
  ui.recommend.disabled = visible.length === 0;
  refreshTranslations();
}

function renderAchievements(): void {
  const fragment = document.createDocumentFragment();
  achievements.forEach((achievement) => {
    const card = document.createElement('article');
    card.className = 'achievement-card';
    const icon = text('span', achievement.icon, 'achievement-icon');
    icon.setAttribute('aria-hidden', 'true');
    card.append(
      icon,
      text('h3', achievement.name),
      text('strong', achievement.path),
      text('p', achievement.action),
      externalLink(achievement.source, achievement.sourceLabel),
    );
    fragment.append(card);
  });
  ui.achievements.replaceChildren(fragment);
  refreshTranslations();
}

function renderCommands(): void {
  try {
    const flow = ui.gitFlow.value;
    if (flow !== 'proprio' && flow !== 'fork') {
      throw new Error('Selecione um fluxo Git válido.');
    }
    currentCommands = gitCommands(
      ui.gitOwner.value.trim(),
      ui.gitRepo.value.trim(),
      ui.gitBranch.value.trim(),
      flow as GitFlow,
      language,
    ).join('\n');
    if (!currentCommands.trim()) throw new Error('Nenhum comando foi gerado.');
    ui.commandOutput.textContent = currentCommands;
    ui.commandError.textContent = '';
    ui.copyCommands.disabled = false;
  } catch (cause) {
    currentCommands = '';
    ui.commandOutput.textContent = '';
    ui.commandError.textContent =
      cause instanceof Error ? cause.message : 'Confira os valores informados.';
    ui.copyCommands.disabled = true;
  }
  refreshTranslations();
}

function updateFilters(): void {
  activeFilter = {
    search: ui.search.value,
    category: ui.category.value,
    difficulty: ui.difficulty.value,
  };
  highlightedProject = '';
  renderProjects();
}

const categories = [
  ...new Set(projects.map((project) => project.category)),
].sort((a, b) => a.localeCompare(b, 'pt-BR'));
const categoryOptions = document.createDocumentFragment();
categories.forEach((category) => {
  const option = text('option', category);
  option.value = category;
  categoryOptions.append(option);
});
ui.category.append(categoryOptions);

ui.roadmap.addEventListener('change', (event) => {
  const checkbox = event.target;
  if (!(checkbox instanceof HTMLInputElement) || checkbox.type !== 'checkbox')
    return;
  const id = checkbox.closest<HTMLElement>('[data-step-id]')?.dataset.stepId;
  if (!id || !validStepIds.has(id)) return;
  progress = {
    ...progress,
    completedSteps: toggleId(progress.completedSteps, id, checkbox.checked),
  };
  updateProgressViews();
  persist();
});

ui.projectGrid.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest<HTMLButtonElement>(
    'button[data-project-id]',
  );
  if (!button || !ui.projectGrid.contains(button)) return;
  const id = button.dataset.projectId;
  if (!id || !validProjectIds.has(id)) return;
  progress = {
    ...progress,
    savedProjects: toggleId(
      progress.savedProjects,
      id,
      !progress.savedProjects.includes(id),
    ),
  };
  updateSaveButton(button);
  persist();
});

ui.search.addEventListener('input', updateFilters);
ui.category.addEventListener('change', updateFilters);
ui.difficulty.addEventListener('change', updateFilters);
ui.recommend.addEventListener('click', () => {
  const visible = filterProjects(projects, activeFilter);
  const unsaved = visible.filter(
    (project) => !progress.savedProjects.includes(project.id),
  );
  const pool = unsaved.length > 0 ? unsaved : visible;
  const alternatives = pool.filter(
    (project) => project.id !== highlightedProject,
  );
  const candidates = alternatives.length > 0 ? alternatives : pool;
  const preferredDifficulty: Difficulty = candidates.some(
    (project) => project.difficulty === 'Iniciante',
  )
    ? 'Iniciante'
    : (candidates[0]?.difficulty ?? 'Iniciante');
  const difficulty = activeFilter.difficulty
    ? (candidates.find(
        (project) => project.difficulty === activeFilter.difficulty,
      )?.difficulty ?? preferredDifficulty)
    : preferredDifficulty;
  const suggestion =
    recommendProject(candidates, difficulty, []) ?? candidates[0];

  if (!suggestion) {
    notify('Nenhuma ideia disponível com esses filtros. Tente outra busca.');
    return;
  }

  highlightedProject = suggestion.id;
  renderProjects();
  const card = document.getElementById(`projeto-${suggestion.id}`);
  if (card) {
    card.focus({ preventScroll: true });
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    card.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'center',
    });
  }
  notify(`Sugestão: ${suggestion.title}`);
});

[ui.gitOwner, ui.gitRepo, ui.gitBranch].forEach((field) => {
  field.addEventListener('input', renderCommands);
});
ui.gitFlow.addEventListener('change', renderCommands);

ui.copyCommands.addEventListener('click', async () => {
  renderCommands();
  const commands = currentCommands;
  if (!commands) return;
  ui.copyCommands.disabled = true;
  try {
    if (!navigator.clipboard?.writeText)
      throw new Error('Área de transferência indisponível.');
    await navigator.clipboard.writeText(commands);
    notify('Comandos copiados. Revise antes de executar.');
  } catch {
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.selectNodeContents(ui.commandOutput);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    ui.commandOutput.focus();
    notify('Use Ctrl+C ou Cmd+C para copiar os comandos selecionados.');
  } finally {
    ui.copyCommands.disabled = !currentCommands;
  }
});

ui.exportProgress.addEventListener('click', () => {
  let url: string | undefined;
  const anchor = document.createElement('a');
  try {
    const blob = new Blob([JSON.stringify(progress, null, 2)], {
      type: 'application/json',
    });
    url = URL.createObjectURL(blob);
    anchor.href = url;
    anchor.download = 'devstart-progresso.json';
    anchor.hidden = true;
    document.body.append(anchor);
    anchor.click();
  } catch {
    notify('Não foi possível exportar o progresso. Tente novamente.');
  } finally {
    anchor.remove();
    if (url) {
      const objectUrl = url;
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
    }
  }
});

ui.importProgress.addEventListener('change', async () => {
  const file = ui.importProgress.files?.[0];
  const version = ++importVersion;
  ui.importProgress.value = '';
  if (!file) return;
  try {
    if (file.size === 0) throw new Error('O arquivo de progresso está vazio.');
    if (file.size > MAX_IMPORT_BYTES)
      throw new Error('Arquivo de progresso muito grande. O limite é 100 KB.');
    const content = await file.text();
    if (version !== importVersion) return;
    const imported = normalizeProgress(
      parseProgress(content.replace(/^\uFEFF/, ''), stepIds, projectIds),
    );
    progress = imported;
    updateProgressViews();
    updateSavedProjects();
    const saved = persist();
    if (saved) notify('Progresso importado e salvo com sucesso.');
  } catch (cause) {
    if (version !== importVersion) return;
    notify(
      cause instanceof Error ? cause.message : 'Arquivo de progresso inválido.',
    );
  }
});

window.addEventListener('storage', (event) => {
  if (!browserStorage || event.storageArea !== browserStorage) return;
  if (event.key !== null && !progressStorageKeys.has(event.key)) return;
  try {
    const next = normalizeProgress(
      readProgress(trackedStorage, stepIds, projectIds),
    );
    if (JSON.stringify(next) === JSON.stringify(progress)) return;
    progress = next;
    updateProgressViews();
    updateSavedProjects();
    notify('Progresso atualizado a partir de outra aba.');
  } catch {
    notify('Não foi possível sincronizar o progresso da outra aba.');
  }
});

const commandFields = {
  owner: ui.gitOwner,
  repository: ui.gitRepo,
  branch: ui.gitBranch,
};
const editedCommandFields = new Set<string>();
for (const [name, field] of Object.entries(commandFields)) {
  field.addEventListener('input', () => editedCommandFields.add(name));
}

byId<HTMLSelectElement>('language-select').addEventListener(
  'change',
  (event) => {
    language = (event.target as HTMLSelectElement).value === 'en' ? 'en' : 'pt';
    for (const [name, field] of Object.entries(commandFields)) {
      if (!editedCommandFields.has(name))
        field.value = gitDefaults[language][name as keyof typeof commandFields];
    }
    renderCommands();
    try {
      localStorage.setItem('devstart-language', language);
    } catch {}
    const url = new URL(location.href);
    url.searchParams.set('lang', language);
    history.replaceState(null, '', url);
    refreshTranslations();
  },
);
const themeSelect = byId<HTMLSelectElement>('theme-select');
themeSelect.value = theme;
themeSelect.addEventListener('change', () => {
  theme = themeSelect.value === 'dark' ? 'dark' : 'light';
  try {
    localStorage.setItem('devstart-theme', theme);
  } catch {}
  refreshTranslations();
});
renderRoadmap();
renderProjects();
renderAchievements();
renderCommands();
refreshTranslations();

if (!browserStorage) {
  notify(
    'O armazenamento está indisponível. Exporte seu progresso antes de fechar a página.',
  );
}
