import { t } from './i18n.mjs';
const search = document.querySelector('#search');
const language = document.querySelector('#language');
const cards = [...document.querySelectorAll('.card')];
function filter() {
  const term = search.value.trim().toLocaleLowerCase();
  let count = 0;
  for (const card of cards) {
    card.hidden = !((card.textContent + " " + card.dataset.search).toLocaleLowerCase().includes(term) && (!language.value || card.dataset.language === language.value));
    card.style.display = card.hidden ? 'none' : '';
    if (!card.hidden) count++;
  }
  document.querySelector('#count').textContent = t(`${count} projetos encontrados`);
}
search.addEventListener('input', filter);
language.addEventListener('change', filter);
filter();
