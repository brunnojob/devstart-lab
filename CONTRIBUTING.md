# Como contribuir

Obrigado por querer melhorar o DevStart Lab. A primeira contribuição pode ser texto, acessibilidade, dados, testes ou código.

## Antes de começar

1. Leia as issues existentes e escolha uma tarefa pequena, especialmente as marcadas `good first issue`.
2. Se a mudança for grande, abra uma issue para definir escopo e critérios de aceite antes de implementar.
3. Em guias de conquistas e fluxos do GitHub, use documentação oficial como fonte e evite prometer critérios que podem mudar.

## Fluxo local

Faça um fork se não tiver permissão de escrita, crie uma branch descritiva e rode:

```bash
npm ci
npm run typecheck
npm run test
npm run build
```

Envie um PR com resumo, motivação, como verificou e referência à issue. Não inclua tokens, `.env`, dados pessoais, dependências compiladas ou conteúdo de terceiros sem licença compatível. O projeto usa TypeScript estrito e não inclui comentários no código; prefira nomes e funções claros.

## Novas ideias de projetos

Uma ideia deve informar público, dificuldade, tempo estimado, stack, requisitos verificáveis e um desafio opcional. Ela precisa ser executável por uma pessoa iniciante ou explicar claramente os pré-requisitos adicionais. Evite descrições vagas como “construa uma rede social”.

## Conduta

Seja respeitoso. Critique mudanças, não pessoas. Ajude quem está começando com explicações reproduzíveis e referências. Quem mantém o projeto pode fechar contribuições fora do escopo ou que não respeitem outras pessoas.
