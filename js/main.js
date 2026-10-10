/* Utilidades comunes: KaTeX, navegación, menú móvil y enlace al repositorio */
const PAL = {
  deepNavy: '#042255', regalNavy: '#01336e', babyPink: '#ff97cc',
  deepPink: '#f35d9c', rosewood: '#c80056', grid: '#e3e9f4', ink: '#0d1d3d'
};

// Formato numérico en español (coma decimal)
function fmt(x, d = 1) {
  return Number(x).toLocaleString('es-CR', { minimumFractionDigits: d, maximumFractionDigits: d });
}

// Valores por defecto de Chart.js
if (window.Chart) {
  Chart.defaults.font.family = "'Montserrat', sans-serif";
  Chart.defaults.font.size = 11;
  Chart.defaults.color = '#3b4a68';
  Chart.defaults.plugins.legend.labels.boxWidth = 14;
  Chart.defaults.plugins.legend.labels.boxHeight = 3;
  Chart.defaults.animation = false;
  Chart.defaults.maintainAspectRatio = false;
}

// Línea vertical que marca un instante en gráficas de tiempo
const vLinePlugin = {
  id: 'vLine',
  afterDatasetsDraw(chart, args, opts) {
    if (opts.x == null) return;
    const { ctx, chartArea: a, scales: { x } } = chart;
    const px = x.getPixelForValue(opts.x);
    if (px < a.left || px > a.right) return;
    ctx.save();
    ctx.strokeStyle = PAL.rosewood; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(px, a.top); ctx.lineTo(px, a.bottom); ctx.stroke();
    ctx.restore();
  }
};

function axisTitle(text) {
  return { display: true, text, font: { weight: '600', size: 11 }, color: PAL.regalNavy };
}

document.addEventListener('DOMContentLoaded', () => {
  // KaTeX
  if (window.renderMathInElement) {
    renderMathInElement(document.body, {
      delimiters: [
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false }
      ],
      throwOnError: false,
      strict: 'ignore'
    });
  }

  // Enlace al repositorio: se deduce de la URL de GitHub Pages (usuario.github.io/repo)
  const host = location.hostname;
  if (host.endsWith('github.io')) {
    const user = host.split('.')[0];
    const repo = location.pathname.split('/').filter(Boolean)[0] || `${user}.github.io`;
    const url = `https://github.com/${user}/${repo}`;
    ['repoLinkSide', 'repoLinkFoot'].forEach(id => { const a = document.getElementById(id); if (a) a.href = url; });
  }

  // Menú móvil
  const sb = document.getElementById('sidebar');
  const mb = document.getElementById('menuBtn');
  mb.addEventListener('click', () => {
    const open = sb.classList.toggle('open');
    mb.setAttribute('aria-expanded', open);
  });
  sb.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    sb.classList.remove('open'); mb.setAttribute('aria-expanded', 'false');
  }));

  // Resaltar el tema visible en el índice
  const links = [...document.querySelectorAll('.sidebar a.nav-link')];
  const targets = links.map(l => document.querySelector(l.getAttribute('href'))).filter(Boolean);
  const unique = [...new Set(targets)];
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const id = '#' + e.target.id;
        links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === id && !l.classList.contains('future')));
      }
    });
  }, { rootMargin: '-35% 0px -60% 0px' });
  unique.forEach(t => obs.observe(t));
});
