import { diagnoseRun, guidance, type RunReport } from '../lib/ci-diagnostics.mjs';
import type { Language } from '../lib/i18n';

const exampleUrl = 'https://github.com/brunnojob/devstart-lab/actions/runs/38196511827';
const example: RunReport = {
  repository: 'laboratorio/pedidos', sha: null, attempt: '1', status: 'completed',
  conclusion: 'failure', failedJobs: 1, missing: [], incomplete: false,
  evidence: [{
    job: 'testes Python', path: 'test_orders.py', line: 8, endLine: 8,
    message: 'AssertionError: expected 1500 cents, received 1200 cents',
    source: null, suggestion: 'assertion',
  }],
};

const tools = [
  ['CIFuse', 'Triage falhas de integração contínua', 'Triage CI failures', 'Compare a anotação com o teste que falhou e formule uma hipótese.', 'Compare the annotation with the failed test and write a hypothesis.', '#diagnostico', 'https://github.com/brunnojob/cifuse'],
  ['PatchScope', 'Revise diffs e prepare checklists para PRs', 'Review diffs and prepare PR checklists', 'Investigue um patch que remove um arquivo de testes.', 'Investigate a patch that removes a test file.', '#review-diff', 'https://github.com/brunnojob/patchscope'],
  ['RepoRelief', 'Identifique pendências de manutenção', 'Find maintenance issues', 'Use documentação, links e arquivos de teste como pistas para propor uma melhoria verificável.', 'Use documentation, links and test files to propose a verifiable change.', '#forge-tool=2', 'https://github.com/brunnojob/reporelief'],
  ['Java / Roslyn', 'Mapeie impacto de alterações em Java e C#', 'Map change impact in Java and C#', 'Parta da alteração de preços e escolha testes a partir das referências encontradas.', 'Start with the pricing change and select tests using the references found.', '#forge-tool=3', 'https://github.com/brunnojob/forgescope'],
  ['PlanRelay', 'Revise e aprove versões de um plano de mudança', 'Review and approve revisions of a change plan', 'Escreva um plano com testes e critérios para reversão.', 'Write a plan with tests and rollback criteria.', '#forge-tool=4', 'https://github.com/ineedfoundmyway/planrelay'],
  ['RevScope', 'Identifique formatos e escolha ferramentas de triagem', 'Identify formats and select triage tools', 'Confira os sinais de um artefato conhecido e registre o grau de confiança.', 'Check signals for a known artifact and record your confidence.', '#forge-tool=5', 'https://github.com/brunnojob/revscope'],
] as const;

export function ciMarkup(language: Language) {
  const t = (pt: string, en: string) => language === 'pt' ? pt : en;
  return `
    <section id="diagnostico" class="shell forge-panel" data-mode-panel="diagnostic">
      <div class="forge-console">
        <h2>${t('Diagnóstico de GitHub Actions', 'GitHub Actions diagnosis')}</h2>
        <p>${t('Cole a URL de uma execução pública. A ferramenta usa as anotações dos checks para localizar a falha e sugerir o próximo passo, sem consultar logs.', 'Paste a public run URL. Check annotations locate failures and suggest next steps without reading logs.')}</p>
        <form id="ci-form">
          <label for="ci-url">${t('URL da execução', 'Run URL')}</label>
          <input id="ci-url" type="url" required placeholder="https://github.com/owner/repo/actions/runs/123" />
          <div class="forge-actions">
            <button type="submit">${t('Diagnosticar execução', 'Diagnose run')}</button>
            <button type="button" id="ci-example">${t('Simular falha de teste', 'Simulate a test failure')}</button>
          </div>
        </form>
        <p><a href="${exampleUrl}" id="ci-real-example">${t('Preencher com uma execução do DevStart Lab', 'Use an actual DevStart Lab run')}</a></p>
        <p role="status" id="ci-status"></p>
        <div id="ci-evidence"></div>
      </div>
      <h2>CLI &amp; CI/CD</h2>
      <p>${t('Use o mesmo diagnóstico no terminal. Para repositórios privados, configure GH_TOKEN no ambiente da CLI.', 'Use the same diagnostics in your terminal. For private repositories, set GH_TOKEN in the CLI environment.')}</p>
      <pre class="forge-command"><code>npm run forge -- ci ${exampleUrl} --json</code></pre>
      <p><a href="https://github.com/brunnojob/devstart-lab/blob/feature/forge-learning-platform/docs/forge-lab.md#cicd">${t('Configurar no pipeline', 'Configure the pipeline')}</a></p>
    </section>
    <section id="ferramentas" class="shell forge-panel" data-mode-panel="tools">
      <h2>${t('Ferramentas para estudar e usar', 'Tools to learn and use')}</h2>
      <div class="forge-exercises">
        ${tools.map(([name, purposePt, purposeEn, labPt, labEn, target, url]) => `
          <article><h3>${name}</h3><p>${t(purposePt, purposeEn)}</p><p>${t(labPt, labEn)}</p>
          <a href="${target}">${t('Praticar', 'Practice')}</a> · <a href="${url}">${t('Código e documentação', 'Source and documentation')}</a></article>
        `).join('')}
      </div>
    </section>`;
}

export function bindCi(root: HTMLElement, language: Language, state: {
  url: string; report?: RunReport; simulated?: boolean; controller?: AbortController;
}) {
  const pt = language === 'pt';
  const t = (br: string, en: string) => pt ? br : en;
  const form = root.querySelector<HTMLFormElement>('#ci-form')!;
  const input = root.querySelector<HTMLInputElement>('#ci-url')!;
  const status = root.querySelector<HTMLElement>('#ci-status')!;
  const result = root.querySelector<HTMLElement>('#ci-evidence')!;
  input.value = state.url;
  state.controller?.abort();
  function display(report: RunReport) {
    status.textContent = `${state.simulated ? t('Simulação · ', 'Simulation · ') : ''}${report.repository} · ${report.conclusion ?? report.status} · ${report.failedJobs} ${t('job(s) com falha', 'failed job(s)')}`;
    result.replaceChildren();
    for (const item of report.evidence) {
      const article = document.createElement('article');
      const title = document.createElement('h3');
      title.textContent = item.line ? `${item.path}:${item.line}${item.endLine && item.endLine > item.line ? `–${item.endLine}` : ''}` : t('Linha não informada pelo check', 'No line reported by the check');
      const detail = document.createElement('p');
      detail.textContent = `${item.job} · ${item.message}`;
      const next = document.createElement('p');
      next.textContent = `${t('Sugestão', 'Suggested next step')} · ${guidance[item.suggestion][pt ? 0 : 1]}`;
      article.append(title, detail, next);
      if (item.source) {
        const source = document.createElement('a');
        source.href = item.source;
        source.textContent = t('Abrir o arquivo no commit', 'Open source at this commit');
        article.append(source, ' · ');
      }
      const practice = document.createElement('a');
      practice.href = item.suggestion === 'assertion' ? '#practice' : '#ferramentas';
      practice.textContent = item.suggestion === 'assertion'
        ? t('Praticar com o projeto de pedidos', 'Practice with the orders project')
        : t('Estudar a ferramenta de diagnóstico', 'Learn the diagnostics tool');
      article.append(practice);
      result.append(article);
    }
    for (const missing of report.missing) {
      const note = document.createElement('p');
      note.textContent = `${missing.job} · ${t('Sem anotação de falha disponível', 'No failure annotation available')}${missing.detail ? ` (${missing.detail})` : ''}`;
      result.append(note);
    }
    if (report.incomplete || !report.evidence.length) {
      const note = document.createElement('p');
      note.textContent = report.incomplete ? t('Consulta parcial. Alguns checks ficaram indisponíveis ou excederam o limite.', 'Partial results. Some checks were unavailable or exceeded the limit.') :
        t('Confira o estado da execução no GitHub. A localização depende das anotações publicadas pelos checks.', 'Check the run status on GitHub. Source locations depend on the annotations checks publish.');
      result.append(note);
    }
  }
  if (state.report) display(state.report);
  input.oninput = () => { state.url = input.value; };
  root.querySelector<HTMLAnchorElement>('#ci-real-example')!.onclick = (event) => {
    event.preventDefault();
    state.url = input.value = exampleUrl;
    input.focus();
  };
  root.querySelector<HTMLButtonElement>('#ci-example')!.onclick = () => {
    state.controller?.abort();
    state.report = example;
    state.simulated = true;
    display(example);
  };
  form.onsubmit = async (event) => {
    event.preventDefault();
    state.controller?.abort();
    const controller = new AbortController();
    state.controller = controller;
    state.url = input.value;
    state.report = undefined;
    state.simulated = false;
    result.replaceChildren();
    status.textContent = t('Consultando anotações…', 'Reading annotations…');
    try {
      const report = await diagnoseRun(state.url, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(60_000)]) });
      if (controller.signal.aborted) return;
      state.report = report;
      display(report);
    } catch (error) {
      if (controller.signal.aborted) return;
      status.textContent = `${t('Falha na consulta', 'Request failed')} · ${error instanceof Error ? error.message : String(error)}`;
    }
  };
}
