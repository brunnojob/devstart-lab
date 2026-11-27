# DevStart Lab × ForgeScope

A plataforma mantém o DevStart Lab como porta de entrada e conecta três modos.

- **Estudo** preserva a trilha Python/Git, o catálogo e o progresso existente.
- **Projetos e exercícios** oferece um processador CSV testável, um cenário de manutenção Java/C# e nove exercícios em três níveis.
- **Automação** executa o PatchScope no navegador, exporta um checklist Markdown e lê relatórios JSON v1 do ForgeScope.

## Fluxos

Para iniciar, baixe o código de pedidos e rode `python3 -m unittest -v`. Em Automação, carregue o diff do mesmo projeto e use a indicação de remoção de cobertura para preparar uma revisão. Para aplicar a revisão aos seus próprios PRs, o painel liga para a Action oficial do PatchScope.

Para praticar manutenção, use o cenário Java/C# do ForgeScope. O relatório de exemplo permite explorar diagnósticos de CI, sinais de manutenção, referências de impacto e testes candidatos. O leitor também aceita um relatório produzido localmente pelo ForgeScope. PlanRelay abre o Hub oficial para trabalhar com planos e aprovações. RevScope apresenta os sinais e recomendações presentes nos relatórios que incluem artefatos.

A plataforma estática não requer conta. Relatórios e diffs importados ficam em memória. O Hub mantém seu próprio fluxo de autenticação.

## Proveniência

- O motor e a configuração PatchScope em `src/vendor/patchscope/` vêm do [commit e2d23db](https://github.com/brunnojob/patchscope/tree/e2d23db3af60724b103f3fb434894005096e83c7/src). A licença MIT está no diretório.
- O relatório de exemplo é uma cópia de [docs/report.json](https://github.com/brunnojob/forgescope/blob/39384ef18617f38113bba3ae7eca47204009daff/docs/report.json) do ForgeScope. A licença acompanha o arquivo.

## Desenvolvimento

Rode `npm ci --ignore-scripts` e `npm run dev`. A plataforma usa a base `/devstart-lab/`. Verifique com `npm test`, `npm run test:security` e `npm run build`.

## Diagnóstico de CI sem logs

O painel inicial usa as anotações de falha dos checks de uma execução pública de GitHub Actions. Quando o check publica arquivo e linha, o painel abre o trecho no SHA da execução. As sugestões são associadas ao texto da anotação, com orientações para dependências, asserções, sintaxe, erros de tipo e declarações não utilizadas. Checks sem anotações não fornecem uma linha confirmada.

No terminal, com Node.js 22 ou mais recente:

```bash
npm run forge -- ci https://github.com/brunnojob/devstart-lab/actions/runs/38196511827
npm run forge -- ci https://github.com/brunnojob/devstart-lab/actions/runs/38196511827/attempts/1 --json
```

A CLI não depende de instalação adicional. Para repositórios privados, forneça `GH_TOKEN` ou `GITHUB_TOKEN` com permissões de leitura de Actions e Checks. Em ambientes com proxy, use Node.js 24 com `NODE_USE_ENV_PROXY=1`. O modo `--fail-on-error` usa código 1 para falha detectada ou consulta parcial. Erros de uso ou de consulta da execução retornam código 2.

## CI/CD

Use o [workflow de exemplo](examples/diagnose-ci.yml) em `.github/workflows/diagnose-ci.yml` no repositório que contém a CLI. Substitua `Qualidade` pelo nome do workflow que você quer observar. O exemplo usa a revisão confiável da branch padrão fornecida pelo evento `workflow_run`, consulta a tentativa exata que falhou e publica o JSON como artefato. Ele não executa o código do PR que originou a falha.

Se o compilador ou o executor de testes publicar resultados somente em stdout, configure um reporter que publique anotações de check para obter localização no diagnóstico.
