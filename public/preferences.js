try {
  const stored = localStorage.getItem('devstart-theme');
  document.documentElement.dataset.theme = stored === 'dark' || stored === 'light' ? stored : 'dark';
} catch {
  document.documentElement.dataset.theme = 'dark';
}
