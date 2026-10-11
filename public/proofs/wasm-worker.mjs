import createProgram from './program.mjs';
self.onmessage = async ({ data }) => {
  const bytes = new TextEncoder().encode(data.input);
  let cursor = 0;
  const lines = [];
  let exit = 0;
  try {
    const instance = await createProgram({ noInitialRun: true, stdin: () => cursor < bytes.length ? bytes[cursor++] : null, print: value => lines.push(value), printErr: value => lines.push(value), onExit: value => { exit = value; } });
    instance.callMain(data.args ?? []);
  } catch (error) {
    if (Number.isInteger(error.status)) exit = error.status;
    else { lines.push(error.message ?? String(error)); exit = 1; }
  }
  self.postMessage({ output: lines.join('\n'), exit });
};
