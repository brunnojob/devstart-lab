export type RoadmapStep = {
  id: string;
  phase: string;
  title: string;
  summary: string;
  deliverable: string;
  resource: string;
  resourceLabel: string;
};

export const roadmap: RoadmapStep[] = [
  { id: 'conta', phase: 'Fundamentos', title: 'Monte seu perfil', summary: 'Crie sua conta, escreva uma bio clara e configure autenticação em duas etapas.', deliverable: 'Perfil com nome, bio e segurança configurada.', resource: 'https://docs.github.com/pt/authentication/securing-your-account-with-two-factor-authentication-2fa/configuring-two-factor-authentication', resourceLabel: 'Segurança da conta' },
  { id: 'repositorio', phase: 'Fundamentos', title: 'Crie seu primeiro repositório', summary: 'Entenda README, licença, visibilidade e histórico de alterações.', deliverable: 'Repositório público com README e licença.', resource: 'https://docs.github.com/pt/get-started/start-your-journey/hello-world', resourceLabel: 'Olá, mundo GitHub' },
  { id: 'git', phase: 'Fundamentos', title: 'Aprenda Git local', summary: 'Pratique clone, status, add, commit, push e pull num projeto seu.', deliverable: 'Três commits pequenos com mensagens descritivas.', resource: 'https://docs.github.com/pt/get-started/using-git/about-git', resourceLabel: 'Sobre o Git' },
  { id: 'branches', phase: 'Construção', title: 'Trabalhe em branches', summary: 'Separe cada mudança numa branch e compare o histórico com a branch principal.', deliverable: 'Branch de funcionalidade enviada ao GitHub.', resource: 'https://docs.github.com/pt/get-started/using-git/about-git', resourceLabel: 'Git na prática' },
  { id: 'readme', phase: 'Construção', title: 'Documente para alguém usar', summary: 'Explique propósito, instalação, exemplos e decisões; adicione capturas quando úteis.', deliverable: 'README que permita executar o projeto sem adivinhar passos.', resource: 'https://docs.github.com/pt/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes', resourceLabel: 'Sobre READMEs' },
  { id: 'projeto', phase: 'Construção', title: 'Publique um projeto pequeno', summary: 'Escolha uma ideia, defina critérios de aceite, implemente e faça uma demonstração.', deliverable: 'Projeto funcional com link e instruções de uso.', resource: 'https://docs.github.com/pt/repositories/creating-and-managing-repositories/about-repositories', resourceLabel: 'Sobre repositórios' },
  { id: 'issues', phase: 'Colaboração', title: 'Abra uma issue útil', summary: 'Descreva comportamento esperado, passos para reproduzir e contexto suficiente.', deliverable: 'Issue específica e reproduzível.', resource: 'https://docs.github.com/pt/issues/tracking-your-work-with-issues/using-issues/creating-an-issue', resourceLabel: 'Criar uma issue' },
  { id: 'fork', phase: 'Colaboração', title: 'Faça fork de um projeto', summary: 'Leia CONTRIBUTING, escolha uma issue pequena e crie uma branch no seu fork.', deliverable: 'Fork com uma alteração isolada.', resource: 'https://docs.github.com/pt/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo', resourceLabel: 'Fazer fork' },
  { id: 'pull-request', phase: 'Colaboração', title: 'Abra seu primeiro pull request', summary: 'Compare sua branch, explique a mudança e peça revisão sem pressa.', deliverable: 'PR com descrição, testes e link para a issue.', resource: 'https://docs.github.com/pt/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request', resourceLabel: 'Criar pull request' },
  { id: 'revisao', phase: 'Colaboração', title: 'Receba e faça revisão', summary: 'Responda comentários com contexto e revise código com respeito.', deliverable: 'Feedback aplicado e conversa resolvida.', resource: 'https://docs.github.com/pt/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/about-pull-request-reviews', resourceLabel: 'Revisões de PR' },
  { id: 'automacao', phase: 'Próximos passos', title: 'Automatize verificações', summary: 'Adicione uma rotina de testes ao abrir pull requests e observe o resultado.', deliverable: 'Workflow de CI passando numa branch.', resource: 'https://docs.github.com/pt/actions/get-started/quickstart', resourceLabel: 'Início rápido de Actions' },
  { id: 'comunidade', phase: 'Próximos passos', title: 'Ajude outra pessoa', summary: 'Compartilhe um aprendizado, melhore documentação ou responda uma dúvida com fontes.', deliverable: 'Contribuição pública e útil para a comunidade.', resource: 'https://docs.github.com/pt/get-started/exploring-projects-on-github/contributing-to-open-source', resourceLabel: 'Contribuir com open source' }
];
