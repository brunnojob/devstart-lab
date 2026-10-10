export type Progress = { version: 1; completedSteps: string[]; savedProjects: string[] };

export const emptyProgress = (): Progress => ({ version: 1, completedSteps: [], savedProjects: [] });

export function parseProgress(value: string, stepIds: readonly string[], projectIds: readonly string[]): Progress {
  if (value.length > 100_000) throw new Error('Arquivo de progresso muito grande.');
  const parsed: unknown = JSON.parse(value);
  if (!parsed || typeof parsed !== 'object' || !('version' in parsed) || parsed.version !== 1 || !('completedSteps' in parsed) || !('savedProjects' in parsed) || !Array.isArray(parsed.completedSteps) || !Array.isArray(parsed.savedProjects)) {
    throw new Error('Formato de progresso inválido.');
  }
  const steps = parsed.completedSteps;
  const projects = parsed.savedProjects;
  if (!steps.every((id: unknown) => typeof id === 'string') || !projects.every((id: unknown) => typeof id === 'string')) throw new Error('Identificadores inválidos.');
  return {
    version: 1,
    completedSteps: [...new Set(steps.filter((id: string) => stepIds.includes(id)))],
    savedProjects: [...new Set(projects.filter((id: string) => projectIds.includes(id)))]
  };
}

export function readProgress(storage: Pick<Storage, 'getItem'>, stepIds: readonly string[], projectIds: readonly string[]): Progress {
  try {
    const stored = storage.getItem('devstart-progress-v1');
    return stored ? parseProgress(stored, stepIds, projectIds) : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

export function writeProgress(storage: Pick<Storage, 'setItem'>, progress: Progress): void {
  storage.setItem('devstart-progress-v1', JSON.stringify(progress));
}
