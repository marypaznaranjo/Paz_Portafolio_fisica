/* Tema 5 — Saltos a los instantes del análisis */
(() => {
  const v = document.getElementById('hapticVideo');
  document.querySelectorAll('.stamp-btn').forEach(b => b.addEventListener('click', () => {
    v.currentTime = +b.dataset.t;
    v.play().catch(() => {});
    v.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }));
})();
