/* Tema 4 — Llantas de F1: agarre vs temperatura y vs carga vertical */
(() => {
  // Rangos oficiales de trabajo (Pirelli, 2019) y picos ilustrativos
  const COMP = [
    { n: 'C1 (más duro)', lo: 110, hi: 140, pk: 1.62, c: PAL.deepNavy },
    { n: 'C2', lo: 110, hi: 135, pk: 1.66, c: PAL.regalNavy },
    { n: 'C3', lo: 105, hi: 135, pk: 1.70, c: PAL.rosewood },
    { n: 'C4', lo: 90, hi: 120, pk: 1.74, c: PAL.deepPink },
    { n: 'C5 (más blando)', lo: 85, hi: 115, pk: 1.78, c: PAL.babyPink }
  ];
  const mu = (cp, T) => { const tc = (cp.lo + cp.hi) / 2, w = (cp.hi - cp.lo) / 2; return cp.pk * Math.pow(0.95, ((T - tc) / w) ** 2); };
  const Ts = []; for (let T = 50; T <= 170; T += 1) Ts.push(T);

  const sel = document.getElementById('compSel');
  const bandPlugin = {
    id: 'band',
    beforeDatasetsDraw(chart) {
      const cp = COMP[+sel.value];
      const { ctx, chartArea: a, scales: { x } } = chart;
      const x1 = x.getPixelForValue(cp.lo), x2 = x.getPixelForValue(cp.hi);
      ctx.save();
      ctx.fillStyle = 'rgba(243, 93, 156, 0.13)'; ctx.fillRect(x1, a.top, x2 - x1, a.bottom - a.top);
      ctx.strokeStyle = PAL.deepPink; ctx.setLineDash([4, 4]);
      [x1, x2].forEach(px => { ctx.beginPath(); ctx.moveTo(px, a.top); ctx.lineTo(px, a.bottom); ctx.stroke(); });
      ctx.setLineDash([]); ctx.fillStyle = PAL.rosewood; ctx.font = "700 11px Montserrat";
      ctx.fillText(`Ventana oficial ${cp.n.split(' ')[0]}: ${cp.lo}–${cp.hi} °C`, x1 + 6, a.top + 14);
      ctx.restore();
    }
  };
  const tChart = new Chart(document.getElementById('t4Temp'), {
    type: 'line',
    data: { datasets: COMP.map((cp, i) => ({
      label: cp.n, data: Ts.map(T => ({ x: T, y: mu(cp, T) })), borderColor: cp.c, backgroundColor: cp.c,
      borderWidth: i === +sel.value ? 4 : 2, pointRadius: 0
    })) },
    options: {
      interaction: { mode: 'nearest', intersect: false },
      scales: {
        x: { type: 'linear', min: 50, max: 170, title: axisTitle('Temperatura de la banda de rodadura, T (°C)'), grid: { color: PAL.grid } },
        y: { min: 0.9, max: 1.85, title: axisTitle('Coeficiente de agarre, μ (adimensional)'), grid: { color: PAL.grid } }
      },
      plugins: { legend: { position: 'top' },
        tooltip: { callbacks: { title: i => `T = ${i[0].parsed.x} °C`, label: i => `${i.dataset.label}: μ = ${fmt(i.parsed.y, 3)}` } } }
    },
    plugins: [bandPlugin]
  });
  sel.addEventListener('change', () => {
    tChart.data.datasets.forEach((d, i) => d.borderWidth = i === +sel.value ? 4 : 2);
    tChart.update();
  });

  // ---- Sensibilidad a la carga (Magic Formula, término D) ----
  const pD1 = 1.70, pD2 = -0.20, Fz0 = 3000, AXLE = 6000;
  const muFz = Fz => pD1 + pD2 * (Fz - Fz0) / Fz0;
  const FyMax = Fz => muFz(Fz) * Fz;
  const Fzs = []; for (let F = 0; F <= 7000; F += 100) Fzs.push(F);

  const lt = document.getElementById('ltSlider');
  const lChart = new Chart(document.getElementById('t4Load'), {
    type: 'scatter',
    data: { datasets: [
      { label: 'Coulomb: F = μN (μ constante = 1,70)', data: Fzs.map(F => ({ x: F, y: pD1 * F })), showLine: true, borderColor: '#9fb3d6', borderDash: [7, 5], borderWidth: 2, pointRadius: 0 },
      { label: 'Llanta real (sensible a la carga)', data: Fzs.map(F => ({ x: F, y: FyMax(F) })), showLine: true, borderColor: PAL.rosewood, borderWidth: 3.5, pointRadius: 0 },
      { label: 'Llantas del eje en la curva', data: [], pointRadius: 8, pointBackgroundColor: PAL.deepPink, pointBorderColor: '#fff', pointBorderWidth: 2 },
      { label: 'Sin transferencia (3000 N c/u)', data: [{ x: Fz0, y: FyMax(Fz0) }], pointRadius: 7, pointStyle: 'rectRot', pointBackgroundColor: PAL.deepNavy }
    ] },
    options: {
      scales: {
        x: { min: 0, max: 7000, title: axisTitle('Carga vertical sobre la llanta, F_z (N)'), grid: { color: PAL.grid } },
        y: { min: 0, max: 12500, title: axisTitle('Fuerza lateral máxima, F_y,máx (N)'), grid: { color: PAL.grid } }
      },
      plugins: { legend: { position: 'top' },
        tooltip: { callbacks: { label: i => `F_z = ${fmt(i.parsed.x, 0)} N → F_y = ${fmt(i.parsed.y, 0)} N` } } }
    }
  });

  function update() {
    const d = +lt.value, ins = Fz0 - d, ext = Fz0 + d;
    const tot = FyMax(ins) + FyMax(ext), base = 2 * FyMax(Fz0);
    document.getElementById('ltOut').textContent = `${fmt(d, 0)} N`;
    lChart.data.datasets[2].data = [{ x: ins, y: FyMax(ins) }, { x: ext, y: FyMax(ext) }];
    lChart.update('none');
    document.getElementById('t4Readout').innerHTML = `
      <div class="ro"><small>Llanta interior</small><b>${fmt(ins, 0)} N</b><div class="sub">μ = ${fmt(muFz(ins), 3)} · F_y = ${fmt(FyMax(ins), 0)} N</div></div>
      <div class="ro"><small>Llanta exterior</small><b>${fmt(ext, 0)} N</b><div class="sub">μ = ${fmt(muFz(ext), 3)} · F_y = ${fmt(FyMax(ext), 0)} N</div></div>
      <div class="ro"><small>Agarre total del eje</small><b>${fmt(tot, 0)} N</b><div class="sub">${fmt((tot / base - 1) * 100, 1)} % frente a ${fmt(base, 0)} N sin transferencia</div></div>
      <div class="ro"><small>Coulomb predice</small><b>${fmt(pD1 * AXLE, 0)} N</b><div class="sub">siempre igual: no ve la transferencia</div></div>`;
  }
  lt.addEventListener('input', update);
  update();
})();
