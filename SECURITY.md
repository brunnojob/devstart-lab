# Security

## Scope

DevStart Lab is a public static educational application. It does not implement authentication, payments, account creation or an application database. Examples and simulations are not production controllers or financial systems.

Progress, preferences and JSON backups are stored in plaintext on the user's device. Do not enter passwords, access tokens, personal records or other sensitive data. HTTPS protects network transport; it does not hide public source code, encrypt localStorage or make downloaded code confidential.

## Controls

- Known progress identifiers are validated before use; imported files are capped at 100 KB and values are rendered as text.
- Git command fields reject shell metacharacters before commands can be copied. Generated commands are never executed by the website.
- Production HTML has a restrictive meta Content Security Policy, without inline scripts or JavaScript string evaluation. Only WebAssembly demo pages allow WebAssembly compilation.
- The original game demo uses dynamically generated inline CSS for its artwork and progress. Only that demo permits style attributes; this does not allow inline JavaScript.
- Evidence status requests are user-initiated, time-limited, anonymous and cached briefly on the page. Recorded evidence remains available when the public GitHub API is rate-limited.
- Demo workers cap input and captured output, and the parent terminates execution after eight seconds. WebAssembly linear memory is capped at 128 MiB; total browser memory is not capped by this setting.
- CI uses lockfile installs, dependency audits and commit-pinned GitHub Actions. Build jobs have read-only repository access; only the deployment job receives Pages and OIDC write permissions.
- Production checks reject executable inline markup and source maps, and enforce application and site size budgets.

## Hosting limitations

GitHub Pages controls TLS, CDN behavior and response headers. Meta CSP cannot enforce `frame-ancestors`, and this repository does not claim clickjacking protection through that directive. Full response-header controls would require a host or proxy that supports them. All projects on the same `brunnojob.github.io` origin share the browser's origin trust boundary; do not host untrusted content or sensitive data there.

The learning application loads Google Fonts. The evidence status button contacts the public GitHub API. Recorded demo sources are downloaded at build time from specific commits. Browser extensions, compromised maintainer accounts, upstream toolchains and malicious changes accepted by maintainers remain relevant risks.

Automated checks and dependency audits are point-in-time evidence, not a guarantee of safety, availability or coverage of unknown vulnerabilities. GitHub Pages and the public GitHub API have service limits.

## Reporting

Use the repository's Security tab to report a vulnerability privately if private reporting is enabled. Otherwise, contact the maintainer through the contact information on the GitHub profile and request a private reporting channel before sharing exploit details or secrets. Do not publish credentials, personal information or a working exploit in a public issue.
