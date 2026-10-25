type PageOptions = {
  stepCount: number;
  projectCount: number;
  defaults: { owner: string; repository: string; branch: string };
};

export function createPage({
  stepCount,
  projectCount,
  defaults,
}: PageOptions): string {
  return `
<header class="site-header">
  <div class="shell header-inner">
    <a class="brand" href="#inicio" aria-label="DevStart Lab, início"
      ><span class="brand-mark">D<span>.</span></span
      ><span>DevStart <b>Lab</b></span></a
    >
    <nav aria-label="Navegação principal">
      <a href="#roadmap">Roadmap</a><a href="#projetos">Projetos</a
      ><a href="#pull-request">Primeiro PR</a
      ><a href="#conquistas">Conquistas</a
      ><a href="./proofs/">Projetos em execução</a>
    </nav>
    <div class="preferences">
      <label
        >Idioma<select id="language-select">
          <option value="pt">Português</option>
          <option value="en">English</option>
        </select></label
      ><label
        >Tema<select id="theme-select">
          <option value="light">Claro</option>
          <option value="dark">Escuro</option>
        </select></label
      >
    </div>
    <a
      class="header-github"
      href="https://github.com/brunnojob/devstart-lab"
      target="_blank"
      rel="noopener noreferrer"
      >Ver no GitHub <span aria-hidden="true">↗</span></a
    >
  </div>
</header>
<main id="conteudo">
  <section id="inicio" class="hero shell">
    <div class="hero-copy">
      <p class="eyebrow">GUIA GRATUITO PARA INICIANTES EM PROGRAMAÇÃO</p>
      <h1>
        Aprenda lógica de programação.<br /><em
          >Publique seu primeiro projeto.</em
        >
      </h1>
      <p class="hero-lead">
        Uma trilha com 20 etapas: resolva exercícios de lógica com exemplos em
        Python, construa um programa e aprenda a publicá-lo no GitHub.
      </p>
      <div class="hero-actions">
        <a class="button primary" href="#step-logica-problemas"
          >Fazer o primeiro exercício <span aria-hidden="true">→</span></a
        ><a class="button secondary" href="#step-conta"
          >Já programo: aprender GitHub</a
        >
      </div>
      <p class="hero-note">
        Sem cadastro ou instalação para consultar. Os exemplos são para executar
        no seu ambiente Python.
      </p>
    </div>
    <aside class="hero-panel" aria-labelledby="first-exercise-title">
      <div class="panel-top">
        <span>EXEMPLO DA ETAPA 01</span><span class="example-tag">Lógica</span>
      </div>
      <div class="panel-body">
        <h2 id="first-exercise-title">Calcule o troco de uma compra</h2>
        <p>Antes de escrever código, separe o problema em três partes.</p>
        <dl class="exercise-breakdown">
          <div>
            <dt>Entrada</dt>
            <dd>2 itens de R$ 10. Pagamento de R$ 25.</dd>
          </div>
          <div>
            <dt>Regra</dt>
            <dd>
              Multiplique preço por quantidade. Subtraia o total do pagamento.
            </dd>
          </div>
          <div>
            <dt>Saída esperada</dt>
            <dd>Total: R$ 20. Troco: R$ 5.</dd>
          </div>
        </dl>
        <a class="inline-link" href="#step-logica-problemas"
          >Ver exercício e exemplo em Python →</a
        >
      </div>
      <div class="panel-bottom">
        Depois: teste dinheiro exato e pagamento insuficiente.
      </div>
    </aside>
  </section>
  <section class="stat-strip">
    <div class="shell stat-grid">
      <div><strong>${stepCount}</strong><span>passos práticos</span></div>
      <div><strong>${projectCount}</strong><span>ideias de projetos</span></div>
      <div><strong>Git</strong><span>do repositório ao PR</span></div>
      <p>
        Sem cadastro. Sem token. Seu progresso fica <b>no seu navegador.</b>
      </p>
    </div>
  </section>
  <section id="roadmap" class="section shell">
    <div class="section-heading">
      <div>
        <p class="eyebrow">01 / O CAMINHO</p>
        <h2>Lógica, Python <em>e GitHub.</em></h2>
        <p>
          Cada etapa traz uma explicação, uma tarefa e um material de apoio.
          Marque como concluída depois de testar sua solução.
        </p>
      </div>
      <div class="progress-card">
        <span id="progress-label">0 de ${stepCount} etapas concluídas</span>
        <div
          class="progress-track"
          role="progressbar"
          aria-label="Etapas concluídas"
          aria-valuemin="0"
          aria-valuemax="${stepCount}"
          aria-valuenow="0"
          id="progress-bar"
        >
          <div id="progress-fill"></div>
        </div>
        <div class="progress-actions">
          <button id="export-progress" type="button">
            Exportar progresso ↓</button
          ><label for="import-progress">Importar JSON ↑</label
          ><input
            id="import-progress"
            type="file"
            accept="application/json,.json"
          />
        </div>
      </div>
    </div>
    <div class="foundation-intro">
      <h3>Como o exercício vira um projeto?</h3>
      <ol class="learning-route">
        <li>
          <strong>1. Resolva problemas pequenos</strong>
          <p>
            Nas etapas 1 a 7, pratique variáveis, condições, laços, funções e
            testes.
          </p>
          <a class="inline-link" href="#step-logica-problemas"
            >Começar pela lógica →</a
          >
        </li>
        <li>
          <strong>2. Junte o que aprendeu</strong>
          <p>
            Na etapa 8, construa uma lista de tarefas ou um controle de despesas
            no terminal.
          </p>
          <a class="inline-link" href="#step-logica-primeiro-projeto"
            >Ver o primeiro programa →</a
          >
        </li>
        <li>
          <strong>3. Publique e colabore</strong>
          <p>
            Depois, use Git, escreva um README e envie uma mudança para revisão
            no GitHub.
          </p>
          <a class="inline-link" href="#step-conta">Ir para GitHub →</a>
        </li>
      </ol>
      <p class="route-note">
        Os exemplos usam Python. Você pode praticar os mesmos conceitos em outra
        linguagem.
      </p>
    </div>
    <div id="roadmap-list" class="roadmap-list"></div>
  </section>
  <section id="projetos" class="section section-tinted">
    <div class="shell">
      <div class="section-heading">
        <div>
          <p class="eyebrow">02 / MÃOS À OBRA</p>
          <h2>Ideias para <em>praticar programação.</em></h2>
          <p>
            Cada projeto tem requisitos, uma estimativa e um próximo desafio.
            Comece pequeno e publique o que aprendeu.
          </p>
        </div>
        <div
          class="project-count"
          id="project-count"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        ></div>
      </div>
      <p class="estimate-note">
        As horas são estimativas para quem já conhece o básico da linguagem.
        Aprenda no seu ritmo.
      </p>
      <div class="filter-bar">
        <label
          >Buscar ideia<input
            id="project-search"
            type="search"
            placeholder="Ex.: API, Python, portfólio..."
            autocomplete="off" /></label
        ><label
          >Área<select id="category-filter">
            <option value="">Todas as áreas</option>
          </select></label
        ><label
          >Nível<select id="difficulty-filter">
            <option value="">Todos os níveis</option>
            <option value="Iniciante">Iniciante</option>
            <option value="Intermediário">Intermediário</option>
            <option value="Desafio">Desafio</option>
          </select></label
        ><button id="recommend" class="button dark" type="button">
          Sugerir um projeto ↗
        </button>
      </div>
      <div id="project-grid" class="project-grid"></div>
      <p id="project-empty" class="empty-state" hidden>
        Nenhum projeto encontrado. Tente outros filtros.
      </p>
    </div>
  </section>
  <section id="pull-request" class="section shell">
    <div class="section-heading">
      <div>
        <p class="eyebrow">03 / COLABORE</p>
        <h2>Seu primeiro PR, <em>passo a passo.</em></h2>
        <p>
          Um pull request propõe uma mudança para revisão. Escolha um problema
          pequeno, leia as regras do projeto e converse com quem mantém o
          código.
        </p>
      </div>
    </div>
    <div class="pr-layout">
      <div class="pr-steps">
        <div>
          <span>01</span>
          <div>
            <h3>Encontre uma tarefa</h3>
            <p>
              Procure issues com <code>good first issue</code> ou melhore a
              documentação. Confirme se a tarefa está disponível.
            </p>
          </div>
        </div>
        <div>
          <span>02</span>
          <div>
            <h3>Faça uma mudança focada</h3>
            <p>
              Crie uma branch, mude apenas o necessário, execute os testes e
              descreva como verificou o resultado.
            </p>
          </div>
        </div>
        <div>
          <span>03</span>
          <div>
            <h3>Abra e acompanhe o PR</h3>
            <p>
              Compare sua branch com a principal, explique o motivo, relacione a
              issue e responda à revisão com respeito.
            </p>
          </div>
        </div>
        <a
          class="inline-link"
          href="https://github.com/brunnojob/devstart-lab/issues"
          target="_blank"
          rel="noopener noreferrer"
          >Explorar issues deste projeto ↗</a
        >
      </div>
      <div class="command-card">
        <p class="eyebrow">GERADOR DE COMANDOS</p>
        <h3>Do clone ao push</h3>
        <p>
          Use seu próprio repositório ou um fork. Os comandos são montados
          localmente.
        </p>
        <div class="command-fields">
          <label
            >Fluxo<select id="git-flow" aria-describedby="command-error">
              <option value="proprio">Meu repositório</option>
              <option value="fork">Meu fork</option>
            </select></label
          ><label
            >Seu usuário GitHub<input
              id="git-owner"
              aria-describedby="command-error"
              value="${defaults.owner}"
              autocomplete="off" /></label
          ><label
            >Nome do repositório<input
              id="git-repo"
              aria-describedby="command-error"
              value="${defaults.repository}"
              autocomplete="off" /></label
          ><label
            >Nome da nova branch<input
              id="git-branch"
              aria-describedby="command-error"
              value="${defaults.branch}"
              autocomplete="off"
          /></label>
        </div>
        <p id="command-error" class="field-error" role="alert"></p>
        <pre id="command-output" tabindex="0" aria-label="Comandos Git"></pre>
        <button id="copy-commands" class="button primary" type="button">
          Copiar comandos
        </button>
        <p class="command-note">
          Em um fork, substitua ORIGINAL_OWNER e ORIGINAL_REPO pelo projeto
          original. Depois do push, abra o PR pela interface do GitHub.
        </p>
      </div>
    </div>
  </section>
  <section id="conquistas" class="section section-tinted">
    <div class="shell">
      <div class="section-heading">
        <div>
          <p class="eyebrow">04 / CONQUISTAS</p>
          <h2>Como funcionam os <em>Achievements.</em></h2>
          <p>
            Os Achievements estão em prévia pública e as regras podem mudar.
            Veja as dicas no seu perfil e participe de projetos de forma
            genuína.
          </p>
        </div>
        <a
          class="inline-link"
          href="https://docs.github.com/pt/account-and-profile/reference/profile-reference#earning-achievements"
          target="_blank"
          rel="noopener noreferrer"
          >Referência oficial ↗</a
        >
      </div>
      <div id="achievement-grid" class="achievement-grid"></div>
    </div>
  </section>
  <section class="closing shell">
    <p class="eyebrow">SUGESTÕES E CORREÇÕES</p>
    <h2>Encontrou um erro?<br /><em>Abra uma issue.</em></h2>
    <p>
      Indique a etapa, explique a dificuldade e diga o que você esperava
      encontrar. Correções nos exemplos e nas traduções também são bem-vindas.
    </p>
    <div class="hero-actions">
      <a
        class="button primary"
        href="https://github.com/brunnojob/devstart-lab"
        target="_blank"
        rel="noopener noreferrer"
        >Contribuir no GitHub ↗</a
      ><a
        class="button secondary"
        href="https://github.com/brunnojob/devstart-lab/issues/new/choose"
        target="_blank"
        rel="noopener noreferrer"
        >Sugerir uma ideia →</a
      >
    </div>
  </section>
</main>
<footer>
  <div class="shell footer-inner">
    <a class="brand" href="#inicio"
      ><span class="brand-mark">D<span>.</span></span
      ><span>DevStart <b>Lab</b></span></a
    >
    <p>
      Criado por
      <a
        href="https://brunnodev.store/"
        target="_blank"
        rel="noopener noreferrer"
        >Brunno / BrunnoDev ↗</a
      >
    </p>
    <a
      href="https://github.com/brunnojob/devstart-lab"
      target="_blank"
      rel="noopener noreferrer"
      >Código aberto ↗</a
    >
  </div>
</footer>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
`;
}
