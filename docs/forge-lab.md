# ForgeLab

Uma bancada open source que transforma exercícios, diffs, checks e análise de repositório em um caso de engenharia. Cada caso reúne evidências, hipóteses, verificações e um plano de revisão. A trilha de Python, Git e colaboração, os exercícios e os projetos abrem tarefas nesse mesmo fluxo.

## Começar

- **Pedidos sem perder cobertura** usa Python, testes e revisão do diff de exemplo.
- **Uma verificação falhou** consulta uma tentativa real de GitHub Actions e explica as linhas indicadas pelos checks.
- **Checkout em dois runtimes** reúne revisão, manutenção, dependências, testes candidatos e triagem de artefatos no mesmo caso.

Em **Minha investigação**, você pode adicionar várias fontes e exportar um caso JSON ou a revisão Markdown. O JSON da bancada e da CLI usa `forgelab-case-v1`. As evidências e o plano ficam em memória até a exportação. A trilha usa a mesma chave de progresso local da versão anterior.

## CLI

Execute com Node.js 22 ou mais recente. O modo `scan` usa JDK 21 e compila o motor incluído na primeira execução.

```bash
node bin/devstart.mjs scan engine/examples/sample --changed java/src/shop/Pricing.java --diff engine/examples/change.diff > checkout.json
git diff --no-ext-diff HEAD | node bin/devstart.mjs diff > revisao.json
node bin/devstart.mjs ci https://github.com/brunnojob/devstart-lab/actions/runs/38196511827/attempts/1 --case > ci.json
```

Abra esses arquivos na mesma investigação. A análise C# usa o worker incluído, compilado com .NET 10 via `node bin/devstart.mjs build-roslyn`. O leitor também aceita relatórios ForgeScope de esquema v1.

Para repositórios privados, forneça `GH_TOKEN` ou `GITHUB_TOKEN` à CLI. A consulta usa permissões de leitura de Actions e Checks. Em ambientes com proxy, use Node.js 24 com `NODE_USE_ENV_PROXY=1`. Use `--json` para obter o relatório de CI anterior, ou `--case` para importar diretamente na bancada.

## CI/CD

O [workflow de exemplo](examples/diagnose-ci.yml) registra o diagnóstico após falha do workflow indicado. Ele usa a revisão confiável da branch padrão do evento `workflow_run`, lê as anotações da tentativa correspondente, sem consultar logs, e salva o caso como artefato. Configure o nome do workflow antes de instalar o exemplo em `.github/workflows/`.

Arquivo e linha dependem da evidência publicada pelo check. Configure um reporter de testes ou problem matcher quando sua ferramenta só emitir texto em stdout.

## Desenvolvimento e proveniência

Rode `npm ci --ignore-scripts`, `npm run dev`, `npm test`, `npm run test:security` e `npm run build`. A rota principal abre o ForgeLab. Links antigos de lições e `?classic=1` mantêm acesso à interface legada.

- O conteúdo de Python, Git e projetos deriva do DevStart Lab.
- O motor Java, o worker Roslyn, o cenário de exemplo e o catálogo RevScope vêm do [ForgeScope 39384ef](https://github.com/brunnojob/forgescope/tree/39384ef18617f38113bba3ae7eca47204009daff). Estão em `engine/` com licenças e proveniência. O modo JSON foi adicionado para a integração.
- O motor de diff do navegador vem do [PatchScope e2d23db](https://github.com/brunnojob/patchscope/tree/e2d23db3af60724b103f3fb434894005096e83c7/src) e mantém a licença MIT em `src/vendor/patchscope/`.
- O plano local usa conceitos de revisão do PlanRelay. O fluxo de aprovação do Hub original não é parte dessa bancada.
