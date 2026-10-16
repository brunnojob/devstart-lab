import { describe, expect, it } from 'vitest';
import { roadmap } from '../src/data/roadmap';
import { projects } from '../src/data/projects';
import { translate } from '../src/lib/i18n';
import { filterProjects } from '../src/lib/catalog';
import { parseProgress } from '../src/lib/storage';

describe('bilingual learning path', () => {
  it('keeps an existing export when adding the programming foundations', () => {
    const previous = JSON.stringify({version: 1, completedSteps: ['conta', 'git', 'pull-request'], savedProjects: ['csv-cleaner']});
    expect(parseProgress(previous, roadmap.map(s => s.id), projects.map(p => p.id))).toEqual(JSON.parse(previous));
    expect(roadmap.slice(0, 8).every(step => step.id.startsWith('logica-') && step.exercise && step.example)).toBe(true);
    expect(new Set(roadmap.map(step => step.id)).size).toBe(20);
  });
  it('finds the same project in either language without changing filter identifiers', () => {
    const find = (search: string) => filterProjects(projects, {search, category: 'Dados', difficulty: 'Iniciante'}).map(p => p.id);
    expect(find('limpador')).toEqual(['csv-cleaner']);
    expect(find('cleaner')).toEqual(['csv-cleaner']);
    expect(find('DATA')).toContain('csv-cleaner');
  });
  it('translates dynamic status messages and all learning content', () => {
    expect(translate('3 de 20 etapas concluídas', 'en')).toBe('3 of 20 steps completed');
    expect(translate('1 ideia para explorar', 'en')).toBe('1 idea to explore');
    expect(translate('Entrega: ' + roadmap[0].deliverable, 'en')).not.toContain('Entrega:');
    for (const item of roadmap) {
      for (const value of [item.title, item.summary, item.deliverable, item.resourceLabel, item.exercise].filter(Boolean)) {
        expect(translate(value!, 'en')).not.toEqual(value);
      }
    }
    for (const item of projects) {
      for (const value of [item.title, item.summary, item.stretch, ...item.requirements]) expect(translate(value, 'en')).not.toEqual(value);
    }
  });
});
