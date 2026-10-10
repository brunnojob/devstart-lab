import './styles.css';
import { roadmap } from './data/roadmap';
import { projects, type Difficulty, type Project } from './data/projects';
import { achievements } from './data/achievements';
import { filterProjects, recommendProject } from './lib/catalog';
import { gitCommands, type GitFlow } from './lib/git-commands';
import { parseProgress, readProgress, writeProgress, type Progress } from './lib/storage';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Elemento principal não encontrado.');

const stepIds = roadmap.map((step) => step.id);
const projectIds = projects.map((project) => project.id);
let progress: Progress = readProgress(localStorage, stepIds, projectIds);
let activeFilter = { search: '', category: '', difficulty: '' };
let highlightedProject = '';

app.innerHTML = `
  <header class="site-header"><div class="shell header-inner"><a class="brand" href="#inicio" aria-label="DevStart Lab, início"><span class="brand-mark">D<span>.</span></span><span>DevStart <b>Lab</b></span></a><nav aria-label="Navegação principal"><a href="#roadmap">Roadmap</a><a href="#projetos">Projetos</a><a href="#pull-request">Primeiro PR</a><a href="#conquistas">Conquistas</a></nav><a class="header-github" href="https://github.com/brunnojob/devstart-lab" target="_blank" rel="noopener noreferrer">Ver no GitHub <span aria-hidden="true">↗</span></a></div></header>
  <main id="conteudo"><section id="inicio" class="hero shell"><div class="hero-copy"><p class="eyebrow"><span class="eyebrow-dot"></span> UM CAMINHO ABERTO PARA QUEM ESTÁ COMEÇANDO</p><h1>Seu primeiro passo <em>vira projeto.</em></h1><p class="hero-lead">Aprenda GitHub na prática. Siga uma trilha clara, encontre uma ideia que cabe no seu tempo e envie um pull request que faz diferença.</p><div class="hero-actions"><a class="button primary" href="#roadmap">Começar a trilha <span aria-hidden="true">↗</span></a><a class="button secondary" href="#projetos">Explorar ideias <span aria-hidden="true">→</span></a></div><div class="hero-micro"><span>01 / Aprenda</span><span>02 / Construa</span><span>03 / Colabore</span></div></div><div class="hero-panel" aria-label="Prévia da sua jornada"><div class="panel-top"><span class="window-dots"><i></i><i></i><i></i></span><span>minha-jornada.md</span><span>↗</span></div><div class="panel-body"><p class="panel-comment"># Da primeira linha ao primeiro PR</p><div class="terminal-row"><span class="terminal-num">01</span><span><b class="terminal-green">✓</b> Criar e entender um repositório</span></div><div class="terminal-row"><span class="terminal-num">02</span><span><b class="terminal-green">✓</b> Construir algo útil</span></div><div class="terminal-row"><span class="terminal-num">03</span><span><b class="terminal-orange">↗</b> Abrir uma contribuição</span></div><div class="terminal-line"></div><p class="terminal-output">O próximo commit é seu<span class="cursor">_</span></p></div><div class="panel-bottom"><span class="live-dot"></span> PROGRESSO REAL, NO SEU RITMO</div></div></section>
  <section class="stat-strip"><div class="shell stat-grid"><div><strong>12</strong><span>passos práticos</span></div><div><strong>25</strong><span>ideias com escopo</span></div><div><strong>01</strong><span>primeiro PR possível</span></div><p>Sem cadastro. Sem token. Seu progresso fica <b>no seu navegador.</b></p></div></section>
  <section id="roadmap" class="section shell"><div class="section-heading"><div><p class="eyebrow">01 / O CAMINHO</p><h2>Um roadmap que <em>anda com você.</em></h2><p>Marque cada etapa ao concluir a entrega. O importante é fazer, não apenas ler.</p></div><div class="progress-card"><span id="progress-label">0 de 12 etapas concluídas</span><div class="progress-track" role="progressbar" aria-label="Etapas concluídas" aria-valuemin="0" aria-valuemax="12" aria-valuenow="0" id="progress-bar"><div id="progress-fill"></div></div><div class="progress-actions"><button id="export-progress" type="button">Exportar progresso ↓</button><label for="import-progress">Importar JSON ↑</label><input id="import-progress" type="file" accept="application/json,.json" /></div></div></div><div id="roadmap-list" class="roadmap-list"></div></section>
  <section id="projetos" class="section section-tinted"><div class="shell"><div class="section-heading"><div><p class="eyebrow">02 / MÃOS À OBRA</p><h2>Uma ideia. <em>Um projeto de verdade.</em></h2><p>Cada projeto tem requisitos, uma estimativa e um próximo desafio. Comece pequeno e publique o que aprendeu.</p></div><div class="project-count" id="project-count"></div></div><div class="filter-bar"><label>Buscar ideia<input id="project-search" type="search" placeholder="Ex.: API, Python, portfólio..." autocomplete="off" /></label><label>Área<select id="category-filter"><option value="">Todas as áreas</option></select></label><label>Nível<select id="difficulty-filter"><option value="">Todos os níveis</option><option>Iniciante</option><option>Intermediário</option><option>Desafio</option></select></label><button id="recommend" class="button dark" type="button">Surpreenda-me ↗</button></div><div id="project-grid" class="project-grid"></div><p id="project-empty" class="empty-state" hidden>Nenhum projeto encontrado. Tente outros filtros.</p></div></section>
  <section id="pull-request" class="section shell"><div class="section-heading"><div><p class="eyebrow">03 / COLABORE</p><h2>Seu primeiro PR, <em>passo a passo.</em></h2><p>Um pull request propõe uma mudança para revisão. Escolha um problema pequeno, leia as regras do projeto e converse com quem mantém o código.</p></div></div><div class="pr-layout"><div class="pr-steps"><div><span>01</span><div><h3>Encontre uma tarefa</h3><p>Procure issues com <code>good first issue</code> ou melhore a documentação. Confirme se a tarefa está disponível.</p></div></div><div><span>02</span><div><h3>Faça uma mudança focada</h3><p>Crie uma branch, mude apenas o necessário, execute os testes e descreva como verificou o resultado.</p></div></div><div><span>03</span><div><h3>Abra e acompanhe o PR</h3><p>Compare sua branch com a principal, explique o motivo, relacione a issue e responda à revisão com respeito.</p></div></div><a class="inline-link" href="https://github.com/brunnojob/devstart-lab/issues" target="_blank" rel="noopener noreferrer">Explorar issues deste projeto ↗</a></div><div class="command-card"><p class="eyebrow">GERADOR DE COMANDOS</p><h3>Do clone ao push</h3><p>Use seu próprio repositório ou um fork. Os comandos são montados localmente.</p><div class="command-fields"><label>Fluxo<select id="git-flow"><option value="proprio">Meu repositório</option><option value="fork">Meu fork</option></select></label><label>Seu usuário GitHub<input id="git-owner" value="seu-usuario" autocomplete="off" /></label><label>Nome do repositório<input id="git-repo" value="meu-projeto" autocomplete="off" /></label><label>Nome da nova branch<input id="git-branch" value="docs/primeiro-pr" autocomplete="off" /></label></div><p id="command-error" class="field-error" role="alert"></p><pre id="command-output" aria-label="Comandos Git"></pre><button id="copy-commands" class="button primary" type="button">Copiar comandos</button><p class="command-note">Em um fork, substitua ORIGINAL_OWNER e ORIGINAL_REPO pelo projeto original. Depois do push, abra o PR pela interface do GitHub.</p></div></div></section>
  <section id="conquistas" class="section section-tinted"><div class="shell"><div class="section-heading"><div><p class="eyebrow">04 / CONQUISTAS</p><h2>Conquistas vêm de <em>contribuições reais.</em></h2><p>Os Achievements estão em prévia pública e as regras podem mudar. Veja as dicas no seu perfil e participe de projetos de forma genuína.</p></div><a class="inline-link" href="https://docs.github.com/pt/account-and-profile/reference/profile-reference#earning-achievements" target="_blank" rel="noopener noreferrer">Referência oficial ↗</a></div><div id="achievement-grid" class="achievement-grid"></div></div></section>
  <section class="closing shell"><p class="eyebrow">O PR COMEÇA COM UMA PEQUENA MUDANÇA</p><h2>Aprender em público<br /><em>abre caminhos.</em></h2><p>Use o guia, compartilhe com alguém que está começando e contribua com uma ideia para melhorá-lo.</p><div class="hero-actions"><a class="button primary" href="https://github.com/brunnojob/devstart-lab" target="_blank" rel="noopener noreferrer">Contribuir no GitHub ↗</a><a class="button secondary" href="https://github.com/brunnojob/devstart-lab/issues/new/choose" target="_blank" rel="noopener noreferrer">Sugerir uma ideia →</a></div></section></main>
  <footer><div class="shell footer-inner"><a class="brand" href="#inicio"><span class="brand-mark">D<span>.</span></span><span>DevStart <b>Lab</b></span></a><p>Feito para aprender e compartilhar. Criado por <a href="https://brunnodev.store/" target="_blank" rel="noopener noreferrer">Brunno / BrunnoDev ↗</a></p><a href="https://github.com/brunnojob/devstart-lab" target="_blank" rel="noopener noreferrer">Código aberto ↗</a></div></footer>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>
`;

function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Elemento ausente: ${id}`);
  return element as T;
}

function text(tag: string, value: string, className?: string): HTMLElement {
  const element = document.createElement(tag);
  element.textContent = value;
  if (className) element.className = className;
  return element;
}

let toastTimer = 0;
function notify(message: string): void {
  const toast = byId<HTMLDivElement>('toast');
  toast.textContent = message;
  toast.classList.add('visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 3500);
}

function persist(): void {
  try {
    writeProgress(localStorage, progress);
  } catch {
    notify('O navegador não permitiu salvar o progresso. Exporte um arquivo JSON.');
  }
}

function renderRoadmap(): void {
  const root = byId<HTMLDivElement>('roadmap-list');
  root.replaceChildren();
  let currentPhase = '';
  roadmap.forEach((step, index) => {
    if (step.phase !== currentPhase) {
      currentPhase = step.phase;
      root.append(text('h3', currentPhase, 'phase-title'));
    }
    const done = progress.completedSteps.includes(step.id);
    const item = document.createElement('article');
    item.className = `roadmap-item${done ? ' done' : ''}`;
    const number = text('span', String(index + 1).padStart(2, '0'), 'step-number');
    const content = document.createElement('div');
    content.className = 'step-content';
    content.append(text('h4', step.title), text('p', step.summary));
    const deliverable = text('p', `Entrega: ${step.deliverable}`, 'deliverable');
    content.append(deliverable);
    const link = document.createElement('a');
    link.href = step.resource;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'inline-link';
    link.textContent = `${step.resourceLabel} ↗`;
    content.append(link);
    const label = document.createElement('label');
    label.className = 'check-label';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = done;
    checkbox.setAttribute('aria-label', `Concluir etapa ${step.title}`);
    checkbox.addEventListener('change', () => {
      progress.completedSteps = checkbox.checked ? [...progress.completedSteps, step.id] : progress.completedSteps.filter((id) => id !== step.id);
      persist();
      renderRoadmap();
    });
    label.append(checkbox, text('span', done ? 'Concluída' : 'Marcar feita'));
    item.append(number, content, label);
    root.append(item);
  });
  const completed = progress.completedSteps.length;
  byId('progress-label').textContent = `${completed} de ${roadmap.length} etapas concluídas`;
  byId('progress-fill').style.width = `${completed / roadmap.length * 100}%`;
  byId('progress-bar').setAttribute('aria-valuenow', String(completed));
}

function createProjectCard(project: Project): HTMLElement {
  const card = document.createElement('article');
  card.className = `project-card${project.id === highlightedProject ? ' highlighted' : ''}`;
  card.id = `projeto-${project.id}`;
  const top = document.createElement('div');
  top.className = 'project-top';
  top.append(text('span', project.category, 'category-pill'), text('span', project.hours, 'project-hours'));
  card.append(top, text('h3', project.title), text('p', project.summary, 'project-summary'));
  const meta = document.createElement('div');
  meta.className = 'project-meta';
  meta.append(text('span', project.difficulty, 'level-pill'));
  project.stack.forEach((tag) => meta.append(text('span', tag, 'tech-tag')));
  card.append(meta, text('p', 'O que construir', 'card-kicker'));
  const list = document.createElement('ul');
  project.requirements.forEach((item) => list.append(text('li', item)));
  card.append(list, text('p', `Próximo nível: ${project.stretch}`, 'stretch'));
  const saved = progress.savedProjects.includes(project.id);
  const save = document.createElement('button');
  save.type = 'button';
  save.className = `save-button${saved ? ' saved' : ''}`;
  save.textContent = saved ? '★ Salvo' : '☆ Salvar ideia';
  save.setAttribute('aria-pressed', String(saved));
  save.addEventListener('click', () => {
    progress.savedProjects = saved ? progress.savedProjects.filter((id) => id !== project.id) : [...progress.savedProjects, project.id];
    persist();
    renderProjects();
  });
  card.append(save);
  return card;
}

function renderProjects(): void {
  const visible = filterProjects(projects, activeFilter);
  const grid = byId<HTMLDivElement>('project-grid');
  grid.replaceChildren(...visible.map(createProjectCard));
  byId('project-count').textContent = `${visible.length} ideias para explorar`;
  byId('project-empty').hidden = visible.length !== 0;
}

function renderAchievements(): void {
  const grid = byId<HTMLDivElement>('achievement-grid');
  achievements.forEach((achievement) => {
    const card = document.createElement('article');
    card.className = 'achievement-card';
    const icon = text('span', achievement.icon, 'achievement-icon');
    icon.setAttribute('aria-hidden', 'true');
    card.append(icon, text('h3', achievement.name), text('strong', achievement.path), text('p', achievement.action));
    const link = document.createElement('a');
    link.href = achievement.source;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'inline-link';
    link.textContent = `${achievement.sourceLabel} ↗`;
    card.append(link);
    grid.append(card);
  });
}

function renderCommands(): void {
  const error = byId<HTMLParagraphElement>('command-error');
  try {
    const commands = gitCommands(byId<HTMLInputElement>('git-owner').value, byId<HTMLInputElement>('git-repo').value, byId<HTMLInputElement>('git-branch').value, byId<HTMLSelectElement>('git-flow').value as GitFlow);
    byId('command-output').textContent = commands.join('\n');
    error.textContent = '';
    byId<HTMLButtonElement>('copy-commands').disabled = false;
  } catch (cause) {
    byId('command-output').textContent = '';
    error.textContent = cause instanceof Error ? cause.message : 'Confira os valores informados.';
    byId<HTMLButtonElement>('copy-commands').disabled = true;
  }
}

const categories = [...new Set(projects.map((project) => project.category))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
const categorySelect = byId<HTMLSelectElement>('category-filter');
categories.forEach((category) => {
  const option = document.createElement('option');
  option.value = category;
  option.textContent = category;
  categorySelect.append(option);
});

byId<HTMLInputElement>('project-search').addEventListener('input', (event) => {
  activeFilter.search = (event.target as HTMLInputElement).value;
  renderProjects();
});
categorySelect.addEventListener('change', () => {
  activeFilter.category = categorySelect.value;
  renderProjects();
});
byId<HTMLSelectElement>('difficulty-filter').addEventListener('change', (event) => {
  activeFilter.difficulty = (event.target as HTMLSelectElement).value;
  renderProjects();
});
byId('recommend').addEventListener('click', () => {
  const difficulty = (activeFilter.difficulty || 'Iniciante') as Difficulty;
  const suggestion = recommendProject(projects, difficulty, progress.savedProjects);
  if (!suggestion) return;
  activeFilter = { search: '', category: '', difficulty: '' };
  byId<HTMLInputElement>('project-search').value = '';
  categorySelect.value = '';
  byId<HTMLSelectElement>('difficulty-filter').value = '';
  highlightedProject = suggestion.id;
  renderProjects();
  document.getElementById(`projeto-${suggestion.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  notify(`Sugestão: ${suggestion.title}`);
});
['git-flow', 'git-owner', 'git-repo', 'git-branch'].forEach((id) => byId(id).addEventListener('input', renderCommands));
byId('copy-commands').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(byId('command-output').textContent ?? '');
    notify('Comandos copiados. Revise antes de executar.');
  } catch {
    notify('Não foi possível copiar. Selecione os comandos manualmente.');
  }
});
byId('export-progress').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'devstart-progresso.json';
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
});
byId<HTMLInputElement>('import-progress').addEventListener('change', async (event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    if (file.size > 100_000) throw new Error('Arquivo de progresso muito grande.');
    progress = parseProgress(await file.text(), stepIds, projectIds);
    persist();
    renderRoadmap();
    renderProjects();
    notify('Progresso importado com sucesso.');
  } catch (cause) {
    notify(cause instanceof Error ? cause.message : 'Arquivo inválido.');
  }
  input.value = '';
});

renderRoadmap();
renderProjects();
renderAchievements();
renderCommands();
