export type Suggestion = 'dependency' | 'assertion' | 'syntax' | 'types' | 'unused' | 'generic';
export const guidance: Record<Suggestion, [string, string]>;
export interface Diagnostic {
  job: string;
  path: string;
  line: number | null;
  endLine: number | null;
  message: string;
  source: string | null;
  suggestion: Suggestion;
}
export interface RunReport {
  repository: string;
  sha: string | null;
  attempt: string | null;
  status: string;
  conclusion: string | null;
  failedJobs: number;
  evidence: Diagnostic[];
  missing: { job: string; reason: string; detail?: string }[];
  incomplete: boolean;
}
export function diagnoseRun(url: string, options?: { signal?: AbortSignal }): Promise<RunReport>;
