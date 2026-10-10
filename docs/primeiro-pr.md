# Seu primeiro pull request, com calma

Um pull request (PR) é um pedido para comparar sua branch com outra branch e discutir uma mudança antes de integrá-la. Você não precisa de um projeto grande: uma correção de instrução, teste ou problema pequeno já é um bom começo.

## 1. Encontre e combine a tarefa

Leia README, licença e CONTRIBUTING do projeto. Procure uma issue marcada `good first issue` ou `help wanted`. Veja se alguém já assumiu a tarefa e, quando necessário, diga o que pretende fazer. Evite enviar mudanças grandes sem conversar antes.

## 2. Escolha o fluxo

**Com permissão de escrita:** clone o repositório original e crie uma branch nele.

**Sem permissão de escrita:** use o botão **Fork** no GitHub, clone o *seu fork*, crie uma branch e envie a mudança para o fork. Configure `upstream` com a URL do projeto original para acompanhar futuras alterações.

Exemplo para o fluxo de fork:

```bash
git clone https://github.com/SEU_USUARIO/NOME_DO_REPO.git
cd NOME_DO_REPO
git remote add upstream https://github.com/AUTOR_ORIGINAL/NOME_DO_REPO.git
git switch -c docs/melhora-instalacao
```

Antes de modificar o código, confira as instruções de instalação do projeto. Evite trabalhar diretamente na branch `main`.

## 3. Mude, teste e envie

Faça a menor alteração que resolva o problema. Revise o diff e execute as verificações descritas no projeto.

```bash
git status
git diff
git add .
git commit -m "docs: esclarece a instalação"
git push -u origin docs/melhora-instalacao
```

`git add .` inclui todos os arquivos alterados da pasta atual. Confira `git status` antes do commit para não enviar segredos, arquivos locais ou mudanças sem relação com a tarefa.

## 4. Abra o PR na interface

No GitHub, use **Compare & pull request** no seu fork ou branch. A branch base deve ser a principal do projeto original; a branch de comparação deve ser a sua. Informe:

- O problema e por que a mudança ajuda.
- O que mudou e o que ficou fora do escopo.
- Como você testou, com resultados verificáveis.
- O número da issue, se existir.
- Capturas ou demonstração quando a interface mudou.

Acompanhe as verificações automáticas. Quando alguém pedir ajustes, envie novos commits na mesma branch. O PR é atualizado automaticamente.

## 5. Depois da revisão

A pessoa mantenedora decide como e quando integrar a mudança. Agradeça o feedback, resolva as conversas e aceite que uma contribuição pode ser redirecionada. Aprender a colaborar conta tanto quanto escrever o código.

## Erros comuns

| Sintoma | O que conferir |
| --- | --- |
| `Permission denied` ao fazer push | Você clonou o projeto original sem acesso de escrita? Envie para o seu fork. |
| PR com arquivos inesperados | Revise `git status`, `.gitignore` e o diff antes do commit. |
| Branch desatualizada | Busque as mudanças de `upstream` e siga a política de merge/rebase do projeto. |
| Checks falhando | Abra os logs do CI, reproduza localmente e envie uma correção. |

Fontes: [criar pull request](https://docs.github.com/pt/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request), [fazer fork](https://docs.github.com/pt/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo), [contribuir com open source](https://docs.github.com/pt/get-started/exploring-projects-on-github/contributing-to-open-source).
