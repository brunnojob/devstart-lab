/// <reference types="vite/client" />
import './workbench.css';
import catalog from '../../engine/src/main/resources/tools.json';
import { roadmap } from '../data/roadmap';
import { roadmapEnglish } from '../data/roadmap.en';
import { projects } from '../data/projects';
import { projectEnglish } from '../data/projects.en';
import { labs } from '../data/forge-labs';
import { diagnoseRun } from '../lib/ci-diagnostics.mjs';
import { checkEvidence, packageCase, readCase, reviewPatch, scanEvidence, type Finding, type Kind } from '../lib/workbench.mjs';
import { emptyProgress, readProgress, writeProgress } from '../lib/storage';

const base = import.meta.env.BASE_URL;
const asset = `${base}forge-lab/`;
const exampleRun = 'https://github.com/brunnojob/devstart-lab/actions/runs/38196511827/attempts/1';
const getPreference = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const language = (new URLSearchParams(location.search).get('lang') ?? getPreference('devstart-language')) === 'en' ? 'en' : 'pt';
const en = language === 'en';
const t = (pt: string, english: string) => en ? english : pt;
const h = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
const tools: Record<Kind, [string, string, string]> = {
  ci: ['CIFuse · Diagnóstico de CI', 'CIFuse · CI diagnostics', t('Anotações de checks apontam para a falha no commit. Compare a mensagem com o resultado esperado antes de corrigir.', 'Check annotations locate failures at a commit. Compare the message with the expected result before applying a fix.')],
  review: ['PatchScope · Revisão de mudanças', 'PatchScope · Change review', t('O motor do PatchScope lê o diff e sugere o que revisar. Confirme a intenção da alteração e a cobertura que ela afeta.', 'PatchScope reads the diff and suggests what to review. Confirm the intent and the coverage it affects.')],
  maintenance: ['RepoRelief · Manutenção do repositório', 'RepoRelief · Repository maintenance', t('Sinais do RepoRelief apontam documentação, configuração ou testes que merecem verificação.', 'RepoRelief signals identify docs, configuration or tests that deserve verification.')],
  impact: ['Java / Roslyn · Impacto no código', 'Java / Roslyn · Source impact', t('Java e Roslyn identificam referências e candidatos a testes. Confirme o caminho até o comportamento alterado.', 'Java and Roslyn identify references and candidate tests. Verify the path to the changed behavior.')],
  artifact: ['RevScope · Triagem de artefatos', 'RevScope · Artifact triage', t('O RevScope registra sinais de formato e sugere como confirmar a identificação de um artefato conhecido.', 'RevScope records format signals and suggests how to confirm a known artifact’s identity.')],
  plan: ['Plano de revisão', 'Review plan', t('Registre hipótese, mudança, teste e reversão num plano que acompanha as evidências, inspirado no fluxo do PlanRelay.', 'Record a hypothesis, change, test and rollback in a plan that travels with the evidence, inspired by PlanRelay.')],
};

const cases = [
  { id: 'orders', title: t('Pedidos sem perder cobertura', 'Orders without losing coverage'), level: t('Iniciante', 'Beginner'), mode: 'review' as Kind,
    brief: t('Uma mudança remove o teste que confere o total de um lote. Reconstrua a regra, prove que a cobertura existe e escreva o resumo do PR.', 'A change removes the test that checks a batch total. Reconstruct the rule, prove the coverage exists and write the PR summary.'),
    acceptance: t('Valide um lote vazio, dois pedidos e um total inválido. Indique quais testes devem falhar antes da correção.', 'Verify an empty batch, two orders and an invalid total. Identify the tests that should fail before applying the fix.') },
  { id: 'ci', title: t('Uma verificação falhou', 'A CI check failed'), level: t('Intermediário', 'Intermediate'), mode: 'ci' as Kind,
    brief: t('Investigue uma falha real de compilação do DevStart Lab pelas anotações do GitHub Actions.', 'Investigate an actual DevStart Lab compile failure using GitHub Actions annotations.'),
    acceptance: t('Abra a linha do commit, explique a causa provável e registre o comando que confirmaria a correção.', 'Open the line at the reported commit, explain the likely cause and record the command that verifies the fix.') },
  { id: 'checkout', title: t('Checkout em dois runtimes', 'Checkout across two runtimes'), level: t('Avançado', 'Advanced'), mode: 'impact' as Kind,
    brief: t('Uma API de preços mudou. Cruze referências, diagnósticos e candidatos a testes antes de propor uma correção compatível.', 'A pricing API changed. Cross-check references, diagnostics and candidate tests before proposing a compatible change.'),
    acceptance: t('Entregue uma matriz de regressão, justifique o escopo e defina um critério de reversão.', 'Submit a regression matrix, explain the scope and define rollback criteria.') },
];

const root = document.querySelector<HTMLElement>('#app')!;
document.documentElement.lang = en ? 'en' : 'pt-BR';
document.title = t('ForgeLab — bancada de engenharia', 'ForgeLab — engineering workbench');

function preferredProgress() {
  try { return readProgress(localStorage, roadmap.map((step) => step.id), projects.map((project) => project.id)); }
  catch { return emptyProgress(); }
}
const progress = preferredProgress();

root.innerHTML = `
<header class="lab-header"><div class="lab-shell">
  <a class="lab-brand" href="#bancada"><span aria-hidden="true">F</span> ForgeLab</a>
  <nav aria-label="${t('Navegação', 'Navigation')}">
    <a href="#bancada">${t('Bancada', 'Workbench')}</a><a href="#estudo">${t('Trilhas', 'Learning paths')}</a><a href="#ferramentas">${t('Ferramentas', 'Tools')}</a>
  </nav>
  <a href="?lang=${en ? 'pt' : 'en'}" id="lab-language">${en ? 'Português' : 'English'}</a>
</div></header>
<main id="conteudo" class="lab-shell">
  <section class="lab-intro">
    <h1>${t('Bancada de engenharia', 'Engineering workbench')}</h1>
    <p>${t('Investigue uma falha, revise uma mudança e documente como validar a correção. Use um caso guiado ou traga seu próprio código.', 'Investigate a failure, review a change and document how to verify the fix. Use a guided case or bring your own code.')}</p>
  </section>
  <section id="bancada" class="lab-workbench">
    <aside class="lab-panel lab-cases">
      <h2>${t('Casos guiados', 'Guided cases')}</h2>
      ${cases.map((item) => `<button type="button" data-case="${item.id}"><span>${item.level}</span><strong>${item.title}</strong></button>`).join('')}
      <button type="button" data-case="own"><strong>${t('Minha investigação', 'My investigation')}</strong></button>
    </aside>
    <div class="lab-panel lab-input">
      <h2 id="lab-case-title"></h2><p id="lab-brief"></p>
      <div id="lab-material"></div>
      <form id="lab-form">
        <label for="lab-source">${t('Fonte de evidência', 'Evidence source')}</label>
        <select id="lab-source"><option value="diff">Diff</option><option value="ci">GitHub Actions</option><option value="file">${t('Relatório ou caso JSON', 'JSON report or case')}</option></select>
        <div data-input="diff"><label for="lab-diff">${t('Diff unificado', 'Unified diff')}</label><textarea id="lab-diff" rows="5" placeholder="git diff HEAD"></textarea></div>
        <div data-input="ci" hidden><label for="lab-run">${t('URL da execução pública', 'Public run URL')}</label><input id="lab-run" type="url" placeholder="https://github.com/owner/repo/actions/runs/123"></div>
        <div data-input="file" hidden><label for="lab-report">${t('Arquivo JSON', 'JSON file')}</label><input id="lab-report" type="file" accept=".json,application/json"></div>
        <button class="lab-primary" type="submit">${t('Adicionar evidências', 'Add evidence')}</button>
        <button id="lab-sample" type="button">${t('Carregar evidência do caso', 'Load case evidence')}</button>
      </form>
      <label for="lab-plan">${t('Plano de revisão', 'Review plan')}</label>
      <p id="lab-acceptance"></p>
      <textarea id="lab-plan" rows="7"></textarea>
      <div class="lab-controls">
        <button id="lab-export" type="button">${t('Exportar caso JSON', 'Export JSON case')}</button>
        <button id="lab-markdown" type="button">${t('Baixar revisão Markdown', 'Download Markdown review')}</button>
      </div>
    </div>
    <section class="lab-panel lab-result" aria-labelledby="lab-evidence-title">
      <h2 id="lab-evidence-title">${t('Evidências', 'Evidence')}</h2>
      <p id="lab-status" role="status"></p>
      <label for="lab-filter">${t('Filtrar por ferramenta', 'Filter by tool')}</label>
      <select id="lab-filter"><option value="">${t('Todas', 'All')}</option>${Object.entries(tools).map(([key, value]) => `<option value="${key}">${value[en ? 1 : 0]}</option>`).join('')}</select>
      <ul id="lab-results"></ul>
      <details id="lab-notes-box"><summary>${t('Fontes e limites da análise', 'Sources and analysis limits')}</summary><ul id="lab-notes"></ul></details>
    </section>
  </section>
  <section id="estudo" class="lab-library">
    <h2>${t('Trilhas e projetos', 'Learning paths and projects')}</h2>
    <div class="lab-library-grid">
      <details class="lab-panel"><summary>${t('Fundamentos de Python, Git e colaboração', 'Python, Git and collaboration fundamentals')}</summary><div id="lab-roadmap"></div></details>
      <details class="lab-panel"><summary>${t('Exercícios por dificuldade', 'Exercises by difficulty')}</summary><div id="lab-exercises"></div></details>
      <details class="lab-panel"><summary>${t('Catálogo de projetos', 'Project catalog')}</summary><div id="lab-projects"></div></details>
    </div>
  </section>
  <section id="ferramentas" class="lab-library">
    <h2>${t('Ferramentas da bancada', 'Workbench tools')}</h2>
    <div class="lab-library-grid">
      ${Object.entries(tools).map(([kind, value]) => `<article class="lab-panel"><h3>${value[en ? 1 : 0]}</h3><p>${value[2]}</p><button type="button" data-tool="${kind}">${t('Usar na bancada', 'Use in workbench')}</button></article>`).join('')}
    </div>
    <details class="lab-panel lab-cli"><summary>${t('Catálogo RevScope', 'RevScope catalog')}</summary>
      <div class="lab-library-grid">${catalog.map((tool) => `<article><h3>${h(tool.name)}</h3><p>${h(tool.bestFor)}</p><a href="${h(tool.docs)}">${t('Documentação', 'Documentation')}</a></article>`).join('')}</div>
    </details>
    <details class="lab-panel lab-cli"><summary>CLI &amp; CI/CD</summary>
      <p>${t('A CLI gera o mesmo arquivo de caso que a bancada abre e exporta. Para análise local de código, use JDK 21.', 'The CLI produces the same case file the workbench opens and exports. Local source analysis uses JDK 21.')}</p>
      <pre><code>node bin/devstart.mjs scan . --base HEAD &gt; caso.json
git diff HEAD | node bin/devstart.mjs diff &gt; revisao.json
node bin/devstart.mjs ci URL --case &gt; ci.json</code></pre>
      <a href="https://github.com/brunnojob/devstart-lab/blob/feature/forge-learning-platform/docs/forge-lab.md#cicd">${t('Configurar no pipeline', 'Configure in a pipeline')}</a>
    </details>
  </section>
</main>
<footer class="lab-shell lab-footer"><a href="https://github.com/brunnojob/devstart-lab/tree/feature/forge-learning-platform">${t('Código-fonte do ForgeLab', 'ForgeLab source')}</a></footer>`;

function element<T extends HTMLElement = HTMLElement>(id: string) {
  return document.querySelector<T>(`#${id}`)!;
}
const caseTitle = element('lab-case-title');
const brief = element('lab-brief');
const acceptance = element('lab-acceptance');
const material = element('lab-material');
const source = element<HTMLSelectElement>('lab-source');
const filter = element<HTMLSelectElement>('lab-filter');
const diff = element<HTMLTextAreaElement>('lab-diff');
const url = element<HTMLInputElement>('lab-run');
const file = element<HTMLInputElement>('lab-report');
const plan = element<HTMLTextAreaElement>('lab-plan');
const status = element('lab-status');
const results = element('lab-results');
const notesList = element('lab-notes');

type CaseState = { findings: Finding[]; notes: string[]; plan: string; diff: string; url: string; status: string };
const states = new Map<string, CaseState>();
let active = '';
let request: AbortController | undefined;
function state() {
  let item = states.get(active);
  if (!item) {
    item = { findings: [], notes: [], plan: '', diff: '', url: active === 'ci' ? exampleRun : '', status: '' };
    states.set(active, item);
  }
  return item;
}

function showInput() {
  root.querySelectorAll<HTMLElement>('[data-input]').forEach((row) => { row.hidden = row.dataset.input !== source.value; });
}

function showEvidence() {
  const { findings, notes } = state();
  const visible = filter.value ? findings.filter((item) => item.kind === filter.value) : findings;
  results.replaceChildren();
  for (const item of visible.slice(0, 80)) {
    const row = document.createElement('li');
    const type = document.createElement('span');
    type.textContent = tools[item.kind][en ? 1 : 0];
    const title = document.createElement('h3');
    title.textContent = item.title || type.textContent;
    row.append(type, title);
    if (item.path) {
      const location = document.createElement(item.source ? 'a' : 'code');
      location.textContent = item.line ? `${item.path}:${item.line}${item.endLine && item.endLine > item.line ? `–${item.endLine}` : ''}` : item.path;
      if (location instanceof HTMLAnchorElement) location.href = item.source;
      row.append(location);
    }
    for (const value of [item.detail, item.next]) {
      if (!value) continue;
      const line = document.createElement('p');
      line.textContent = value;
      row.append(line);
    }
    const how = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = t('Como interpretar', 'How to interpret');
    const help = document.createElement('p');
    help.textContent = tools[item.kind][2];
    how.append(summary, help);
    row.append(how);
    results.append(row);
  }
  if (visible.length === 0 || visible.length > 80) {
    const note = document.createElement('li');
    note.textContent = visible.length ? t('Mostrando 80. Exporte o caso para consultar todas.', 'Showing 80. Export the case to see all findings.') : t('Nenhuma evidência neste filtro.', 'No evidence matches this filter.');
    results.append(note);
  }
  notesList.replaceChildren(...notes.slice(0, 100).map((text) => {
    const entry = document.createElement('li');
    entry.textContent = text;
    return entry;
  }));
  element('lab-notes-box').hidden = notes.length === 0;
}

function selectCase(id: string) {
  request?.abort();
  active = id;
  const item = cases.find((entry) => entry.id === id);
  const current = state();
  caseTitle.textContent = item?.title ?? t('Minha investigação', 'My investigation');
  brief.textContent = item?.brief ?? t('Reúna resultados de CI, diff e análise local para a mesma mudança.', 'Collect CI, diff and local analysis results for the same change.');
  acceptance.textContent = item?.acceptance ?? t('Inclua hipótese, verificação e critério de reversão.', 'Include a hypothesis, verification and rollback criteria.');
  plan.placeholder = t('Hipótese\nMudança proposta\nComo verificar\nQuando reverter', 'Hypothesis\nProposed change\nHow to verify\nWhen to roll back');
  material.innerHTML = id === 'orders'
    ? `<a href="${asset}pedidos/orders.py" download>orders.py</a> · <a href="${asset}pedidos/test_orders.py" download>test_orders.py</a> · <code>python3 -m unittest -v</code>`
    : id === 'checkout' ? `<p>${t('O cenário completo acompanha o código-fonte em', 'The full scenario is included in the source at')} <code>engine/examples/sample</code>.</p>` : '';
  source.value = item?.mode === 'ci' ? 'ci' : item?.mode === 'impact' ? 'file' : 'diff';
  filter.value = '';
  diff.value = current.diff;
  url.value = current.url;
  file.value = '';
  plan.value = current.plan;
  status.textContent = current.status;
  element('lab-sample').hidden = !item;
  root.querySelectorAll<HTMLButtonElement>('[data-case]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.case === id)));
  showInput();
  showEvidence();
}

function merge(reports: { findings: Finding[]; notes: string[]; plan?: string }) {
  const current = state();
  const keys = new Set(current.findings.map((row) => JSON.stringify(row)));
  for (const row of reports.findings) {
    const key = JSON.stringify(row);
    if (!keys.has(key)) { keys.add(key); current.findings.push(row); }
  }
  current.notes = [...new Set([...current.notes, ...reports.notes])];
  if (reports.plan?.trim() && reports.plan !== current.plan) {
    current.plan = [current.plan, reports.plan].filter(Boolean).join('\n\n');
    plan.value = current.plan;
  }
  current.status = status.textContent = `${current.findings.length} ${t('evidência(s) neste caso', 'piece(s) of evidence in this case')}`;
  showEvidence();
}

async function collect(sample: boolean) {
  request?.abort();
  const controller = new AbortController();
  request = controller;
  const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(60_000)]);
  status.textContent = t('Analisando…', 'Analyzing…');
  try {
    let report;
    if ((sample && active === 'ci') || (!sample && source.value === 'ci')) {
      report = checkEvidence(await diagnoseRun(sample ? exampleRun : url.value, { signal }), language);
    } else if (sample) {
      const response = await fetch(`${asset}${active === 'orders' ? 'pedidos/change.diff' : 'checkout-case.json'}`, { signal });
      if (!response.ok) throw new Error(t('Material indisponível.', 'Case material unavailable.'));
      report = active === 'orders' ? reviewPatch(await response.text()) : readCase(await response.json());
    } else if (source.value === 'diff') {
      report = reviewPatch(diff.value);
    } else {
      const selected = file.files?.[0];
      if (!selected || selected.size > 5_000_000) throw new Error(t('Escolha um JSON de até 5 MB.', 'Choose a JSON file up to 5 MB.'));
      const data = JSON.parse(await selected.text());
      report = data?.schema === 'forgelab-case-v1' ? readCase(data) : scanEvidence(data, language);
    }
    if (!controller.signal.aborted) merge(report);
  } catch (error) {
    if (!controller.signal.aborted) state().status = status.textContent = error instanceof Error ? error.message : String(error);
  }
}

function download(data: string, name: string, type: string) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([data], { type }));
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

element<HTMLFormElement>('lab-form').onsubmit = (event) => { event.preventDefault(); void collect(false); };
element('lab-sample').onclick = () => void collect(true);
element('lab-export').onclick = () => download(JSON.stringify(packageCase(state().findings, state().notes, plan.value), null, 2), 'forgelab-case.json', 'application/json');
element('lab-markdown').onclick = () => {
  const literal = (text: string) => text.replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char]!);
  const lines = state().findings.flatMap((item) => [
    `### ${literal(item.title.replace(/[\r\n]+/g, ' '))}`, '',
    ...[item.path ? `${item.path}${item.line ? `:${item.line}` : ''}` : '', item.detail, item.next, item.source].filter(Boolean).map(literal), '',
  ]);
  download([`# ${caseTitle.textContent}`, '', `## ${t('Plano', 'Plan')}`, '', plan.value, '', `## ${t('Evidências', 'Evidence')}`, '', ...lines].join('\n'), 'forgelab-review.md', 'text/markdown');
};
source.onchange = showInput;
filter.onchange = showEvidence;
diff.oninput = () => { state().diff = diff.value; };
url.oninput = () => { state().url = url.value; };
plan.oninput = () => { state().plan = plan.value; };
root.querySelectorAll<HTMLButtonElement>('[data-case]').forEach((button) => { button.onclick = () => selectCase(button.dataset.case!); });
root.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach((button) => {
  button.onclick = () => {
    const tool = button.dataset.tool!;
    if (tool === 'ci' || tool === 'review' || tool === 'impact' || tool === 'artifact' || tool === 'maintenance') {
      selectCase(tool === 'ci' ? 'ci' : tool === 'review' ? 'orders' : 'checkout');
      filter.value = tool;
      void collect(true);
    }
    element('bancada').scrollIntoView();
    if (tool === 'plan') plan.focus();
  };
});

const lessonButton = (id: string, title: string) => `<button type="button" data-lesson="${id}">${h(title)}</button>`;
element('lab-roadmap').innerHTML = roadmap.map((step) => {
  const localized = roadmapEnglish[step.id];
  const title = en ? localized[0] : step.title;
  const summary = en ? localized[1] : step.summary;
  const exercise = en ? localized[4] : step.exercise;
  return `<article><h3>${h(title)}</h3><p>${h(summary)}</p>${exercise ? `<p>${h(exercise)}</p>` : ''}${step.example ? `<pre><code>${h(step.example)}</code></pre>` : ''}
    <p><a href="${h(step.resource)}">${h(en ? localized[3] : step.resourceLabel)}</a></p>
    ${lessonButton(step.id, t('Abrir na bancada', 'Open in workbench'))}
    <label><input type="checkbox" data-progress="${step.id}"${progress.completedSteps.includes(step.id) ? ' checked' : ''}> ${t('Concluído', 'Completed')}</label></article>`;
}).join('');
element('lab-exercises').innerHTML = labs.map(([level, pt, english, task, taskEn, goal, goalEn], index) =>
  `<article><h3>${h(t(pt, english))}</h3><p>${h(t(task, taskEn))}</p><p>${h(t(goal, goalEn))}</p>
    <button type="button" data-exercise="${index}">${t('Praticar na bancada', 'Practice in workbench')} · ${cases[Number(level) - 1].level}</button></article>`).join('');
element('lab-projects').innerHTML = projects.map((project) => {
  const item = en ? projectEnglish[project.id] : [project.title, project.summary, project.requirements, project.stretch] as const;
  return `<article><h3>${h(item[0])}</h3><p>${h(item[1])}</p><ul>${item[2].map((requirement) => `<li>${h(requirement)}</li>`).join('')}</ul>
    <button type="button" data-project="${project.id}">${t('Abrir projeto na bancada', 'Open project in workbench')}</button></article>`;
}).join('');
function startTask(id: string, title: string, description: string, goal: string, mode: string) {
  selectCase(id);
  caseTitle.textContent = title;
  brief.textContent = description;
  acceptance.textContent = goal;
  source.value = mode;
  showInput();
  element('bancada').scrollIntoView();
  plan.focus({ preventScroll: true });
}
root.querySelectorAll<HTMLButtonElement>('[data-lesson]').forEach((button) => {
  button.onclick = () => {
    const step = roadmap.find((entry) => entry.id === button.dataset.lesson)!;
    const translated = roadmapEnglish[step.id];
    startTask(`lesson:${step.id}`, en ? translated[0] : step.title, en ? translated[1] : step.summary,
      en ? translated[2] : step.deliverable, step.id === 'automacao' ? 'ci' : 'diff');
  };
});
root.querySelectorAll<HTMLButtonElement>('[data-exercise]').forEach((button) => {
  button.onclick = () => {
    const index = Number(button.dataset.exercise);
    const [, pt, english, task, taskEn, goal, goalEn] = labs[index];
    startTask(`exercise:${index}`, t(pt, english), t(task, taskEn), t(goal, goalEn),
      index === 4 || index === 7 ? 'ci' : index >= 5 ? 'file' : 'diff');
  };
});
root.querySelectorAll<HTMLButtonElement>('[data-project]').forEach((button) => {
  button.onclick = () => {
    const project = projects.find((entry) => entry.id === button.dataset.project)!;
    const item = en ? projectEnglish[project.id] : [project.title, project.summary, project.requirements] as const;
    startTask(`project:${project.id}`, item[0], item[1], item[2].join(' · '), 'diff');
  };
});
root.querySelectorAll<HTMLInputElement>('[data-progress]').forEach((box) => {
  box.onchange = () => {
    const id = box.dataset.progress!;
    progress.completedSteps = progress.completedSteps.filter((step) => step !== id);
    if (box.checked) progress.completedSteps.push(id);
    try { writeProgress(localStorage, progress); } catch {}
  };
});

selectCase('orders');

void collect(true);
