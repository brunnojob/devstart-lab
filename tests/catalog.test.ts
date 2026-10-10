import { describe, expect, it } from 'vitest';
import { projects } from '../src/data/projects';
import { filterProjects, recommendProject } from '../src/lib/catalog';

describe('catálogo', () => {
  it('procura sem depender de acentos ou caixa', () => {
    expect(filterProjects(projects, { search: 'PORTFOLIO', category: '', difficulty: '' }).map((project) => project.id)).toEqual(['portfolio']);
  });

  it('combina filtros e evita projetos já salvos na recomendação', () => {
    expect(filterProjects(projects, { search: 'teste', category: 'Automação', difficulty: 'Iniciante' }).map((project) => project.id)).toEqual(['ci-reutilizavel']);
    expect(recommendProject(projects, 'Iniciante', ['lista-tarefas'])?.id).toBe('conversor');
  });
});
