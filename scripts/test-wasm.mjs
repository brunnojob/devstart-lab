import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const [directory, scenarioPath] = process.argv.slice(2);
globalThis.require = createRequire(import.meta.url);
globalThis.__dirname = directory;
const createProgram = (await import(pathToFileURL(`${directory}/program.mjs`))).default;
const wasmBinary = await readFile(`${directory}/program.wasm`);
const scenarios = JSON.parse(await readFile(scenarioPath, 'utf8'));
for (const test of [{ name: 'Original C self-test', argv: ['./app', '--self-test'] }, ...scenarios.cases.filter(item => item.display !== false)]) {
  const input = test.input ? await readFile(`${scenarioPath.replace(/\.proof\/scenarios.json$/, '')}${test.input}`, 'utf8') : test.stdin ?? '';
  const bytes = new TextEncoder().encode(input);
  let cursor = 0;
  let exit = 0;
  const lines = [];
  let instance;
  try { instance = await createProgram({ wasmBinary, noInitialRun: true, quit: (status, error) => { throw error; }, stdin: () => cursor < bytes.length ? bytes[cursor++] : null, print: value => lines.push(value), printErr: value => lines.push(value), onExit: value => { exit = value; } }); } catch (error) { console.error(JSON.stringify({ stage: "initialize", message: error.message, output: lines })); process.exit(1); }
  try { instance.callMain(test.argv.slice(1)); } catch (error) { if (Number.isInteger(error.status)) exit = error.status; else throw error; }
  assert.equal(exit, test.exit ?? 0, test.name);
  for (const expected of test.contains ?? []) assert.ok(lines.join('\n').includes(expected), `${test.name}: ${expected}`);
  for (const forbidden of test.absent ?? []) assert.ok(!lines.join('\n').includes(forbidden), `${test.name}: forbidden ${forbidden}`);
  console.log(`PASS WebAssembly: ${test.name}`);
}

// Emscripten sets the host exitCode during intentional rejection cases.
// Assertions above verify every expected program exit independently.
process.exitCode = 0;
