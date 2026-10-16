import { translate } from './i18n';
import type { Difficulty, Project } from '../data/projects';

export type ProjectFilter = { search: string; category: string; difficulty: string };

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
}

export function filterProjects(items: readonly Project[], filter: ProjectFilter): Project[] {
  const query = normalize(filter.search.trim());
  return items.filter((project) => {
    const fields = [project.title, project.summary, project.category, ...project.stack];
    const searchable = normalize([...fields, ...fields.map(value => translate(value, 'en'))].join(' '));
    return (!query || searchable.includes(query)) && (!filter.category || project.category === filter.category) && (!filter.difficulty || project.difficulty === filter.difficulty);
  });
}

export function recommendProject(items: readonly Project[], difficulty: Difficulty, completedIds: readonly string[]): Project | undefined {
  const candidates = items.filter((project) => project.difficulty === difficulty && !completedIds.includes(project.id));
  return candidates[0] ?? items.find((project) => project.difficulty === difficulty);
}
