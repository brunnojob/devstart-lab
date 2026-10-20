import { describe, expect, it } from 'vitest';
import { parseProgress, readProgress } from '../src/lib/storage';

describe('progresso', () => {
  it('discards executable strings and prototype keys without mutating global objects', () => {
    const hostile = '{"version":1,"completedSteps":["<script>alert(1)</script>"],"savedProjects":["__proto__","javascript:alert(1)"],"__proto__":{"polluted":true}}';
    expect(parseProgress(hostile, ['known-step'], ['known-project'])).toEqual({ version: 1, completedSteps: [], savedProjects: [] });
    expect('polluted' in {}).toBe(false);
    expect(() => parseProgress('x'.repeat(100_001), [], [])).toThrow();
  });
  it('aceita somente identificadores conhecidos e remove duplicatas', () => {
    expect(parseProgress('{"version":1,"completedSteps":["a","a","desconhecido"],"savedProjects":["x","y"]}', ['a'], ['x'])).toEqual({ version: 1, completedSteps: ['a'], savedProjects: ['x'] });
  });

  it('rejeita estruturas inválidas e recupera armazenamento corrompido', () => {
    expect(() => parseProgress('{"version":2,"completedSteps":[],"savedProjects":[]}', [], [])).toThrow();
    expect(readProgress({ getItem: () => '{broken' }, [], [])).toEqual({ version: 1, completedSteps: [], savedProjects: [] });
  });
});
