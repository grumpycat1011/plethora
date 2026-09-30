window.plethoraBit = {
  async init(ctx) {
    const canvas = ctx.createCanvas2D({ alpha: false, maxDpr: 2, coordinateSpace: "css", layer: "content" });
    const g = canvas.getContext("2d");
    const input = ctx.input.track(canvas);
    const TAU = Math.PI * 2;

    // ---- SIM-BEGIN ----
    const ARENA_W = 100;
    const ARENA_H = 150;
    const BULLET_RANGE = 760;
    const COLORS = {
      red: { name: "Red", hint: "mirror bounce", hex: "#ff3b5c", bounces: 5 },
      blue: { name: "Blue", hint: "phases through glass", hex: "#35c2ff", bounces: 6 },
      green: { name: "Green", hint: "turns 90\u00b0 at walls", hex: "#3dff86", bounces: 6 },
      yellow: { name: "Yellow", hint: "splits on bounce", hex: "#ffd23d", bounces: 3 }
    };

    function seg(ax, ay, bx, by, type) {
      return { ax, ay, bx, by, type: type || "solid" };
    }
    function box(x0, y0, x1, y1, type) {
      return [seg(x0, y0, x1, y0, type), seg(x1, y0, x1, y1, type), seg(x1, y1, x0, y1, type), seg(x0, y1, x0, y0, type)];
    }
    function buildWalls(level) {
      const w = level.walls.slice();
      w.push(seg(0, 0, ARENA_W, 0), seg(ARENA_W, 0, ARENA_W, ARENA_H), seg(ARENA_W, ARENA_H, 0, ARENA_H), seg(0, ARENA_H, 0, 0));
      return w;
    }
    function raySeg(px, py, dx, dy, s) {
      const ex = s.bx - s.ax;
      const ey = s.by - s.ay;
      const den = dx * ey - dy * ex;
      if (Math.abs(den) < 1e-12) return -1;
      const qx = s.ax - px;
      const qy = s.ay - py;
      const t = (qx * ey - qy * ex) / den;
      const u = (qx * dy - qy * dx) / den;
      if (u < -1e-9 || u > 1 + 1e-9) return -1;
      return t;
    }
    function rayCircle(px, py, dx, dy, cx, cy, r) {
      const fx = px - cx;
      const fy = py - cy;
      const b = fx * dx + fy * dy;
      const c = fx * fx + fy * fy - r * r;
      const disc = b * b - c;
      if (disc < 0) return -1;
      const sq = Math.sqrt(disc);
      let t = -b - sq;
      if (t < 0) t = -b + sq;
      return t < 0 ? -1 : t;
    }
    function makeBullet(x, y, dx, dy, color, gen) {
      return { x, y, dx, dy, color, gen: gen || 0, bounces: 0, travel: 0, alive: true };
    }
    // Move a bullet `dist` units through the map. Returns bullets spawned by splits.
    function advance(b, dist, walls, targets, ev) {
      const spec = COLORS[b.color];
      const spawned = [];
      let remaining = Math.min(dist, BULLET_RANGE - b.travel);
      let guard = 0;
      while (b.alive && remaining > 1e-6 && guard++ < 40) {
        let bestT = Infinity;
        let best = null;
        for (const s of walls) {
          if (s.type === "glass" && b.color === "blue") continue;
          const t = raySeg(b.x, b.y, b.dx, b.dy, s);
          if (t > 1e-6 && t < bestT) { bestT = t; best = s; }
        }
        const step = Math.min(remaining, bestT);
        for (const tg of targets) {
          if (tg.hit) continue;
          const t = rayCircle(b.x, b.y, b.dx, b.dy, tg.x, tg.y, tg.r);
          if (t >= 0 && t <= step) {
            tg.hit = true;
            if (ev) ev("target", { target: tg, x: b.x + b.dx * t, y: b.y + b.dy * t, bullet: b });
          }
        }
        b.x += b.dx * step;
        b.y += b.dy * step;
        b.travel += step;
        remaining -= step;
        if (step === bestT && best) {
          if (best.type === "void") {
            b.alive = false;
            if (ev) ev("absorb", { x: b.x, y: b.y, bullet: b });
            break;
          }
          if (b.bounces >= spec.bounces) {
            b.alive = false;
            if (ev) ev("die", { x: b.x, y: b.y, bullet: b });
            break;
          }
          let nx = -(best.by - best.ay);
          let ny = best.bx - best.ax;
          const nl = Math.hypot(nx, ny);
          nx /= nl;
          ny /= nl;
          if (nx * b.dx + ny * b.dy > 0) { nx = -nx; ny = -ny; }
          const dot = b.dx * nx + b.dy * ny;
          let rx = b.dx - 2 * dot * nx;
          let ry = b.dy - 2 * dot * ny;
          if (b.color === "green") {
            // turn 90 degrees away from the wall; a head-on hit turns left
            const lx = b.dy;
            const ly = -b.dx;
            const dl = lx * nx + ly * ny;
            if (dl >= -1e-3) { rx = lx; ry = ly; } else { rx = -lx; ry = -ly; }
          }
          b.bounces++;
          b.x += nx * 0.02;
          b.y += ny * 0.02;
          if (b.color === "yellow" && b.gen < 2) {
            const a = 0.42;
            const cs = Math.cos(a);
            const sn = Math.sin(a);
            const r1x = rx * cs - ry * sn;
            const r1y = rx * sn + ry * cs;
            const r2x = rx * cs + ry * sn;
            const r2y = -rx * sn + ry * cs;
            b.gen++;
            if (r2x * nx + r2y * ny > 0.02) {
              const nb = makeBullet(b.x, b.y, r2x, r2y, "yellow", b.gen);
              nb.bounces = b.bounces;
              nb.travel = b.travel;
              spawned.push(nb);
            }
            if (r1x * nx + r1y * ny > 0.02) { rx = r1x; ry = r1y; }
          }
          b.dx = rx;
          b.dy = ry;
          if (ev) ev("bounce", { x: b.x, y: b.y, bullet: b, wall: best });
        }
        if (b.travel >= BULLET_RANGE - 1e-6) {
          b.alive = false;
          if (ev) ev("die", { x: b.x, y: b.y, bullet: b });
        }
      }
      return spawned;
    }
    // ---- SIM-END ----
    // ---- LEVELS-BEGIN ----
    const LEVELS = [
      {
        name: "Bank Shot",
        colors: ["red"], shots: 3, par: 1,
        shooter: { x: 50, y: 138 },
        targets: [{ x: 50, y: 30 }],
        walls: [seg(18, 75, 82, 75)]
      },
      {
        name: "Side Pocket",
        colors: ["red"], shots: 3, par: 1,
        shooter: { x: 30, y: 138 },
        targets: [{ x: 82, y: 24 }],
        walls: [seg(64, 8, 64, 44), seg(64, 44, 86, 44), seg(10, 88, 58, 88), seg(40, 60, 64, 44)]
      },
      {
        name: "Glass Box",
        colors: ["red", "blue"], shots: 3, par: 1,
        shooter: { x: 50, y: 138 },
        targets: [{ x: 50, y: 24 }],
        walls: [seg(34, 8, 66, 8), seg(34, 40, 66, 40), seg(34, 8, 34, 40, "glass"), seg(66, 8, 66, 40, "glass"), seg(20, 80, 80, 80, "glass")]
      },
      {
        name: "Two Rooms",
        colors: ["red", "blue"], shots: 3, par: 2,
        shooter: { x: 50, y: 138 },
        targets: [{ x: 20, y: 22 }, { x: 80, y: 22 }],
        walls: [
          seg(6, 40, 36, 40), seg(36, 8, 36, 40, "glass"),
          seg(64, 40, 94, 40, "glass"), seg(64, 8, 64, 40),
          seg(50, 55, 50, 110), seg(25, 95, 40, 95), seg(60, 95, 75, 95)
        ]
      },
      {
        name: "Right Angles",
        colors: ["red", "blue", "green"], shots: 3, par: 1,
        shooter: { x: 80, y: 138 },
        targets: [{ x: 7, y: 58 }],
        walls: [
          seg(94, 26, 84, 8), seg(0, 10, 80, 10), seg(14, 22, 80, 22),
          seg(14, 22, 14, 70), seg(0, 70, 14, 70), seg(30, 70, 65, 95, "glass")
        ]
      },
      {
        name: "Event Horizon",
        colors: ["red", "green"], shots: 3, par: 1,
        shooter: { x: 50, y: 138 },
        targets: [{ x: 50, y: 20 }],
        walls: [
          seg(22, 50, 78, 50, "void"), seg(1, 60, 1, 115, "void"), seg(99, 20, 99, 70, "void"),
          seg(62, 90, 88, 80), seg(28, 8, 28, 32), seg(72, 8, 72, 32)
        ]
      },
      {
        name: "Splitter",
        colors: ["red", "yellow"], shots: 2, par: 1,
        shooter: { x: 50, y: 138 },
        targets: [{ x: 15, y: 20 }, { x: 50, y: 12 }, { x: 85, y: 20 }],
        walls: [seg(10, 50, 90, 50), seg(0, 90, 20, 70), seg(100, 90, 80, 70)]
      },
      {
        name: "Hall of Mirrors",
        colors: ["red", "blue", "green"], shots: 3, par: 2,
        shooter: { x: 50, y: 138 },
        targets: [{ x: 12, y: 12 }, { x: 88, y: 12 }, { x: 50, y: 58 }],
        walls: [
          seg(20, 30, 40, 20), seg(60, 20, 80, 30),
          seg(35, 50, 65, 50, "glass"), seg(35, 66, 65, 66), seg(35, 50, 35, 66), seg(65, 50, 65, 66, "glass"),
          seg(0, 85, 25, 105), seg(100, 85, 75, 105)
        ]
      },
      {
        name: "Prism Vault",
        colors: ["red", "blue", "green", "yellow"], shots: 3, par: 2,
        shooter: { x: 50, y: 138 },
        targets: [{ x: 50, y: 20 }, { x: 12, y: 70 }, { x: 88, y: 70 }],
        walls: [
          seg(36, 8, 64, 8), seg(36, 8, 36, 34, "glass"), seg(64, 8, 64, 34, "glass"), seg(36, 34, 64, 34),
          seg(0, 55, 26, 55), seg(26, 55, 26, 74, "glass"), seg(0, 86, 26, 86, "void"),
          seg(74, 55, 100, 55), seg(74, 55, 74, 70), seg(74, 86, 100, 86, "void"),
          seg(40, 100, 60, 100, "void")
        ]
      },
      {
        name: "Labyrinth",
        colors: ["red", "blue", "green", "yellow"], shots: 4, par: 2,
        shooter: { x: 50, y: 140 },
        targets: [{ x: 10, y: 10 }, { x: 90, y: 10 }, { x: 50, y: 70 }, { x: 10, y: 110 }],
        walls: [
          seg(0, 25, 30, 25), seg(30, 25, 30, 45), seg(20, 45, 30, 45, "void"),
          seg(70, 25, 100, 25, "glass"), seg(70, 0, 70, 25),
          seg(40, 60, 60, 60), seg(40, 80, 60, 80), seg(40, 60, 40, 80, "glass"), seg(60, 60, 60, 72),
          seg(0, 95, 25, 95), seg(25, 95, 25, 125, "glass"), seg(0, 125, 15, 125),
          seg(75, 100, 100, 120, "void"), seg(45, 115, 60, 105)
        ]
      }
    ];
    // ---- LEVELS-END ----

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
    function hap(kind, force) {
      if (!tune("haptics_on", true)) return;
      if (ctx.capabilities && ctx.capabilities.haptics === false) return;
      const now = performance.now();
      if (!force && now - lastHap < 45) return;
      lastHap = now;
      try { ctx.platform.haptic(kind); } catch (e) { /* haptics unavailable */ }
    }

    // ---------- save data ----------
    let save = { unlocked: 0, stars: {} };
    try {
      const stored = await Promise.resolve(ctx.storage.get("ricochet_save"));
      if (stored && typeof stored.unlocked === "number") save = { unlocked: stored.unlocked, stars: stored.stars || {} };
    } catch (e) { /* storage optional */ }
    function persist() {
      try { Promise.resolve(ctx.storage.set("ricochet_save", save)).catch(() => {}); } catch (e) { /* ignore */ }
    }

    // ---------- layout ----------
    let W = ctx.width;
    let H = ctx.height;
    let safe = ctx.safeArea || { top: 0, bottom: 0, left: 0, right: 0 };
    const HUD_H = 108;
    const view = { s: 1, ox: 0, oy: 0 };
    function layout() {
      const top = safe.top + HUD_H;
      const bottom = H - Math.max(safe.bottom || 0, 14) - 10;
      const availH = Math.max(100, bottom - top);
      view.s = Math.min((W - 20) / ARENA_W, availH / ARENA_H);
      view.ox = (W - ARENA_W * view.s) / 2;
      view.oy = top + (availH - ARENA_H * view.s) / 2;
    }
    ctx.onResize(info => {
      W = info.width;
      H = info.height;
      safe = info.safeArea || safe;
      layout();
    }, { immediate: true });
    layout();
    const sx = x => view.ox + x * view.s;
    const sy = y => view.oy + y * view.s;
    const toArena = (px, py) => ({ x: (px - view.ox) / view.s, y: (py - view.oy) / view.s });

    // ---------- game state ----------
    let levelIdx = Math.min(save.unlocked, LEVELS.length - 1);
    let level;
    let walls;
    let targets;
    let shotsLeft;
    let shotsUsed;
    let colorIdx = 0;
    let bullets = [];
    let particles = [];
    let rings = [];
    let phase = "aim";
    let aim = { x: 0, y: -1 };
    let aiming = false;
    let attemptStarted = false;
    let allHitTimer = -1;
    let resultStars = 0;
    let banner = { text: "", t: 0 };
    let time = 0;
    let finale = false;

    function loadLevel(i) {
      levelIdx = (i + LEVELS.length) % LEVELS.length;
      level = LEVELS[levelIdx];
      walls = buildWalls(level);
      targets = level.targets.map(t => ({ x: t.x, y: t.y, r: 4, hit: false, hitT: 0 }));
      shotsLeft = level.shots;
      shotsUsed = 0;
      bullets = [];
      particles = [];
      rings = [];
      phase = "aim";
      aiming = false;
      attemptStarted = false;
      allHitTimer = -1;
      finale = false;
      if (colorIdx >= level.colors.length) colorIdx = level.colors.length - 1;
      const newest = level.colors[level.colors.length - 1];
      const firstTimeColor = !LEVELS.slice(0, levelIdx).some(l => l.colors.indexOf(newest) >= 0);
      if (firstTimeColor) colorIdx = level.colors.length - 1;
      aim = { x: 0, y: -1 };
      banner = { text: firstTimeColor && levelIdx > 0 ? "New: " + COLORS[newest].name + " \u2014 " + COLORS[newest].hint : level.name, t: 2.6 };
      try { ctx.platform.setProgress(levelIdx / LEVELS.length); } catch (e) { /* optional */ }
    }
    loadLevel(levelIdx);

    function currentColor() {
      return level.colors[colorIdx];
    }

    // ---------- effects ----------
    function sparks(x, y, color, n, speed) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * TAU;
        const v = speed * (0.4 + Math.random() * 0.8);
        particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.35 + Math.random() * 0.35, max: 0.7, color });
      }
      if (particles.length > 400) particles.splice(0, particles.length - 400);
    }

    function onSimEvent(type, d) {
      const col = COLORS[d.bullet.color].hex;
      if (type === "bounce") {
        d.bullet.trail.push({ x: d.x, y: d.y });
        sparks(d.x, d.y, col, 6, 30);
        hap("light");
      } else if (type === "target") {
        d.target.hitT = 0.001;
        rings.push({ x: d.target.x, y: d.target.y, t: 0, color: col });
        sparks(d.target.x, d.target.y, col, 22, 55);
        sparks(d.target.x, d.target.y, "#ffffff", 10, 40);
        hap("medium", true);
        try { ctx.fx.flash({ color: col, opacity: 0.12, durationMs: 160 }); } catch (e) { /* optional */ }
      } else if (type === "absorb") {
        d.bullet.trail.push({ x: d.x, y: d.y });
        sparks(d.x, d.y, "#b44cff", 14, 20);
        hap("warning");
      } else if (type === "die") {
        sparks(d.x, d.y, col, 5, 14);
      }
    }

    // ---------- aim preview ----------
    function previewPath() {
      const c = currentColor();
      const b = makeBullet(level.shooter.x, level.shooter.y, aim.x, aim.y, c);
      const pts = [{ x: b.x, y: b.y }];
      const extra = tune("preview_after_bounce", 24);
      let bounced = false;
      let after = 0;
      let splitStub = null;
      const fake = [];
      for (let i = 0; i < 160 && b.alive; i++) {
        const spawned = advance(b, 3, walls, fake, (type, d) => {
          if (type === "bounce" && !bounced) { bounced = true; pts.push({ x: d.x, y: d.y }); }
        });
        if (spawned.length && !splitStub) splitStub = { x: spawned[0].x, y: spawned[0].y, dx: spawned[0].dx, dy: spawned[0].dy };
        pts.push({ x: b.x, y: b.y });
        if (bounced) {
          after += 3;
          if (after >= extra) break;
        }
      }
      return { pts, splitStub, extra };
    }

    // ---------- firing ----------
    function fire() {
      if (phase !== "aim" || shotsLeft <= 0) return;
      if (!attemptStarted) {
        attemptStarted = true;
        ctx.platform.start({ level: levelIdx + 1 });
      }
      const c = currentColor();
      const b = makeBullet(level.shooter.x, level.shooter.y, aim.x, aim.y, c);
      b.trail = [{ x: b.x, y: b.y }];
      bullets.push(b);
      shotsLeft--;
      shotsUsed++;
      phase = "flying";
      allHitTimer = -1;
      hap("light", true);
      sparks(level.shooter.x + aim.x * 5, level.shooter.y + aim.y * 5, COLORS[c].hex, 8, 40);
      ctx.platform.interact({ type: "fire", color: c, level: levelIdx + 1 });
    }

    function finishShot() {
      const all = targets.every(t => t.hit);
      if (all) {
        phase = "clear";
        resultStars = shotsUsed <= level.par ? 3 : shotsUsed <= level.par + 1 ? 2 : 1;
        const key = String(levelIdx);
        save.stars[key] = Math.max(save.stars[key] || 0, resultStars);
        save.unlocked = Math.max(save.unlocked, Math.min(levelIdx + 1, LEVELS.length - 1));
        persist();
        hap("success", true);
        ctx.platform.milestone("level_clear", { level: levelIdx + 1, stars: resultStars, shots: shotsUsed });
        if (levelIdx === LEVELS.length - 1) {
          finale = true;
          ctx.platform.complete({ levels: LEVELS.length });
          ctx.timeout(() => {
            try {
              ctx.pulse.complete({ level: LEVELS.length, text: "Cleared every Ricochet map", score: totalStars() });
            } catch (e) { /* optional */ }
          }, 450);
        }
      } else if (shotsLeft <= 0) {
        phase = "fail";
        hap("error", true);
        ctx.platform.fail({ level: levelIdx + 1 });
      } else {
        phase = "aim";
      }
    }
    function totalStars() {
      let s = 0;
      for (const k in save.stars) s += save.stars[k];
      return s;
    }

    // ---------- HUD geometry ----------
    function hudButtons() {
      const y1 = safe.top + 26;
      const y2 = safe.top + 66;
      const n = level.colors.length;
      const gap = 50;
      const chips = level.colors.map((c, i) => ({ c, i, x: W / 2 + (i - (n - 1) / 2) * gap, y: y2, r: 17 }));
      return {
        prev: { x: 30, y: y1, r: 22 },
        next: { x: W - 80, y: y1, r: 22 },
        reset: { x: W - 30, y: y1, r: 22 },
        chips
      };
    }
    function hit(btn, p) {
      return Math.hypot(p.x - btn.x, p.y - btn.y) <= btn.r + 8;
    }

    ctx.input.on(canvas, "tap", p => {
      if (p.y > safe.top + HUD_H) return;
      const b = hudButtons();
      if (hit(b.prev, p)) {
        if (levelIdx > 0) { loadLevel(levelIdx - 1); hap("light", true); }
        return;
      }
      if (hit(b.next, p)) {
        if (levelIdx < save.unlocked) { loadLevel(levelIdx + 1); hap("light", true); }
        else hap("warning", true);
        return;
      }
      if (hit(b.reset, p)) {
        loadLevel(levelIdx);
        hap("medium", true);
        return;
      }
      for (const chip of b.chips) {
        if (hit(chip, { x: p.x, y: p.y })) {
          if (colorIdx !== chip.i) {
            colorIdx = chip.i;
            hap("light", true);
            banner = { text: COLORS[chip.c].name + " \u2014 " + COLORS[chip.c].hint, t: 1.8 };
            ctx.platform.interact({ type: "color", color: chip.c });
          }
          return;
        }
      }
    });

    // ---------- update ----------
    let pressInArena = false;
    function update(dtMs) {
      const dt = Math.min(0.05, dtMs / 1000);
      time += dt;
      if (banner.t > 0) banner.t -= dt;

      if (input.pressed) {
        pressInArena = input.y > safe.top + HUD_H;
      }
      if (pressInArena && input.down && phase === "aim") {
        const a = toArena(input.x, input.y);
        const dx = a.x - level.shooter.x;
        const dy = a.y - level.shooter.y;
        const len = Math.hypot(dx, dy);
        if (len > 3) {
          aim = { x: dx / len, y: dy / len };
          aiming = true;
        }
      }
      if (input.released && pressInArena) {
        pressInArena = false;
        if (phase === "aim" && aiming) {
          aiming = false;
          fire();
        } else if (phase === "clear") {
          loadLevel(finale ? 0 : levelIdx + 1);
          hap("light", true);
        } else if (phase === "fail") {
          loadLevel(levelIdx);
          hap("light", true);
        }
      }

      if (phase === "flying") {
        const fast = input.down && pressInArena ? 3 : 1;
        const dist = tune("bullet_speed", 190) * dt * fast;
        const born = [];
        for (const b of bullets) {
          if (!b.alive) continue;
          const spawned = advance(b, dist, walls, targets, onSimEvent);
          b.trail.push({ x: b.x, y: b.y });
          if (b.trail.length > 90) b.trail.shift();
          for (const nb of spawned) {
            nb.trail = [{ x: nb.x, y: nb.y }];
            born.push(nb);
          }
        }
        if (born.length) {
          bullets.push(...born);
          hap("medium");
        }
        for (const b of bullets) {
          if (!b.alive) b.fade = (b.fade || 0) + dt;
        }
        const allHit = targets.every(t => t.hit);
        if (allHit && allHitTimer < 0) allHitTimer = 0.55;
        if (allHitTimer >= 0) {
          allHitTimer -= dt;
          if (allHitTimer < 0) finishShot();
        } else if (bullets.every(b => !b.alive)) {
          finishShot();
        }
      } else {
        for (const b of bullets) if (!b.alive) b.fade = (b.fade || 0) + dt;
      }
      bullets = bullets.filter(b => b.alive || (b.fade || 0) < 0.6);

      for (const p of particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= Math.pow(0.02, dt);
        p.vy *= Math.pow(0.02, dt);
        p.life -= dt;
      }
      particles = particles.filter(p => p.life > 0);
      for (const r of rings) r.t += dt;
      rings = rings.filter(r => r.t < 0.8);
      for (const t of targets) if (t.hit && t.hitT < 1) t.hitT = Math.min(1, t.hitT + dt * 2.5);
    }

    // ---------- render ----------
    function drawBackground() {
      const grad = g.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#0d0a24");
      grad.addColorStop(1, "#05040f");
      g.fillStyle = grad;
      g.fillRect(0, 0, W, H);
      const x0 = sx(0);
      const y0 = sy(0);
      const aw = ARENA_W * view.s;
      const ah = ARENA_H * view.s;
      g.fillStyle = "#0a0820";
      g.fillRect(x0, y0, aw, ah);
      g.strokeStyle = "rgba(160,140,255,0.06)";
      g.lineWidth = 1;
      g.beginPath();
      for (let x = 10; x < ARENA_W; x += 10) { g.moveTo(sx(x), y0); g.lineTo(sx(x), y0 + ah); }
      for (let y = 10; y < ARENA_H; y += 10) { g.moveTo(x0, sy(y)); g.lineTo(x0 + aw, sy(y)); }
      g.stroke();
      g.strokeStyle = "rgba(210,200,255,0.85)";
      g.lineWidth = Math.max(2, view.s * 1.2);
      g.strokeRect(x0, y0, aw, ah);
    }

    function drawWalls() {
      g.lineCap = "round";
      for (const w of level.walls) {
        const ax = sx(w.ax);
        const ay = sy(w.ay);
        const bx = sx(w.bx);
        const by = sy(w.by);
        if (w.type === "solid") {
          g.shadowColor = "rgba(200,180,255,0.8)";
          g.shadowBlur = 8;
          g.strokeStyle = "#e4dcff";
          g.lineWidth = Math.max(3, view.s * 1.6);
          g.setLineDash([]);
        } else if (w.type === "glass") {
          g.shadowColor = "rgba(53,194,255,0.9)";
          g.shadowBlur = 10;
          g.strokeStyle = "rgba(120,215,255,0.55)";
          g.lineWidth = Math.max(3, view.s * 1.8);
          g.setLineDash([]);
        } else {
          g.shadowColor = "rgba(180,60,255,0.9)";
          g.shadowBlur = 12;
          g.strokeStyle = "#8a2cff";
          g.lineWidth = Math.max(3, view.s * 1.8);
          g.setLineDash([view.s * 2.2, view.s * 1.6]);
          g.lineDashOffset = -time * view.s * 6;
        }
        g.beginPath();
        g.moveTo(ax, ay);
        g.lineTo(bx, by);
        g.stroke();
        if (w.type === "glass") {
          g.shadowBlur = 0;
          g.strokeStyle = "rgba(230,250,255,0.8)";
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(ax, ay);
          g.lineTo(bx, by);
          g.stroke();
        }
      }
      g.setLineDash([]);
      g.shadowBlur = 0;
    }

    function drawTargets() {
      for (const t of targets) {
        const x = sx(t.x);
        const y = sy(t.y);
        const r = t.r * view.s;
        if (!t.hit) {
          const pulse = 1 + 0.08 * Math.sin(time * 4 + t.x);
          g.shadowColor = "#ff5fd2";
          g.shadowBlur = 14;
          g.fillStyle = "#ff5fd2";
          g.beginPath();
          g.arc(x, y, r * 0.42 * pulse, 0, TAU);
          g.fill();
          g.shadowBlur = 0;
          g.strokeStyle = "rgba(255,255,255,0.9)";
          g.lineWidth = Math.max(1.5, view.s * 0.6);
          g.beginPath();
          g.arc(x, y, r * 0.75 * pulse, 0, TAU);
          g.stroke();
          g.strokeStyle = "rgba(255,95,210,0.7)";
          g.setLineDash([r * 0.5, r * 0.35]);
          g.lineDashOffset = -time * r * 1.5;
          g.beginPath();
          g.arc(x, y, r * 1.08 * pulse, 0, TAU);
          g.stroke();
          g.setLineDash([]);
        } else {
          g.strokeStyle = "rgba(255,255,255," + (0.35 * (1 - t.hitT) + 0.12).toFixed(3) + ")";
          g.lineWidth = 1.5;
          g.beginPath();
          g.arc(x, y, r * (0.75 + t.hitT * 0.3), 0, TAU);
          g.stroke();
          g.fillStyle = "rgba(61,255,134,0.85)";
          g.font = "700 " + Math.round(r * 1.1) + "px system-ui, sans-serif";
          g.textAlign = "center";
          g.textBaseline = "middle";
          g.fillText("\u2713", x, y + 1);
        }
      }
      for (const ring of rings) {
        const k = ring.t / 0.8;
        g.strokeStyle = ring.color;
        g.globalAlpha = 1 - k;
        g.lineWidth = 3 * (1 - k) + 1;
        g.beginPath();
        g.arc(sx(ring.x), sy(ring.y), view.s * (4 + k * 16), 0, TAU);
        g.stroke();
        g.globalAlpha = 1;
      }
    }

    function drawPreview() {
      if (phase !== "aim") return;
      const c = currentColor();
      const hex = COLORS[c].hex;
      const pv = previewPath();
      g.strokeStyle = hex;
      g.globalAlpha = aiming ? 0.85 : 0.35;
      g.lineWidth = 2;
      g.setLineDash([6, 6]);
      g.lineDashOffset = -time * 30;
      g.beginPath();
      pv.pts.forEach((p, i) => (i ? g.lineTo(sx(p.x), sy(p.y)) : g.moveTo(sx(p.x), sy(p.y))));
      g.stroke();
      if (pv.splitStub && pv.extra > 0) {
        g.beginPath();
        g.moveTo(sx(pv.splitStub.x), sy(pv.splitStub.y));
        g.lineTo(sx(pv.splitStub.x + pv.splitStub.dx * pv.extra), sy(pv.splitStub.y + pv.splitStub.dy * pv.extra));
        g.stroke();
      }
      g.setLineDash([]);
      g.globalAlpha = 1;
    }

    function drawShooter() {
      const c = currentColor();
      const hex = COLORS[c].hex;
      const x = sx(level.shooter.x);
      const y = sy(level.shooter.y);
      const r = Math.max(10, view.s * 4.2);
      const ang = Math.atan2(aim.y, aim.x);
      g.save();
      g.translate(x, y);
      g.rotate(ang);
      g.fillStyle = "#231d45";
      g.strokeStyle = hex;
      g.lineWidth = 2;
      g.beginPath();
      if (g.roundRect) g.roundRect(0, -r * 0.32, r * 1.6, r * 0.64, r * 0.2);
      else g.rect(0, -r * 0.32, r * 1.6, r * 0.64);
      g.fill();
      g.stroke();
      g.restore();
      g.shadowColor = hex;
      g.shadowBlur = 16;
      g.fillStyle = "#231d45";
      g.beginPath();
      g.arc(x, y, r, 0, TAU);
      g.fill();
      g.strokeStyle = hex;
      g.lineWidth = 2.5;
      g.stroke();
      g.shadowBlur = 0;
      g.fillStyle = hex;
      g.beginPath();
      g.arc(x, y, r * 0.42, 0, TAU);
      g.fill();
    }

    function drawBullets() {
      g.lineCap = "round";
      g.lineJoin = "round";
      for (const b of bullets) {
        const hex = COLORS[b.color].hex;
        const fade = b.alive ? 1 : Math.max(0, 1 - (b.fade || 0) / 0.6);
        const tr = b.trail;
        const n = tr.length;
        for (let i = 1; i < n; i++) {
          const k = i / n;
          g.strokeStyle = hex;
          g.globalAlpha = k * k * 0.9 * fade;
          g.lineWidth = Math.max(1.5, view.s * 1.1 * k);
          g.beginPath();
          g.moveTo(sx(tr[i - 1].x), sy(tr[i - 1].y));
          g.lineTo(sx(tr[i].x), sy(tr[i].y));
          g.stroke();
        }
        g.globalAlpha = fade;
        if (b.alive) {
          g.shadowColor = hex;
          g.shadowBlur = 14;
          g.fillStyle = "#ffffff";
          g.beginPath();
          g.arc(sx(b.x), sy(b.y), Math.max(3, view.s * 1.3), 0, TAU);
          g.fill();
          g.shadowBlur = 0;
        }
        g.globalAlpha = 1;
      }
      for (const p of particles) {
        g.globalAlpha = Math.max(0, p.life / p.max);
        g.fillStyle = p.color;
        g.fillRect(sx(p.x) - 1.5, sy(p.y) - 1.5, 3, 3);
      }
      g.globalAlpha = 1;
    }

    function drawHud() {
      const b = hudButtons();
      g.textAlign = "center";
      g.textBaseline = "middle";
      // level title
      g.fillStyle = "#f3efff";
      g.font = "700 17px system-ui, sans-serif";
      g.fillText((levelIdx + 1) + " \u00b7 " + level.name, W / 2 - 22, b.prev.y);
      // nav buttons
      const navBtn = (btn, label, enabled) => {
        g.fillStyle = enabled ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)";
        g.beginPath();
        g.arc(btn.x, btn.y, 17, 0, TAU);
        g.fill();
        g.fillStyle = enabled ? "#ffffff" : "rgba(255,255,255,0.25)";
        g.font = "700 15px system-ui, sans-serif";
        g.fillText(label, btn.x, btn.y + 1);
      };
      navBtn(b.prev, "\u25c0", levelIdx > 0);
      navBtn(b.next, "\u25b6", levelIdx < save.unlocked);
      navBtn(b.reset, "\u21bb", true);
      // shots
      const pipY = b.chips[0].y;
      g.textAlign = "left";
      g.font = "600 11px system-ui, sans-serif";
      g.fillStyle = "rgba(255,255,255,0.55)";
      g.fillText("SHOTS", 16, pipY - 12);
      for (let i = 0; i < level.shots; i++) {
        g.fillStyle = i < shotsLeft ? "#ffffff" : "rgba(255,255,255,0.18)";
        g.beginPath();
        g.arc(22 + i * 13, pipY + 6, 4.5, 0, TAU);
        g.fill();
      }
      // stars best
      const best = save.stars[String(levelIdx)] || 0;
      g.textAlign = "right";
      g.fillStyle = "rgba(255,255,255,0.55)";
      g.fillText("PAR " + level.par, W - 16, pipY - 12);
      g.font = "700 14px system-ui, sans-serif";
      g.fillStyle = "#ffd23d";
      g.fillText("\u2605".repeat(best) + "\u2606".repeat(3 - best), W - 16, pipY + 6);
      // chips
      g.textAlign = "center";
      for (const chip of b.chips) {
        const on = chip.i === colorIdx;
        const hex = COLORS[chip.c].hex;
        if (on) {
          g.strokeStyle = hex;
          g.lineWidth = 2.5;
          g.beginPath();
          g.arc(chip.x, chip.y, chip.r + 5, 0, TAU);
          g.stroke();
        }
        g.shadowColor = hex;
        g.shadowBlur = on ? 16 : 0;
        g.fillStyle = hex;
        g.globalAlpha = on ? 1 : 0.55;
        g.beginPath();
        g.arc(chip.x, chip.y, on ? chip.r : chip.r - 3, 0, TAU);
        g.fill();
        g.globalAlpha = 1;
        g.shadowBlur = 0;
      }
      g.font = "500 12.5px system-ui, sans-serif";
      g.fillStyle = COLORS[currentColor()].hex;
      g.fillText(COLORS[currentColor()].name + " \u00b7 " + COLORS[currentColor()].hint, W / 2, b.chips[0].y + 32);
    }

    function drawOverlay() {
      if (banner.t > 0 && phase === "aim") {
        const a = Math.min(1, banner.t / 0.4);
        g.globalAlpha = a;
        g.font = "700 15px system-ui, sans-serif";
        const tw = g.measureText(banner.text).width + 28;
        const y = sy(ARENA_H * 0.5);
        g.fillStyle = "rgba(10,8,32,0.82)";
        g.beginPath();
        if (g.roundRect) g.roundRect(W / 2 - tw / 2, y - 18, tw, 36, 18);
        else g.rect(W / 2 - tw / 2, y - 18, tw, 36);
        g.fill();
        g.fillStyle = "#ffffff";
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillText(banner.text, W / 2, y + 1);
        g.globalAlpha = 1;
      }
      if (phase !== "clear" && phase !== "fail") return;
      const cy = sy(ARENA_H * 0.46);
      g.fillStyle = "rgba(5,4,15,0.72)";
      g.fillRect(sx(0), sy(0), ARENA_W * view.s, ARENA_H * view.s);
      g.textAlign = "center";
      g.textBaseline = "middle";
      if (phase === "clear") {
        g.fillStyle = "#ffffff";
        g.font = "800 30px system-ui, sans-serif";
        g.fillText(finale ? "All maps cleared!" : "Cleared!", W / 2, cy - 40);
        g.font = "700 38px system-ui, sans-serif";
        g.fillStyle = "#ffd23d";
        g.fillText("\u2605".repeat(resultStars) + "\u2606".repeat(3 - resultStars), W / 2, cy + 8);
        g.font = "500 14px system-ui, sans-serif";
        g.fillStyle = "rgba(255,255,255,0.7)";
        g.fillText(shotsUsed + (shotsUsed === 1 ? " shot" : " shots") + " \u00b7 par " + level.par, W / 2, cy + 46);
        g.fillStyle = "#ffffff";
        g.fillText(finale ? "Tap to play again from map 1" : "Tap for the next map", W / 2, cy + 78);
      } else {
        g.fillStyle = "#ff3b5c";
        g.font = "800 28px system-ui, sans-serif";
        g.fillText("Out of shots", W / 2, cy - 20);
        g.font = "500 14px system-ui, sans-serif";
        g.fillStyle = "rgba(255,255,255,0.8)";
        g.fillText("Tap to try this map again", W / 2, cy + 18);
      }
    }

    function render() {
      drawBackground();
      drawWalls();
      drawTargets();
      g.save();
      g.beginPath();
      g.rect(sx(0), sy(0), ARENA_W * view.s, ARENA_H * view.s);
      g.clip();
      drawPreview();
      drawBullets();
      g.restore();
      drawShooter();
      drawHud();
      drawOverlay();
    }

    ctx.game.loop({ input, update, render });
    render();
    ctx.platform.ready();
  }
};
