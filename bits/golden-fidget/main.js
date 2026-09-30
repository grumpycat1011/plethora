window.plethoraBit = {
  async init(ctx) {
    const canvas = ctx.createCanvas2D({ alpha: false, maxDpr: 2, coordinateSpace: "css", layer: "content" });
    const g = canvas.getContext("2d");
    const input = ctx.input.track(canvas);

    const TAU = Math.PI * 2;
    const PHI = (1 + Math.sqrt(5)) / 2;
    const GOLDEN = 2 - PHI; // golden angle as a fraction of a turn (~0.381966)
    const GOLDEN_DEG = 360 * GOLDEN;
    const FIB = [1, 1];
    while (FIB.length < 30) FIB.push(FIB[FIB.length - 1] + FIB[FIB.length - 2]);

    function tune(id, fallback) {
      try {
        const v = ctx.tune.get(id);
        return v === undefined || v === null ? fallback : v;
      } catch (e) {
        return fallback;
      }
    }

    // ---------- haptics ----------
    let lastHap = 0;
    function hap(kind) {
      if (!tune("haptics_on", true)) return;
      if (ctx.capabilities && ctx.capabilities.haptics === false) return;
      const now = performance.now();
      if (now - lastHap < 38) return;
      lastHap = now;
      try { ctx.platform.haptic(kind); } catch (e) { /* haptics unavailable */ }
    }

    let started = false;
    let lastInteract = 0;
    function touched(type) {
      if (!started) {
        started = true;
        ctx.platform.start();
      }
      const now = performance.now();
      if (now - lastInteract > 600) {
        lastInteract = now;
        ctx.platform.interact({ type, mode: MODES[mode].id });
      }
    }

    function ripple(x, y, color) {
      try { ctx.fx.ripple({ x, y, color }); } catch (e) { /* fx optional */ }
    }

    // ---------- layout ----------
    let W = ctx.width;
    let H = ctx.height;
    let safeTop = (ctx.safeArea && ctx.safeArea.top) || 0;
    ctx.onResize(info => {
      W = info.width;
      H = info.height;
      safeTop = (info.safeArea && info.safeArea.top) || 0;
    }, { immediate: true });

    const MODES = [
      { id: "sunflower", icon: "\u03c6", name: "Sunflower" },
      { id: "table", icon: "\u00d7", name: "Times" },
      { id: "tiles", icon: "\u25a1", name: "Fibonacci" }
    ];
    let mode = 0;
    let modeFade = 0;

    function pillRects() {
      const pw = Math.min(118, (W - 40) / 3);
      const ph = 36;
      const gap = 8;
      const total = pw * 3 + gap * 2;
      const x0 = (W - total) / 2;
      const y = safeTop + 14;
      return MODES.map((m, i) => ({ x: x0 + i * (pw + gap), y, w: pw, h: ph }));
    }
    function pillHit(x, y) {
      const rects = pillRects();
      for (let i = 0; i < rects.length; i++) {
        const r = rects[i];
        if (x >= r.x - 4 && x <= r.x + r.w + 4 && y >= r.y - 8 && y <= r.y + r.h + 8) return i;
      }
      return -1;
    }
    function inHud(y) {
      return y < safeTop + 64;
    }

    let hueDrift = 0;

    // =====================================================================
    // Toy 1: Sunflower phyllotaxis. Divergence angle scrubbed around the
    // golden angle; detents at Fibonacci ratio convergents F(n)/F(n+2).
    // =====================================================================
    const detents = [];
    for (let n = 1; n <= 12; n++) detents.push({ p: FIB[n - 1], q: FIB[n + 1], v: FIB[n - 1] / FIB[n + 1] });
    const sun = {
      u: 0,          // dial position; frac = GOLDEN + K * u^3
      uVel: 0,
      rot: 0,
      hue: 20,
      waves: [],
      idle: 0,
      lastFrac: GOLDEN
    };
    const SUN_K = 0.13;
    function sunFrac() {
      return GOLDEN + SUN_K * sun.u * sun.u * sun.u;
    }
    function nearestDetent(frac, maxQ) {
      let best = null;
      let bestD = Infinity;
      for (const d of detents) {
        if (d.q > maxQ) continue;
        const dist = Math.abs(d.v - frac);
        if (dist < bestD) { bestD = dist; best = d; }
      }
      return best;
    }
    function sunUpdate(dt, dragDx) {
      if (dragDx !== null) {
        const du = dragDx / Math.max(260, W * 1.25);
        sun.u += du;
        sun.uVel = sun.uVel * 0.6 + (du / Math.max(dt, 0.001)) * 0.4;
        sun.idle = 0;
      } else {
        sun.idle += dt;
        sun.u += sun.uVel * dt;
        sun.uVel *= Math.pow(0.04, dt);
        // soft magnetic pull to the golden angle when close and resting
        if (Math.abs(sun.uVel) < 0.05 && Math.abs(sun.u) < 0.09) {
          sun.u += (0 - sun.u) * Math.min(1, dt * 4);
        }
      }
      if (sun.u > 1) { sun.u = 1; sun.uVel = 0; }
      if (sun.u < -1) { sun.u = -1; sun.uVel = 0; }

      const frac = sunFrac();
      const a = sun.lastFrac;
      const b = frac;
      if (a !== b) {
        const lo = Math.min(a, b);
        const hi = Math.max(a, b);
        if (GOLDEN > lo && GOLDEN <= hi) {
          hap("medium");
        } else {
          for (const d of detents) {
            if (d.v > lo && d.v <= hi) { hap("light"); break; }
          }
        }
      }
      sun.lastFrac = frac;
      sun.rot += dt * 0.12;
      for (const w of sun.waves) w.t += dt;
      sun.waves = sun.waves.filter(w => w.t < 2.2);
    }
    function sunTap(x, y) {
      sun.waves.push({ t: 0 });
      sun.hue = (sun.hue + GOLDEN_DEG) % 360;
      hap("medium");
      ripple(x, y, "hsl(" + sun.hue.toFixed(0) + ",95%,62%)");
    }
    function sunDraw() {
      const n = Math.round(tune("seed_count", 800));
      const cx = W / 2;
      const cy = safeTop + 64 + (H - safeTop - 64) * 0.47;
      const maxR = Math.min(W * 0.46, (H - safeTop - 64) * 0.42);
      const c = maxR / Math.sqrt(n);
      const frac = sunFrac();
      const arms = nearestDetent(frac, 55);
      const q = arms ? arms.q : 21;
      const waveSpeed = maxR / 1.1;
      g.save();
      g.translate(cx, cy);
      for (let i = 1; i <= n; i++) {
        const r = c * Math.sqrt(i);
        const ang = i * frac * TAU + sun.rot;
        let boost = 0;
        for (const w of sun.waves) {
          const d = (r - w.t * waveSpeed) / (maxR * 0.07);
          boost += Math.exp(-d * d) * (1 - w.t / 2.2);
        }
        const size = c * (0.28 + 0.2 * Math.sqrt(i / n)) * (1 + 0.9 * boost);
        const hue = (sun.hue + hueDrift + ((i % q) / q) * 300) % 360;
        const light = 55 + 18 * Math.min(1, boost);
        g.fillStyle = "hsl(" + hue.toFixed(1) + ",96%," + light.toFixed(0) + "%)";
        g.beginPath();
        g.arc(Math.cos(ang) * r, Math.sin(ang) * r, Math.max(0.8, size), 0, TAU);
        g.fill();
      }
      g.restore();

      const exact = Math.abs(sun.u) < 0.004;
      const label = exact ? "golden angle  137.508\u00b0" : (frac * 360).toFixed(2) + "\u00b0  \u2248  " + arms.p + "/" + arms.q + " turn";
      hudText(label, exact ? "\u03c6 spirals \u2014 no two seeds ever line up" : q + " spiral arms \u00b7 drag to twist");
    }

    // =====================================================================
    // Toy 2: Modular times-table circle. Point i links to point k-i mod n.
    // =====================================================================
    const table = { k: 2, kVel: 0, target: null, idle: 0, lastK: 2, hue: 200 };
    const FIB_K = [2, 3, 5, 8, 13, 21, 34, 55, 89];
    function tableUpdate(dt, dragDx) {
      if (dragDx !== null) {
        const dk = dragDx * (6 / Math.max(300, W));
        table.k += dk;
        table.kVel = table.kVel * 0.6 + (dk / Math.max(dt, 0.001)) * 0.4;
        table.target = null;
        table.idle = 0;
      } else {
        table.idle += dt;
        if (table.target !== null) {
          table.k += (table.target - table.k) * Math.min(1, dt * 5);
          if (Math.abs(table.target - table.k) < 0.002) { table.k = table.target; table.target = null; }
        } else {
          table.k += table.kVel * dt;
          table.kVel *= Math.pow(0.05, dt);
          const nearest = Math.round(table.k);
          if (table.idle < 3.5 && Math.abs(table.kVel) < 0.4 && Math.abs(nearest - table.k) < 0.12) {
            table.k += (nearest - table.k) * Math.min(1, dt * 6);
          } else if (table.idle >= 3.5 && tune("auto_drift", true)) {
            table.k += dt * 0.06;
          }
        }
      }
      if (table.k < 0) table.k += 100;
      if (table.k >= 100) table.k -= 100;
      const a = table.lastK;
      const b = table.k;
      if (Math.abs(a - b) < 50 && Math.floor(a) !== Math.floor(b)) {
        const crossed = Math.max(Math.floor(a), Math.floor(b));
        hap(FIB_K.indexOf(crossed) >= 0 ? "medium" : "light");
      }
      table.lastK = b;
    }
    function tableTap(x, y) {
      const from = table.target !== null ? table.target : table.k;
      let next = FIB_K.find(f => f > from + 0.5);
      if (next === undefined) next = 2;
      table.target = next;
      table.kVel = 0;
      table.idle = 0;
      table.hue = (table.hue + GOLDEN_DEG) % 360;
      hap("success");
      ripple(x, y, "hsl(" + table.hue.toFixed(0) + ",95%,62%)");
    }
    const CURVE_NAMES = { 2: "cardioid", 3: "nephroid", 4: "3-cusp epicycloid", 5: "4-cusp epicycloid", 21: "20 petals", 34: "33 petals", 51: "a wild echo", 99: "a mirror" };
    function tableDraw() {
      const n = Math.round(tune("table_points", 240));
      const cx = W / 2;
      const cy = safeTop + 64 + (H - safeTop - 64) * 0.47;
      const R = Math.min(W * 0.44, (H - safeTop - 64) * 0.4);
      g.save();
      g.globalCompositeOperation = "lighter";
      g.lineWidth = 1.15;
      for (let i = 0; i < n; i++) {
        const a1 = (i / n) * TAU - Math.PI / 2;
        const a2 = ((table.k * i) / n) * TAU - Math.PI / 2;
        const hue = (table.hue + hueDrift + (i / n) * 300) % 360;
        g.strokeStyle = "hsla(" + hue.toFixed(1) + ",100%,60%,0.55)";
        g.beginPath();
        g.moveTo(cx + Math.cos(a1) * R, cy + Math.sin(a1) * R);
        g.lineTo(cx + Math.cos(a2) * R, cy + Math.sin(a2) * R);
        g.stroke();
      }
      g.restore();
      g.strokeStyle = "rgba(255,255,255,0.18)";
      g.lineWidth = 1.5;
      g.beginPath();
      g.arc(cx, cy, R + 4, 0, TAU);
      g.stroke();

      const rounded = Math.round(table.k);
      const onInt = Math.abs(rounded - table.k) < 0.01;
      const name = onInt && CURVE_NAMES[rounded] ? " \u00b7 " + CURVE_NAMES[rounded] : "";
      hudText("\u00d7" + (onInt ? String(rounded) : table.k.toFixed(2)) + name, "drag to morph \u00b7 tap for the next Fibonacci \u00d7");
    }

    // =====================================================================
    // Toy 3: Fibonacci tiling with the golden spiral.
    // =====================================================================
    const MAX_TILES = 22;
    const tiles = {
      list: [],
      box: null,
      cam: { x: 0.5, y: 0.5, s: 80 },
      rot: 0,
      rotVel: 0,
      holdAcc: 0,
      resetFade: 0
    };
    function tilesReset() {
      tiles.list = [];
      tiles.box = null;
      tilesAdd(true);
    }
    function tilesAdd(quiet) {
      const n = tiles.list.length;
      let sq;
      if (n === 0) {
        sq = { x: 0, y: 0, s: 1, cx: 1, cy: 1, a0: Math.PI, dir: 3 };
        tiles.box = { x0: 0, y0: 0, x1: 1, y1: 1 };
      } else {
        const b = tiles.box;
        const dir = (n - 1) % 4;
        if (dir === 0) { const s = b.y1 - b.y0; sq = { x: b.x1, y: b.y0, s, cx: b.x1, cy: b.y1, a0: -Math.PI / 2 }; b.x1 += s; }
        else if (dir === 1) { const s = b.x1 - b.x0; sq = { x: b.x0, y: b.y1, s, cx: b.x0, cy: b.y1, a0: 0 }; b.y1 += s; }
        else if (dir === 2) { const s = b.y1 - b.y0; sq = { x: b.x0 - s, y: b.y0, s, cx: b.x0, cy: b.y0, a0: Math.PI / 2 }; b.x0 -= s; }
        else { const s = b.x1 - b.x0; sq = { x: b.x0, y: b.y0 - s, s, cx: b.x1, cy: b.y0, a0: Math.PI }; b.y0 -= s; }
        sq.dir = dir;
      }
      sq.n = n;
      sq.age = 0;
      sq.hue = (n * GOLDEN_DEG + 10) % 360;
      tiles.list.push(sq);
      if (!quiet) {
        hap(n < 6 ? "light" : n < 13 ? "medium" : "heavy");
      }
    }
    function tilesStep(x, y) {
      if (tiles.list.length >= MAX_TILES) {
        tiles.resetFade = 1;
        hap("success");
        tilesReset();
        return;
      }
      tilesAdd(false);
      if (x !== undefined) {
        const last = tiles.list[tiles.list.length - 1];
        ripple(x, y, "hsl(" + last.hue.toFixed(0) + ",95%,62%)");
      }
    }
    tilesReset();
    tilesAdd(true);
    function tilesUpdate(dt, drag) {
      for (const t of tiles.list) t.age += dt;
      const b = tiles.box;
      const bw = b.x1 - b.x0;
      const bh = b.y1 - b.y0;
      const availH = H - safeTop - 64 - Math.max(80, (ctx.safeArea && ctx.safeArea.bottom) || 0);
      const diag = Math.sqrt(bw * bw + bh * bh);
      const targetS = Math.min(W * 0.9, availH * 0.9) / diag;
      const tx = (b.x0 + b.x1) / 2;
      const ty = (b.y0 + b.y1) / 2;
      const k = Math.min(1, dt * 4.5);
      // zoom in log space so big jumps feel smooth
      tiles.cam.s = Math.exp(Math.log(tiles.cam.s) + (Math.log(targetS) - Math.log(tiles.cam.s)) * k);
      tiles.cam.x += (tx - tiles.cam.x) * k;
      tiles.cam.y += (ty - tiles.cam.y) * k;

      if (drag) {
        tiles.rot += drag.dAngle;
        tiles.rotVel = tiles.rotVel * 0.6 + (drag.dAngle / Math.max(dt, 0.001)) * 0.4;
      } else {
        tiles.rot += tiles.rotVel * dt;
        tiles.rotVel *= Math.pow(0.08, dt);
        tiles.rot += dt * 0.05;
      }
      if (tiles.resetFade > 0) tiles.resetFade = Math.max(0, tiles.resetFade - dt * 1.8);
    }
    function tilesDraw() {
      const cx = W / 2;
      const cy = safeTop + 64 + (H - safeTop - 64 - 40) * 0.5;
      const s = tiles.cam.s;
      g.save();
      g.translate(cx, cy);
      g.rotate(tiles.rot);
      g.scale(s, -s);
      g.translate(-tiles.cam.x, -tiles.cam.y);
      for (const t of tiles.list) {
        const p = Math.min(1, t.age / 0.35);
        const e = 1 + 2.2 * Math.pow(p - 1, 3) + 1.2 * Math.pow(p - 1, 2); // ease-out-back
        const pop = Math.max(0.001, e);
        const mx = t.x + t.s / 2;
        const my = t.y + t.s / 2;
        const hs = (t.s / 2) * pop;
        const hue = (t.hue + hueDrift) % 360;
        g.fillStyle = "hsl(" + hue.toFixed(1) + ",92%,58%)";
        g.fillRect(mx - hs, my - hs, hs * 2, hs * 2);
        g.lineWidth = 2.2 / s;
        g.strokeStyle = "#0b0720";
        g.strokeRect(mx - hs, my - hs, hs * 2, hs * 2);
      }
      // golden spiral
      g.lineWidth = 3.2 / s;
      g.strokeStyle = "rgba(255,255,255,0.92)";
      g.lineCap = "round";
      g.beginPath();
      for (const t of tiles.list) {
        const p = Math.min(1, t.age / 0.35);
        g.moveTo(t.cx + Math.cos(t.a0) * t.s, t.cy + Math.sin(t.a0) * t.s);
        g.arc(t.cx, t.cy, t.s, t.a0, t.a0 + (Math.PI / 2) * p);
      }
      g.stroke();
      g.restore();

      // numbers (drawn unrotated-text for legibility)
      g.save();
      g.fillStyle = "rgba(11,7,32,0.8)";
      g.textAlign = "center";
      g.textBaseline = "middle";
      const cos = Math.cos(tiles.rot);
      const sin = Math.sin(tiles.rot);
      for (const t of tiles.list) {
        const px = t.s * s;
        if (px < 28 || t.age < 0.2) continue;
        const wx = (t.x + t.s / 2 - tiles.cam.x) * s;
        const wy = -(t.y + t.s / 2 - tiles.cam.y) * s;
        const sx = cx + wx * cos - wy * sin;
        const sy = cy + wx * sin + wy * cos;
        g.font = "700 " + Math.min(64, px * 0.32).toFixed(0) + "px system-ui, sans-serif";
        g.fillText(String(FIB[t.n]), sx, sy);
      }
      g.restore();

      const n = tiles.list.length;
      const ratio = n > 2 ? FIB[n - 1] / FIB[n - 2] : 1;
      hudText(FIB[n - 1] + " / " + FIB[n - 2] + " = " + ratio.toFixed(6), n >= MAX_TILES ? "tap to begin again" : "tap or hold to grow \u00b7 drag to spin \u2192 \u03c6 " + PHI.toFixed(6));
      if (tiles.resetFade > 0) {
        g.fillStyle = "rgba(255,255,255," + (tiles.resetFade * 0.5).toFixed(3) + ")";
        g.fillRect(0, 0, W, H);
      }
    }

    // ---------- shared drawing ----------
    let hudLines = ["", ""];
    function hudText(a, b) { hudLines = [a, b]; }

    function drawBackground() {
      const grad = g.createRadialGradient(W / 2, H * 0.5, 0, W / 2, H * 0.5, Math.max(W, H) * 0.75);
      const h = (hueDrift * 0.5 + 250) % 360;
      grad.addColorStop(0, "hsl(" + h.toFixed(0) + ",55%,11%)");
      grad.addColorStop(1, "hsl(" + ((h + 40) % 360).toFixed(0) + ",60%,4%)");
      g.fillStyle = grad;
      g.fillRect(0, 0, W, H);
    }
    function drawHud() {
      const rects = pillRects();
      g.textAlign = "center";
      g.textBaseline = "middle";
      rects.forEach((r, i) => {
        const on = i === mode;
        const hue = (i * 120 + hueDrift + 300) % 360;
        g.fillStyle = on ? "hsl(" + hue.toFixed(0) + ",95%,62%)" : "rgba(255,255,255,0.08)";
        g.beginPath();
        if (g.roundRect) g.roundRect(r.x, r.y, r.w, r.h, r.h / 2);
        else g.rect(r.x, r.y, r.w, r.h);
        g.fill();
        g.fillStyle = on ? "#0b0720" : "rgba(255,255,255,0.78)";
        g.font = "700 14px system-ui, sans-serif";
        g.fillText(MODES[i].icon + "  " + MODES[i].name, r.x + r.w / 2, r.y + r.h / 2 + 1);
      });
      const y = safeTop + 14 + 36 + 26;
      g.fillStyle = "rgba(255,255,255,0.95)";
      g.font = "600 17px ui-monospace, Menlo, monospace";
      g.fillText(hudLines[0], W / 2, y);
      g.fillStyle = "rgba(255,255,255,0.55)";
      g.font = "500 12.5px system-ui, sans-serif";
      g.fillText(hudLines[1], W / 2, y + 22);
    }

    // ---------- input ----------
    let dragging = false;
    let dragFromHud = false;
    let lastX = 0;
    let lastY = 0;

    ctx.input.on(canvas, "tap", p => {
      const pill = pillHit(p.x, p.y);
      if (pill >= 0) {
        touched("mode");
        if (pill !== mode) {
          mode = pill;
          modeFade = 1;
          hap("medium");
        }
        return;
      }
      if (inHud(p.y)) return;
      touched("tap");
      if (mode === 0) sunTap(p.x, p.y);
      else if (mode === 1) tableTap(p.x, p.y);
      else tilesStep(p.x, p.y);
    });

    function update(dtMs) {
      const dt = Math.min(0.05, dtMs / 1000);
      hueDrift = (hueDrift + dt * 6) % 360;
      if (modeFade > 0) modeFade = Math.max(0, modeFade - dt * 3.5);

      let dx = null;
      let dAngle = null;
      if (input.down) {
        if (!dragging) {
          dragging = true;
          dragFromHud = inHud(input.y);
          lastX = input.x;
          lastY = input.y;
          tiles.holdAcc = 0;
        } else if (!dragFromHud) {
          const moved = input.x - lastX;
          if (input.dragging || Math.abs(moved) > 0) {
            dx = moved;
            const ccx = W / 2;
            const ccy = safeTop + 64 + (H - safeTop - 64 - 40) * 0.5;
            const a0 = Math.atan2(lastY - ccy, lastX - ccx);
            const a1 = Math.atan2(input.y - ccy, input.x - ccx);
            let da = a1 - a0;
            if (da > Math.PI) da -= TAU;
            if (da < -Math.PI) da += TAU;
            const rr = Math.hypot(input.x - ccx, input.y - ccy);
            dAngle = rr > 24 ? da : 0;
            if (input.dragging) touched("drag");
          }
          lastX = input.x;
          lastY = input.y;
          // hold-to-grow for the tiles toy
          if (mode === 2 && !input.dragging && (input.durationMs || 0) > 380 && (input.distance || 0) < 12) {
            tiles.holdAcc += dt;
            if (tiles.holdAcc > 0.2) {
              tiles.holdAcc = 0;
              touched("hold");
              tilesStep();
            }
          }
        }
      } else {
        dragging = false;
        dragFromHud = false;
      }
      const drag = dx === null ? null : dx;
      sunUpdate(dt, mode === 0 ? drag : null);
      tableUpdate(dt, mode === 1 ? drag : null);
      tilesUpdate(dt, mode === 2 && dAngle !== null ? { dAngle } : null);
    }

    function render() {
      drawBackground();
      if (mode === 0) sunDraw();
      else if (mode === 1) tableDraw();
      else tilesDraw();
      if (modeFade > 0) {
        g.fillStyle = "rgba(5,3,16," + (modeFade * 0.85).toFixed(3) + ")";
        g.fillRect(0, 0, W, H);
      }
      drawHud();
    }

    ctx.game.loop({ input, update, render });
    render();
    ctx.platform.ready();
  }
};
