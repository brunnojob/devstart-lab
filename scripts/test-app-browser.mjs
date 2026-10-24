import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from '../.qa/node_modules/playwright/index.mjs';

const base = 'http://127.0.0.1:4918/devstart-lab/';
const server = spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4918', '--strictPort'], { stdio: 'ignore' });
let browser;
try {
  for (let attempt = 0; attempt < 50; attempt++) {
    try { if ((await fetch(base)).ok) break; } catch {}
    if (attempt === 49) throw new Error('Preview did not start');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_EXECUTABLE_PATH, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  const violations = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    window.securityViolations = [];
    document.addEventListener('securitypolicyviolation', event => window.securityViolations.push(event.violatedDirective));
  });
  await page.goto(base + '?lang=en');
  await page.locator('.roadmap-item').last().waitFor();
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  assert.match(await page.locator('h1').innerText(), /Learn programming logic/);
  await page.getByRole('link', { name: 'Try the first exercise', exact: true }).click();
  assert.equal(new URL(page.url()).hash, '#step-logica-problemas');
  assert.equal(await page.locator('#step-logica-problemas h4').innerText(), 'Break a problem into steps');
  await page.locator('#language-select').selectOption('pt');
  assert.match(await page.locator('h1').innerText(), /Aprenda lógica de programação/);
  assert.equal(await page.locator('.learning-route li').count(), 3);
  await page.locator('#language-select').selectOption('en');
  await page.locator('#theme-select').selectOption('light');
  await page.reload();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
  assert.equal(await page.locator('.roadmap-item').count(), 20);
  assert.equal(await page.locator('.project-card').count(), 25);
  await page.locator('.roadmap-item input[type=checkbox]').first().check();
  await page.reload();
  assert.equal(await page.locator('.roadmap-item input[type=checkbox]').first().isChecked(), true);
  await page.locator('#theme-select').selectOption('dark');
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  const commandLocales = {
    en: { owner: 'your-username', repo: 'my-project', branch: 'docs/first-pr', message: 'docs: describe the change', heading: 'Your first PR, step by step.' },
    pt: { owner: 'seu-usuario', repo: 'meu-projeto', branch: 'docs/primeiro-pr', message: 'docs: descreve a mudança', heading: 'Seu primeiro PR, passo a passo.' },
  };
  for (const lang of ['en', 'pt', 'en']) {
    await page.locator('#language-select').selectOption(lang);
    const expected = commandLocales[lang];
    assert.equal(await page.locator('#pull-request h2').innerText(), expected.heading);
    assert.equal(await page.locator('#git-owner').inputValue(), expected.owner);
    assert.equal(await page.locator('#git-repo').inputValue(), expected.repo);
    assert.equal(await page.locator('#git-branch').inputValue(), expected.branch);
    for (const flow of ['proprio', 'fork']) {
      await page.locator('#git-flow').selectOption(flow);
      const commands = await page.locator('#command-output').innerText();
      assert.ok(commands.includes(`git clone https://github.com/${expected.owner}/${expected.repo}.git`));
      assert.ok(commands.includes(`git switch -c ${expected.branch}`));
      assert.ok(commands.includes(`git commit -m "${expected.message}"`));
      assert.equal(commands.includes('git remote add upstream'), flow === 'fork');
    }
  }
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.locator('#copy-commands').click();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), await page.locator('#command-output').innerText());
  await page.locator('#git-owner').fill('octocat');
  await page.locator('#git-repo').fill('hello-world');
  await page.locator('#git-branch').fill('docs/custom');
  for (const lang of ['pt', 'en']) {
    await page.locator('#language-select').selectOption(lang);
    assert.equal(await page.locator('#git-owner').inputValue(), 'octocat');
    assert.equal(await page.locator('#git-repo').inputValue(), 'hello-world');
    assert.equal(await page.locator('#git-branch').inputValue(), 'docs/custom');
    assert.ok((await page.locator('#command-output').innerText()).includes(`git commit -m "${commandLocales[lang].message}"`));
  }
  await page.locator('#git-owner').fill('user; touch /tmp/injected');
  assert.equal(await page.locator('#copy-commands').isDisabled(), true);
  assert.equal(await page.locator('#command-output').innerText(), '');
  assert.equal(await page.locator('#command-error').innerText(), 'Enter a valid GitHub username.');
  await page.locator('#language-select').selectOption('pt');
  assert.equal(await page.locator('#command-error').innerText(), 'Informe um usuário GitHub válido.');
  await page.locator('#language-select').selectOption('en');
  await page.locator('#import-progress').setInputFiles({ name: 'hostile.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ version: 1, completedSteps: ['<img src=x onerror=alert(1)>'], savedProjects: ['javascript:alert(1)'] })) });
  await page.waitForFunction(() => document.querySelector('#progress-bar').getAttribute('aria-valuenow') === '0');
  assert.equal(await page.locator('img[onerror]').count(), 0);
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  violations.push(...await page.evaluate(() => window.securityViolations));
  assert.deepEqual(violations, []);
  await page.evaluate(() => {
    const script = document.createElement('script');
    script.textContent = 'window.injectedScriptExecuted = true';
    document.head.append(script);
  });
  await page.waitForFunction(() => window.securityViolations.includes('script-src-elem'));
  assert.equal(await page.evaluate(() => window.injectedScriptExecuted), undefined);
  assert.deepEqual(errors, []);
  const context = await browser.newContext();
  await context.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Storage blocked', 'SecurityError'); } });
  });
  const restricted = await context.newPage();
  await restricted.goto(base + '?lang=en');
  await restricted.locator('.roadmap-item input[type=checkbox]').first().check();
  assert.equal(await restricted.locator('#progress-bar').getAttribute('aria-valuenow'), '1');
  await context.close();
  console.log('PASS: English UI, persistence, theme, command injection rejection, hostile import, mobile layout, CSP enforcement and blocked-storage fallback');
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
}
