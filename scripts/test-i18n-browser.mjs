import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { chromium } from '../.qa/node_modules/playwright/index.mjs';
const catalog = JSON.parse(await readFile('proofs/catalog.json', 'utf8'));
const translations = JSON.parse(await readFile('proofs/translations.json', 'utf8'));
const reverse = Object.fromEntries(Object.entries(translations).map(([pt, en]) => [en, pt]));
const server = spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4919', '--strictPort'], { stdio: 'ignore' });
const origin = 'http://127.0.0.1:4919/devstart-lab';
let browser;
try {
  for (let attempt = 0; attempt < 50; attempt++) {
    try { if ((await fetch(origin + '/')).ok) break; } catch {}
    if (attempt === 49) throw new Error('Locale test server failed to start');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  const options = process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox'] } : {};
  browser = await chromium.launch({ headless: true, ...options });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('https://api.github.com/**', route => route.fulfill({ json: { workflow_runs: [{ id: 123, event: 'push', head_branch: 'main', head_sha: catalog.find(item => item.name === 'c-household-budget').sha, conclusion: 'success', status: 'completed' }] } }));
  for (const lang of ['en', 'pt']) {
    const expected = lang === 'en' ? 'en' : 'pt-BR';
    await page.goto(`${origin}/?lang=${lang}`);
    await page.waitForFunction(locale => document.documentElement.lang === locale, expected);
    const proofsLink = page.locator('nav a[href*="proofs/"]');
    assert.equal(new URL(await proofsLink.getAttribute('href'), origin).searchParams.get('lang'), lang);
    assert.equal(await proofsLink.innerText(), lang === 'en' ? 'Projects in action' : 'Projetos em execução');
    await proofsLink.click();
    await page.waitForFunction(locale => document.documentElement.lang === locale, expected);
    assert.equal(await page.locator('.card').count(), catalog.length);
    assert.equal(await page.title(), `${lang === 'en' ? 'Projects in action' : 'Projetos em execução'} | Brunno Dev`);
    const descriptions = await page.locator('.card > p').allTextContents();
    for (const [index, item] of catalog.entries()) {
      assert.equal(descriptions[index], (lang === 'en' ? translations[item.description] : reverse[item.description]) ?? item.description, item.name);
    }
    await page.locator('#search').fill(lang === 'en' ? 'household' : 'doméstico');
    assert.ok(await page.locator('.card:visible').count() > 0);
    assert.match(await page.locator('#count').innerText(), lang === 'en' ? /projects found/ : /projetos encontrados/);
    await page.goto(`${origin}/proofs/c-household-budget/`);
    await page.waitForFunction(locale => document.documentElement.lang === locale, expected);
    assert.equal(await page.locator('h1').innerText(), lang === 'en' ? 'Household Budget' : 'Orçamento doméstico');
    assert.equal(await page.locator('.block h2').first().innerText(), lang === 'en' ? 'What was verified' : 'O que foi verificado');
    const transcript = await page.locator('details pre').first().innerText();
    await page.locator('#check').click();
    await page.waitForFunction(() => document.querySelector('#status a'));
    assert.match(await page.locator('#status').innerText(), lang === 'en' ? /Latest run: passed/ : /Última execução: passou/);
    assert.equal(await page.locator('details pre').first().innerText(), transcript);
    await page.reload();
    await page.waitForFunction(locale => document.documentElement.lang === locale, expected);
    assert.equal(await page.locator('#locale').inputValue(), lang);
  }
  for (const lang of ['en', 'pt']) {
    await page.goto(`${origin}/proofs/eletrical-comands-and-teory/demo/?lang=${lang}`);
    await page.waitForFunction(() => document.querySelector('#input').value.length > 0);
    await page.getByRole('button', { name: lang === 'en' ? 'Run scans' : 'Executar scans', exact: true }).click();
    assert.match(await page.locator('#result').innerText(), /"energized": true/);
    await page.locator('#input').fill('[');
    await page.locator('#run').click();
    assert.equal(await page.locator('#result').innerText(), lang === 'en' ? 'Invalid JSON input or scan.' : 'Entrada JSON ou scan inválido.');
    await page.goto(`${origin}/proofs/casino-simulator-brunnodev/demo/?lang=${lang}`);
    await page.locator('#gamesGrid button').first().waitFor();
    assert.equal(await page.locator('#languageName').innerText(), lang === 'en' ? 'English' : 'Português');
    assert.equal(await page.locator('.account-actions button').last().innerText(), lang === 'en' ? 'Export history' : 'Exportar histórico');
  }
  await page.goto(`${origin}/proofs/?lang=en`);
  await page.locator('#locale').selectOption('pt');
  await page.waitForURL('**/proofs/?lang=pt');
  assert.equal(await page.evaluate(() => localStorage.getItem('devstart-language')), 'pt');
  await page.goto(`${origin}/proofs/?lang=en`);
  assert.equal(await page.evaluate(() => localStorage.getItem('devstart-language')), 'en');
  const isolated = await browser.newContext();
  await isolated.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Disabled', 'SecurityError'); } });
  });
  const blocked = await isolated.newPage();
  await blocked.goto(`${origin}/?lang=en`);
  await blocked.locator('nav a[href*="proofs/"]').click();
  await blocked.waitForFunction(() => document.documentElement.lang === 'en');
  await blocked.locator('a[href*="c-household-budget/"]').first().click();
  await blocked.waitForFunction(() => document.documentElement.lang === 'en');
  assert.equal(new URL(blocked.url()).searchParams.get('lang'), 'en');
  await isolated.close();
  assert.deepEqual(errors, []);
  console.log('PASS: EN/PT navigation, catalog descriptions, filters, evidence, live status, reload, overrides and unavailable storage');
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
