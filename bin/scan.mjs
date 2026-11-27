import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { packageCase, scanEvidence } from '../src/lib/workbench.mjs';

const engine = fileURLToPath(new URL('../engine/', import.meta.url));
const jar = join(engine, 'build/forgescope.jar');

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', timeout: 120_000 });
  if (result.error) throw new Error(`${command}: ${result.error.message}`);
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || `${command}: ${result.status}`);
}

export function scan(args) {
  const [repository, ...options] = args;
  const allowed = new Set(['--changed', '--base', '--diff', '--symbol', '--csharp-worker']);
  if (!repository || repository.startsWith('-') || options.length % 2 || options.some((flag, index) => index % 2 === 0 && !allowed.has(flag))) {
    throw new Error('Uso: node bin/devstart.mjs scan <pasta> [--base <ref> | --diff <arquivo>] [--changed <caminho>]');
  }
  if (!existsSync(jar)) run('java', ['tools/Build.java'], engine);
  const output = mkdtempSync(join(tmpdir(), 'forgelab-'));
  try {
    const worker = join(engine, 'dotnet/ForgeScope.Worker/bin/Release/net10.0/ForgeScope.Worker.dll');
    if (existsSync(worker) && !options.includes('--csharp-worker')) options.push('--csharp-worker', worker);
    run('java', ['-jar', jar, repository === 'validate' ? './validate' : repository, ...options, '--output', output, '--format', 'json'], process.cwd());
    const report = JSON.parse(readFileSync(join(output, 'report.json'), 'utf8'));
    const { findings, notes } = scanEvidence(report);
    return packageCase(findings, notes);
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
}

export function buildRoslyn() {
  const project = join(engine, 'dotnet/ForgeScope.Worker/ForgeScope.Worker.csproj');
  run('dotnet', ['build', project, '-c', 'Release'], dirname(project));
}
