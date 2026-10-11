import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { chromium } from '../.qa/node_modules/playwright/index.mjs';
const catalog = JSON.parse(await readFile('proofs/catalog.json', 'utf8'));
const server = spawn('python', ['-m', 'http.server', '4917', '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' });
let browser;
try {
  for (let index = 0; index < 50; index++) {
    try { if ((await fetch('http://127.0.0.1:4917/proofs/')).ok) break; } catch {}
    if (index === 49) throw new Error('Static proof server did not start');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4917/proofs/');
  assert.equal(await page.locator('.card').count(), catalog.length);
  await page.locator('#search').fill('modbus');
  assert.equal(await page.locator('.card:visible').count(), 2);
  await page.locator('#search').fill('');
  await page.screenshot({ path: 'dist/proofs/catalog-browser.png', fullPage: true });
  for (const item of catalog.filter(item => item.demo === 'wasm')) {
    await page.goto(`http://127.0.0.1:4917/proofs/${item.name}/demo/`);
    await page.waitForFunction(() => document.querySelector('#input').value.length > 0);
    await page.getByRole('button', { name: 'Executar código C', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('#result').textContent.startsWith('Código de saída:'));
    assert.ok((await page.locator('#result').innerText()).startsWith('Código de saída: 0'), item.name);
    await page.locator('#input').fill('broken,input\n');
    await page.getByRole('button', { name: 'Executar código C', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('#result').textContent.startsWith('Código de saída:'));
    assert.ok((await page.locator('#result').innerText()).startsWith('Código de saída: 2'), item.name + ' rejects invalid input');
    console.log(`PASS browser WebAssembly: ${item.name}`);
  }
  await page.goto('http://127.0.0.1:4917/proofs/eletrical-comands-and-teory/demo/');
  await page.waitForFunction(() => document.querySelector('#input').value.length > 0);
  await page.getByRole('button', { name: 'Executar scans', exact: true }).click();
  const circuit = await page.locator('#result').innerText();
  assert.ok(circuit.includes('"energized": true') && circuit.includes('"energized": false'));
  await page.goto('http://127.0.0.1:4917/proofs/casino-simulator-brunnodev/demo/');
  assert.ok((await page.title()).includes('NOVA'));
  await page.goto('http://127.0.0.1:4917/proofs/c-household-budget/');
  assert.equal(await page.locator('details').count(), 2);
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
  await page.screenshot({ path: 'dist/proofs/detail-mobile.png', fullPage: true });
  assert.deepEqual(errors, []);
  console.log('PASS: catalog filters, circuit transitions, static game, mobile layout and zero browser errors');
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
}
