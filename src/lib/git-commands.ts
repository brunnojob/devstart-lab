export type GitFlow = 'proprio' | 'fork';

export function gitCommands(owner: string, repository: string, branch: string, flow: GitFlow): string[] {
  const account = owner.trim();
  const repo = repository.trim();
  const name = branch.trim();
  if (!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(account)) throw new Error('Informe um usuário GitHub válido.');
  if (!/^[a-z\d][a-z\d._-]{0,99}$/i.test(repo) || repo.endsWith('.git') || repo.includes('..')) throw new Error('Informe um repositório válido, sem .git.');
  if (!/^[a-z\d][a-z\d/_-]{0,79}$/i.test(name) || name.includes('//') || name.endsWith('/') || name === 'main' || name === 'master') throw new Error('Use uma branch nova com letras, números, /, _ ou -.');
  const url = `https://github.com/${account}/${repo}.git`;
  const commands = [`git clone ${url}`, `cd ${repo}`];
  if (flow === 'fork') commands.push('git remote add upstream https://github.com/ORIGINAL_OWNER/ORIGINAL_REPO.git');
  commands.push(`git switch -c ${name}`, 'git status', 'git add .', `git commit -m "docs: descreve a mudança"`, `git push -u origin ${name}`);
  return commands;
}
