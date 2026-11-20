/* Стрибалка: змійка-кубик сама біжить, гравець стрибає. Редактор рівнів і перевірка, чи рівень можна пройти */
(function () {
"use strict";
// рівень — рядки згори вниз (нижній рядок стоїть на підлозі): . повітря, # блок, ^ шип, = батут, S портал-літак, C портал-кубик
const ROWS = 5;
const P = { vx: 0.125, g: 0.0125, jump: 0.222, pad: 0.3, size: 0.78, fly: 0.011, vmax: 0.11 };
const rowsOf = lv => lv.length || ROWS;   // у пісочниці рівні вищі (7 рядків), у завданнях — 5
const cellAt = (lv, c, r) => { const row = lv[lv.length - 1 - r]; return row && c >= 0 && c < row.length ? row[c] : "."; };
const lenOf = lv => Math.max(...lv.map(r => r.length));
const blank = (n, h) => Array.from({ length: h || ROWS }, () => ".".repeat(n));
const SPEED = { "<": 0.7, "|": 1, ">": 1.5 };   // портали швидкості: повільно, звичайно, швидко
const counts = lv => { const s = lv.join(""); return { spikes: (s.match(/\^/g) || []).length, blocks: (s.match(/#/g) || []).length, pads: (s.match(/=/g) || []).length, portals: (s.match(/[SC<>|]/g) || []).length }; };
// портал діє на всю колонку, у якій стоїть
const PORT = "SC<>|";
const portalsIn = (lv, c) => { let o = ""; for (let r = 0; r < rowsOf(lv); r++) { const ch = cellAt(lv, c, r); if (PORT.includes(ch) && !o.includes(ch)) o += ch; } return o; };

// один крок фізики; повертає новий стан або { dead }
// mode: "cube" — стрибає; "ship" — літачок: затиснув — летить угору, відпустив — опускається
function step(lv, s, press) {
  let { x, y, vy, ground } = s, mode = s.mode || "cube", sp = s.sp || 1;
  const S = P.size, L = lenOf(lv);
  if (mode === "cube" && press && ground) { vy = P.jump; ground = false; }
  x += P.vx * sp;
  // портал: колонка порталу перетинає середину гравця
  const pt = portalsIn(lv, Math.floor(x + S / 2));
  if (pt) {
    if (pt.includes("S") && mode !== "ship") { mode = "ship"; vy = Math.max(-0.03, Math.min(0.03, vy)); ground = false; }
    if (pt.includes("C") && mode !== "cube") { mode = "cube"; }
    for (const k of "<|>") if (pt.includes(k)) sp = SPEED[k];
  }
  const overlaps = (x0, y0, f) => { for (let c = Math.floor(x0); c <= Math.floor(x0 + S - 1e-6); c++) for (let r = Math.max(0, Math.floor(y0)); r <= Math.floor(y0 + S - 1e-6); r++) if (f(cellAt(lv, c, r), c, r)) return { c, r }; return null; };
  // збоку в блок — розбився
  const side = overlaps(x, y, ch => ch === "#");
  if (side) { if (y >= side.r + 1 - 0.06) y = side.r + 1; else return { dead: true, x, y, mode, sp, why: "блок" }; }
  if (mode === "ship") {
    vy += press ? P.fly : -P.fly;
    vy = Math.max(-P.vmax, Math.min(P.vmax, vy));
    y += vy; ground = false;
    if (y <= 0) { y = 0; vy = 0; }
    if (y >= rowsOf(lv) - S) { y = rowsOf(lv) - S; vy = 0; }   // стеля
    const b = overlaps(x, y, ch => ch === "#");
    if (b) { if (vy <= 0 && y > b.r + 0.5) { y = b.r + 1; vy = 0; } else if (vy > 0 && y + S < b.r + 0.5) { y = b.r - S; vy = 0; } else return { dead: true, x, y, mode, sp, why: "блок" }; }
  } else {
    vy -= P.g; y += vy;
    ground = false;
    if (y <= 0) { y = 0; vy = 0; ground = true; }
    const b = overlaps(x, y, ch => ch === "#");
    if (b) {
      if (vy <= 0 && y > b.r + 0.5) { y = b.r + 1; vy = 0; ground = true; }
      else return { dead: true, x, y, mode, sp, why: "голова" };
    }
    // батут під ногами — високий стрибок
    if (ground) { const under = overlaps(x, y - 0.05, ch => ch === "="); if (under && y <= under.r + 0.5) { vy = P.pad; ground = false; } }
  }
  // шип: менша зона, щоб було чесно
  for (let c = Math.floor(x); c <= Math.floor(x + S); c++) for (let r = Math.max(0, Math.floor(y)); r <= Math.floor(y + S); r++) {
    if (cellAt(lv, c, r) !== "^") continue;
    if (x + S > c + 0.28 && x < c + 0.72 && y < r + 0.55 && y + S > r) return { dead: true, x, y, mode, sp, why: "шип" };
  }
  return { x, y, vy, ground, mode, sp, win: x >= L };
}
const presses = pr => { const a = []; for (; pr; pr = pr.up) a.push(pr.t); return new Set(a); };
// пошук: чи можна пройти рівень. Кубик вирішує «стрибати чи ні», коли стоїть на опорі;
// літачок — кожні кілька кроків «тримати чи відпустити»
const HOLD = 3;
function solve(lv) {
  const seen = new Set(), L = lenOf(lv); let far = 0;
  const stack = [{ x: 0, y: 0, vy: 0, ground: true, mode: "cube", t: 0, pr: null }];
  const keyOf = s => Math.round(s.x * 100) + ":" + (s.sp && s.sp !== 1 ? "v" + s.sp : "") + (s.mode === "ship" ? "s" + Math.round(s.y * 12) + ":" + Math.round(s.vy * 60) : Math.round(s.y * 50) + ":" + (s.ground ? "g" : Math.round(s.vy * 1000)));
  while (stack.length) {
    let s = stack.pop();
    // кубик летить без рішень, поки не стане на опору
    for (;;) {
      if (s.x > far) far = s.x;
      const key = keyOf(s);
      if (seen.has(key)) { s = null; break; }
      seen.add(key);
      if (s.ground || s.mode === "ship") break;
      const n = step(lv, s, false); if (n.dead) { s = null; break; } n.t = s.t + 1; n.pr = s.pr; if (n.win) return { ok: true, presses: presses(n.pr) }; s = n;
    }
    if (!s) continue;
    if (s.mode === "ship") {
      for (const press of [true, false]) {
        let n = s, dead = false;
        for (let k = 0; k < HOLD; k++) { const m = step(lv, n, press); m.t = n.t + 1; m.pr = press ? { t: n.t, up: n.pr } : n.pr; if (m.dead) { dead = true; break; } if (m.win) return { ok: true, presses: presses(m.pr) }; n = m; if (n.mode !== "ship") break; }
        if (!dead) stack.push(n);
      }
    } else for (const press of [false, true]) { const n = step(lv, s, press); n.t = s.t + 1; n.pr = press ? { t: s.t, up: s.pr } : s.pr; if (n.win) return { ok: true, presses: presses(n.pr) }; if (!n.dead) stack.push(n); }
    if (seen.size > 700000) break;
  }
  return { ok: false, col: Math.min(L - 1, Math.floor(far + 1)) };
}

// ---------- малювання і гра ----------
const CELL = 34;
const TEST = typeof location !== "undefined" && /^(localhost|127\.0\.0\.1)$/.test(location.hostname);   // автогра лише для перевірок на комп'ютері розробника
function drawScene(ctx, lv, st, camX, W, H, opt) {
  const ROWS = rowsOf(lv), top = H - CELL * (ROWS + 1);
  ctx.clearRect(0, 0, W, H);
  const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#2b2b6e"); sky.addColorStop(1, "#6a4fb3"); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  // смужки на фоні — відчуття швидкості
  ctx.fillStyle = "rgba(255,255,255,.06)"; for (let i = 0; i < 12; i++) { const xx = ((i * 140 - camX * 0.4 * CELL) % (W + 140) + W + 140) % (W + 140) - 70; ctx.fillRect(xx, 30 + (i % 4) * 40, 70, 6); }
  const L = lenOf(lv);
  const c0 = Math.max(0, Math.floor(camX)), c1 = Math.min(L + 2, Math.ceil(camX + W / CELL) + 1);
  for (let c = c0; c < c1; c++) for (let r = 0; r < ROWS; r++) {
    const ch = cellAt(lv, c, r), X = (c - camX) * CELL, Y = top + (ROWS - 1 - r) * CELL;
    if (opt && opt.grid) { ctx.strokeStyle = "rgba(255,255,255,.12)"; ctx.strokeRect(X, Y, CELL, CELL); }
    if (ch === "#") { ctx.fillStyle = "#1c1c3a"; ctx.fillRect(X + 1, Y + 1, CELL - 2, CELL - 2); ctx.strokeStyle = "#7ee0ff"; ctx.lineWidth = 2; ctx.strokeRect(X + 2, Y + 2, CELL - 4, CELL - 4); }
    if (ch === "^") { ctx.fillStyle = "#11112a"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X + 3, Y + CELL - 1); ctx.lineTo(X + CELL / 2, Y + 5); ctx.lineTo(X + CELL - 3, Y + CELL - 1); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    if (ch === "=") { ctx.fillStyle = "#ffd23d"; ctx.fillRect(X + 3, Y + CELL - 8, CELL - 6, 7); ctx.fillStyle = "#ff9f1c"; ctx.fillRect(X + 8, Y + CELL - 12, CELL - 16, 4); }
  }
  // портали — на всю висоту колонки
  for (let c = c0; c < c1; c++) {
    const all = portalsIn(lv, c); if (!all) continue;
    const X = (c - camX) * CELL;
    for (const pt of all) {
    const col = { S: "#ff5fd2", C: "#4cc77a", ">": "#ff9f1c", "<": "#5fb4ff", "|": "#ffffff" }[pt], icon = { S: "✈️", C: "🟩", ">": "»»", "<": "«", "|": "»" }[pt];
    if ("<|>".includes(pt)) {   // портал швидкості — стрілки на всю колонку
      ctx.save(); ctx.globalAlpha = .22; ctx.fillStyle = col; ctx.fillRect(X + 4, top, CELL - 8, ROWS * CELL); ctx.restore();
      ctx.fillStyle = col; ctx.font = "bold 20px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (let r = 0; r < ROWS; r++) ctx.fillText(icon, X + CELL / 2, top + r * CELL + CELL / 2);
      continue;
    }
    ctx.save(); ctx.globalAlpha = .28; ctx.fillStyle = col; ctx.fillRect(X + 6, top, CELL - 12, ROWS * CELL); ctx.restore();
    ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(X + CELL / 2, top + ROWS * CELL / 2, CELL / 2 - 4, ROWS * CELL / 2 - 4, 0, 0, 7); ctx.stroke();
    ctx.font = "18px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(icon, X + CELL / 2, top + ROWS * CELL / 2);
  }}
  // фініш
  const FX = (L - camX) * CELL; if (FX < W + CELL) { for (let i = 0; i < ROWS * 2; i++) for (let j = 0; j < 2; j++) { ctx.fillStyle = (i + j) % 2 ? "#fff" : "#222"; ctx.fillRect(FX + j * CELL / 2, top + i * CELL / 2, CELL / 2, CELL / 2); } }
  // підлога
  ctx.fillStyle = "#151530"; ctx.fillRect(0, top + ROWS * CELL, W, H); ctx.fillStyle = "#7ee0ff"; ctx.fillRect(0, top + ROWS * CELL, W, 3);
  if (opt && opt.mark != null) { ctx.fillStyle = "rgba(255,70,70,.35)"; ctx.fillRect((opt.mark - camX) * CELL, top, CELL, ROWS * CELL); }
  if (st) {   // змійка-кубик, обертається в польоті
    const S = P.size * CELL, X = (st.x - camX) * CELL, Y = top + ROWS * CELL - st.y * CELL - S;
    ctx.save(); ctx.translate(X + S / 2, Y + S / 2); ctx.rotate(st.rot || 0);
    ctx.fillStyle = st.dead ? "#ff6b6b" : "#4cc77a"; ctx.strokeStyle = "#1f6f43"; ctx.lineWidth = 2.5;
    if (st.mode === "ship") {   // літачок: корпус, крило, хвіст, змійка в кабіні
      ctx.beginPath(); ctx.moveTo(-S / 2 - 4, -2); ctx.lineTo(-S / 2 - 6, -S / 2 + 2); ctx.lineTo(-S / 2 + 6, -4); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-S / 2 - 4, -4); ctx.quadraticCurveTo(0, -12, S / 2 + 8, 2); ctx.quadraticCurveTo(0, S / 2 + 2, -S / 2 - 4, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#ffd23d"; ctx.beginPath(); ctx.moveTo(-6, 4); ctx.lineTo(6, 4); ctx.lineTo(-4, S / 2 + 6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#bfefff"; ctx.beginPath(); ctx.ellipse(4, -6, 7, 5, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(6, -6, 2.2, 0, 7); ctx.fill();
      ctx.restore(); return;
    }
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-S / 2, -S / 2, S, S, 6) : ctx.rect(-S / 2, -S / 2, S, S); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(-4, -4, 5, 0, 7); ctx.arc(7, -4, 5, 0, 7); ctx.fill();
    ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(-3, -4, 2.4, 0, 7); ctx.arc(8, -4, 2.4, 0, 7); ctx.fill();
    ctx.restore();
  }
}
// гра на canvas: натискання — пробіл, клік, дотик
function player(el, getLevel, onEnd) {
  el.innerHTML = `<div class="rplay"><canvas class="rcv" tabindex="0" aria-label="Гра. Пробіл, клік або дотик — стрибок; у літачку тримай, щоб летіти вгору"></canvas>
    <div class="rbar"><button class="btn" data-go>▶ Грати</button><span class="rinfo"></span></div></div>`;
  const cv = el.querySelector("canvas"), ctx = cv.getContext("2d"), info = el.querySelector(".rinfo");
  let st = null, raf = 0, press = false, tries = 0, best = 0, lv = getLevel(), acc = 0, last = 0;
  const size = () => { const w = el.clientWidth || 600; cv.width = w * devicePixelRatio; const h = Math.round(CELL * (rowsOf(lv) + 1.5)); cv.height = h * devicePixelRatio; cv.style.width = w + "px"; cv.style.height = h + "px"; ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); };
  const W = () => cv.width / devicePixelRatio, H = () => cv.height / devicePixelRatio;
  const still = () => { size(); drawScene(ctx, lv, { x: 0, y: 0, rot: 0 }, -1, W(), H()); };
  const loop = t => {
    if (!st) return;
    if (!last) last = t; acc += Math.min(100, t - last); last = t;
    while (acc >= 1000 / 60 && st && !st.dead && !st.win) {
      acc -= 1000 / 60;
      const n = step(lv, st, auto ? auto.has(st.t || 0) : press); n.t = (st.t || 0) + 1;
      if (n.dead) { st = Object.assign({}, st, n, { dead: true }); break; }
      st = Object.assign(n, { rot: n.mode === "ship" ? -n.vy * 4 : st.mode === "ship" ? 0 : n.ground ? Math.round((st.rot || 0) / (Math.PI / 2)) * (Math.PI / 2) : (st.rot || 0) + 0.11 });
    }
    const pct = Math.min(100, Math.floor(st.x / lenOf(lv) * 100)); best = Math.max(best, pct);
    drawScene(ctx, lv, st, st.x - 3, W(), H());
    info.textContent = `${pct}% · спроба ${tries} · найкраще ${best}%`;
    if (st.dead || st.win) { const how = st.win ? "win" : "dead"; cancelAnimationFrame(raf); info.textContent = st.win ? `🏆 Пройдено! Спроба ${tries}.` : `💥 ${pct}% · спроба ${tries}. Ще раз — пробіл або «Грати»`; st = null; onEnd && onEnd(how, { tries, pct }); return; }
    raf = requestAnimationFrame(loop);
  };
  let auto = null;
  const go = () => { lv = getLevel(); size(); tries++; auto = TEST && window.__runnerAuto ? (solve(lv).presses || null) : null; st = { x: 0, y: 0, vy: 0, ground: true, mode: "cube", sp: 1, rot: 0, t: 0 }; acc = 0; last = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); cv.focus(); };
  el.querySelector("[data-go]").onclick = go;
  const down = e => { if (e.type === "keydown" && e.code !== "Space" && e.key !== "ArrowUp") return; e.preventDefault(); if (!st) go(); press = true; };
  const up = e => { if (e.type === "keyup" && e.code !== "Space" && e.key !== "ArrowUp") return; press = false; };
  cv.addEventListener("keydown", down); cv.addEventListener("keyup", up);
  cv.addEventListener("pointerdown", down); window.addEventListener("pointerup", up);
  still();
  return { refresh: () => { lv = getLevel(); if (!st) { still(); info.textContent = ""; } }, stop: () => { cancelAnimationFrame(raf); st = null; } };
}
// редактор: малюємо клітинки пензлем або пересуваємо їх рукою
const EK = { "#": "b", "^": "s", "=": "p", "S": "ps", "C": "pc", ">": "vf", "<": "vs", "|": "vn", ".": "e" }, EI = { "#": "", "^": "▲", "=": "▬", "S": "✈", "C": "■", ">": "»»", "<": "«", "|": "»", ".": "" };
function editor(el, lv, onChange) {
  const tools = [["#", "Блок"], ["^", "Шип"], ["=", "Батут"], ["S", "✈️ Портал-літак"], ["C", "🟩 Портал-кубик"], [">", "⏩ Швидше"], ["<", "🐢 Повільніше"], ["|", "▶️ Звичайна швидкість"], ["move", "✋ Пересунути"], [".", "Гумка"]];
  let tool = "^", painting = false, held = null;
  el.innerHTML = `<div class="redit"><div class="apal">${tools.map(([k, n]) => `<button data-t="${k}" class="${k === tool ? "on" : ""}">${n}</button>`).join("")}<span class="muted rhint"></span></div>
    <div class="rgridwrap"><div class="rgrid"></div></div></div>`;
  const grid = el.querySelector(".rgrid"), hint = el.querySelector(".rhint");
  const setHint = () => hint.textContent = tool === "move" ? (held ? "Тепер клацни клітинку, куди поставити (або відпусти мишку над нею)" : "Візьми блок, шип, батут чи портал і перетягни на нове місце") : tool === "S" || tool === "C" ? "Портал діє на всю колонку: пролетиш крізь нього — зміниш форму" : "<|>".includes(tool) ? "Портал швидкості діє на всю колонку: після нього змійка біжить швидше чи повільніше, аж до наступного такого порталу" : "Клацай або веди мишкою по клітинках";
  el.querySelectorAll("[data-t]").forEach(b => b.onclick = () => { tool = b.dataset.t; held = null; el.querySelectorAll("[data-t]").forEach(x => x.classList.toggle("on", x === b)); setHint(); draw(); });
  const changed = () => { draw(); onChange && onChange(); };
  const setCell = (c, r, ch) => { const row = lv[r].split(""); row[c] = ch; lv[r] = row.join(""); };
  const paint = (c, r) => { if (lv[r][c] === tool) return; setCell(c, r, tool); changed(); };
  const drop = (c, r) => { if (!held) return; if (c !== held.c || r !== held.r) { setCell(held.c, held.r, "."); setCell(c, r, held.ch); held = null; changed(); } setHint(); };
  const cellOf = e => { const d = document.elementFromPoint(e.clientX, e.clientY); return d && d.classList && d.classList.contains("rc") && grid.contains(d) ? d : null; };
  const draw = () => {
    const L = lenOf(lv);
    grid.style.gridTemplateColumns = `repeat(${L}, 22px)`;
    grid.classList.toggle("moving", tool === "move");
    grid.innerHTML = lv.map((row, r) => row.split("").map((ch, c) => `<div class="rc k${EK[ch] || "e"}${held && held.c === c && held.r === r ? " held" : ""}" data-r="${r}" data-c="${c}">${EI[ch] ?? ""}</div>`).join("")).join("")
      + Array.from({ length: L }, (_, c) => `<div class="rnum">${c % 5 === 0 ? c : ""}</div>`).join("");
    grid.querySelectorAll(".rc").forEach(d => {
      const c = +d.dataset.c, r = +d.dataset.r;
      d.onpointerdown = e => {
        e.preventDefault();
        if (tool !== "move") { painting = true; paint(c, r); return; }
        if (held) { if (held.c === c && held.r === r) { held = null; setHint(); draw(); } else drop(c, r); return; }
        if (lv[r][c] !== ".") { held = { c, r, ch: lv[r][c], drag: true }; setHint(); draw(); }
      };
      d.onpointerenter = e => { if (tool === "move") return; if (painting && (e.buttons & 1)) paint(c, r); else if (!(e.buttons & 1)) painting = false; };
    });
  };
  window.addEventListener("pointerup", e => {
    painting = false;
    if (tool === "move" && held && held.drag) { held.drag = false; const d = cellOf(e); if (d) drop(+d.dataset.c, +d.dataset.r); }
  });
  ["pointercancel", "blur"].forEach(ev => window.addEventListener(ev, () => painting = false));
  grid.addEventListener("dragstart", e => e.preventDefault());
  setHint(); draw();
  return { draw };
}

window.RUN = { ROWS, step, solve, counts, blank, lenOf, player, editor, drawScene };

// ---------- типи завдань ----------
const T = {};
// пройди рівень (або просто спробуй: після кількох спроб можна йти далі)
T.rplay = (it, A) => {
  let done = false;
  A.frame(it, `<div class="q">${A.md(it.q)}</div><div id="rp"></div>`);
  A.setActs("");
  player(A.$("#rp"), () => it.level, (how, s) => {
    if (done) return;
    if (how === "win") { done = true; A.feedback(true, A.praise(), it.why || ""); A.nextBtn(); }
    else if (s.tries >= (it.free || 6) && !A.$("#rskip")) { A.setActs(`<button class="btn ghost" id="rskip">Далі без перемоги</button>`, { rskip: () => { done = true; A.feedback(true, "Нічого, головне — спробувати", it.why || ""); A.nextBtn(); } }); }
  });
};
// збери або виправ рівень: перевіряємо кількість елементів і що його можна пройти
T.rmake = (it, A) => {
  const lv = A.st.lv || (A.st.lv = (it.level || blank(it.len || 30)).slice());
  let tries = 0, done = false;
  A.frame(it, `<div class="q">${A.md(it.q)}</div><div id="re"></div><div id="rp"></div>`);
  let pl = null;
  editor(A.$("#re"), lv, () => pl && pl.refresh());
  pl = player(A.$("#rp"), () => lv, () => {});
  const check = () => {
    if (done) return;
    const c = counts(lv), need = it.need || {}, probs = [];
    if (need.spikes && c.spikes < need.spikes) probs.push(`шипів треба щонайменше ${need.spikes} (зараз ${c.spikes})`);
    if (need.blocks && c.blocks < need.blocks) probs.push(`блоків треба щонайменше ${need.blocks} (зараз ${c.blocks})`);
    if (need.pads && c.pads < need.pads) probs.push(`батутів треба щонайменше ${need.pads} (зараз ${c.pads})`);
    const sv = solve(lv);
    if (!sv.ok) probs.push(`рівень неможливо пройти — застрягаєш біля колонки ${sv.col}`);
    if (!probs.length) { done = true; pl.stop(); A.feedback(tries === 0, tries === 0 ? A.praise() : "Тепер усе гаразд!", it.why || "Рівень можна пройти — гра перевірила всі варіанти стрибків."); A.nextBtn(); return; }
    tries++; if (tries === 1) { A.lose(); A.frame0Hearts(); }
    A.feedback(false, "Ще не готово", probs.join("; ") + ".");
    if (!sv.ok) { const cv = A.$("#rp canvas"); if (cv) { /* підсвітимо проблемну колонку */ } }
  };
  A.setActs(`<button class="btn" id="ck">Перевірити рівень</button>`, { ck: check });
};
window.GAME_TYPES = Object.assign(window.GAME_TYPES || {}, T);
})();
