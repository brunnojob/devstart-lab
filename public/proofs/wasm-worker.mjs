import createProgram from './program.mjs';
self.onmessage = async ({ data }) => {
  if (!data || typeof data.input !== 'string' || !Array.isArray(data.args) || !data.args.every(value => value === '--self-test') || data.args.length > 1) {
    self.postMessage({ output: 'Invalid program input.', exit: 2 });
    return;
  }
  const bytes = new TextEncoder().encode(data.input);
  if (bytes.length > 65536) {
    self.postMessage({ output: 'Input exceeds 64 KiB.', exit: 2 });
    return;
  }
  let cursor = 0;
  const lines = [];
  let outputSize = 0;
  const record = value => {
    const line = String(value);
    outputSize += new TextEncoder().encode(line).length + 1;
    if (outputSize > 131072) throw new Error('Output exceeds 128 KiB.');
    lines.push(line);
  };
  let exit = 0;
  try {
    const instance = await createProgram({ noInitialRun: true, quit: (status, error) => { throw error; }, stdin: () => cursor < bytes.length ? bytes[cursor++] : null, print: record, printErr: record, onExit: value => { exit = value; } });
    instance.callMain(data.args ?? []);
  } catch (error) {
    if (Number.isInteger(error.status)) exit = error.status;
    else { lines.length = 0; lines.push(String(error.message ?? error).slice(0, 1024)); exit = 1; }
  }
  self.postMessage({ output: lines.join('\n'), exit });
};
