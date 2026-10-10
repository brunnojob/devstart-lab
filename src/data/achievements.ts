export type Achievement = {
  name: string;
  icon: string;
  path: string;
  action: string;
  source: string;
  sourceLabel: string;
};

export const achievements: Achievement[] = [
  { name: 'Pull Shark', icon: '↗', path: 'Contribua com pull requests de verdade.', action: 'Escolha uma issue pequena, envie uma mudança útil e acompanhe a revisão até o merge. A elegibilidade do badge depende das regras atuais do GitHub.', source: 'https://docs.github.com/pt/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request', sourceLabel: 'Guia de pull requests' },
  { name: 'Pair Extraordinaire', icon: '◉', path: 'Programe com outra pessoa e registre a autoria corretamente.', action: 'Quando houver colaboração real, adicione a pessoa como coautora do commit com consentimento e um e-mail associado à conta dela.', source: 'https://docs.github.com/pt/pull-requests/committing-changes-to-your-project/creating-and-editing-commits/creating-a-commit-with-multiple-authors', sourceLabel: 'Commits com coautoria' },
  { name: 'Galaxy Brain', icon: '✦', path: 'Ajude a comunidade em GitHub Discussions.', action: 'Responda perguntas com contexto, links e exemplos verificáveis. A pessoa autora pode marcar uma resposta útil como solução.', source: 'https://docs.github.com/pt/discussions/collaborating-with-your-community-using-discussions/participating-in-a-discussion', sourceLabel: 'Participar de discussões' },
  { name: 'Starstruck', icon: '★', path: 'Publique algo que outras pessoas queiram guardar.', action: 'Resolva um problema claro, capriche no README, mantenha exemplos utilizáveis e divulgue em comunidades relevantes sem pedir estrelas em troca.', source: 'https://docs.github.com/pt/get-started/exploring-projects-on-github/saving-repositories-with-stars', sourceLabel: 'Sobre estrelas' }
];
