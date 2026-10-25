# Development notes

DevStart Lab is a static TypeScript application built with Vite. The learning
content lives in `src/data/`; filtering, progress storage, Git commands and
translation helpers live in `src/lib/`. `src/ui/page.ts` contains the page
markup, while `src/main.ts` connects the controls and renders dynamic content.

## Local checks

Use Node.js 22.12+ and Python 3. The CI workflow runs on Node.js 24.

```sh
npm ci --ignore-scripts
npm run typecheck
npm test
npm run test:security
npm run build
npm run preview
```

The build checks TypeScript, bundles the application, applies the Content
Security Policy and checks HTML and asset budgets. The main application has a
150 KiB gzip budget; the complete site has a 50 MiB budget.

The CI workflow also runs `scripts/test-app-browser.mjs` in Chromium. It covers
language and theme switching, progress persistence, Git command validation,
imports, mobile overflow and unavailable browser storage.

## Catalog build

The Pages workflow generates the separate project catalog before building the
site. A local `npm run build` builds the learning application without fetching
or compiling catalog sources. See [proofs/README.md](../proofs/README.md) for the
catalog data and execution records.

## Execution evidence

The [catalog](https://brunnojob.github.io/devstart-lab/proofs/) contains snapshots for 60 repositories and 59 execution reports. Each report links to its source commit and original GitHub Actions run. Reports demonstrate the recorded scenarios, not every possible input or physical hardware operation.

The full Pages workflow runs `python3 scripts/build-proofs.py`, compiles six original C programs to WebAssembly and checks their scenarios. JavaScript demonstrations use source files from recorded commits. It then verifies generated links, runs Chromium tests for the application and demos, and deploys only after the checks pass. A plain local `npm run build` builds the learning application; it does not fetch or compile all external demo sources.

WebAssembly demos run in a worker with a parent-controlled eight-second timeout, a 128 MiB linear-memory cap, a 64 KiB input limit and a 128 KiB captured-output limit. These limits do not describe total browser memory. Demos do not connect to industrial equipment. The game demonstration uses fictional credits only.


## Security and privacy

Source code is public under the MIT license. Browser JavaScript and WebAssembly are downloadable; minification is an optimization, not encryption. Progress and exported JSON are unencrypted and must not contain sensitive information. HTTPS protects transport on the published site.

The published HTML allows local scripts and the resources needed by each page. WebAssembly compilation is enabled only on WebAssembly demo pages; JavaScript string evaluation and inline scripts remain blocked. Google Fonts requests go to Google. An explicit evidence-status lookup goes to GitHub. Read [SECURITY.md](../SECURITY.md) for scope, limitations and vulnerability reporting.

GitHub Pages is a static host with usage limits. This architecture avoids a per-visitor backend and database bottleneck, but it does not promise unlimited traffic, zero vulnerabilities or guaranteed availability.

