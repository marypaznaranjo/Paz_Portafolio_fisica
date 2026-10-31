/* Tema 7 — Coeficiente de restitución: pelota real (ITF) frente a la configuración de un motor de juego */
(() => {
  const $ = id => document.getElementById(id);
  const cv = $('bounceCanvas');
  if (!cv) return;
  const ctx = cv.getContext('2d');

  const G = 9.81, H0 = 2.54, M = 0.057, T_MAX = 8;   // caída ITF de 254 cm; masa dentro de 56,0–59,4 g
  const E_REAL = Math.sqrt(1.41 / 2.54);              // rebote medio ITF (141 cm) → e ≈ 0,745
  const V_REST_REAL = 0.05;                           // por debajo de esto el ojo ya no ve rebote
  const inEb = $('eBall'), inEf = $('eFloor'), inMode = $('eMode'), inTh = $('eThresh');

  const combine = (a, b, mode) => ({ avg: (a + b) / 2, min: Math.min(a, b), mul: a * b, max: Math.max(a, b) })[mode];
  const MODE_TXT = { avg: 'Promedio', min: 'Mínimo', mul: 'Multiplicar', max: 'Máximo' };

  /* Movimiento exacto entre choques (MRUA) y regla de choque v' = −e·v.
     Si la rapidez de impacto es menor que el umbral, el motor no aplica la restitución: la pelota se detiene. */
  function rebotes(e, vTh) {
    const ev = [];               // {t, vIn, vOut}
    let t = Math.sqrt(2 * H0 / G), v = Math.sqrt(2 * G * H0);
    while (t < T_MAX && ev.length < 400) {
      const vOut = v > vTh ? e * v : 0;
      ev.push({ t, vIn: v, vOut });
      if (vOut <= 0) break;
      t += 2 * vOut / G; v = vOut;
    }
    return ev;
  }
  function altura(ev, t) {
    const t0 = Math.sqrt(2 * H0 / G);
    if (t <= t0) return H0 - 0.5 * G * t * t;
    for (let i = 0; i < ev.length; i++) {
      const u = ev[i].vOut, tn = ev[i].t, tEnd = i + 1 < ev.length ? ev[i + 1].t : Infinity;
      if (t < tEnd) return u > 0 ? Math.max(0, u * (t - tn) - 0.5 * G * (t - tn) ** 2) : 0;
    }
    return 0;
  }

  let state = null, anim = null;
  function compute() {
    const eB = +inEb.value, eF = +inEf.value, mode = inMode.value, vTh = +inTh.value;
    const eEff = combine(eB, eF, mode);
    state = { eB, eF, mode, vTh, eEff, real: rebotes(E_REAL, V_REST_REAL), game: rebotes(eEff, vTh) };
  }

  // ---------- Dibujo ----------
  function drawBall(x, y, r, fill) {
    ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = Math.max(1.5, r * 0.18);
    ctx.beginPath(); ctx.arc(x - r * 0.9, y, r * 0.75, -0.9, 0.9); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + r * 0.9, y, r * 0.75, Math.PI - 0.9, Math.PI + 0.9); ctx.stroke();
  }
  function lane(x0, wL, Y, sc, ev, e, t, color, title, sub) {
    const cx = x0 + wL / 2, r = Math.max(7, 0.12 * sc);
    // alturas de los ápices ya alcanzados
    ctx.save(); ctx.setLineDash([3, 4]); ctx.strokeStyle = color; ctx.globalAlpha = 0.45; ctx.lineWidth = 1;
    ev.forEach(b => { if (b.t < t && b.vOut > 0) { const h = b.vOut ** 2 / (2 * G); if (h < 4) { ctx.beginPath(); ctx.moveTo(cx - wL * 0.32, Y(h)); ctx.lineTo(cx + wL * 0.32, Y(h)); ctx.stroke(); } } });
    ctx.restore();
    const y = altura(ev, t);
    const yc = Math.max(Y(Math.min(y, 4.2)) - r, 30);
    // sombra
    ctx.fillStyle = 'rgba(4,34,85,0.15)'; ctx.beginPath();
    ctx.ellipse(cx, Y(0) + 2, r * (1.1 - Math.min(y, 3) / 6), r * 0.25, 0, 0, Math.PI * 2); ctx.fill();
    drawBall(cx, yc, r, color);
    if (y > 4.2) { ctx.fillStyle = PAL.rosewood; ctx.font = '700 11px Montserrat'; ctx.textAlign = 'center'; ctx.fillText('↑ se sale del cuadro', cx, 22); }
    ctx.textAlign = 'center';
    ctx.fillStyle = PAL.deepNavy; ctx.font = '800 12.5px Montserrat'; ctx.fillText(title, cx, Y(0) + 24);
    ctx.fillStyle = '#3b4a68'; ctx.font = '500 11px Montserrat'; ctx.fillText(sub, cx, Y(0) + 40);
    const nB = ev.filter(b => b.t <= t && b.vOut > 0).length;
    ctx.fillStyle = color; ctx.font = '700 11px Montserrat';
    const rest = ev.length && ev[ev.length - 1].vOut === 0 && t >= ev[ev.length - 1].t;
    const top = 18 + (y > 4.2 ? 16 : 0);
    if (wL >= 230) ctx.fillText(`rebotes: ${nB}${rest ? ' · en reposo' : ''}`, cx, top);
    else { ctx.fillText(`rebotes: ${nB}`, cx, top); if (rest) ctx.fillText('en reposo', cx, top + 14); }
    ctx.textAlign = 'left';
  }
  function draw(t = 0) {
    const dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
    if (w < 120 || h < 120) return;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    const padL = 40, padB = 66, padT = 44, sc = (h - padB - padT) / 3.0;
    const Y = m => h - padB - m * sc;
    // regla vertical
    ctx.font = '500 10.5px Montserrat'; ctx.strokeStyle = '#e3e9f4'; ctx.fillStyle = '#6a7894'; ctx.lineWidth = 1;
    for (let m = 0; m <= 3; m += 0.5) { ctx.beginPath(); ctx.moveTo(padL, Y(m)); ctx.lineTo(w - 8, Y(m)); ctx.stroke(); ctx.fillText(fmt(m, 1), 6, Y(m) + 4); }
    ctx.fillStyle = PAL.regalNavy; ctx.font = '600 11px Montserrat'; ctx.fillText('y (m)', 6, padT - 14);
    // altura de caída ITF
    ctx.save(); ctx.strokeStyle = PAL.deepPink; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.moveTo(padL, Y(H0)); ctx.lineTo(w - 8, Y(H0)); ctx.stroke(); ctx.restore();
    ctx.fillStyle = PAL.rosewood; ctx.font = '700 10.5px Montserrat'; ctx.fillText('caída ITF: 2,54 m', padL + 4, Y(H0) - 5);
    // suelo y separador
    ctx.fillStyle = PAL.deepNavy; ctx.fillRect(padL, Y(0), w - padL - 8, 5);
    const wL = (w - padL - 8) / 2;
    ctx.strokeStyle = '#dfe6f3'; ctx.beginPath(); ctx.moveTo(padL + wL, padT - 10); ctx.lineTo(padL + wL, Y(0)); ctx.stroke();
    lane(padL, wL, Y, sc, state.real, E_REAL, t, PAL.regalNavy, 'Pelota real (ITF)', `e = ${fmt(E_REAL, 3)}`);
    lane(padL + wL, wL, Y, sc, state.game, state.eEff, t, PAL.deepPink, 'Motor de juego', `e efectivo = ${fmt(state.eEff, 3)}`);
    ctx.fillStyle = PAL.deepNavy; ctx.font = '700 12px Montserrat'; ctx.textAlign = 'right';
    ctx.fillText(`t = ${fmt(t, 2)} s`, w - 12, h - 8); ctx.textAlign = 'left';
  }

  // ---------- Gráfica y(t) ----------
  const chart = new Chart($('bounceChart'), {
    type: 'scatter',
    data: { datasets: [
      { label: `Pelota real ITF (e = ${fmt(E_REAL, 3)})`, data: [], showLine: true, borderColor: PAL.regalNavy, borderWidth: 2, pointRadius: 0 },
      { label: 'Motor de juego (e efectivo)', data: [], showLine: true, borderColor: PAL.deepPink, borderWidth: 2.5, pointRadius: 0 }
    ] },
    options: {
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      scales: {
        x: { type: 'linear', min: 0, max: T_MAX, title: axisTitle('Tiempo, t (s)'), grid: { color: PAL.grid } },
        y: { min: 0, max: 3, title: axisTitle('Altura de la pelota, y (m)'), grid: { color: PAL.grid } }
      },
      locale: 'es-CR',
      plugins: { legend: { position: 'top' }, vLine: { x: null },
        tooltip: { callbacks: { title: i => `t = ${fmt(i[0].parsed.x, 2)} s`, label: i => `${i.dataset.label.split(' (')[0]}: y = ${fmt(i.parsed.y, 2)} m` } } }
    },
    plugins: [vLinePlugin]
  });
  const sample = ev => { const d = []; for (let t = 0; t <= T_MAX + 1e-9; t += 1 / 100) d.push({ x: +t.toFixed(2), y: Math.min(altura(ev, t), 3.2) }); return d; };

  function readout() {
    const s = state, b1 = s.game[0], r1 = s.real[0];
    const h1 = b1.vOut ** 2 / (2 * G), hr = r1.vOut ** 2 / (2 * G);
    const last = s.game[s.game.length - 1];
    const stops = last.vOut === 0;
    const nb = stops ? s.game.length - 1 : s.game.length;
    const J = M * (b1.vIn + b1.vOut);
    const zenoT = s.eEff < 1 ? Math.sqrt(2 * H0 / G) * (1 + s.eEff) / (1 - s.eEff) : Infinity;
    $('bounceReadout').innerHTML = `
      <div class="ro"><small>e efectivo (${MODE_TXT[s.mode]})</small><b>${fmt(s.eEff, 3)}</b><div class="sub">pelota ${fmt(s.eB, 3)} · suelo ${fmt(s.eF, 3)}</div></div>
      <div class="ro"><small>Altura del 1.er rebote</small><b>${fmt(h1, 2)} m</b><div class="sub">real: ${fmt(hr, 2)} m · h₁ = e²·h₀</div></div>
      <div class="ro"><small>Energía por choque</small><b>${s.eEff <= 1 ? '−' + fmt((1 - s.eEff ** 2) * 100, 1) : '+' + fmt((s.eEff ** 2 - 1) * 100, 1)} %</b><div class="sub">${s.eEff > 1 ? 'gana energía: imposible' : s.eEff === 1 ? 'elástico: no pierde nada' : 'ΔK/K = 1 − e²'}</div></div>
      <div class="ro"><small>Rebotes hasta el reposo</small><b>${stops ? nb : '∞'}</b><div class="sub">${stops ? `se detiene en t = ${fmt(last.t, 2)} s` : (isFinite(zenoT) ? `teoría: ∞ rebotes en ${fmt(zenoT, 2)} s` : 'nunca se detiene')}</div></div>
      <div class="ro"><small>Impulso del 1.er choque</small><b>${fmt(J, 3)} N·s</b><div class="sub">J = m(1 + e)v, con m = 57 g</div></div>`;
    $('eBallOut').textContent = fmt(s.eB, 3);
    $('eFloorOut').textContent = fmt(s.eF, 3);
    $('eThreshOut').textContent = `${fmt(s.vTh, 1)} m/s`;
  }

  function update() {
    compute();
    chart.data.datasets[0].data = sample(state.real);
    chart.data.datasets[1].data = sample(state.game);
    chart.options.plugins.vLine.x = anim ? anim.t : null;
    chart.update('none');
    readout();
    draw(anim ? anim.t : 0);
  }

  // ---------- Animación en tiempo real ----------
  function play() {
    if (anim) cancelAnimationFrame(anim.raf);
    anim = { start: performance.now(), t: 0, raf: 0 };
    const step = now => {
      anim.t = Math.min((now - anim.start) / 1000, T_MAX);
      draw(anim.t);
      chart.options.plugins.vLine.x = anim.t; chart.update('none');
      if (anim.t < T_MAX) anim.raf = requestAnimationFrame(step);
    };
    anim.raf = requestAnimationFrame(step);
  }
  $('bounceBtn').addEventListener('click', play);

  const PRESETS = {
    itf:   { eB: 0.745, eF: 0.745, mode: 'avg', th: 0.1 },
    avg0:  { eB: 0.745, eF: 0,     mode: 'avg', th: 0.1 },
    mul0:  { eB: 0.745, eF: 0,     mode: 'mul', th: 0.1 },
    thr:   { eB: 0.745, eF: 0.745, mode: 'avg', th: 2 },
    elast: { eB: 1,     eF: 1,     mode: 'avg', th: 0.1 },
    gain:  { eB: 1.1,   eF: 1.1,   mode: 'avg', th: 0.1 }
  };
  document.querySelectorAll('[data-bpreset]').forEach(b => b.addEventListener('click', () => {
    const p = PRESETS[b.dataset.bpreset];
    inEb.value = p.eB; inEf.value = p.eF; inMode.value = p.mode; inTh.value = p.th;
    update(); play();
  }));
  [inEb, inEf, inTh].forEach(el => el.addEventListener('input', update));
  inMode.addEventListener('change', update);
  window.addEventListener('resize', () => draw(anim ? anim.t : 0));
  update();
})();
