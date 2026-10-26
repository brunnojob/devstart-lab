# DevStart Lab

A free guide to programming basics, small projects and your first GitHub contribution. It starts with Python exercises and continues with Git, publishing a repository and opening a pull request.

[Try it in English](https://brunnojob.github.io/devstart-lab/?lang=en) · [Usar em português](https://brunnojob.github.io/devstart-lab/?lang=pt) · [Watch the walkthrough](https://brunnojob.github.io/devstart-lab/media/devstartlab.mp4)

## Using the guide

If you are starting from scratch, work through the first eight steps: break down a problem, practice Python basics and build a small terminal program. Run the examples in your own Python environment; the guide does not execute them for you.

If you already code, jump to the GitHub steps. They cover creating a repository, writing a README, using branches and proposing a focused change through a pull request.

The app includes:

- 20 learning steps with explanations, tasks and reference links.
- 25 project ideas with requirements, difficulty filters and suggested extensions.
- A Git command generator for your own repository or a fork.
- Checklists and saved project ideas, stored in your browser.
- JSON import and export for backing up progress.
- English and Portuguese interfaces, with light and dark themes.

No account, API token or application server is needed. Clearing site data removes saved progress, so export a backup if you want to keep it or switch browsers. The longer [first-PR guide](docs/primeiro-pr.md) and [achievement guide](docs/conquistas.md) are currently in Portuguese.

## Project examples

The separate [project catalog](https://brunnojob.github.io/devstart-lab/proofs/) links to source repositories, recorded test runs and browser demonstrations. These records show the scenarios that were tested, rather than guaranteeing every feature or hardware integration. See [the catalog notes](proofs/README.md) for details.

## Run locally

Requires Node.js 22.12+ and Python 3.

```sh
git clone https://github.com/brunnojob/devstart-lab.git
cd devstart-lab
npm ci --ignore-scripts
npm run dev
```

Open the address printed by Vite. To check a change:

```sh
npm run typecheck
npm test
npm run test:security
npm run build
```

Build output uses the `/devstart-lab/` base path. For browser checks, the catalog build and security details, read [development notes](docs/development.md) and [SECURITY.md](SECURITY.md).

## Contributing

Found a confusing step or an example that does not work? [Open an issue](https://github.com/brunnojob/devstart-lab/issues) with the step, what you tried and what happened. Corrections to examples, accessibility improvements and translation fixes are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a pull request.

## Sponsor

Help keep DevStart Lab free with a contribution on [Buy Me a Coffee](https://buymeacoffee.com/brunnodev). Support includes code reviews, project guidance and collaboration opportunities.

[![Sponsor](https://img.shields.io/badge/Sponsor-brunnojob-8b1538?logo=buymeacoffee&logoColor=white)](https://buymeacoffee.com/brunnodev)

## License and credits

[MIT](LICENSE). Created by **Brunno / BrunnoDev** — [brunnodev.store](https://brunnodev.store/).

