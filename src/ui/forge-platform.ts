/// <reference types="vite/client" />
import { labs } from '../data/forge-labs';
import type { Language } from '../lib/i18n';
import { analyzeDiff, limits, toMarkdown } from '../vendor/patchscope/engine.js';

const base = `${import.meta.env.BASE_URL}forge-lab/`;
const hub = 'https://forgescope-hub.thankfulmoss-3d30be42.canadacentral.azurecontainerapps.io/';
const docs = 'https://github.com/brunnojob/forgescope';
const sampleSource = `${docs}/tree/39384ef18617f38113bba3ae7eca47204009daff/examples/sample`;
const actionGuide = 'https://github.com/brunnojob/patchscope#github-actions';
const capabilities = [
  ['PatchScope', 'Revisão de diff', 'Diff review', ['patchscope']],
  ['CIFuse', 'Diagnóstico de CI', 'CI diagnostics', ['cifuse', 'devrescue']],
  ['RepoRelief', 'Manutenção', 'Maintenance', ['reporelief']],
  ['Java / Roslyn', 'Impacto e testes', 'Impact and tests', ['impact']],
  ['PlanRelay', 'Planos e aprovações no Hub', 'Plans and approvals in Hub', ['planrelay']],
  ['RevScope', 'Triagem de artefatos', 'Artifact triage', ['revscope']],
] as const;

type Fields = Record<string, unknown>;
function record(value: unknown): Fields {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Fields : {};
}
function items(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}
function label(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}
function evidenceLine(title: string, detail: string): HTMLLIElement {
  const row = document.createElement('li');
  const heading = document.createElement('strong');
  heading.textContent = title;
  const body = document.createElement('p');
  body.textContent = detail;
  row.append(heading, body);
  return row;
}

export function mountForgePlatform(root: HTMLElement) {
  let language: Language | undefined;
  let report: Fields | undefined;
  let review: ReturnType<typeof analyzeDiff> | undefined;
  let diff = '';
  let level = '';
  let tool = '0';
  let reportRequest = 0;
  let diffRequest = 0;
  const study = document.querySelector<HTMLElement>('#study-mode')!;

  function selectMode() {
    const hash = location.hash;
    const mode = hash === '#automation' ? 'automation' : hash === '#practice' ? 'practice' : 'study';
    study.hidden = mode !== 'study';
    root.querySelectorAll<HTMLElement>('[data-mode-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.modePanel !== mode;
    });
    root.querySelectorAll<HTMLAnchorElement>('[data-mode-link]').forEach((link) => {
      if (link.dataset.modeLink === mode) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  window.addEventListener('hashchange', () => {
    const wasStudy = !study.hidden;
    selectMode();
    const id = location.hash.slice(1);
    if (id === 'practice' || id === 'automation' || (!wasStudy && !study.hidden)) {
      document.getElementById(id)?.scrollIntoView();
    }
  });

  return (nextLanguage: Language) => {
    if (language === nextLanguage) return;
    language = nextLanguage;
    const pt = language === 'pt';
    const t = (br: string, en: string) => pt ? br : en;
    root.innerHTML = `
      <section class="shell forge-intro" id="hub-inicio">
        <p class="forge-kicker">DevStart Lab × ForgeScope</p>
        <h2>${t('Da primeira linha à revisão de produção.', 'From your first line to production review.')}</h2>
        <p>${t('Aprenda programação, pratique com um projeto testável e investigue mudanças com as ferramentas que um mantenedor usa.', 'Learn programming, practice on a testable project, and investigate changes with tools maintainers use.')}</p>
        <nav class="forge-modes" aria-label="${t('Modos da plataforma', 'Platform modes')}">
          <a href="#inicio" data-mode-link="study">${t('Estudo', 'Study')}</a>
          <a href="#practice" data-mode-link="practice">${t('Projetos e exercícios', 'Projects and exercises')}</a>
          <a href="#automation" data-mode-link="automation">${t('Automação', 'Automation')}</a>
        </nav>
      </section>
      <section class="shell forge-panel" id="practice" data-mode-panel="practice">
        <h2>${t('Projetos e exercícios', 'Projects and exercises')}</h2>
        <article class="forge-project">
          <h3>${t('Projeto guiado · Processador de pedidos', 'Guided project · Order processor')}</h3>
          <p>${t('Evolua um processador CSV em Python. Adicione validação, escreva testes de regressão e entregue uma mudança revisável.', 'Extend a Python CSV processor. Add validation, write regression tests, and deliver a reviewable change.')}</p>
          <p><a href="${base}pedidos/orders.py" download>orders.py</a> · <a href="${base}pedidos/test_orders.py" download>test_orders.py</a> · <a href="${base}pedidos/change.diff" download>${t('Diff de revisão', 'Review diff')}</a></p>
          <ol>
            <li>${t('Baixe os arquivos Python na mesma pasta e rode', 'Download the Python files into one folder and run')} <code>python3 -m unittest -v</code>.</li>
            <li>${t('Defina o comportamento para linhas inválidas e pedidos duplicados. Implemente e teste.', 'Define behavior for malformed rows and duplicate orders. Implement and test it.')}</li>
            <li>${t('No modo Automação, revise o diff sugerido e exporte o checklist para o PR.', 'In Automation mode, review the sample diff and export the checklist for your PR.')}</li>
          </ol>
          <a class="button secondary" href="#automation">${t('Revisar o diff', 'Review the diff')}</a>
        </article>
        <article class="forge-project">
          <h3>${t('Projeto de manutenção · Mudança no checkout', 'Maintenance project · Checkout change')}</h3>
          <p>${t('Use o cenário Java/C# do ForgeScope para investigar uma mudança na API de preços e seus efeitos sobre os pedidos.', 'Use the ForgeScope Java/C# case to investigate a pricing API change and its effects on orders.')}</p>
          <ol>
            <li><a href="${sampleSource}">${t('Abra o código do cenário', 'Open the scenario source')}</a> ${t('e compare os módulos de preços, pedidos e compatibilidade.', 'and compare pricing, orders, and compatibility modules.')}</li>
            <li>${t('Carregue o relatório oficial em Automação. Localize referências afetadas, erros de CI e candidatos a testes.', 'Load the official report in Automation. Locate affected references, CI errors, and test candidates.')}</li>
            <li>${t('Proponha uma correção compatível e entregue uma matriz de regressão com critérios de reversão.', 'Propose a compatible fix and submit a regression matrix with rollback criteria.')}</li>
          </ol>
        </article>
        <label for="forge-level">${t('Dificuldade', 'Difficulty')}</label>
        <select id="forge-level"><option value="">${t('Todas', 'All')}</option>
          <option value="1">${t('Iniciante', 'Beginner')}</option><option value="2">${t('Intermediário', 'Intermediate')}</option><option value="3">${t('Avançado', 'Advanced')}</option>
        </select>
        <div class="forge-exercises">
          ${labs.map(([id, br, en, taskBr, taskEn, goalBr, goalEn]) => `
            <article data-level="${id}">
              <h3>${t(br, en)}</h3><p>${t(taskBr, taskEn)}</p>
              <p><strong>${t('Entrega esperada', 'Expected submission')}</strong> · ${t(goalBr, goalEn)}</p>
            </article>`).join('')}
        </div>
      </section>
      <section class="shell forge-panel" id="automation" data-mode-panel="automation">
        <h2>${t('Automação com ForgeScope', 'Automation with ForgeScope')}</h2>
        <div class="forge-exercises">
          <article>
            <h3>PatchScope</h3>
            <label for="forge-diff">${t('Cole um diff unificado', 'Paste a unified diff')}</label>
            <textarea id="forge-diff" rows="9" placeholder="git diff HEAD" maxlength="${limits.bytes}"></textarea>
            <div class="forge-actions">
              <button type="button" id="review-diff">${t('Analisar diff', 'Analyze diff')}</button>
              <button type="button" id="sample-diff">${t('Carregar diff de pedidos', 'Load orders diff')}</button>
              <button type="button" id="export-review" disabled>${t('Baixar checklist', 'Download checklist')}</button>
            </div>
            <p role="status" id="patch-status"></p>
            <p><a href="${actionGuide}">${t('Automatizar revisão em pull requests com GitHub Actions', 'Automate pull request review with GitHub Actions')}</a></p>
            <ul class="forge-evidence" id="patch-results"></ul>
          </article>
          <article>
            <h3>${t('Relatório ForgeScope', 'ForgeScope report')}</h3>
            <p>${t('Importe o report.json gerado pelo ForgeScope ou explore o exemplo oficial. A leitura ocorre no navegador.', 'Import a report.json generated by ForgeScope or explore the official sample. Files are read in your browser.')}</p>
            <label for="forge-file">${t('Arquivo de relatório', 'Report file')}</label>
            <input type="file" id="forge-file" accept=".json,application/json">
            <div class="forge-actions"><button type="button" id="sample-report">${t('Abrir relatório de exemplo', 'Open sample report')}</button></div>
            <p role="status" id="forge-status"></p>
            <label for="forge-tool">${t('Capacidade', 'Capability')}</label>
            <select id="forge-tool">${capabilities.map(([name, br, en], index) =>
              `<option value="${index}">${name} · ${t(br, en)}</option>`).join('')}</select>
            <ul class="forge-evidence" id="forge-results"></ul>
            <p><a href="${docs}#quick-start">${t('Gerar relatório no terminal', 'Generate a report locally')}</a> · <a href="${hub}">${t('Abrir ForgeScope Hub', 'Open ForgeScope Hub')}</a></p>
          </article>
        </div>
      </section>`;

    function find<T extends HTMLElement>(id: string): T {
      return root.querySelector<T>(`#${id}`)!;
    }
    const difficulty = find<HTMLSelectElement>('forge-level');
    function filterLabs() {
      root.querySelectorAll<HTMLElement>('[data-level]').forEach((lab) => {
        lab.hidden = level !== '' && lab.dataset.level !== level;
      });
    }
    difficulty.value = level;
    difficulty.onchange = () => { level = difficulty.value; filterLabs(); };
    filterLabs();

    const input = find<HTMLTextAreaElement>('forge-diff');
    const patchStatus = find('patch-status');
    const patchResults = find('patch-results');
    const exportButton = find<HTMLButtonElement>('export-review');
    input.value = diff;
    function presentReview() {
      patchResults.replaceChildren();
      exportButton.disabled = !review;
      if (!review) return;
      patchStatus.textContent = `${review.summary.files} ${t('arquivo(s)', 'file(s)')} · ${review.summary.findings} ${t('ponto(s) de revisão', 'review prompt(s)')}`;
      for (const warning of review.warnings) patchResults.append(evidenceLine(t('Aviso', 'Warning'), warning));
      for (const finding of review.findings.slice(0, 100)) {
        const location = finding.line === null ? finding.path : `${finding.path}:${finding.line}`;
        patchResults.append(evidenceLine(`${finding.severity.toUpperCase()} · ${finding.title}`,
          `${location} · ${finding.reason} ${finding.action}`));
      }
      if (review.findings.length > 100) {
        patchResults.append(evidenceLine(t('Primeiros 100 pontos', 'First 100 prompts'),
          t('O checklist contém todos os resultados.', 'The checklist contains all results.')));
      }
    }
    function runReview() {
      diff = input.value;
      review = undefined;
      patchStatus.textContent = '';
      try {
        const result = analyzeDiff(diff);
        if (!result.summary.files) throw new Error(t('Cole um diff unificado com arquivos alterados.', 'Paste a unified diff with changed files.'));
        review = result;
      } catch (error) {
        patchStatus.textContent = label(error instanceof Error ? error.message : error);
      }
      presentReview();
    }
    input.oninput = () => {
      diffRequest++;
      diff = input.value;
      review = undefined;
      patchStatus.textContent = '';
      presentReview();
    };
    find('review-diff').onclick = runReview;
    find('sample-diff').onclick = async () => {
      const request = ++diffRequest;
      try {
        const response = await fetch(`${base}pedidos/change.diff`);
        if (!response.ok) throw new Error();
        const sample = await response.text();
        if (request !== diffRequest || !input.isConnected) return;
        input.value = sample;
        runReview();
      } catch {
        if (request === diffRequest) patchStatus.textContent = t('Falha ao carregar o diff.', 'Unable to load the diff.');
      }
    };
    exportButton.onclick = () => {
      if (!review) return;
      const url = URL.createObjectURL(new Blob([toMarkdown(review)], { type: 'text/markdown' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'patchscope-review.md';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    presentReview();

    const status = find('forge-status');
    const results = find('forge-results');
    const select = find<HTMLSelectElement>('forge-tool');
    select.value = tool;
    function presentReport() {
      results.replaceChildren();
      if (tool === '4') {
        results.append(evidenceLine('PlanRelay', t('Abra o Hub para criar, revisar e aprovar uma revisão do plano.', 'Open the Hub to create, review, and approve a plan revision.')));
      }
      if (!report) return;
      status.textContent = `${t('Relatório carregado', 'Report loaded')} · ${label(report.project)}`;
      const engines: readonly string[] = capabilities[Number(tool)][3];
      const impact = record(report.impact);
      const findings = items(report.findings).map(record).filter((entry) => engines.includes(label(entry.engine)));
      for (const entry of findings.slice(0, 100)) {
        results.append(evidenceLine(`${label(entry.priority)} · ${label(entry.title)}`,
          [entry.path, entry.line, entry.evidence, entry.action].map(label).filter(Boolean).join(' · ')));
      }
      if (tool === '3') {
        for (const candidate of items(impact.test_candidates).slice(0, 50)) {
          results.append(evidenceLine(t('Candidato a teste', 'Test candidate'), label(candidate)));
        }
        for (const edge of items(impact.edges).slice(0, 50).map(record)) {
          results.append(evidenceLine(label(edge.language), `${label(edge.source)} → ${label(edge.target)} · ${label(edge.line)}`));
        }
      }
      if (tool === '5') {
        for (const signal of items(record(report.artifacts).signals).slice(0, 50).map(record)) {
          results.append(evidenceLine(label(signal.kind),
            [signal.path, signal.verification, signal.notes].map(label).filter(Boolean).join(' · ')));
        }
        for (const entry of items(report.tools).slice(0, 50).map(record)) {
          results.append(evidenceLine(label(entry.name) || label(entry.tool), label(entry.description) || label(entry.reason)));
        }
        if (!results.children.length) results.append(evidenceLine(t('Sem artefatos no relatório', 'No artifacts in this report'),
          t('Abra a documentação do ForgeScope para consultar o catálogo RevScope.', 'Open the ForgeScope documentation to browse the RevScope catalog.')));
      }
      if (!results.children.length) results.append(evidenceLine(t('Sem achados nesta capacidade', 'No findings for this capability'), ''));
    }
    async function loadReport(read: () => Promise<string>) {
      const request = ++reportRequest;
      status.textContent = t('Carregando…', 'Loading…');
      try {
        const parsed = record(JSON.parse(await read()));
        if (parsed.schema_version !== 1 || typeof parsed.project !== 'string' || !Array.isArray(parsed.findings)) throw new Error();
        if (request !== reportRequest || !status.isConnected) return;
        report = parsed;
        presentReport();
      } catch {
        if (request === reportRequest) status.textContent = t('Não foi possível carregar um relatório ForgeScope v1 de até 5 MB.', 'Could not load a ForgeScope v1 report of up to 5 MB.');
      }
    }
    find<HTMLInputElement>('forge-file').onchange = (event) => {
      const field = event.currentTarget as HTMLInputElement;
      const file = field.files?.[0];
      field.value = '';
      if (!file) return;
      void loadReport(() => file.size <= 5_000_000 ? file.text() : Promise.reject(new Error()));
    };
    find('sample-report').onclick = () => void loadReport(async () => {
      const response = await fetch(`${base}forgescope-sample.json`);
      if (!response.ok) throw new Error();
      return response.text();
    });
    select.onchange = () => { tool = select.value; presentReport(); };
    presentReport();
    selectMode();
  };
}
