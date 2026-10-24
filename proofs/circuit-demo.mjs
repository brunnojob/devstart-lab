import { t } from '../../i18n.mjs';
import { CircuitEngine } from './circuit.mjs';
document.querySelector('#result').textContent = t('Aguardando execução.');
const definition = await (await fetch('./circuit.json')).json();
const input = document.querySelector('#input');
input.value = JSON.stringify(await (await fetch('./input.json')).json(), null, 2);
document.querySelector('#run').addEventListener('click', () => {
  const output = document.querySelector('#result');
  try {
    if (input.value.length > 65536) throw new Error(t('Entrada acima de 64 KiB.'));
    const scans = JSON.parse(input.value);
    if (!Array.isArray(scans) || scans.length > 1000) throw new Error(t('Informe um array com até 1.000 scans.'));
    const engine = new CircuitEngine(definition);
    output.textContent = JSON.stringify(scans.map(scan => engine.scan(scan.inputs, scan.timestampMs)), null, 2);
  } catch (error) { output.textContent = error instanceof SyntaxError ? t('Entrada JSON ou scan inválido.') : t(error.message); }
});
