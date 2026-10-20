# DevStart Lab

An open learning path from programming logic to a first open source contribution. Available in English and Portuguese, with light and dark themes and progress stored in your browser.

[Try in English](https://brunnojob.github.io/devstart-lab/?lang=en) · [Português](https://brunnojob.github.io/devstart-lab/?lang=pt) · [Execution evidence and demos](https://brunnojob.github.io/devstart-lab/proofs/)

## Video walkthrough

[Watch the 55-second demonstration](https://brunnojob.github.io/devstart-lab/media/devstartlab.mp4)

See the learning path, project catalog and interface in action. [View the video file on GitHub](https://github.com/brunnojob/devstart-lab/blob/main/public/media/devstartlab.mp4).

## What you can do

| Feature | Behavior |
| --- | --- |
| Learning path | Complete 20 steps: eight programming foundations with Python examples, followed by 12 GitHub and collaboration steps |
| Project ideas | Filter 25 scoped ideas by area, difficulty and search; review requirements and save favorites |
| Git command generator | Generate a local repository or fork workflow with validated account, repository and branch names |
| Progress | Track steps locally and import or export a validated JSON backup |
| Preferences | Switch language and theme without an account |
| Execution catalog | Inspect 60 existing repositories, recorded test results and runnable browser demonstrations |

No sign-up, API token, database or application server is required. The main learning application makes no GitHub API requests. The evidence pages query the public GitHub API only when you press the status button, with a timeout and a short per-page cache.

## Start learning

1. Open the [English application](https://brunnojob.github.io/devstart-lab/?lang=en).
2. Start with programming logic, or jump to the GitHub steps if you already write code.
3. Choose a beginner project with a manageable scope and complete its requirements.
4. Read the target project's contribution guide before opening a focused pull request.

Time estimates assume basic familiarity with the language. Python is used to explain concepts; the learning path does not require GitHub tooling for the first eight steps. The [detailed first-PR guide](docs/primeiro-pr.md) and [achievement guide](docs/conquistas.md) are currently in Portuguese. Evidence logs retain their original languages.

## Run locally

Requirements: Node.js 22.12 or newer, npm and Python 3. GitHub Actions uses Node.js 24.

```bash
git clone https://github.com/brunnojob/devstart-lab.git
cd devstart-lab
npm ci --ignore-scripts
npm run dev
```

Open the URL printed by Vite. Production builds use the `/devstart-lab/` base path.

```bash
npm run typecheck
npm test
npm run test:security
npm audit --audit-level=high
npm run build
npm run preview
```

The application uses strict TypeScript, Vite and Vitest, without production package dependencies. `npm run build` adds a Content Security Policy to every generated HTML page and rejects unsafe executable markup, source maps and oversized assets. The main application assets have a 150 KiB gzip budget; the complete site has a 50 MiB budget.

## Execution evidence

The [catalog](https://brunnojob.github.io/devstart-lab/proofs/) contains snapshots for 60 repositories and 59 execution reports. Each report links to its source commit and original GitHub Actions run. Reports demonstrate the recorded scenarios, not every possible input or physical hardware operation.

The full Pages workflow runs `python3 scripts/build-proofs.py`, compiles six original C programs to WebAssembly and checks their scenarios. JavaScript demonstrations use source files from recorded commits. It then verifies generated links, runs Chromium tests for the application and demos, and deploys only after the checks pass. A plain local `npm run build` builds the learning application; it does not fetch or compile all external demo sources.

WebAssembly demos run in a worker with a parent-controlled eight-second timeout, a 128 MiB linear-memory cap, a 64 KiB input limit and a 128 KiB captured-output limit. These limits do not describe total browser memory. Demos do not connect to industrial equipment. The game demonstration uses fictional credits only.

## Security and privacy

Source code is public under the MIT license. Browser JavaScript and WebAssembly are downloadable; minification is an optimization, not encryption. Progress and exported JSON are unencrypted and must not contain sensitive information. HTTPS protects transport on the published site.

The published HTML allows local scripts and the resources needed by each page. WebAssembly compilation is enabled only on WebAssembly demo pages; JavaScript string evaluation and inline scripts remain blocked. Google Fonts requests go to Google. An explicit evidence-status lookup goes to GitHub. Read [SECURITY.md](SECURITY.md) for scope, limitations and vulnerability reporting.

GitHub Pages is a static host with usage limits. This architecture avoids a per-visitor backend and database bottleneck, but it does not promise unlimited traffic, zero vulnerabilities or guaranteed availability.

## Repository layout

```text
src/data/             Learning steps, project ideas and translations
src/lib/              Filtering, progress validation and Git commands
src/main.ts           Application interface and interactions
src/styles.css        Responsive light and dark themes
public/proofs/        Browser demo adapters and evidence-page assets
proofs/               Recorded catalog and execution evidence
scripts/              Demo build, security checks and browser verification
tests/                Unit and security regression tests
.github/              CI, Pages deployment and contribution templates
```

## Contribute

Read [CONTRIBUTING.md](CONTRIBUTING.md). Open an issue with a concrete problem, expected behavior and acceptance criteria. Accessibility fixes, translations, tests and clearer learning examples are welcome. Use reliable sources and reproducible examples for content changes.

Achievements are incidental outcomes of useful work. Do not create empty pull requests, fictitious coauthorship or artificial discussions. GitHub controls badge eligibility and may change its rules.

## License and credits

[MIT](LICENSE). Created by **Brunno / BrunnoDev** — [brunnodev.store](https://brunnodev.store/) · [GitHub @brunnojob](https://github.com/brunnojob).

Existing coauthorship credit:

```text
Co-authored-by: nyctophile <33561761+ineedfoundmyway@users.noreply.github.com>
```

