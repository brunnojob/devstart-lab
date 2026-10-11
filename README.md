# DevStart Lab

**Um ponto de partida em português para aprender GitHub, construir projetos e fazer a primeira contribuição open source.**

[Explorar a aplicação](https://brunnojob.github.io/devstart-lab/) · [Começar pelo roadmap](#roadmap) · [Ideias de projetos](#ideias-de-projetos) · [Fazer o primeiro PR](#seu-primeiro-pull-request) · [Contribuir](CONTRIBUTING.md)

> Seu primeiro passo vira projeto. O guia é gratuito, aberto e funciona no navegador sem conta adicional, token ou servidor.

## O que existe aqui

| Área | O que você consegue fazer |
| --- | --- |
| Roadmap | Percorrer 12 etapas com entregas verificáveis, referências oficiais e progresso salvo no navegador |
| Projetos | Filtrar 25 ideias por área, nível e busca; conferir requisitos, estimativa e extensão; salvar favoritas |
| Primeiro PR | Entender branch, fork, revisão e gerar comandos Git a partir do seu usuário e repositório |
| Conquistas | Conhecer caminhos legítimos para Pull Shark, Pair Extraordinaire, Galaxy Brain e Starstruck |
| Portabilidade | Exportar e importar o progresso em JSON, sem enviar dados pessoais a um servidor |

## Comece em 15 minutos

1. Abra a [aplicação](https://brunnojob.github.io/devstart-lab/) e marque a primeira etapa do roadmap depois de executá-la.
2. Filtre o catálogo por **Iniciante** e escolha uma ideia cujo escopo caiba na sua semana.
3. Crie um repositório com README, licença e uma primeira versão utilizável.
4. Escolha uma melhoria pequena em um projeto aberto e siga o [guia de pull request](docs/primeiro-pr.md).

O objetivo é criar valor para outras pessoas. Estrelas e conquistas podem vir como consequência, mas não são garantidas.

## Roadmap

| Fase | Etapas | Entrega esperada |
| --- | --- | --- |
| Fundamentos | Perfil, repositório, Git local | Perfil seguro e histórico de commits compreensível |
| Construção | Branches, README, projeto | Projeto funcional e documentado |
| Colaboração | Issues, fork, pull request, revisão | Contribuição pequena, revisável e útil |
| Próximos passos | Automação, comunidade | Testes no CI e ajuda a outra pessoa |

A aplicação apresenta cada etapa com uma fonte do GitHub Docs e um entregável concreto. O progresso fica em `localStorage`; exporte um JSON se quiser mudar de navegador.

## Ideias de projetos

As 25 propostas cobrem frontend, backend, dados, automação, documentação, API e full stack. Cada uma traz dificuldade, tempo estimado, requisitos mínimos e um desafio extra. Algumas opções para começar:

- **Lista de tarefas acessível:** armazenamento local e navegação por teclado.
- **Conversor de unidades:** validação e testes de fórmulas.
- **Modelo de CI:** verificação automática de testes e build em pull requests.
- **Glossário Git:** 20 termos com fontes e exemplos práticos.
- **API de biblioteca:** rotas CRUD, validação e testes.

Abra uma [sugestão de nova ideia](https://github.com/brunnojob/devstart-lab/issues/new/choose) com problema, público, requisitos e critérios de aceite.

## Seu primeiro pull request

Se você tem permissão de escrita no projeto, crie uma branch no repositório. Caso contrário, faça um fork e crie uma branch nele. Leia o `CONTRIBUTING.md` do projeto antes de alterar arquivos. Execute testes, envie a branch e use a interface do GitHub para abrir um PR com contexto e evidências. O [tutorial completo](docs/primeiro-pr.md) inclui os dois fluxos e erros frequentes.

Encontre tarefas pequenas em [issues marcadas como `good first issue`](https://github.com/topics/good-first-issue) e confirme que ninguém já está trabalhando nelas. Documentação, tradução, testes e correções pequenas também são contribuições valiosas.

## Conquistas do GitHub

O [guia de conquistas](docs/conquistas.md) mostra ações úteis associadas a quatro Achievements e aponta para fontes oficiais. As regras exatas de elegibilidade não são uma promessa deste projeto: o GitHub informa que a funcionalidade está em **prévia pública** e pode mudar. Passe o cursor ou clique em uma conquista no seu perfil para ver as dicas e os eventos relacionados.

Evite criar PRs vazios, coautorias fictícias ou discussões artificiais. Faça o trabalho que vale a pena mesmo sem badge.

## Executar localmente

### Pré-requisitos

- Node.js 22.12 ou superior
- npm compatível com a sua versão do Node.js

```bash
git clone https://github.com/brunnojob/devstart-lab.git
cd devstart-lab
npm ci
npm run dev
```

Abra o endereço local informado pelo Vite. Para verificar alterações:

```bash
npm run typecheck
npm run test
npm run build
npm run preview
```

O projeto usa TypeScript estrito, Vite e Vitest. O build está configurado para o caminho `/devstart-lab/` do GitHub Pages. O site é estático; nenhuma variável de ambiente ou token é exigido.

## Estrutura

```text
src/data/             Roadmap, ideias e conquistas
src/lib/              Busca, progresso e comandos Git
src/main.ts           Interface e interações
src/styles.css        Layout responsivo
 tests/               Testes das regras de negócio
 docs/                Guias aprofundados
 .github/             CI, publicação e modelos de contribuição
```

## Contribua

Leia [CONTRIBUTING.md](CONTRIBUTING.md), abra uma issue com uma melhoria delimitada e envie um PR. Sugestões de conteúdo devem ter fontes confiáveis e exemplos reproduzíveis. Correções de acessibilidade, testes e explicações mais claras são bem-vindas.

## Licença e créditos

Código sob [MIT](LICENSE). Conteúdo e projeto criados por **Brunno / BrunnoDev** — [brunnodev.store](https://brunnodev.store/) · [GitHub @brunnojob](https://github.com/brunnojob).

## Co-authorship

Contribution trailer:

```text
Co-authored-by: nyctophile <33561761+ineedfoundmyway@users.noreply.github.com>
```

## Projetos em execução

[Explorar as evidências públicas](https://brunnojob.github.io/devstart-lab/proofs/). O catálogo reúne 60 projetos existentes, 59 relatórios extraídos dos logs do GitHub Actions e demos que executam o código original no navegador. Cada relatório identifica a versão, os comandos, as saídas e os limites da verificação. O perfil `brunnojob` e o repositório `bet-admin-dashboard` ficam fora desse catálogo.

`python scripts/build-proofs.py` compila seis programas em C para WebAssembly e reproduz seus cenários de entrada. As demos JavaScript usam os arquivos originais em commits fixados. O build falha se a versão baixada, o relatório ou os cenários não corresponderem ao registro. O catálogo contém snapshots; o botão de consulta usa a API pública do GitHub para mostrar a execução mais recente, sem confundi-la com a versão registrada.
