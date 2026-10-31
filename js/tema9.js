/* Tema 9 — Asistencia gravitatoria: rapidez real de la Voyager 2 respecto al Sol (NASA/JPL Horizons) */
(() => {
  const $ = id => document.getElementById(id);
  if (!$('t9Speed') || typeof VOYAGER2 === 'undefined') return;

  const MU_SOL = 1.32712440018e11;   // GM del Sol (km³/s²)
  const UA = 149597870.7;            // km

  // Datos de los planetas: GM (km³/s²), radio ecuatorial (km), altitud del máximo acercamiento sobre las nubes (km, NASA)
  const PLANETAS = {
    J: { nombre: 'Júpiter', mu: 1.26686534e8, radio: 71492, alt: 645000, ca: Date.UTC(1979, 6, 9, 22, 29) },
    S: { nombre: 'Saturno', mu: 3.7931187e7, radio: 60268, alt: 101000, ca: Date.UTC(1981, 7, 26, 3, 0) },
    U: { nombre: 'Urano',   mu: 5.793939e6,  radio: 25559, alt: 81500,  ca: Date.UTC(1986, 0, 24, 17, 59) },
    N: { nombre: 'Neptuno', mu: 6.836529e6,  radio: 24764, alt: 4800,   ca: Date.UTC(1989, 7, 25, 3, 56) }
  };
  const ORDEN = ['J', 'S', 'U', 'N'];

  // ---- Lectura de los datos ----
  const decYear = ms => {
    const y = new Date(ms).getUTCFullYear();
    const a = Date.UTC(y, 0, 1), b = Date.UTC(y + 1, 0, 1);
    return y + (ms - a) / (b - a);
  };
  const H = VOYAGER2.helio.split(';').map(s => {
    const [f, r, v] = s.split(',');
    const [d, h] = f.split(' ');
    const [Y, M, D] = d.split('-').map(Number);
    const ms = Date.UTC(Y, M - 1, D, +h);
    return { ms, x: decYear(ms), r: +r, v: +v, f };
  });
  const vEsc = r => Math.sqrt(2 * MU_SOL / (r * UA));
  const energia = (v, r) => v * v / 2 - MU_SOL / (r * UA);  // km²/s² = MJ/kg
  const idxCercano = ms => H.reduce((m, p, i) => Math.abs(p.ms - ms) < Math.abs(H[m].ms - ms) ? i : m, 0);

  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const fecha = ms => { const d = new Date(ms); return `${d.getUTCDate()} ${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };

  // Cambio de rapidez respecto al Sol: 30 días antes y 30 días después del máximo acercamiento
  const DIA = 86400000;
  const RESUMEN = ORDEN.map(k => {
    const p = PLANETAS[k];
    const a = H[idxCercano(p.ca - 30 * DIA)], b = H[idxCercano(p.ca + 30 * DIA)];
    const pico = H.filter(q => Math.abs(q.ms - p.ca) < 3 * DIA).reduce((m, q) => q.v > m.v ? q : m);
    return { k, ...p, antes: a, despues: b, pico, dv: b.v - a.v };
  });

  // ---- Plugin: líneas verticales en cada encuentro, con el nombre del planeta ----
  const encuentrosPlugin = {
    id: 'encuentros',
    afterDatasetsDraw(chart) {
      const { ctx, chartArea: a, scales: { x } } = chart;
      ctx.save();
      RESUMEN.forEach(e => {
        const px = x.getPixelForValue(decYear(e.ca));
        if (px < a.left || px > a.right) return;
        ctx.strokeStyle = 'rgba(4,34,85,0.35)'; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.moveTo(px, a.top); ctx.lineTo(px, a.bottom); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = PAL.deepNavy; ctx.font = "700 11px Montserrat, sans-serif"; ctx.textAlign = 'center';
        ctx.fillText(e.nombre, Math.min(Math.max(px, a.left + 28), a.right - 28), a.top + 12);
      });
      ctx.restore();
    }
  };

  // ---- Gráfica 1: rapidez respecto al Sol y rapidez de escape ----
  const sChart = new Chart($('t9Speed'), {
    type: 'scatter',
    data: { datasets: [
      { label: 'Rapidez de la Voyager 2 respecto al Sol, v (km/s)', data: H.map(p => ({ x: p.x, y: p.v })), showLine: true, borderColor: PAL.rosewood, borderWidth: 2.2, pointRadius: 0 },
      { label: 'Rapidez de escape del Sol a esa distancia, √(2GM/r) (km/s)', data: H.map(p => ({ x: p.x, y: vEsc(p.r) })), showLine: true, borderColor: PAL.regalNavy, borderDash: [6, 5], borderWidth: 1.6, pointRadius: 0 }
    ] },
    plugins: [encuentrosPlugin, vLinePlugin],
    options: {
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      scales: {
        x: { type: 'linear', min: 1977.6, max: 1990, title: axisTitle('Tiempo (año)'), grid: { color: PAL.grid },
             ticks: { stepSize: 1, callback: v => Number.isInteger(v) ? String(v) : '' } },
        y: { min: 0, max: 45, title: axisTitle('Rapidez respecto al Sol, v (km/s)'), grid: { color: PAL.grid } }
      },
      plugins: {
        legend: { position: 'top' },
        vLine: { x: null },
        tooltip: { callbacks: {
          title: i => fecha(H[i[0].dataIndex].ms),
          label: i => `${i.datasetIndex === 0 ? 'v' : 'v_escape'}: ${fmt(i.parsed.y, 2)} km/s` } }
      }
    }
  });

  // ---- Gráfica 2: el mismo encuentro visto desde el planeta y desde el Sol ----
  let actual = 'J';
  const serie = k => VOYAGER2.planeta[k].split(';').map(s => s.split(' ').map(Number));
  const pChart = new Chart($('t9Planet'), {
    type: 'scatter',
    data: { datasets: [
      { label: 'Respecto al planeta (km/s)', data: [], showLine: true, borderColor: PAL.deepNavy, borderWidth: 2.4, pointRadius: 0 },
      { label: 'Respecto al Sol (km/s)', data: [], showLine: true, borderColor: PAL.deepPink, borderWidth: 2.4, pointRadius: 0 }
    ] },
    plugins: [vLinePlugin],
    options: {
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      scales: {
        x: { type: 'linear', min: -120, max: 120, title: axisTitle('Horas desde el máximo acercamiento, t − t_ca (h)'), grid: { color: PAL.grid }, ticks: { stepSize: 24 } },
        y: { title: axisTitle('Rapidez, v (km/s)'), grid: { color: PAL.grid } }
      },
      plugins: { legend: { position: 'top' }, vLine: { x: 0 },
        tooltip: { callbacks: { title: i => `t − t_ca = ${fmt(i[0].parsed.x, 0)} h`, label: i => `${i.dataset.label.split(' (')[0]}: ${fmt(i.parsed.y, 2)} km/s` } } }
    }
  });

  // ---- Gráfica 3: cambio neto de rapidez respecto al Sol en cada encuentro ----
  const bChart = new Chart($('t9Delta'), {
    type: 'bar',
    data: { labels: RESUMEN.map(e => e.nombre), datasets: [{
      label: 'Δv respecto al Sol (30 días antes → 30 días después)',
      data: RESUMEN.map(e => e.dv),
      backgroundColor: RESUMEN.map(e => e.dv >= 0 ? PAL.deepPink : PAL.regalNavy) }] },
    options: {
      scales: {
        x: { grid: { display: false } },
        y: { title: axisTitle('Cambio de rapidez, Δv (km/s)'), grid: { color: c => c.tick.value === 0 ? PAL.deepNavy : PAL.grid } }
      },
      plugins: { legend: { display: false },
        tooltip: { callbacks: { label: i => `Δv = ${i.parsed.y >= 0 ? '+' : ''}${fmt(i.parsed.y, 2)} km/s` } } }
    }
  });

  // ---- Lecturas ----
  const slider = $('t9Slider');
  slider.max = H.length - 1;
  slider.value = idxCercano(Date.UTC(1979, 6, 20));

  function updateFecha() {
    const p = H[+slider.value];
    const ve = vEsc(p.r), E = energia(p.v, p.r);
    $('t9Out').textContent = fecha(p.ms);
    sChart.options.plugins.vLine.x = p.x;
    sChart.update('none');
    $('t9Readout').innerHTML = `
      <div class="ro"><small>Distancia al Sol</small><b>${fmt(p.r, 2)} UA</b><div class="sub">${fmt(p.r * UA / 1e6, 0)} millones de km</div></div>
      <div class="ro"><small>Rapidez respecto al Sol</small><b>${fmt(p.v, 2)} km/s</b><div class="sub">${fmt(p.v * 3600, 0)} km/h</div></div>
      <div class="ro"><small>Rapidez de escape a esa distancia</small><b>${fmt(ve, 2)} km/s</b><div class="sub">v_esc = √(2GM☉/r)</div></div>
      <div class="ro"><small>Energía mecánica por kilogramo</small><b>${E >= 0 ? '+' : '−'}${fmt(Math.abs(E), 1)} MJ/kg</b><div class="sub" style="color:${E >= 0 ? '#7be3b0' : '#ffd27a'}">${E >= 0 ? 'E > 0: escapa del sistema solar' : 'E < 0: ligada al Sol (órbita cerrada)'}</div></div>`;
  }

  function updateEncuentro() {
    const e = RESUMEN.find(r => r.k === actual);
    const d = serie(actual);
    pChart.data.datasets[0].data = d.map(r => ({ x: r[0], y: r[1] }));
    pChart.data.datasets[1].data = d.map(r => ({ x: r[0], y: r[2] }));
    const ys = d.flatMap(r => [r[1], r[2]]);
    pChart.options.scales.y.min = Math.floor(Math.min(...ys) - 1);
    pChart.options.scales.y.max = Math.ceil(Math.max(...ys) + 1);
    pChart.options.scales.x.min = Math.min(-120, d[0][0]);
    pChart.update('none');
    document.querySelectorAll('#t9Enc .btn').forEach(b => b.classList.toggle('ghost', b.dataset.k !== actual));

    // Entrada y salida lejos del planeta (primer y último dato, ±4,5–5,75 días)
    const vin = d[0][1], vout = d[d.length - 1][1];
    const vinf = (vin + vout) / 2;
    const rp = e.radio + e.alt;
    const s = 1 / (1 + rp * vinf * vinf / e.mu);          // sin(δ/2)
    const delta = 2 * Math.asin(s) * 180 / Math.PI;
    const dvMax = 2 * vinf * s;
    const Ea = energia(e.antes.v, e.antes.r), Eb = energia(e.despues.v, e.despues.r);
    $('t9EncReadout').innerHTML = `
      <div class="ro"><small>Rapidez respecto a ${e.nombre}</small><b>${fmt(vin, 2)} → ${fmt(vout, 2)} km/s</b><div class="sub">entrada → salida: se conserva (diferencia ${fmt(Math.abs(vout - vin), 2)} km/s)</div></div>
      <div class="ro"><small>Rapidez respecto al Sol</small><b>${fmt(e.antes.v, 2)} → ${fmt(e.despues.v, 2)} km/s</b><div class="sub">30 días antes → 30 días después: ${e.dv >= 0 ? '+' : '−'}${fmt(Math.abs(e.dv), 2)} km/s</div></div>
      <div class="ro"><small>Ángulo de desvío en el planeta</small><b>δ = ${fmt(delta, 0)}°</b><div class="sub">r_p ≈ ${fmt(rp, 0)} km · Δv máx posible = 2v∞ sen(δ/2) = ${fmt(dvMax, 1)} km/s</div></div>
      <div class="ro"><small>Energía por kg respecto al Sol</small><b>${Ea >= 0 ? '+' : '−'}${fmt(Math.abs(Ea), 0)} → ${Eb >= 0 ? '+' : '−'}${fmt(Math.abs(Eb), 0)} MJ/kg</b><div class="sub">pico durante el paso: ${fmt(e.pico.v, 1)} km/s (${fecha(e.pico.ms)})</div></div>`;
  }

  document.querySelectorAll('#t9Enc .btn').forEach(b => b.addEventListener('click', () => { actual = b.dataset.k; updateEncuentro(); }));
  slider.addEventListener('input', updateFecha);
  document.querySelectorAll('#t9Jump .btn').forEach(b => b.addEventListener('click', () => {
    slider.value = idxCercano(Date.UTC(...b.dataset.d.split('-').map((n, i) => i === 1 ? n - 1 : +n)));
    updateFecha();
  }));
  updateFecha();
  updateEncuentro();
})();
