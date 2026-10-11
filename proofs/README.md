# Execution evidence

This catalog publishes evidence for existing public repositories. It does not create projects or change upstream authorship.

`catalog.json` identifies each repository, tested commit, GitHub Actions run, license and verification scope. Reports in `evidence/` were extracted from `PROOF_EVIDENCE_JSON` in the corresponding job logs. Repository, source SHA, run URL and successful job conclusion were checked against the GitHub API. Outputs may be shortened by the original recorder; the original job and artifact remain the full source.

The pages present recorded execution, not a continuously running backend. The current-run button queries the public GitHub API on demand and explicitly distinguishes a later commit from the recorded version. No tokens are sent to the browser.

Six C diagnostic programs are compiled from pinned original sources with Emscripten. Their WebAssembly builds run the same success and rejection scenarios before publication. The browser runner uses an isolated worker, an eight-second timeout and a 64 KiB input limit. It processes supplied text and does not connect to industrial equipment.

The circuit demo imports the original JavaScript interpreter. The casino demo publishes the original static application with virtual credits. Their original tests run during the catalog build. DevStart Lab remains available at its existing root URL.

To refresh a report, collect its actual job output, verify the run and source identifiers, then update both the report and catalog entry. Never replace output with an illustrative transcript or mark unavailable dependencies as passing.

Build with Python 3, Node.js 24, Git and Emscripten:

```sh
python scripts/build-proofs.py
npm ci
npm run test
npm run build
python scripts/check-proof-pages.py
```

Original repository licenses and third-party credits are retained. Forks are identified in their detail pages.
