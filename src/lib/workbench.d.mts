import type { RunReport } from './ci-diagnostics.mjs';
type Language = 'pt' | 'en';
export type Kind = 'review' | 'ci' | 'maintenance' | 'impact' | 'artifact' | 'plan';
export interface Finding {
  kind: Kind; title: string; path: string; line: number | null; endLine: number | null;
  detail: string; next: string; source: string;
}
export interface Evidence { findings: Finding[]; notes: string[] }
export function reviewPatch(diff: string): Evidence;
export function checkEvidence(report: RunReport, language?: Language): Evidence;
export function scanEvidence(report: unknown, language?: Language): Evidence;
export function readCase(value: unknown): Evidence & { plan: string };
export function packageCase(findings: Finding[], notes: string[], plan?: string): Evidence & { schema: string; plan: string };
