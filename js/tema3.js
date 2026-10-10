/* Tema 3 — Calculadora complementaria del hábitat rotatorio */
(() => {
  const r = document.getElementById('habR'), rpm = document.getElementById('habRpm');
  const G = 9.81, H = 1.8, WALK = 1.4;
  function update() {
    const R = +r.value, n = +rpm.value;
    const w = n * 2 * Math.PI / 60, gap = w * w * R, T = 60 / n, v = w * R;
    const rpm1g = 60 / (2 * Math.PI) * Math.sqrt(G / R);
    const cor = 2 * w * WALK;
    let comfort, col;
    if (n <= 2) { comfort = 'Cómodo (≤ 2 rpm)'; col = '#7be3b0'; }
    else if (n <= 4) { comfort = 'Tolerable con adaptación (2–4 rpm)'; col = '#ffd27a'; }
    else { comfort = 'Probable mareo (> 4 rpm)'; col = '#ff97cc'; }
    document.getElementById('habROut').textContent = `${fmt(R, 1)} m`;
    document.getElementById('habRpmOut').textContent = `${fmt(n, 2)} rpm`;
    document.getElementById('habReadout').innerHTML = `
      <div class="ro"><small>Gravedad aparente</small><b>${fmt(gap, 2)} m/s²</b><div class="sub">= ${fmt(gap / G, 2)} g · g_ap = ω²r</div></div>
      <div class="ro"><small>ω y período</small><b>${fmt(w, 4)} rad/s</b><div class="sub">T = ${fmt(T, 1)} s · v = ${fmt(v, 1)} m/s</div></div>
      <div class="ro"><small>rpm para 1 g con este r</small><b>${fmt(rpm1g, 2)} rpm</b><div class="sub">rpm = (60/2π)·√(g/r)</div></div>
      <div class="ro"><small>Gradiente y Coriolis</small><b>${fmt(1 - H / R, 3)}</b><div class="sub">cabeza/pies · Coriolis al caminar ${fmt(cor / G * 100, 1)} % g</div></div>
      <div class="ro" style="grid-column:1/-1"><small>Confort (Globus y Hall, 2017)</small><b style="color:${col}">${comfort}</b></div>`;
  }
  [r, rpm].forEach(i => i.addEventListener('input', update));
  update();
})();
