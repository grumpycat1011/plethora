// Solvability checker: sweeps every aim angle for every bullet colour on each map.
// Usage: node bits/ricochet/tools/solve.js bits/ricochet/main.js
const fs = require("fs");
const src = process.argv[2]
  ? (() => { const s = fs.readFileSync(process.argv[2], "utf8"); return s.slice(s.indexOf("// ---- SIM-BEGIN")) .slice(0) ; })()
  : fs.readFileSync(__dirname + "/simcore.js", "utf8") + fs.readFileSync(__dirname + "/levels.js", "utf8");
const code = process.argv[2]
  ? (() => { const s = fs.readFileSync(process.argv[2], "utf8");
      const a = s.slice(s.indexOf("// ---- SIM-BEGIN"), s.indexOf("// ---- SIM-END"));
      const b = s.slice(s.indexOf("// ---- LEVELS-BEGIN"), s.indexOf("// ---- LEVELS-END"));
      return a + "\n" + b; })()
  : src;
const M = new Function(code + "; return {LEVELS, COLORS, buildWalls, advance, makeBullet};")();
const STEP = 0.05;
function shoot(level, walls, color, deg) {
  const a = deg * Math.PI / 180;
  const targets = level.targets.map(t => ({ x: t.x, y: t.y, r: 4, hit: false }));
  let bullets = [M.makeBullet(level.shooter.x, level.shooter.y, Math.cos(a), Math.sin(a), color)];
  let bounces = 0;
  let guard = 0;
  while (bullets.length && guard++ < 50) {
    const next = [];
    for (const b of bullets) {
      next.push(...M.advance(b, 1e9, walls, targets));
    }
    bullets = next;
  }
  let mask = 0;
  targets.forEach((t, i) => { if (t.hit) mask |= 1 << i; });
  return mask;
}
function analyze(level, colors) {
  const walls = M.buildWalls(level);
  const windows = {}; // mask -> {color, best contiguous width, center}
  for (const c of colors) {
    let prev = -1, start = 0;
    const n = Math.round(360 / STEP);
    const masks = [];
    for (let i = 0; i < n; i++) masks.push(shoot(level, walls, c, i * STEP));
    for (let i = 0; i <= n; i++) {
      const m = i < n ? masks[i] : -2;
      if (m !== prev) {
        if (prev > 0) {
          const w = (i - start) * STEP;
          const key = prev;
          if (!windows[key] || windows[key].w < w) windows[key] = { color: c, w, at: ((start + i) / 2) * STEP };
        }
        prev = m; start = i;
      }
    }
  }
  return windows;
}
function minShots(nT, windows, minW) {
  const full = (1 << nT) - 1;
  const masks = Object.keys(windows).map(Number).filter(m => windows[m].w >= minW);
  let dist = new Map([[0, 0]]);
  let frontier = [0];
  for (let d = 1; d <= 6; d++) {
    const nf = [];
    for (const s of frontier) for (const m of masks) {
      const ns = s | m;
      if (!dist.has(ns)) { dist.set(ns, d); nf.push(ns); if (ns === full) return d; }
    }
    frontier = nf;
  }
  return Infinity;
}
M.LEVELS.forEach((lv, i) => {
  const nT = lv.targets.length;
  const all = analyze(lv, lv.colors);
  const prevColors = lv.colors.slice(0, -1);
  const newest = lv.colors[lv.colors.length - 1];
  const withoutNew = prevColors.length ? analyze(lv, prevColors) : {};
  const summary = Object.entries(all).sort((a, b) => b[1].w - a[1].w).slice(0, 6)
    .map(([m, v]) => m.toString(2).padStart(nT, "0") + ":" + v.color[0] + " " + v.w.toFixed(2) + "°@" + v.at.toFixed(1)).join("  ");
  console.log(`L${i + 1} ${lv.name} [${lv.colors}] shots=${lv.shots} par=${lv.par}`);
  console.log(`   min shots (>=0.3): ${minShots(nT, all, 0.3)}  (>=0.8): ${minShots(nT, all, 0.8)}  without ${newest}: >=0.3 ${prevColors.length ? minShots(nT, withoutNew, 0.3) : "-"} >=0.8 ${prevColors.length ? minShots(nT, withoutNew, 0.8) : "-"}`);
  console.log("   " + summary);
});
if (process.env.SOLS) {
  const sols = M.LEVELS.map(lv => {
    const nT = lv.targets.length, full = (1 << nT) - 1;
    const win = analyze(lv, lv.colors);
    const masks = Object.keys(win).map(Number).filter(m => win[m].w >= 0.8);
    // BFS with parent pointers
    const prev = new Map([[0, null]]); let fr = [0];
    while (fr.length && !prev.has(full)) { const nf = []; for (const s of fr) for (const m of masks) { const ns = s | m; if (!prev.has(ns)) { prev.set(ns, [s, m]); nf.push(ns); } } fr = nf; }
    const shots = []; let cur = full; while (cur) { const [p, m] = prev.get(cur); shots.unshift({ color: win[m].color, deg: win[m].at }); cur = p; }
    return shots;
  });
  fs.writeFileSync(__dirname + "/sols.json", JSON.stringify(sols));
  console.log(JSON.stringify(sols));
}
