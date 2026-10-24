import { t } from '../../i18n.mjs';
const input = document.querySelector('#input');
const result = document.querySelector('#result');
let example = '';
try {
  const response = await fetch('./input.txt', { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error('Example unavailable');
  example = await response.text();
} catch { result.textContent = t('Não foi possível carregar o exemplo. Cole sua entrada abaixo.'); }
input.value = example;
document.querySelector('#sample').addEventListener('click', () => { input.value = example; });
for (const button of document.querySelectorAll('[data-run]')) button.addEventListener('click', () => {
  if (new TextEncoder().encode(input.value).length > 65536) { result.textContent = t('Entrada acima de 64 KiB.'); return; }
  let worker;
  try { worker = new Worker('./worker.mjs', { type: 'module' }); }
  catch { result.textContent = t('Este navegador não permite executar a demo WebAssembly.'); return; }
  result.textContent = t('Executando o código C compilado...');
  for (const item of document.querySelectorAll('[data-run]')) item.disabled = true;
  const finish = text => {
    result.textContent = text;
    worker.terminate();
    clearTimeout(timer);
    for (const item of document.querySelectorAll('[data-run]')) item.disabled = false;
  };
  const timer = setTimeout(() => finish(t('Limite de 8 segundos atingido.')), 8000);
  worker.onmessage = ({ data }) => finish(`${t('Código de saída:')} ${data.exit}\n\n${data.output}`);
  worker.onerror = event => finish(`${t('Falha ao carregar WebAssembly:')} ${event.message}`);
  worker.postMessage({ input: button.dataset.run === 'test' ? '' : input.value, args: button.dataset.run === 'test' ? ['--self-test'] : [] });
});
