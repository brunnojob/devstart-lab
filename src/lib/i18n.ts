import { projects } from '../data/projects';
import { roadmap } from '../data/roadmap';
import { projectEnglish } from '../data/projects.en';
import { roadmapEnglish } from '../data/roadmap.en';

export type Language = 'pt' | 'en';
const english: Record<string, string> = {
"GUIA GRATUITO PARA INICIANTES EM PROGRAMAÇÃO": "A FREE GUIDE FOR PROGRAMMING BEGINNERS",
"Aprenda lógica de programação.": "Learn programming logic.",
"Publique seu primeiro projeto.": "Publish your first project.",
"Uma trilha com 20 etapas: resolva exercícios de lógica com exemplos em Python, construa um programa e aprenda a publicá-lo no GitHub.": "A 20-step path: solve logic exercises with Python examples, build a program and learn how to publish it on GitHub.",
"Fazer o primeiro exercício": "Try the first exercise",
"Já programo: aprender GitHub": "Already coding: learn GitHub",
"Sem cadastro ou instalação para consultar. Os exemplos são para executar no seu ambiente Python.": "No sign-up or installation to read the guide. Run the examples in your own Python environment.",
"EXEMPLO DA ETAPA 01": "STEP 01 EXAMPLE",
"Lógica": "Logic",
"Calcule o troco de uma compra": "Calculate change for a purchase",
"Antes de escrever código, separe o problema em três partes.": "Before writing code, split the problem into three parts.",
"Entrada": "Input",
"2 itens de R$ 10. Pagamento de R$ 25.": "2 items at R$ 10 each. Payment: R$ 25.",
"Regra": "Rule",
"Multiplique preço por quantidade. Subtraia o total do pagamento.": "Multiply price by quantity. Subtract the total from the payment.",
"Saída esperada": "Expected output",
"Total: R$ 20. Troco: R$ 5.": "Total: R$ 20. Change: R$ 5.",
"Ver exercício e exemplo em Python →": "View the exercise and Python example →",
"Depois: teste dinheiro exato e pagamento insuficiente.": "Next: test exact payment and insufficient payment.",
"do repositório ao PR": "from repository to PR",
"O que aprender,": "What to learn,",
"em qual ordem.": "and in what order.",
"Cada etapa traz uma explicação, uma tarefa e um material de apoio. Marque como concluída depois de testar sua solução.": "Each step includes an explanation, a task and a reference. Mark it complete after testing your solution.",
"Como o exercício vira um projeto?": "How does the exercise become a project?",
"1. Resolva problemas pequenos": "1. Solve small problems",
"Nas etapas 1 a 7, pratique variáveis, condições, laços, funções e testes.": "In steps 1–7, practice variables, conditions, loops, functions and tests.",
"Começar pela lógica →": "Start with logic →",
"2. Junte o que aprendeu": "2. Put it together",
"Na etapa 8, construa uma lista de tarefas ou um controle de despesas no terminal.": "In step 8, build a task list or an expense tracker in the terminal.",
"Ver o primeiro programa →": "View the first program →",
"3. Publique e colabore": "3. Publish and collaborate",
"Depois, use Git, escreva um README e envie uma mudança para revisão no GitHub.": "Then use Git, write a README and submit a change for review on GitHub.",
"Os exemplos usam Python. Você pode praticar os mesmos conceitos em outra linguagem.": "Examples use Python. You can practice the same concepts in another language.",
"Escolha o que": "Choose what",
"você vai construir.": "you will build.",

'Pular para o conteúdo':'Skip to content','DevStart Lab, início':'DevStart Lab, home','Navegação principal':'Main navigation','Projetos':'Projects','Primeiro PR':'First PR','Conquistas':'Achievements','Projetos em execução':'Projects in action','Ver no GitHub':'View on GitHub',
'UM CAMINHO ABERTO PARA QUEM ESTÁ COMEÇANDO':'AN OPEN PATH FOR BEGINNERS','Seu primeiro passo':'Your first step','vira projeto.':'becomes a project.','Aprenda GitHub na prática. Siga uma trilha clara, encontre uma ideia que cabe no seu tempo e envie um pull request que faz diferença.':'Learn programming logic, build your first program and practice GitHub. Follow a clear path from the basics to your first contribution.',
'Começar a trilha':'Start the path','Explorar ideias':'Explore ideas','01 / Aprenda':'01 / Learn','02 / Construa':'02 / Build','03 / Colabore':'03 / Collaborate','Prévia da sua jornada':'Preview of your journey','minha-jornada.md':'my-journey.md','# Da primeira linha ao primeiro PR':'# From the first line to the first PR','Criar e entender um repositório':'Create and understand a repository','Construir algo útil':'Build something useful','Abrir uma contribuição':'Make a contribution','O próximo commit é seu':'The next commit is yours','PROGRESSO REAL, NO SEU RITMO':'REAL PROGRESS, AT YOUR OWN PACE',
'passos práticos':'practical steps','ideias com escopo':'scoped project ideas','primeiro PR possível':'first PR to work towards','Sem cadastro. Sem token. Seu progresso fica':'No sign-up. No token. Your progress stays','no seu navegador.':'in your browser.',
'01 / O CAMINHO':'01 / THE PATH','Um roadmap que':'A roadmap that','anda com você.':'moves with you.','Marque cada etapa ao concluir a entrega. O importante é fazer, não apenas ler.':'Mark each step after completing its deliverable. Practice matters more than just reading.','Etapas concluídas':'Completed steps','Exportar progresso ↓':'Export progress ↓','Importar JSON ↑':'Import JSON ↑','Concluída':'Completed','Marcar feita':'Mark done',
'Comece aqui: lógica de programação':'Start here: programming logic','Fundamentos':'GitHub fundamentals','Construção':'Building','Colaboração':'Collaboration','Próximos passos':'Next steps','Pratique com um exemplo':'Practice with an example','Exercício':'Exercise',
'02 / MÃOS À OBRA':'02 / BUILD SOMETHING','Uma ideia.':'One idea.','Um projeto de verdade.':'A working project.','Cada projeto tem requisitos, uma estimativa e um próximo desafio. Comece pequeno e publique o que aprendeu.':'Each project includes requirements, a time estimate and a next challenge. Start small and publish what you learn.','Buscar ideia':'Search ideas','Ex.: API, Python, portfólio...':'E.g. API, Python, portfolio...','Área':'Area','Nível':'Level','Todas as áreas':'All areas','Todos os níveis':'All levels','Iniciante':'Beginner','Intermediário':'Intermediate','Desafio':'Challenge','Dados':'Data','Automação':'Automation','Documentação':'Documentation','Surpreenda-me ↗':'Suggest an idea ↗','Nenhum projeto encontrado. Tente outros filtros.':'No projects found. Try different filters.','O que construir':'What to build','★ Salvo':'★ Saved','☆ Salvar ideia':'☆ Save idea',
'03 / COLABORE':'03 / COLLABORATE','Seu primeiro PR,':'Your first PR,','passo a passo.':'step by step.','Um pull request propõe uma mudança para revisão. Escolha um problema pequeno, leia as regras do projeto e converse com quem mantém o código.':'A pull request proposes a change for review. Choose a small problem, read the project rules and talk to the maintainers.','Encontre uma tarefa':'Find a task','Procure issues com':'Look for issues labeled','ou melhore a documentação. Confirme se a tarefa está disponível.':'or improve the documentation. Check that the task is available.','Faça uma mudança focada':'Make a focused change','Crie uma branch, mude apenas o necessário, execute os testes e descreva como verificou o resultado.':'Create a branch, change only what is needed, run the tests and explain how you verified the result.','Abra e acompanhe o PR':'Open and follow up on the PR','Compare sua branch com a principal, explique o motivo, relacione a issue e responda à revisão com respeito.':'Compare your branch with the main branch, explain why, link the issue and respond respectfully to reviews.','Explorar issues deste projeto ↗':'Explore this project’s issues ↗','GERADOR DE COMANDOS':'COMMAND GENERATOR','Do clone ao push':'From clone to push','Use seu próprio repositório ou um fork. Os comandos são montados localmente.':'Use your own repository or a fork. Commands are generated locally.','Fluxo':'Workflow','Meu repositório':'My repository','Meu fork':'My fork','Seu usuário GitHub':'Your GitHub username','Nome do repositório':'Repository name','Nome da nova branch':'New branch name','Comandos Git':'Git commands','Copiar comandos':'Copy commands','Em um fork, substitua ORIGINAL_OWNER e ORIGINAL_REPO pelo projeto original. Depois do push, abra o PR pela interface do GitHub.':'For a fork, replace ORIGINAL_OWNER and ORIGINAL_REPO with the original project. After pushing, open the PR through GitHub.',
'04 / CONQUISTAS':'04 / ACHIEVEMENTS','Conquistas vêm de':'Achievements come from','contribuições reais.':'real contributions.','Os Achievements estão em prévia pública e as regras podem mudar. Veja as dicas no seu perfil e participe de projetos de forma genuína.':'Achievements are in public preview and rules may change. Check the hints on your profile and contribute meaningfully.','Referência oficial ↗':'Official reference ↗','Contribua com pull requests de verdade.':'Contribute meaningful pull requests.','Escolha uma issue pequena, envie uma mudança útil e acompanhe a revisão até o merge. A elegibilidade do badge depende das regras atuais do GitHub.':'Choose a small issue, submit a useful change and follow the review through to merge. Badge eligibility depends on GitHub’s current rules.','Guia de pull requests':'Pull request guide','Programe com outra pessoa e registre a autoria corretamente.':'Work with someone and credit authorship correctly.','Quando houver colaboração real, adicione a pessoa como coautora do commit com consentimento e um e-mail associado à conta dela.':'For actual collaboration, add the person as a commit coauthor with their consent and an email linked to their account.','Commits com coautoria':'Coauthored commits','Ajude a comunidade em GitHub Discussions.':'Help the community in GitHub Discussions.','Responda perguntas com contexto, links e exemplos verificáveis. A pessoa autora pode marcar uma resposta útil como solução.':'Answer questions with context, links and verifiable examples. The question author can mark a useful answer as the solution.','Participar de discussões':'Participate in discussions','Publique algo que outras pessoas queiram guardar.':'Publish something people want to keep.','Resolva um problema claro, capriche no README, mantenha exemplos utilizáveis e divulgue em comunidades relevantes sem pedir estrelas em troca.':'Solve a clear problem, write a useful README, maintain runnable examples and share in relevant communities without asking for stars in return.','Sobre estrelas':'About stars',
'O PR COMEÇA COM UMA PEQUENA MUDANÇA':'A PR STARTS WITH A SMALL CHANGE','Aprender em público':'Learning in public','abre caminhos.':'opens doors.','Use o guia, compartilhe com alguém que está começando e contribua com uma ideia para melhorá-lo.':'Use the guide, share it with a beginner and contribute an idea to improve it.','Contribuir no GitHub ↗':'Contribute on GitHub ↗','Sugerir uma ideia →':'Suggest an idea →','Feito para aprender e compartilhar. Criado por':'Made for learning and sharing. Created by','Código aberto ↗':'Open source ↗',
'Comece pela lógica, pratique GitHub depois.':'Start with logic, then practice GitHub.','Sem experiência? Faça as oito primeiras etapas. Já programa? Vá direto para GitHub. Os exemplos usam Python, mas os conceitos valem para outras linguagens.':'No experience? Start with the first eight steps. Already coding? Jump straight to GitHub. Examples use Python, but the concepts apply to other languages.','Ir para GitHub →':'Jump to GitHub →','As horas são estimativas para quem já conhece o básico da linguagem. Aprenda no seu ritmo.':'Time estimates assume basic knowledge of the language. Learn at your own pace.',
'Idioma':'Language','Tema':'Theme','Claro':'Light','Escuro':'Dark','Preferências salvas neste navegador.':'Preferences saved in this browser.',
'Progresso mantido nesta página. Exporte o JSON para não perder suas alterações.':'Progress is kept on this page. Export JSON to avoid losing your changes.','Nenhuma ideia disponível com esses filtros. Tente outra busca.':'No ideas available with these filters. Try another search.','Comandos copiados. Revise antes de executar.':'Commands copied. Review before running.','Use Ctrl+C ou Cmd+C para copiar os comandos selecionados.':'Use Ctrl+C or Cmd+C to copy the selected commands.','Não foi possível exportar o progresso. Tente novamente.':'Unable to export progress. Try again.','O arquivo de progresso está vazio.':'The progress file is empty.','Arquivo de progresso muito grande. O limite é 100 KB.':'Progress file too large. The limit is 100 KB.','Progresso importado e salvo com sucesso.':'Progress imported and saved.','Arquivo de progresso inválido.':'Invalid progress file.','Arquivo de progresso muito grande.':'Progress file too large.','Formato de progresso inválido.':'Invalid progress format.','Identificadores inválidos.':'Invalid identifiers.','Progresso atualizado a partir de outra aba.':'Progress updated from another tab.','Não foi possível sincronizar o progresso da outra aba.':'Unable to sync progress from the other tab.','O armazenamento está indisponível. Exporte seu progresso antes de fechar a página.':'Storage is unavailable. Export progress before closing this page.','Informe um usuário GitHub válido.':'Enter a valid GitHub username.','Informe um repositório válido, sem .git.':'Enter a valid repository name without .git.','Use uma branch nova com letras, números, /, _ ou -.':'Use a new branch with letters, numbers, /, _ or -.','Selecione um fluxo Git válido.':'Select a valid Git workflow.','Nenhum comando foi gerado.':'No commands generated.','Confira os valores informados.':'Check the entered values.'
};
for (const project of projects) {
  const entry = projectEnglish[project.id];
  if (!entry) throw new Error(`Missing project translation: ${project.id}`);
  english[project.title] = entry[0]; english[project.summary] = entry[1]; english[project.stretch] = entry[3];
  project.requirements.forEach((value, index) => { english[value] = entry[2][index]; });
}
for (const step of roadmap) {
  const entry = roadmapEnglish[step.id];
  if (!entry) throw new Error(`Missing roadmap translation: ${step.id}`);
  english[step.title] = entry[0]; english[step.summary] = entry[1]; english[step.deliverable] = entry[2]; english[step.resourceLabel] = entry[3];
  if (step.exercise && entry[4]) english[step.exercise] = entry[4];
}
export function translate(value: string, language: Language): string {
  if (language === 'pt') return value;
  const trimmed = value.trim();
  let translated = english[trimmed];
  if (!translated) {
    const progress = /^(\d+) de (\d+) etapas concluídas$/.exec(trimmed);
    const count = /^(\d+) ideias? para explorar$/.exec(trimmed);
    if (progress) translated = `${progress[1]} of ${progress[2]} steps completed`;
    else if (count) translated = `${count[1]} ${count[1] === '1' ? 'idea' : 'ideas'} to explore`;
    else {
      for (const [prefix, replacement] of [['Entrega: ', 'Deliverable: '], ['Próximo nível: ', 'Next level: '], ['Concluir etapa ', 'Complete step '], ['Salvar ideia: ', 'Save idea: '], ['Remover dos salvos: ', 'Remove saved idea: '], ['Sugestão: ', 'Suggestion: ']]) {
        if (trimmed.startsWith(prefix)) { translated = replacement + translate(trimmed.slice(prefix.length), language); break; }
      }
      if (!translated && trimmed.endsWith(' ↗')) translated = translate(trimmed.slice(0, -2), language) + ' ↗';
    }
  }
  return translated ? value.replace(trimmed, translated) : value;
}

type Source = { original: string; output: string };
const textSources = new WeakMap<Node, Source>();
const attributeSources = new WeakMap<Element, Map<string, Source>>();
export function translateDOM(root: HTMLElement, language: Language): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.parentElement?.closest('pre, code, script, style, [data-no-translate]')) continue;
    const current = node.nodeValue ?? '';
    const previous = textSources.get(node);
    const original = previous && current === previous.output ? previous.original : current;
    const output = translate(original, language);
    if (current !== output) node.nodeValue = output;
    textSources.set(node, { original, output });
  }
  for (const element of [root, ...root.querySelectorAll<HTMLElement>('[aria-label], [aria-valuetext], [placeholder]')]) {
    const sources = attributeSources.get(element) ?? new Map<string, Source>();
    for (const name of ['aria-label', 'aria-valuetext', 'placeholder']) {
      const current = element.getAttribute(name);
      if (current === null) continue;
      const previous = sources.get(name);
      const original = previous && current === previous.output ? previous.original : current;
      const output = translate(original, language);
      if (current !== output) element.setAttribute(name, output);
      sources.set(name, {original, output});
    }
    attributeSources.set(element, sources);
  }
}
