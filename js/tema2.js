/* Tema 2 — Simulación del salto: tiro parabólico con gravedad ajustable */
(() => {
  const cv = document.getElementById('jumpCanvas');
  const ctx = cv.getContext('2d');
  const $ = id => document.getElementById(id);
  const inV0 = $('v0'), inG = $('grav'), inM = $('fallMul'), inVx = $('vx');
  const G_REAL = 9.81, X0 = 0.8, CH_W = 0.6, CH_H = 1.0;

  let anim = null; // {start, t}

  function params() {
    return { v0: +inV0.value, g: +inG.value, m: +inM.value, vx: +inVx.value };
  }
  function jumpModel(v0, g, m, vx) {
    const H = v0 * v0 / (2 * g), th = v0 / g, td = Math.sqrt(2 * H / (m * g));
    return { H, th, td, tair: th + td, R: vx * (th + td),
      y: t => t <= th ? v0 * t - 0.5 * g * t * t : Math.max(0, H - 0.5 * m * g * (t - th) ** 2),
      x: t => X0 + vx * Math.min(t, th + td) };
  }

  function niceStep(span) {
    const raw = span / 6, p = Math.pow(10, Math.floor(Math.log10(raw)));
    const f = raw / p; return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p;
  }

  function draw() {
    const dpr = window.devicePixelRatio || 1;
    const w = cv.clientWidth, h = cv.clientHeight;
    if (w < 120 || h < 120) return;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const p = params();
    const J = jumpModel(p.v0, p.g, p.m, p.vx);
    const Gh = jumpModel(p.v0, G_REAL, 1, p.vx);
    const worldW = Math.max(J.R, Gh.R, 4) + X0 + 1.2;
    const worldH = Math.max(J.H, Gh.H, 1.5) + CH_H + 0.6;
    const padL = 46, padB = 34, padT = 50, padR = 16;
    const sc = Math.min((w - padL - padR) / worldW, (h - padB - padT) / worldH);
    const X = m => padL + m * sc, Y = m => h - padB - m * sc;

    // cuadrícula
    const st = niceStep(Math.max(worldW, worldH));
    ctx.font = "500 11px Montserrat"; ctx.fillStyle = '#6a7894'; ctx.strokeStyle = '#e3e9f4'; ctx.lineWidth = 1;
    for (let gx = 0; gx <= worldW + 1e-6; gx += st) {
      ctx.beginPath(); ctx.moveTo(X(gx), Y(0)); ctx.lineTo(X(gx), padT); ctx.stroke();
      ctx.fillText(fmt(gx, st < 1 ? 1 : 0), X(gx) - 6, h - padB + 15);
    }
    for (let gy = 0; gy <= worldH + 1e-6; gy += st) {
      ctx.beginPath(); ctx.moveTo(padL, Y(gy)); ctx.lineTo(w - padR, Y(gy)); ctx.stroke();
      if (gy > 0) ctx.fillText(fmt(gy, st < 1 ? 1 : 0), 8, Y(gy) + 4);
    }
    ctx.fillStyle = PAL.regalNavy; ctx.font = "600 11px Montserrat";
    ctx.fillText('x (m)', w - padR - 40, h - padB + 28);
    ctx.save(); ctx.translate(8, padT - 6); ctx.fillText('y (m)', 0, 0); ctx.restore();

    // suelo
    ctx.fillStyle = PAL.deepNavy; ctx.fillRect(padL, Y(0), w - padL - padR, 4);

    // trayectorias
    const path = (M, color, dash, lw) => {
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.setLineDash(dash);
      ctx.beginPath();
      const N = 120;
      for (let i = 0; i <= N; i++) {
        const t = M.tair * i / N; const px = X(M.x(t) + CH_W / 2), py = Y(M.y(t) + CH_H / 2);
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke(); ctx.restore();
    };
    path(Gh, '#7f9bd0', [7, 6], 2);
    path(J, PAL.deepPink, [], 3.5);

    // cima
    const ax = X(J.x(J.th) + CH_W / 2), ay = Y(J.H + CH_H / 2);
    ctx.fillStyle = PAL.rosewood; ctx.beginPath(); ctx.arc(ax, ay, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = PAL.rosewood; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, Y(CH_H / 2)); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = "700 12px Montserrat"; ctx.fillText(`H = ${fmt(J.H, 2)} m`, ax + 8, ay - 6);

    // personaje
    let t = anim ? anim.t : 0;
    const cx = J.x(t), cy = J.y(t);
    ctx.fillStyle = PAL.rosewood;
    const rx = X(cx), ry = Y(cy + CH_H), rw = CH_W * sc, rh = CH_H * sc;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(rx, ry, rw, rh, Math.min(6, rw / 4)) : ctx.rect(rx, ry, rw, rh); ctx.fill();
    ctx.fillStyle = '#fff';
    if (rw > 10) { ctx.fillRect(rx + rw * 0.55, ry + rh * 0.2, rw * 0.18, rh * 0.12); }

    // leyenda y reloj
    ctx.font = "600 11px Montserrat";
    const lx = Math.max(padL, w - 250);
    ctx.fillStyle = PAL.deepPink; ctx.fillRect(lx, 14, 18, 4);
    ctx.fillStyle = PAL.ink; ctx.fillText(`Su salto (g = ${fmt(p.g, 1)} m/s²)`, lx + 24, 19);
    ctx.strokeStyle = '#7f9bd0'; ctx.setLineDash([5, 4]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(lx, 34); ctx.lineTo(lx + 18, 34); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillText('Referencia: g = 9,81 m/s²', lx + 24, 38);
    if (anim) { ctx.font = "800 14px Montserrat"; ctx.fillStyle = PAL.rosewood; ctx.fillText(`t = ${fmt(t, 2)} s`, padL + 10, padT + 18); }
  }

  function readouts() {
    const p = params(), J = jumpModel(p.v0, p.g, p.m, p.vx), Gh = jumpModel(p.v0, G_REAL, 1, p.vx);
    $('v0Out').textContent = `${fmt(p.v0, 1)} m/s`;
    $('gOut').textContent = `${fmt(p.g, 1)} m/s² (${fmt(p.g / G_REAL, 1)} g)`;
    $('mOut').textContent = `× ${fmt(p.m, 2)}`;
    $('vxOut').textContent = `${fmt(p.vx, 1)} m/s`;
    $('jumpReadout').innerHTML = `
      <div class="ro"><small>Altura máxima</small><b>${fmt(J.H, 2)} m</b><div class="sub">H = v₀²/2g · ${fmt(J.H / 1, 1)} alturas del personaje</div></div>
      <div class="ro"><small>Tiempo hasta la cima</small><b>${fmt(J.th, 3)} s</b><div class="sub">t_h = v₀/g</div></div>
      <div class="ro"><small>Tiempo en el aire</small><b>${fmt(J.tair, 3)} s</b><div class="sub">con g real: ${fmt(Gh.tair, 2)} s</div></div>
      <div class="ro"><small>Alcance horizontal</small><b>${fmt(J.R, 2)} m</b><div class="sub">x = vₓ · t_aire</div></div>`;
  }

  function refresh() { readouts(); if (!anim) draw(); }
  [inV0, inG, inM, inVx].forEach(i => i.addEventListener('input', () => { anim = null; refresh(); }));

  function jump() {
    const p = params(), J = jumpModel(p.v0, p.g, p.m, p.vx);
    const start = performance.now();
    anim = { t: 0 };
    const loop = now => {
      if (!anim) return;
      anim.t = Math.min((now - start) / 1000, J.tair);
      draw();
      if (anim.t < J.tair) requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  $('jumpBtn').addEventListener('click', jump);
  cv.addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); jump(); } });
  cv.addEventListener('click', () => cv.focus());

  const presets = {
    real: { v0: 4.4, g: 9.81, m: 1, vx: 3 },
    plat: { v0: 17.1, g: 49, m: 1.8, vx: 6 },
    celeste: { v0: 105 * 0.145, g: 900 * 0.145, m: 1, vx: 90 * 0.145 },
    luna: { v0: 4.4, g: 1.62, m: 1, vx: 3 }
  };
  document.querySelectorAll('[data-preset]').forEach(b => b.addEventListener('click', () => {
    const p = presets[b.dataset.preset];
    inV0.value = p.v0; inG.value = p.g; inM.value = p.m; inVx.value = p.vx;
    anim = null; refresh(); jump();
  }));

  // Modo diseñador
  const dH = $('dH'), dT = $('dT');
  function design() {
    const H = +dH.value, th = +dT.value, g = 2 * H / (th * th), v0 = 2 * H / th;
    $('dHOut').textContent = `${fmt(H, 1)} m`; $('dTOut').textContent = `${fmt(th, 2)} s`;
    $('designOut').textContent = `→ g = ${fmt(g, 1)} m/s² (${fmt(g / G_REAL, 1)} g) · v₀ = ${fmt(v0, 2)} m/s`;
    return { g, v0 };
  }
  [dH, dT].forEach(i => i.addEventListener('input', design));
  $('applyDesign').addEventListener('click', () => {
    const d = design();
    inG.value = Math.min(140, d.g); inV0.value = Math.min(20, d.v0); inM.value = 1;
    anim = null; refresh(); jump();
  });

  design(); refresh();
  window.addEventListener('resize', () => draw());
  if (document.fonts) document.fonts.ready.then(draw);
})();
