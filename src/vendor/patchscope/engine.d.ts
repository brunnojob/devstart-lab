export const limits: Readonly<{ bytes: number; files: number; lines: number }>;
export interface ReviewFinding {
  severity: string;
  path: string;
  line: number | null;
  title: string;
  reason: string;
  action: string;
}
export interface ReviewReport {
  summary: { files: number; findings: number };
  findings: ReviewFinding[];
  warnings: string[];
}
export function analyzeDiff(input: string): ReviewReport;
export function toMarkdown(report: ReviewReport): string;
