const params = new URLSearchParams(location.search);
const legacySections = /^#(?:inicio|roadmap|projetos|pull-request|conquistas|step-)/;
if (params.get('classic') === '1' || legacySections.test(location.hash)) {
  void import('./legacy');
} else {
  void import('./ui/workbench');
}
