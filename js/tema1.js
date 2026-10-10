/* Tema 1 — Dron de reparto: ruta declarada con perfil de mínimo tirón */
(() => {
  const WP = [
    { n: 'CEDI (despegue)', x: 0, y: 0 },
    { n: 'P1', x: 400, y: 300 },
    { n: 'P2', x: 900, y: 300 },
    { n: 'Cliente (entrega)', x: 1100, y: 700 }
  ];
  const LEG_T = [40, 40, 36];   // s
  const HOVER = 4;              // s de pausa en P1 y P2
  const DT = 0.5;               // s de muestreo

  // Segmentos de la misión
  const segs = [];
  let t0 = 0;
  for (let i = 0; i < LEG_T.length; i++) {
    const a = WP[i], b = WP[i + 1];
    const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
    segs.push({ type: 'move', a, b, dx, dy, L, T: LEG_T[i], t0, i });
    t0 += LEG_T[i];
    if (i < LEG_T.length - 1) { segs.push({ type: 'hover', at: b, T: HOVER, t0 }); t0 += HOVER; }
  }
  const TT = t0;

  function stateAt(t) {
    t = Math.min(Math.max(t, 0), TT);
    let s = segs[segs.length - 1];
    for (const g of segs) if (t <= g.t0 + g.T) { s = g; break; }
    if (s.type === 'hover') return { x: s.at.x, y: s.at.y, vx: 0, vy: 0, ax: 0, ay: 0 };
    const tau = (t - s.t0) / s.T, T = s.T;
    const sp = 10 * tau ** 3 - 15 * tau ** 4 + 6 * tau ** 5;
    const sv = (30 * tau ** 2 - 60 * tau ** 3 + 30 * tau ** 4) / T;
    const sa = (60 * tau - 180 * tau ** 2 + 120 * tau ** 3) / (T * T);
    return {
      x: s.a.x + s.dx * sp, y: s.a.y + s.dy * sp,
      vx: s.dx * sv, vy: s.dy * sv, ax: s.dx * sa, ay: s.dy * sa
    };
  }

  // Datos muestreados
  const data = [];
  let dist = 0, prev = null;
  for (let t = 0; t <= TT + 1e-9; t += DT) {
    const st = stateAt(t);
    if (prev) dist += Math.hypot(st.x - prev.x, st.y - prev.y);
    data.push({ t, ...st, v: Math.hypot(st.vx, st.vy), a: Math.hypot(st.ax, st.ay), s: dist });
    prev = st;
  }

  // Tabla de la ruta
  const tb = document.querySelector('#routeTable tbody');
  segs.filter(s => s.type === 'move').forEach(s => {
    const vmax = 15 / 8 * s.L / s.T, amax = 10 * Math.sqrt(3) / 3 * s.L / (s.T * s.T);
    tb.insertAdjacentHTML('beforeend',
      `<tr><td>${s.i + 1}</td><td>${s.a.n} (${s.a.x}, ${s.a.y}) → ${s.b.n} (${s.b.x}, ${s.b.y})</td>
       <td>${fmt(s.L, 1)} m</td><td>${s.T} s</td><td>${fmt(vmax, 1)} m/s (${fmt(vmax * 3.6, 0)} km/h)</td><td>${fmt(amax, 2)} m/s²</td></tr>`);
  });
  tb.insertAdjacentHTML('beforeend', `<tr class="hl"><td>Total</td><td>3 tramos + 2 pausas de ${HOVER} s</td><td>${fmt(dist, 1)} m</td><td>${TT} s</td><td colspan="2">rapidez media ${fmt(dist / TT, 1)} m/s</td></tr>`);

  const slider = document.getElementById('t1Slider');
  slider.max = TT;

  const timeScale = (title) => ({
    type: 'linear', min: 0, max: TT, title: axisTitle('Tiempo, t (s)'), grid: { color: PAL.grid }
  });
  const ln = (label, key, color, dash) => ({
    label, data: data.map(d => ({ x: d.t, y: d[key] })), borderColor: color, backgroundColor: color,
    borderWidth: 2, pointRadius: 0, borderDash: dash || [], tension: 0
  });
  const tChart = (id, datasets, ytitle) => new Chart(document.getElementById(id), {
    type: 'line', data: { datasets },
    options: {
      parsing: true, interaction: { mode: 'nearest', intersect: false },
      scales: { x: timeScale(), y: { title: axisTitle(ytitle), grid: { color: PAL.grid } } },
      plugins: { vLine: { x: +slider.value }, legend: { position: 'top' },
        tooltip: { callbacks: { title: i => `t = ${fmt(i[0].parsed.x, 1)} s`, label: i => `${i.dataset.label}: ${fmt(i.parsed.y, 2)}` } } }
    },
    plugins: [vLinePlugin]
  });

  const cPos = tChart('t1Pos', [
    ln('x(t) — este', 'x', PAL.regalNavy), ln('y(t) — norte', 'y', PAL.deepPink), ln('s(t) — distancia recorrida', 's', PAL.babyPink, [6, 4])
  ], 'Posición (m)');
  const cVel = tChart('t1Vel', [
    ln('vₓ', 'vx', PAL.regalNavy), ln('v_y', 'vy', PAL.deepPink), ln('|v| rapidez', 'v', PAL.rosewood, [6, 3])
  ], 'Velocidad (m/s)');
  const cAcc = tChart('t1Acc', [
    ln('aₓ', 'ax', PAL.regalNavy), ln('a_y', 'ay', PAL.deepPink), ln('|a|', 'a', PAL.rosewood, [6, 3])
  ], 'Aceleración (m/s²)');

  // Mapa con vectores velocidad
  const arrowsPlugin = {
    id: 'vArrows',
    afterDatasetsDraw(chart) {
      const { ctx, scales: { x, y } } = chart;
      ctx.save();
      for (let t = 3; t < TT; t += 6) {
        const s = stateAt(t);
        if (Math.hypot(s.vx, s.vy) < 0.5) continue;
        const k = 4; // 1 m/s = 4 m
        const x1 = x.getPixelForValue(s.x), y1 = y.getPixelForValue(s.y);
        const x2 = x.getPixelForValue(s.x + s.vx * k), y2 = y.getPixelForValue(s.y + s.vy * k);
        const ang = Math.atan2(y2 - y1, x2 - x1);
        ctx.strokeStyle = PAL.deepPink; ctx.fillStyle = PAL.deepPink; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - 8 * Math.cos(ang - 0.4), y2 - 8 * Math.sin(ang - 0.4));
        ctx.lineTo(x2 - 8 * Math.cos(ang + 0.4), y2 - 8 * Math.sin(ang + 0.4));
        ctx.closePath(); ctx.fill();
      }
      // etiquetas de puntos de control
      ctx.font = "600 11px Montserrat"; ctx.fillStyle = PAL.deepNavy;
      WP.forEach((w, i) => {
        const px = x.getPixelForValue(w.x), py = y.getPixelForValue(w.y);
        ctx.fillText(w.n, px + (i === 3 ? -110 : 8), py + (i === 0 ? -8 : 16));
      });
      ctx.restore();
    }
  };
  const cMap = new Chart(document.getElementById('t1Map'), {
    type: 'scatter',
    data: {
      datasets: [
        { label: 'Trayectoria', data: data.map(d => ({ x: d.x, y: d.y })), showLine: true, borderColor: PAL.regalNavy, borderWidth: 3, pointRadius: 0 },
        { label: 'Puntos de control', data: WP.map(w => ({ x: w.x, y: w.y })), pointRadius: 6, pointBackgroundColor: PAL.deepNavy, pointBorderColor: '#fff', pointBorderWidth: 2 },
        { label: 'Dron (instante elegido)', data: [{ x: 0, y: 0 }], pointRadius: 9, pointBackgroundColor: PAL.rosewood, pointBorderColor: PAL.babyPink, pointBorderWidth: 3 }
      ]
    },
    options: {
      scales: {
        x: { min: -100, max: 1200, title: axisTitle('x — este (m)'), grid: { color: PAL.grid } },
        y: { min: -100, max: 800, title: axisTitle('y — norte (m)'), grid: { color: PAL.grid } }
      },
      plugins: { legend: { position: 'top' }, tooltip: { callbacks: { label: i => `(${fmt(i.parsed.x, 0)} m, ${fmt(i.parsed.y, 0)} m)` } } }
    },
    plugins: [arrowsPlugin]
  });

  const out = document.getElementById('t1Out');
  const ro = document.getElementById('t1Readout');
  function update() {
    const t = +slider.value;
    const s = stateAt(t);
    const v = Math.hypot(s.vx, s.vy), a = Math.hypot(s.ax, s.ay);
    const dir = v > 0.01 ? (Math.atan2(s.vy, s.vx) * 180 / Math.PI) : null;
    out.textContent = `${fmt(t, 1)} s`;
    cMap.data.datasets[2].data = [{ x: s.x, y: s.y }]; cMap.update('none');
    [cPos, cVel, cAcc].forEach(c => { c.options.plugins.vLine.x = t; c.update('none'); });
    ro.innerHTML = `
      <div class="ro"><small>Posición r</small><b>(${fmt(s.x, 1)}, ${fmt(s.y, 1)}) m</b><div class="sub">|r| = ${fmt(Math.hypot(s.x, s.y), 1)} m del CEDI</div></div>
      <div class="ro"><small>Velocidad v</small><b>(${fmt(s.vx, 2)}, ${fmt(s.vy, 2)}) m/s</b><div class="sub">|v| = ${fmt(v, 2)} m/s${dir !== null ? ` · dirección ${fmt(dir, 1)}°` : ' · en pausa'}</div></div>
      <div class="ro"><small>Aceleración a</small><b>(${fmt(s.ax, 3)}, ${fmt(s.ay, 3)}) m/s²</b><div class="sub">|a| = ${fmt(a, 3)} m/s²</div></div>`;
  }
  slider.addEventListener('input', update);
  update();

  // Reproducción
  let playing = false, raf = null, last = 0;
  const playBtn = document.getElementById('t1Play');
  function step(now) {
    const dt = (now - last) / 1000; last = now;
    let t = +slider.value + dt * 8; // 8x tiempo real
    if (t >= TT) { t = TT; stop(); }
    slider.value = t; update();
    if (playing) raf = requestAnimationFrame(step);
  }
  function stop() { playing = false; cancelAnimationFrame(raf); playBtn.textContent = '▶ Reproducir vuelo'; }
  playBtn.addEventListener('click', () => {
    if (playing) return stop();
    if (+slider.value >= TT) slider.value = 0;
    playing = true; last = performance.now(); playBtn.textContent = '❚❚ Pausa (8× tiempo real)';
    raf = requestAnimationFrame(step);
  });

  // CSV
  document.getElementById('t1Csv').addEventListener('click', () => {
    const head = 't_s,x_m,y_m,vx_m_s,vy_m_s,rapidez_m_s,ax_m_s2,ay_m_s2,a_m_s2,distancia_m\n';
    const rows = data.map(d => [d.t, d.x, d.y, d.vx, d.vy, d.v, d.ax, d.ay, d.a, d.s].map(n => n.toFixed(4)).join(',')).join('\n');
    const blob = new Blob([head + rows], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'ruta_dron_tema1.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
})();
