const API = 'https://api.github.com';
const FAILED = new Set(['failure', 'timed_out', 'startup_failure', 'action_required']);

export function parseRun(url) {
  const match = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/actions\/runs\/([1-9]\d*)(?:\/attempts\/([1-9]\d*))?\/?$/.exec(url.trim());
  if (!match || [match?.[1], match?.[2]].some((part) => part === '.' || part === '..')) {
    throw new Error('Use https://github.com/owner/repo/actions/runs/123');
  }
  const [, owner, repository, run, attempt] = match;
  return { owner, repository, run, attempt };
}

export function suggestionFor(message) {
  if (/ModuleNotFoundError|Cannot find module|package .* does not exist|CS0246/i.test(message)) return 'dependency';
  if (/AssertionError|expected.*(?:received|actual)|assertion failed/i.test(message)) return 'assertion';
  if (/SyntaxError|unexpected token|expected ['";]/i.test(message)) return 'syntax';
  if (/never read|unused import|imports .* unused/i.test(message)) return 'unused';
  if (/TS2322|TS2345|incompatible types|CS0029|CS1503/i.test(message)) return 'types';
  return 'generic';
}

export const guidance = {
  dependency: ['Confira o import, o manifesto e o lockfile. Repita a instalação com a versão usada pelo job.', 'Check the import, manifest and lockfile. Repeat installation with the version used by the job.'],
  assertion: ['Compare os valores esperado e obtido. Rode o teste isoladamente e confirme a regra esperada antes de alterar a asserção.', 'Compare expected and actual values. Run the test in isolation and confirm the intended behavior before editing the assertion.'],
  syntax: ['Inspecione a linha indicada e a anterior. Rode o parser ou compilador localmente para confirmar a correção.', 'Inspect the reported line and the preceding line. Run the parser or compiler locally to confirm the fix.'],
  types: ['Compare o tipo exigido pela assinatura com o valor recebido. Rode a checagem de tipos após ajustar a origem do valor.', 'Compare the signature’s required type with the supplied value. Run the type checker after fixing the source of the value.'],
  unused: ['Verifique se a declaração perdeu sua chamada ou se sobrou após uma refatoração. Restaure o uso necessário ou remova a declaração e rode a checagem de tipos.', 'Check whether the declaration lost a call site or was left behind by a refactor. Restore the intended usage or remove it, then run the type checker.'],
  generic: ['Abra a anotação e reproduza localmente o comando do check. Registre um teste que confirme a hipótese.', 'Open the annotation and reproduce the check command locally. Record a test that verifies your hypothesis.'],
};

export async function diagnoseRun(url, { token, request = fetch, signal } = {}) {
  const { owner, repository, run, attempt } = parseRun(url);
  const repo = `/repos/${owner}/${repository}`;
  const runPath = `${repo}/actions/runs/${run}`;
  const attemptPath = attempt ? `${runPath}/attempts/${attempt}` : runPath;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  async function get(path) {
    const response = await request(API + path, { headers, signal, redirect: 'error' });
    if (!response.ok) throw new Error(`GitHub API HTTP ${response.status}`);
    return response.json();
  }
  async function pages(path, unpack) {
    const rows = [];
    for (let page = 1; page <= 5; page++) {
      const batch = unpack(await get(`${path}?per_page=100&page=${page}`));
      if (!Array.isArray(batch)) throw new Error('Invalid GitHub API response.');
      rows.push(...batch);
      if (batch.length < 100) return { rows, limited: false };
    }
    return { rows, limited: true };
  }
  const metadata = await get(attemptPath);
  const sha = /^[a-f0-9]{40}$/i.test(metadata.head_sha ?? '') ? metadata.head_sha : null;
  const activeAttempt = attempt ?? (/^[1-9]\d*$/.test(String(metadata.run_attempt)) ? String(metadata.run_attempt) : null);
  const jobsPath = activeAttempt ? `${runPath}/attempts/${activeAttempt}/jobs` : `${runPath}/jobs`;
  const { rows: jobs, limited } = await pages(jobsPath, (value) => value.jobs);
  const failures = jobs.filter((job) => FAILED.has(job.conclusion));
  const evidence = [];
  const missing = [];
  let incomplete = limited || failures.length > 30;
  for (const job of failures.slice(0, 30)) {
    signal?.throwIfAborted();
    const check = typeof job.check_run_url === 'string' &&
      job.check_run_url.startsWith(API + repo + '/check-runs/')
      ? job.check_run_url.slice((API + repo + '/check-runs/').length) : '';
    if (!/^[1-9]\d*$/.test(check)) {
      missing.push({ job: job.name, reason: 'no-check' });
      continue;
    }
    let annotations;
    try {
      annotations = await pages(`${repo}/check-runs/${check}/annotations`, (value) => value);
    } catch (error) {
      signal?.throwIfAborted();
      incomplete = true;
      missing.push({ job: job.name, reason: 'unavailable', detail: error.message });
      continue;
    }
    incomplete ||= annotations.limited;
    const errors = annotations.rows.filter((item) => item.annotation_level === 'failure');
    if (!errors.length) missing.push({ job: job.name, reason: 'no-annotation' });
    for (const item of errors) {
      const path = typeof item.path === 'string' ? item.path : '';
      const line = Number.isSafeInteger(item.start_line) && item.start_line > 0 ? item.start_line : null;
      const endLine = Number.isSafeInteger(item.end_line) && item.end_line >= line ? item.end_line : line;
      const message = item.message || item.title || '';
      const encodedPath = path.split('/').map(encodeURIComponent).join('/');
      const source = sha && line && path && path.split('/').every((piece) => piece && piece !== '.' && piece !== '..')
        ? `https://github.com/${owner}/${repository}/blob/${sha}/${encodedPath}#L${line}${endLine > line ? `-L${endLine}` : ''}` : null;
      evidence.push({ job: job.name, path, line, endLine, message, source, suggestion: suggestionFor(message) });
    }
  }
  return { repository: `${owner}/${repository}`, sha, attempt: activeAttempt, status: metadata.status, conclusion: metadata.conclusion, failedJobs: failures.length, evidence, missing, incomplete };
}
