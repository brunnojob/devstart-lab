import { guidance } from './ci-diagnostics.mjs';
import { analyzeDiff } from '../vendor/patchscope/engine.js';

const kindFor = {
  patchscope: 'review', cifuse: 'ci', devrescue: 'ci', reporelief: 'maintenance',
  impact: 'impact', revscope: 'artifact', planrelay: 'plan',
};
const kinds = new Set(['review', 'ci', 'maintenance', 'impact', 'artifact', 'plan']);
const fields = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const array = (value) => Array.isArray(value) ? value : [];
const str = (value) => typeof value === 'string' ? value : '';
const lineNumber = (value) => Number.isSafeInteger(value) && value > 0 ? value : null;

function finding(kind, item) {
  const link = str(item.source);
  return {
    kind,
    title: str(item.title),
    path: str(item.path),
    line: lineNumber(item.line),
    endLine: lineNumber(item.endLine),
    detail: str(item.detail),
    next: str(item.next),
    source: /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/blob\/[a-f\d]{40}\//i.test(link) ? link : '',
  };
}

export function reviewPatch(diff) {
  const report = analyzeDiff(diff);
  if (!report.summary.files) throw new Error('Diff unificado sem arquivos alterados.');
  return { findings: report.findings.map((row) => finding('review', {
    ...row, detail: row.reason, next: row.action,
  })), notes: report.warnings };
}

export function checkEvidence(report, language = 'pt') {
  const locale = language === 'pt' ? 0 : 1;
  return {
    findings: report.evidence.map((row) => finding('ci', {
      ...row, title: row.job, detail: row.message, next: guidance[row.suggestion]?.[locale] ?? row.nextStep,
    })),
    notes: [
      `${report.repository} · ${report.conclusion ?? report.status} · ${report.failedJobs} ${locale ? 'failed job(s)' : 'job(s) com falha'}`,
      ...report.missing.map((row) => `${row.job} · ${locale ? 'No failure annotation available' : 'Sem anotação de falha disponível'}${row.detail ? ` (${row.detail})` : ''}`),
      ...(report.incomplete ? [locale ? 'Partial query.' : 'Consulta parcial.'] : []),
    ],
  };
}

export function scanEvidence(report, language = 'pt') {
  const en = language === 'en';
  const root = fields(report);
  if (root.schema_version !== 1 || typeof root.project !== 'string' || !Array.isArray(root.findings)) {
    throw new Error('Relatório de análise incompatível. Use JSON de esquema v1.');
  }
  const impact = fields(root.impact);
  const artifacts = fields(root.artifacts);
  return {
    findings: [
      ...root.findings.map(fields).map((row) => finding(Object.hasOwn(kindFor, row.engine) ? kindFor[row.engine] : 'maintenance', {
        ...row, detail: row.evidence, next: row.action,
      })),
      ...array(impact.test_candidates).filter((path) => typeof path === 'string').map((path) => finding('impact', {
        title: en ? 'Regression test candidate' : 'Candidato a teste de regressão', path,
        next: en ? 'Check whether this test exercises the changed behavior.' : 'Verifique se esse teste cobre o comportamento alterado.',
      })),
      ...array(impact.edges).map(fields).map((row) => finding('impact', {
        title: row.language, path: row.source, line: row.line, detail: row.target,
        next: en ? 'Confirm that the reference reaches the behavior under review.' : 'Confirme se a referência alcança o comportamento em revisão.',
      })),
      ...array(artifacts.signals).map(fields).map((row) => finding('artifact', {
        title: row.kind, path: row.path, detail: row.verification, next: row.notes,
      })),
      ...array(root.tools).map(fields).map((row) => finding('artifact', {
        title: row.name, detail: row.bestFor, next: row.reason,
      })),
    ],
    notes: [root.project, ...Object.entries(fields(root.engines)).map(([name, entry]) => `${name}: ${str(fields(entry).status)}`),
      ...array(root.limitations).filter((note) => typeof note === 'string')],
  };
}

export function readCase(value) {
  const bundle = fields(value);
  if (bundle.schema !== 'forgelab-case-v1' || !Array.isArray(bundle.findings) || !Array.isArray(bundle.notes)) {
    throw new Error('Arquivo de caso inválido.');
  }
  return {
    findings: bundle.findings.map(fields).filter((row) => kinds.has(row.kind)).map((row) => finding(row.kind, row)),
    notes: bundle.notes.filter((row) => typeof row === 'string'),
    plan: str(bundle.plan),
  };
}

export function packageCase(findings, notes, plan = '') {
  return { schema: 'forgelab-case-v1', findings, notes, plan };
}
