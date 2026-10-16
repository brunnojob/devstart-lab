try {
  const stored = localStorage.getItem('devstart-theme');
  document.documentElement.dataset.theme = stored === 'dark' || stored === 'light' ? stored : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
} catch {
  document.documentElement.dataset.theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
