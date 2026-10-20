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
  assert.equal(await page.locator('.roadmap-item').count(), 20);
  assert.equal(await page.locator('.project-card').count(), 25);
  await page.locator('.roadmap-item input[type=checkbox]').first().check();
  await page.reload();
  assert.equal(await page.locator('.roadmap-item input[type=checkbox]').first().isChecked(), true);
  await page.locator('#theme-select').selectOption('dark');
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  await page.locator('#git-owner').fill('user; touch /tmp/injected');
  assert.equal(await page.locator('#copy-commands').isDisabled(), true);
  assert.equal(await page.locator('#command-output').innerText(), '');
  assert.equal(await page.locator('#command-error').innerText(), 'Enter a valid GitHub username.');
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
