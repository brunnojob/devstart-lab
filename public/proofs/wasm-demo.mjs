const input = document.querySelector('#input');
const result = document.querySelector('#result');
const example = await (await fetch('./input.txt')).text();
input.value = example;
document.querySelector('#sample').addEventListener('click', () => { input.value = example; });
for (const button of document.querySelectorAll('[data-run]')) button.addEventListener('click', () => {
  if (new TextEncoder().encode(input.value).length > 65536) { result.textContent = 'Entrada acima de 64 KiB.'; return; }
  const worker = new Worker('./worker.mjs', { type: 'module' });
  result.textContent = 'Executando o código C compilado...';
  for (const item of document.querySelectorAll('[data-run]')) item.disabled = true;
  const finish = text => {
    result.textContent = text;
    worker.terminate();
    clearTimeout(timer);
    for (const item of document.querySelectorAll('[data-run]')) item.disabled = false;
  };
  const timer = setTimeout(() => finish('Limite de 8 segundos atingido.'), 8000);
  worker.onmessage = ({ data }) => finish(`Código de saída: ${data.exit}\n\n${data.output}`);
  worker.onerror = event => finish(`Falha ao carregar WebAssembly: ${event.message}`);
  worker.postMessage({ input: button.dataset.run === 'test' ? '' : input.value, args: button.dataset.run === 'test' ? ['--self-test'] : [] });
});
