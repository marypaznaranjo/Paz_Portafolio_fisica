/* Tema 8 — Calculadora complementaria: maniobra con una rueda de reacción y tiempo hasta la saturación */
(() => {
  const $ = id => document.getElementById(id);
  if (!$('rwI')) return;

  // Rueda Honeywell HR16 según Basilisk (simIncludeRW.py): Ω_máx = 6000 rpm, u_máx = 0,2 N·m, h_máx = 50, 75 o 100 N·m·s
  const OMEGA_MAX = 6000 * 2 * Math.PI / 60;   // rad/s
  const U_MAX = 0.2;                           // N·m

  const inI = $('rwI'), inTh = $('rwTheta'), inTau = $('rwTau'), inH = $('rwH');

  function tiempo(s) {
    if (s < 120) return `${fmt(s, 0)} s`;
    if (s < 7200) return `${fmt(s / 60, 1)} min`;
    if (s < 3 * 86400) return `${fmt(s / 3600, 1)} h`;
    return `${fmt(s / 86400, 1)} días`;
  }

  function update() {
    const I = +inI.value, thDeg = +inTh.value, tauExt = +inTau.value * 1e-6, hMax = +inH.value;
    const th = thDeg * Math.PI / 180;
    const Js = hMax / OMEGA_MAX;                     // J_s = h_máx / Ω_máx (como en Basilisk)

    $('rwIOut').textContent = `${fmt(I, 0)} kg·m²`;
    $('rwThetaOut').textContent = `${fmt(thDeg, 0)}°`;
    $('rwTauOut').textContent = `${fmt(tauExt * 1e6, 0)} µN·m`;

    // Maniobra de reposo a reposo con torque máximo (acelera la mitad, frena la otra mitad)
    let t, wPico, hPico, limitada = false;
    const hBang = Math.sqrt(th * U_MAX * I);         // h necesaria si solo limita el torque
    if (hBang <= hMax) {
      t = 2 * Math.sqrt(th * I / U_MAX);
      hPico = hBang;
    } else {                                         // la rueda llega a h_máx: tramo a velocidad constante
      limitada = true;
      hPico = hMax;
      t = th * I / hMax + hMax / U_MAX;
    }
    wPico = hPico / I;
    const rpmRueda = hPico / Js * 60 / (2 * Math.PI);
    const vueltas = (I / Js) * th / (2 * Math.PI);   // giro relativo de la rueda: J_s·Δθ_rueda = −I·Δθ_sat
    const tSat = hMax / tauExt;

    $('rwReadout').innerHTML = `
      <div class="ro"><small>Duración de la maniobra</small><b>${tiempo(t)}</b><div class="sub">${limitada ? 'limitada por la capacidad h_máx de la rueda' : 't = 2√(θI/τ_máx), con τ_máx = 0,2 N·m'}</div></div>
      <div class="ro"><small>Giro máximo del satélite</small><b>${fmt(wPico * 180 / Math.PI, 2)} °/s</b><div class="sub">ω = h/I · L de la rueda = ${fmt(hPico, 1)} N·m·s</div></div>
      <div class="ro"><small>Velocidad de la rueda en el pico</small><b>${fmt(rpmRueda, 0)} rpm</b><div class="sub">de ${fmt(6000, 0)} rpm posibles · J_s = ${fmt(Js, 4)} kg·m²</div></div>
      <div class="ro"><small>Vueltas de la rueda para girar ${fmt(thDeg, 0)}°</small><b>${fmt(vueltas, 0)}</b><div class="sub">J_s Δθ_rueda = −I Δθ_satélite</div></div>
      <div class="ro" style="grid-column:1/-1"><small>Tiempo hasta saturar con la perturbación externa (sin descargar)</small><b style="color:${tSat < 86400 ? '#ff97cc' : '#7be3b0'}">${tiempo(tSat)}</b><div class="sub">t_sat = h_máx / τ_ext = ${fmt(hMax, 0)} N·m·s ÷ ${fmt(tauExt * 1e6, 0)} µN·m. Después hay que descargar momento con propulsores o magnetotorques.</div></div>`;
  }

  [inI, inTh, inTau, inH].forEach(el => el.addEventListener('input', update));
  inH.addEventListener('change', update);
  update();
})();
