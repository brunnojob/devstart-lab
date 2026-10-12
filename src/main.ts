import './styles.css';
import { roadmap } from './data/roadmap';
import { projects, type Difficulty, type Project } from './data/projects';
import { achievements } from './data/achievements';
import { filterProjects, recommendProject } from './lib/catalog';
import { gitCommands, type GitFlow } from './lib/git-commands';
import { parseProgress, readProgress, writeProgress, type Progress } from './lib/storage';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Elemento principal não encontrado.');

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
    get length() { return values.size; },
    clear() { values.clear(); },
    getItem(key) { return values.get(key) ?? null; },
    key(index) { return [...values.keys()][index] ?? null; },
    removeItem(key) { values.delete(key); },
    setItem(key, value) { values.set(key, value); },
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
  get length() { return (browserStorage ?? memoryStorage).length; },
  clear() { (browserStorage ?? memoryStorage).clear(); },
  getItem(key) {
    progressStorageKeys.add(key);
    return (browserStorage ?? memoryStorage).getItem(key);
  },
  key(index) { return (browserStorage ?? memoryStorage).key(index); },
  removeItem(key) { (browserStorage ?? memoryStorage).removeItem(key); },
  setItem(key, value) {
    progressStorageKeys.add(key);
    (browserStorage ?? memoryStorage).setItem(key, value);
  },
};

function normalizeProgress(value: Progress): Progress {
  return {
    ...value,
    completedSteps: [...new Set(value.completedSteps)].filter((id) => validStepIds.has(id)),
    savedProjects: [...new Set(value.savedProjects)].filter((id) => validProjectIds.has(id)),
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

app.innerHTML = `
  <header class="site-header"><div class="shell header-inner"><a class="brand" href="#inicio" aria-label="DevStart Lab, início"><span class="brand-mark">D<span>.</span></span><span>DevStart <b>Lab</b></span></a><nav aria-label="Navegação principal"><a href="#roadmap">Roadmap</a><a href="#projetos">Projetos</a><a href="#pull-request">Primeiro PR</a><a href="#conquistas">Conquistas</a><a href="./proofs/">Projetos em execução</a></nav><a class="header-github" href="https://github.com/brunnojob/devstart-lab" target="_blank" rel="noopener noreferrer">Ver no GitHub <span aria-hidden="true">↗</span></a></div></header>
  <main id="conteudo"><section id="inicio" class="hero shell"><div class="hero-copy"><p class="eyebrow"><span class="eyebrow-dot"></span> UM CAMINHO ABERTO PARA QUEM ESTÁ COMEÇANDO</p><h1>Seu primeiro passo <em>vira projeto.</em></h1><p class="hero-lead">Aprenda GitHub na prática. Siga uma trilha clara, encontre uma ideia que cabe no seu tempo e envie um pull request que faz diferença.</p><div class="hero-actions"><a class="button primary" href="#roadmap">Começar a trilha <span aria-hidden="true">↗</span></a><a class="button secondary" href="#projetos">Explorar ideias <span aria-hidden="true">→</span></a></div><div class="hero-micro"><span>01 / Aprenda</span><span>02 / Construa</span><span>03 / Colabore</span></div></div><div class="hero-panel" aria-label="Prévia da sua jornada"><div class="panel-top"><span class="window-dots"><i></i><i></i><i></i></span><span>minha-jornada.md</span><span>↗</span></div><div class="panel-body"><p class="panel-comment"># Da primeira linha ao primeiro PR</p><div class="terminal-row"><span class="terminal-num">01</span><span><b class="terminal-green">✓</b> Criar e entender um repositório</span></div><div class="terminal-row"><span class="terminal-num">02</span><span><b class="terminal-green">✓</b> Construir algo útil</span></div><div class="terminal-row"><span class="terminal-num">03</span><span><b class="terminal-orange">↗</b> Abrir uma contribuição</span></div><div class="terminal-line"></div><p class="terminal-output">O próximo commit é seu<span class="cursor">_</span></p></div><div class="panel-bottom"><span class="live-dot"></span> PROGRESSO REAL, NO SEU RITMO</div></div></section>
  <section class="stat-strip"><div class="shell stat-grid"><div><strong>${roadmap.length}</strong><span>passos práticos</span></div><div><strong>${projects.length}</strong><span>ideias com escopo</span></div><div><strong>01</strong><span>primeiro PR possível</span></div><p>Sem cadastro. Sem token. Seu progresso fica <b>no seu navegador.</b></p></div></section>
  <section id="roadmap" class="section shell"><div class="section-heading"><div><p class="eyebrow">01 / O CAMINHO</p><h2>Um roadmap que <em>anda com você.</em></h2><p>Marque cada etapa ao concluir a entrega. O importante é fazer, não apenas ler.</p></div><div class="progress-card"><span id="progress-label">0 de ${roadmap.length} etapas concluídas</span><div class="progress-track" role="progressbar" aria-label="Etapas concluídas" aria-valuemin="0" aria-valuemax="${roadmap.length}" aria-valuenow="0" id="progress-bar"><div id="progress-fill"></div></div><div class="progress-actions"><button id="export-progress" type="button">Exportar progresso ↓</button><label for="import-progress">Importar JSON ↑</label><input id="import-progress" type="file" accept="application/json,.json" /></div></div></div><div id="roadmap-list" class="roadmap-list"></div></section>
  <section id="projetos" class="section section-tinted"><div class="shell"><div class="section-heading"><div><p class="eyebrow">02 / MÃOS À OBRA</p><h2>Uma ideia. <em>Um projeto de verdade.</em></h2><p>Cada projeto tem requisitos, uma estimativa e um próximo desafio. Comece pequeno e publique o que aprendeu.</p></div><div class="project-count" id="project-count" role="status" aria-live="polite" aria-atomic="true"></div></div><div class="filter-bar"><label>Buscar ideia<input id="project-search" type="search" placeholder="Ex.: API, Python, portfólio..." autocomplete="off" /></label><label>Área<select id="category-filter"><option value="">Todas as áreas</option></select></label><label>Nível<select id="difficulty-filter"><option value="">Todos os níveis</option><option>Iniciante</option><option>Intermediário</option><option>Desafio</option></select></label><button id="recommend" class="button dark" type="button">Surpreenda-me ↗</button></div><div id="project-grid" class="project-grid"></div><p id="project-empty" class="empty-state" hidden>Nenhum projeto encontrado. Tente outros filtros.</p></div></section>
  <section id="pull-request" class="section shell"><div class="section-heading"><div><p class="eyebrow">03 / COLABORE</p><h2>Seu primeiro PR, <em>passo a passo.</em></h2><p>Um pull request propõe uma mudança para revisão. Escolha um problema pequeno, leia as regras do projeto e converse com quem mantém o código.</p></div></div><div class="pr-layout"><div class="pr-steps"><div><span>01</span><div><h3>Encontre uma tarefa</h3><p>Procure issues com <code>good first issue</code> ou melhore a documentação. Confirme se a tarefa está disponível.</p></div></div><div><span>02</span><div><h3>Faça uma mudança focada</h3><p>Crie uma branch, mude apenas o necessário, execute os testes e descreva como verificou o resultado.</p></div></div><div><span>03</span><div><h3>Abra e acompanhe o PR</h3><p>Compare sua branch com a principal, explique o motivo, relacione a issue e responda à revisão com respeito.</p></div></div><a class="inline-link" href="https://github.com/brunnojob/devstart-lab/issues" target="_blank" rel="noopener noreferrer">Explorar issues deste projeto ↗</a></div><div class="command-card"><p class="eyebrow">GERADOR DE COMANDOS</p><h3>Do clone ao push</h3><p>Use seu próprio repositório ou um fork. Os comandos são montados localmente.</p><div class="command-fields"><label>Fluxo<select id="git-flow" aria-describedby="command-error"><option value="proprio">Meu repositório</option><option value="fork">Meu fork</option></select></label><label>Seu usuário GitHub<input id="git-owner" aria-describedby="command-error" value="seu-usuario" autocomplete="off" /></label><label>Nome do repositório<input id="git-repo" aria-describedby="command-error" value="meu-projeto" autocomplete="off" /></label><label>Nome da nova branch<input id="git-branch" aria-describedby="command-error" value="docs/primeiro-pr" autocomplete="off" /></label></div><p id="command-error" class="field-error" role="alert"></p><pre id="command-output" tabindex="0" aria-label="Comandos Git"></pre><button id="copy-commands" class="button primary" type="button">Copiar comandos</button><p class="command-note">Em um fork, substitua ORIGINAL_OWNER e ORIGINAL_REPO pelo projeto original. Depois do push, abra o PR pela interface do GitHub.</p></div></div></section>
  <section id="conquistas" class="section section-tinted"><div class="shell"><div class="section-heading"><div><p class="eyebrow">04 / CONQUISTAS</p><h2>Conquistas vêm de <em>contribuições reais.</em></h2><p>Os Achievements estão em prévia pública e as regras podem mudar. Veja as dicas no seu perfil e participe de projetos de forma genuína.</p></div><a class="inline-link" href="https://docs.github.com/pt/account-and-profile/reference/profile-reference#earning-achievements" target="_blank" rel="noopener noreferrer">Referência oficial ↗</a></div><div id="achievement-grid" class="achievement-grid"></div></div></section>
  <section class="closing shell"><p class="eyebrow">O PR COMEÇA COM UMA PEQUENA MUDANÇA</p><h2>Aprender em público<br /><em>abre caminhos.</em></h2><p>Use o guia, compartilhe com alguém que está começando e contribua com uma ideia para melhorá-lo.</p><div class="hero-actions"><a class="button primary" href="https://github.com/brunnojob/devstart-lab" target="_blank" rel="noopener noreferrer">Contribuir no GitHub ↗</a><a class="button secondary" href="https://github.com/brunnojob/devstart-lab/issues/new/choose" target="_blank" rel="noopener noreferrer">Sugerir uma ideia →</a></div></section></main>
  <footer><div class="shell footer-inner"><a class="brand" href="#inicio"><span class="brand-mark">D<span>.</span></span><span>DevStart <b>Lab</b></span></a><p>Feito para aprender e compartilhar. Criado por <a href="https://brunnodev.store/" target="_blank" rel="noopener noreferrer">Brunno / BrunnoDev ↗</a></p><a href="https://github.com/brunnojob/devstart-lab" target="_blank" rel="noopener noreferrer">Código aberto ↗</a></div></footer>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>
`;

function byId<T extends HTMLElement>(id: string): T {
  const element = app?.querySelector<HTMLElement>(`#${id}`);
  if (!element) throw new Error(`Elemento ausente: ${id}`);
  return element as T;
}
