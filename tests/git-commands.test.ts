import { describe, expect, it } from 'vitest';
import { gitCommands } from '../src/lib/git-commands';

describe('comandos de Git', () => {
  it.each(['user;whoami', 'user$(whoami)', 'user`whoami`', 'user\nwhoami', 'user&whoami', 'user|whoami', 'user"quote'])('rejects shell syntax in every command field: %s', value => {
    expect(() => gitCommands(value, 'repo', 'fix/issue', 'proprio')).toThrow();
    expect(() => gitCommands('user', value, 'fix/issue', 'proprio')).toThrow();
    expect(() => gitCommands('user', 'repo', value, 'proprio')).toThrow();
  });
  it('gera um fluxo de fork sem interpolar comandos não confiáveis', () => {
    expect(gitCommands('alguem', 'projeto', 'docs/primeiro-pr', 'fork')).toContain('git remote add upstream https://github.com/ORIGINAL_OWNER/ORIGINAL_REPO.git');
    expect(() => gitCommands('alguem;echo segredo', 'repo', 'docs', 'proprio')).toThrow();
    expect(() => gitCommands('alguem', 'repo', 'docs;rm', 'proprio')).toThrow();
  });
});
