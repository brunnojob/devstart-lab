#!/usr/bin/env node
import { diagnoseRun, guidance } from '../src/lib/ci-diagnostics.mjs';

const [command, url, ...flags] = process.argv.slice(2);
if (command !== 'ci' || !url || flags.some((flag) => flag !== '--json' && flag !== '--fail-on-error')) {
  console.error('Uso: npm run forge -- ci <URL da execução GitHub Actions> [--json] [--fail-on-error]');
  process.exitCode = 2;
} else {
  try {
    const result = await diagnoseRun(url, {
      token: process.env.GH_TOKEN || process.env.GITHUB_TOKEN,
      signal: AbortSignal.timeout(90_000),
    });
    const output = { ...result, evidence: result.evidence.map((entry) => ({ ...entry, nextStep: guidance[entry.suggestion][0] })) };
    if (flags.includes('--json')) console.log(JSON.stringify(output, null, 2));
    else {
      console.log(`${result.repository} · ${result.conclusion ?? result.status} · ${result.failedJobs} job(s) com falha`);
      for (const entry of output.evidence) {
        console.log(`\n${entry.job} · ${entry.line ? `${entry.path}:${entry.line}` : 'sem linha confirmada'}\n${entry.message}\nPróximo passo: ${entry.nextStep}`);
        if (entry.source) console.log(entry.source);
      }
      for (const entry of output.missing) console.log(`${entry.job}: sem anotação de falha disponível${entry.detail ? ` (${entry.detail})` : ''}.`);
      if (output.incomplete) console.log('Diagnóstico parcial.');
    }
    if (flags.includes('--fail-on-error') && (result.failedJobs || result.conclusion === 'failure' || result.incomplete)) process.exitCode = 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
