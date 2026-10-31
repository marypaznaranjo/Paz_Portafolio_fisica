/* Tema 6 — Frenado regenerativo: balance de energía a lo largo de un ciclo de manejo oficial (EPA) */
(() => {
  const $ = id => document.getElementById(id);
  if (!$('t6Power') || typeof CICLOS === 'undefined') return;

  // Parámetros fijos del modelo (ilustrativos, del orden de un compacto eléctrico; se declaran en la página)
  const G = 9.81, RHO = 1.2, CRR = 0.009, CDA = 0.65, ETA_T = 0.90, V_CUT = 4.0;
  const NOMBRE = { udds: 'UDDS (ciudad)', hwfet: 'HWFET (carretera)' };

  const inCyc = $('t6Cycle'), inM = $('t6Mass'), inEta = $('t6Eta'), inP = $('t6Pmax');

  /* Integra el ciclo segundo a segundo (Δt = 1 s).
     P_rueda = m·a·v + (m·g·Crr + ½·ρ·CdA·v²)·v
     P_rueda > 0 → tracción (la batería entrega P/η_t)
     P_rueda < 0 → frenado: el motor recupera min(P_freno·f(v), P_máx) y la batería recibe η_r de eso;
                   el resto lo disipan los frenos de fricción. */
  function simular(v, m, etaR, pMax) {
    const n = v.length;
    const serie = { t: [], vKmh: [], pTrac: [], pRec: [], pFric: [], eBat: [], eRec: [], eNet: [], eFric: [] };
    const E = { bat: 0, rec: 0, conv: 0, fric: 0, kin: 0, res: 0, dist: 0 };
    for (let k = 0; k < n - 1; k++) {
      const v0 = v[k], v1 = v[k + 1], vm = (v0 + v1) / 2, a = v1 - v0;
      E.dist += vm;
      let pTrac = 0, pRecBat = 0, pFric = 0;
      if (vm > 0) {
        const pRes = (m * G * CRR + 0.5 * RHO * CDA * vm * vm) * vm;  // potencia contra rodadura y aire
        const pKin = m * a * vm;                                     // dK/dt
        const pWheel = pKin + pRes;
        if (a < 0) { E.kin += -pKin; E.res += Math.min(pRes, -pKin); }
        if (pWheel >= 0) {
          pTrac = pWheel / ETA_T; E.bat += pTrac;
        } else {
          const pBrake = -pWheel;
          const pRegen = Math.min(pBrake * Math.min(1, vm / V_CUT), pMax);
          pRecBat = etaR * pRegen; pFric = pBrake - pRegen;
          E.rec += pRecBat; E.conv += pRegen - pRecBat; E.fric += pFric;
        }
      }
      serie.t.push(k + 0.5); serie.vKmh.push(vm * 3.6);
      serie.pTrac.push(pTrac / 1000); serie.pRec.push(-pRecBat / 1000); serie.pFric.push(-pFric / 1000);
      serie.eBat.push(E.bat / 3600); serie.eRec.push(E.rec / 3600);
      serie.eNet.push((E.bat - E.rec) / 3600); serie.eFric.push(E.fric / 3600);
    }
    return { serie, E };
  }

  const xy = (xs, ys) => xs.map((x, i) => ({ x, y: ys[i] }));
  const commonX = max => ({ type: 'linear', min: 0, max, title: axisTitle('Tiempo, t (s)'), grid: { color: PAL.grid } });

  // ---- Gráfica 1: flujo de potencia y velocidad ----
  const pChart = new Chart($('t6Power'), {
    type: 'scatter',
    data: { datasets: [
      { label: 'Tracción: batería → ruedas (kW)', data: [], showLine: true, borderColor: PAL.regalNavy, backgroundColor: 'rgba(1,51,110,0.18)', fill: 'origin', borderWidth: 1.2, pointRadius: 0, yAxisID: 'y' },
      { label: 'Recuperada: ruedas → batería (kW)', data: [], showLine: true, borderColor: PAL.deepPink, backgroundColor: 'rgba(243,93,156,0.35)', fill: 'origin', borderWidth: 1.2, pointRadius: 0, yAxisID: 'y' },
      { label: 'Disipada en frenos de fricción (kW)', data: [], showLine: true, borderColor: PAL.rosewood, backgroundColor: 'rgba(200,0,86,0.55)', fill: 'origin', borderWidth: 1.2, pointRadius: 0, yAxisID: 'y' },
      { label: 'Velocidad (km/h)', data: [], showLine: true, borderColor: '#7f9bd0', borderDash: [5, 4], borderWidth: 1.5, pointRadius: 0, yAxisID: 'y2' }
    ] },
    options: {
      locale: 'es-CR',
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      scales: {
        x: commonX(1370),
        y: { min: -60, max: 60, title: axisTitle('Potencia, P (kW)'), grid: { color: c => c.tick.value === 0 ? PAL.deepNavy : PAL.grid } },
        y2: { position: 'right', min: 0, max: 120, title: axisTitle('Velocidad, v (km/h)'), grid: { display: false } }
      },
      plugins: { legend: { position: 'top' },
        tooltip: { callbacks: { title: i => `t = ${fmt(i[0].parsed.x, 1)} s`,
          label: i => `${i.dataset.label.split(' (')[0]}: ${fmt(Math.abs(i.parsed.y), 1)} ${i.datasetIndex === 3 ? 'km/h' : 'kW'}` } } }
    }
  });

  // ---- Gráfica 2: energía acumulada ----
  const eChart = new Chart($('t6Energy'), {
    type: 'scatter',
    data: { datasets: [
      { label: 'Entregada por la batería para tracción', data: [], showLine: true, borderColor: PAL.regalNavy, borderWidth: 2.5, pointRadius: 0 },
      { label: 'Devuelta a la batería (regeneración)', data: [], showLine: true, borderColor: PAL.deepPink, borderWidth: 2.5, pointRadius: 0 },
      { label: 'Consumo neto = entregada − devuelta', data: [], showLine: true, borderColor: PAL.deepNavy, borderDash: [7, 5], borderWidth: 2, pointRadius: 0 },
      { label: 'Calor en frenos de fricción', data: [], showLine: true, borderColor: PAL.rosewood, borderWidth: 2, pointRadius: 0 }
    ] },
    options: {
      locale: 'es-CR',
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      scales: { x: commonX(1370), y: { min: 0, title: axisTitle('Energía acumulada, E (Wh)'), grid: { color: PAL.grid } } },
      plugins: { legend: { position: 'top' },
        tooltip: { callbacks: { title: i => `t = ${fmt(i[0].parsed.x, 0)} s`, label: i => `${i.dataset.label}: ${fmt(i.parsed.y, 0)} Wh` } } }
    }
  });

  // ---- Gráfica 3: ¿a dónde va la energía cinética de los frenados? (ambos ciclos) ----
  const bChart = new Chart($('t6Balance'), {
    type: 'bar',
    data: { labels: [NOMBRE.udds, NOMBRE.hwfet], datasets: [
      { label: 'Vence rodadura y aire', data: [], backgroundColor: '#9fb3d6' },
      { label: 'Vuelve a la batería', data: [], backgroundColor: PAL.deepPink },
      { label: 'Pérdidas del motor/inversor', data: [], backgroundColor: PAL.babyPink },
      { label: 'Calor en frenos de fricción', data: [], backgroundColor: PAL.rosewood }
    ] },
    options: {
      locale: 'es-CR',
      indexAxis: 'y',
      scales: {
        x: { stacked: true, min: 0, max: 100, title: axisTitle('Porcentaje de la energía cinética liberada al desacelerar (%)'), grid: { color: PAL.grid } },
        y: { stacked: true, grid: { display: false } }
      },
      plugins: { legend: { position: 'top' },
        tooltip: { callbacks: { label: i => `${i.dataset.label}: ${fmt(i.parsed.x, 1)} %` } } }
    }
  });

  function update() {
    const cyc = inCyc.value, m = +inM.value, eta = +inEta.value, pMax = +inP.value * 1000;
    $('t6MassOut').textContent = `${fmt(m, 0)} kg`;
    $('t6EtaOut').textContent = `${fmt(eta * 100, 0)} %`;
    $('t6PmaxOut').textContent = pMax === 0 ? 'sin regeneración' : `${fmt(pMax / 1000, 0)} kW`;

    const { serie: s, E } = simular(CICLOS[cyc], m, eta, pMax);
    const tMax = CICLOS[cyc].length - 1;
    pChart.data.datasets[0].data = xy(s.t, s.pTrac);
    pChart.data.datasets[1].data = xy(s.t, s.pRec);
    pChart.data.datasets[2].data = xy(s.t, s.pFric);
    pChart.data.datasets[3].data = xy(s.t, s.vKmh);
    const pk = Math.max(...s.pTrac, ...s.pRec.map(Math.abs), ...s.pFric.map(Math.abs));
    const lim = Math.max(20, Math.ceil(pk / 10) * 10);
    pChart.options.scales.y.min = -lim; pChart.options.scales.y.max = lim;
    pChart.options.scales.x.max = tMax;
    pChart.update('none');

    eChart.data.datasets[0].data = xy(s.t, s.eBat);
    eChart.data.datasets[1].data = xy(s.t, s.eRec);
    eChart.data.datasets[2].data = xy(s.t, s.eNet);
    eChart.data.datasets[3].data = xy(s.t, s.eFric);
    eChart.options.scales.x.max = tMax;
    eChart.update('none');

    // Balance de ambos ciclos con los mismos parámetros
    const parts = ['udds', 'hwfet'].map(k => {
      const R = simular(CICLOS[k], m, eta, pMax).E;
      return [R.res, R.rec, R.conv, R.fric].map(x => 100 * x / R.kin);
    });
    bChart.data.datasets.forEach((d, j) => d.data = parts.map(p => p[j]));
    bChart.update('none');

    const km = E.dist / 1000, wh = x => x / 3600;
    const ahorro = 100 * E.rec / E.bat;
    $('t6Readout').innerHTML = `
      <div class="ro"><small>Energía cinética liberada al frenar</small><b>${fmt(wh(E.kin), 0)} Wh</b><div class="sub">suma de ½m(v₁² − v₂²) en ${NOMBRE[cyc]} · ${fmt(km, 1)} km</div></div>
      <div class="ro"><small>Recuperada en la batería</small><b>${fmt(wh(E.rec), 0)} Wh</b><div class="sub">${fmt(100 * E.rec / E.kin, 1)} % de esa energía cinética</div></div>
      <div class="ro"><small>Disipada como calor</small><b>${fmt(wh(E.fric + E.conv), 0)} Wh</b><div class="sub">frenos ${fmt(wh(E.fric), 0)} Wh · motor/inversor ${fmt(wh(E.conv), 0)} Wh</div></div>
      <div class="ro"><small>Consumo neto</small><b>${fmt(wh(E.bat - E.rec) / km, 0)} Wh/km</b><div class="sub">sin regeneración: ${fmt(wh(E.bat) / km, 0)} Wh/km (−${fmt(ahorro, 1)} %)</div></div>`;
  }

  [inCyc, inM, inEta, inP].forEach(el => el.addEventListener('input', update));
  inCyc.addEventListener('change', update);
  update();
})();
