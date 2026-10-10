import { describe, expect, it } from 'vitest';
import { parseProgress, readProgress } from '../src/lib/storage';

describe('progresso', () => {
  it('aceita somente identificadores conhecidos e remove duplicatas', () => {
    expect(parseProgress('{"version":1,"completedSteps":["a","a","desconhecido"],"savedProjects":["x","y"]}', ['a'], ['x'])).toEqual({ version: 1, completedSteps: ['a'], savedProjects: ['x'] });
  });

  it('rejeita estruturas inválidas e recupera armazenamento corrompido', () => {
    expect(() => parseProgress('{"version":2,"completedSteps":[],"savedProjects":[]}', [], [])).toThrow();
    expect(readProgress({ getItem: () => '{broken' }, [], [])).toEqual({ version: 1, completedSteps: [], savedProjects: [] });
  });
});
