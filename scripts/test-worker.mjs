import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import vm from 'node:vm';

const source = (await readFile('public/proofs/wasm-worker.mjs', 'utf8')).replace("import createProgram from './program.mjs';", '');

async function run(data, program = async () => ({ callMain() {} })) {
  const messages = [];
  const self = { postMessage: value => messages.push(value) };
  const context = vm.createContext({ self, TextEncoder, createProgram: program });
  new vm.Script(source).runInContext(context);
  await self.onmessage({ data });
  return messages[0];
}

test('worker rejects oversized UTF-8 input and unsupported arguments before initialization', async () => {
  let initialized = false;
  const program = async () => { initialized = true; };
  for (const data of [{ input: 'é'.repeat(32769), args: [] }, { input: '', args: ['--anything'] }, { input: null, args: [] }, { input: '', args: ['--self-test', '--self-test'] }]) {
    assert.equal((await run(data, program)).exit, 2);
  }
  assert.equal(initialized, false);
});

test('worker stops programs that flood captured output', async () => {
  let printed = 0;
  const result = await run({ input: '', args: [] }, async options => ({ callMain() {
    for (let count = 0; count < 100000; count++) {
      printed++;
      options.print('x'.repeat(1024));
    }
  } }));
  assert.equal(result.exit, 1);
  assert.match(result.output, /Output exceeds/);
  assert.ok(printed < 130);
  assert.ok(new TextEncoder().encode(result.output).length <= 131072);
});

test('worker preserves valid program output and intentional exit status', async () => {
  const result = await run({ input: '42\n', args: [] }, async options => ({ callMain() {
    assert.equal(options.stdin(), 52);
    options.print('42');
    throw Object.assign(new Error('Exit'), { status: 2 });
  } }));
  assert.equal(result.exit, 2);
  assert.equal(result.output, '42');
});
