let cachedStatus;
let cacheExpires = 0;
const button = document.querySelector('#check');
button?.addEventListener('click', async () => {
  const status = document.querySelector('#status');
  if (cachedStatus && Date.now() < cacheExpires) {
    status.replaceChildren(...cachedStatus.map(node => node.cloneNode(true)));
    return;
  }
  button.disabled = true;
  status.textContent = 'Consultando o GitHub...';
  try {
    const response = await fetch(`https://api.github.com/repos/brunnojob/${encodeURIComponent(button.dataset.repo)}/actions/workflows/${button.dataset.workflow}/runs?per_page=10`, { signal: AbortSignal.timeout(8000), credentials: 'omit', referrerPolicy: 'no-referrer' });
    if (!response.ok) throw new Error(response.status === 403 || response.status === 429 ? 'Limite da API pública atingido. Consulte o Actions pelo link acima.' : `GitHub respondeu ${response.status}. Consulte o Actions pelo link acima.`);
    const data = await response.json();
    if (!Array.isArray(data.workflow_runs)) throw new Error('Resposta inválida do GitHub.');
    const run = data.workflow_runs.find(item => item.event !== 'pull_request' && item.head_branch === button.dataset.branch);
    if (!run || !Number.isSafeInteger(run.id) || run.id <= 0 || !/^[a-f0-9]{40}$/i.test(run.head_sha)) throw new Error('Nenhuma execução encontrada para a branch principal.');
    const labels = { success: 'passou', failure: 'falhou', cancelled: 'cancelada', action_required: 'aguarda autorização', skipped: 'ignorada', timed_out: 'tempo esgotado' };
    status.replaceChildren(document.createTextNode(`Última execução: ${labels[run.conclusion] ?? run.status}. Commit ${run.head_sha.slice(0,12)}. `));
    const link = document.createElement('a');
    link.href = `https://github.com/brunnojob/${button.dataset.repo}/actions/runs/${Number(run.id)}`;
    link.textContent = 'Abrir execução';
    status.append(link, document.createTextNode(run.head_sha === button.dataset.sha ? ' — corresponde ao relatório abaixo.' : ' — é outra versão; o relatório abaixo continua identificado pelo commit registrado.'));
    cachedStatus = [...status.childNodes].map(node => node.cloneNode(true));
    cacheExpires = Date.now() + 60000;
  } catch (error) {
    status.textContent = error.name === 'TimeoutError' ? 'A consulta demorou demais. Consulte o Actions pelo link acima.' : error.message;
  } finally {
    button.disabled = false;
  }
});
