/* Стрибалка: змійка-кубик сама біжить, гравець стрибає. Редактор рівнів і перевірка, чи рівень можна пройти */
(function () {
"use strict";
// рівень — рядки згори вниз (нижній рядок стоїть на підлозі): . повітря, # блок, ^ шип, = батут
const ROWS = 5;
const P = { vx: 0.125, g: 0.0125, jump: 0.222, pad: 0.3, size: 0.78 };
const cellAt = (lv, c, r) => { const row = lv[ROWS - 1 - r]; return row && c >= 0 && c < row.length ? row[c] : "."; };
const lenOf = lv => Math.max(...lv.map(r => r.length));
const blank = n => Array.from({ length: ROWS }, () => ".".repeat(n));
const counts = lv => { const s = lv.join(""); return { spikes: (s.match(/\^/g) || []).length, blocks: (s.match(/#/g) || []).length, pads: (s.match(/=/g) || []).length }; };

// один крок фізики; повертає новий стан або { dead }
function step(lv, s, press) {
  let { x, y, vy, ground } = s;
  const S = P.size, L = lenOf(lv);
  if (press && ground) { vy = P.jump; ground = false; }
  x += P.vx;
  const overlaps = (x0, y0, f) => { for (let c = Math.floor(x0); c <= Math.floor(x0 + S - 1e-6); c++) for (let r = Math.max(0, Math.floor(y0)); r <= Math.floor(y0 + S - 1e-6); r++) if (f(cellAt(lv, c, r), c, r)) return { c, r }; return null; };
  // збоку в блок — розбився
  if (overlaps(x, y, ch => ch === "#") ) {
    const hit = overlaps(x, y, ch => ch === "#");
    if (y >= hit.r + 1 - 0.06) y = hit.r + 1; else return { dead: true, x, y, why: "блок" };
  }
  vy -= P.g; y += vy;
  ground = false;
  if (y <= 0) { y = 0; vy = 0; ground = true; }
  const b = overlaps(x, y, ch => ch === "#");
  if (b) {
    if (vy <= 0 && y > b.r + 0.5) { y = b.r + 1; vy = 0; ground = true; }
    else return { dead: true, x, y, why: "голова" };
  }
  // батут під ногами — високий стрибок
  if (ground) { const under = overlaps(x, y - 0.05, ch => ch === "="); if (under && y <= under.r + 0.5) { vy = P.pad; ground = false; } }
  // шип: менша зона, щоб було чесно
  for (let c = Math.floor(x); c <= Math.floor(x + S); c++) for (let r = Math.max(0, Math.floor(y)); r <= Math.floor(y + S); r++) {
    if (cellAt(lv, c, r) !== "^") continue;
    if (x + S > c + 0.28 && x < c + 0.72 && y < r + 0.55 && y + S > r) return { dead: true, x, y, why: "шип" };
  }
  return { x, y, vy, ground, win: x >= L };
}
const presses = pr => { const a = []; for (; pr; pr = pr.up) a.push(pr.t); return new Set(a); };
// пошук: чи можна пройти рівень (рішення «стрибати чи ні» лише коли стоїмо на чомусь)
function solve(lv) {
  const seen = new Set(), L = lenOf(lv); let far = 0;
  const stack = [{ x: 0, y: 0, vy: 0, ground: true, t: 0, pr: null }];
  while (stack.length) {
    let s = stack.pop();
    // летимо без рішень, поки не станемо на опору
    for (;;) {
      if (s.x > far) far = s.x;
      const key = Math.round(s.x * 100) + ":" + Math.round(s.y * 50) + ":" + (s.ground ? "g" : Math.round(s.vy * 1000));
      if (seen.has(key)) { s = null; break; }
      seen.add(key);
      if (s.ground) break;
      const n = step(lv, s, false); if (n.dead) { s = null; break; } n.t = s.t + 1; n.pr = s.pr; if (n.win) return { ok: true, presses: presses(n.pr) }; s = n;
    }
    if (!s) continue;
    for (const press of [false, true]) { const n = step(lv, s, press); n.t = s.t + 1; n.pr = press ? { t: s.t, up: s.pr } : s.pr; if (n.win) return { ok: true, presses: presses(n.pr) }; if (!n.dead) stack.push(n); }
    if (seen.size > 400000) break;
  }
  return { ok: false, col: Math.min(L - 1, Math.floor(far + 1)) };
}

// ---------- малювання і гра ----------
const CELL = 34;
const TEST = typeof location !== "undefined" && /^(localhost|127\.0\.0\.1)$/.test(location.hostname);   // автогра лише для перевірок на комп'ютері розробника
function drawScene(ctx, lv, st, camX, W, H, opt) {
  const top = H - CELL * (ROWS + 1);
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
  // фініш
  const FX = (L - camX) * CELL; if (FX < W + CELL) { for (let i = 0; i < ROWS * 2; i++) for (let j = 0; j < 2; j++) { ctx.fillStyle = (i + j) % 2 ? "#fff" : "#222"; ctx.fillRect(FX + j * CELL / 2, top + i * CELL / 2, CELL / 2, CELL / 2); } }
  // підлога
  ctx.fillStyle = "#151530"; ctx.fillRect(0, top + ROWS * CELL, W, H); ctx.fillStyle = "#7ee0ff"; ctx.fillRect(0, top + ROWS * CELL, W, 3);
  if (opt && opt.mark != null) { ctx.fillStyle = "rgba(255,70,70,.35)"; ctx.fillRect((opt.mark - camX) * CELL, top, CELL, ROWS * CELL); }
  if (st) {   // змійка-кубик, обертається в польоті
    const S = P.size * CELL, X = (st.x - camX) * CELL, Y = top + ROWS * CELL - st.y * CELL - S;
    ctx.save(); ctx.translate(X + S / 2, Y + S / 2); ctx.rotate(st.rot || 0);
    ctx.fillStyle = st.dead ? "#ff6b6b" : "#4cc77a"; ctx.strokeStyle = "#1f6f43"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-S / 2, -S / 2, S, S, 6) : ctx.rect(-S / 2, -S / 2, S, S); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(-4, -4, 5, 0, 7); ctx.arc(7, -4, 5, 0, 7); ctx.fill();
    ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(-3, -4, 2.4, 0, 7); ctx.arc(8, -4, 2.4, 0, 7); ctx.fill();
    ctx.restore();
  }
}
// гра на canvas: натискання — пробіл, клік, дотик
function player(el, getLevel, onEnd) {
  el.innerHTML = `<div class="rplay"><canvas class="rcv" tabindex="0" aria-label="Гра. Пробіл, клік або дотик — стрибок"></canvas>
    <div class="rbar"><button class="btn" data-go>▶ Грати</button><span class="rinfo"></span></div></div>`;
  const cv = el.querySelector("canvas"), ctx = cv.getContext("2d"), info = el.querySelector(".rinfo");
  let st = null, raf = 0, press = false, tries = 0, best = 0, lv = getLevel(), acc = 0, last = 0;
  const size = () => { const w = el.clientWidth || 600; cv.width = w * devicePixelRatio; cv.height = (CELL * (ROWS + 3)) * devicePixelRatio; cv.style.width = w + "px"; cv.style.height = CELL * (ROWS + 3) + "px"; ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); };
  const W = () => cv.width / devicePixelRatio, H = () => cv.height / devicePixelRatio;
  const still = () => { size(); drawScene(ctx, lv, { x: 0, y: 0, rot: 0 }, -1, W(), H()); };
  const loop = t => {
    if (!st) return;
    if (!last) last = t; acc += Math.min(100, t - last); last = t;
    while (acc >= 1000 / 60 && st && !st.dead && !st.win) {
      acc -= 1000 / 60;
      const n = step(lv, st, auto ? auto.has(st.t || 0) : press); n.t = (st.t || 0) + 1;
      if (n.dead) { st = Object.assign({}, st, n, { dead: true }); break; }
      st = Object.assign(n, { rot: n.ground ? Math.round((st.rot || 0) / (Math.PI / 2)) * (Math.PI / 2) : (st.rot || 0) + 0.11 });
    }
    const pct = Math.min(100, Math.floor(st.x / lenOf(lv) * 100)); best = Math.max(best, pct);
    drawScene(ctx, lv, st, st.x - 3, W(), H());
    info.textContent = `${pct}% · спроба ${tries} · найкраще ${best}%`;
    if (st.dead || st.win) { const how = st.win ? "win" : "dead"; cancelAnimationFrame(raf); info.textContent = st.win ? `🏆 Пройдено! Спроба ${tries}.` : `💥 ${pct}% · спроба ${tries}. Ще раз — пробіл або «Грати»`; st = null; onEnd && onEnd(how, { tries, pct }); return; }
    raf = requestAnimationFrame(loop);
  };
  let auto = null;
  const go = () => { lv = getLevel(); size(); tries++; auto = TEST && window.__runnerAuto ? (solve(lv).presses || null) : null; st = { x: 0, y: 0, vy: 0, ground: true, rot: 0, t: 0 }; acc = 0; last = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); cv.focus(); };
  el.querySelector("[data-go]").onclick = go;
  const down = e => { if (e.type === "keydown" && e.code !== "Space" && e.key !== "ArrowUp") return; e.preventDefault(); if (!st) go(); press = true; };
  const up = e => { if (e.type === "keyup" && e.code !== "Space" && e.key !== "ArrowUp") return; press = false; };
  cv.addEventListener("keydown", down); cv.addEventListener("keyup", up);
  cv.addEventListener("pointerdown", down); window.addEventListener("pointerup", up);
  still();
  return { refresh: () => { lv = getLevel(); if (!st) still(); }, stop: () => { cancelAnimationFrame(raf); st = null; } };
}
// редактор: малюємо клітинки пензлем
function editor(el, lv, onChange) {
  const tools = [["#", "Блок"], ["^", "Шип"], ["=", "Батут"], [".", "Гумка"]];
  let tool = "^", painting = false;
  el.innerHTML = `<div class="redit"><div class="apal">${tools.map(([k, n]) => `<button data-t="${k}" class="${k === tool ? "on" : ""}">${n}</button>`).join("")}<span class="muted">Клацай або веди мишкою по клітинках</span></div>
    <div class="rgridwrap"><div class="rgrid"></div></div></div>`;
  const grid = el.querySelector(".rgrid");
  el.querySelectorAll("[data-t]").forEach(b => b.onclick = () => { tool = b.dataset.t; el.querySelectorAll("[data-t]").forEach(x => x.classList.toggle("on", x === b)); });
  const paint = (c, r) => { const row = lv[r].split(""); if (row[c] === tool) return; row[c] = tool; lv[r] = row.join(""); draw(); onChange && onChange(); };
  const draw = () => {
    const L = lenOf(lv);
    grid.style.gridTemplateColumns = `repeat(${L}, 22px)`;
    grid.innerHTML = lv.map((row, r) => row.split("").map((ch, c) => `<div class="rc k${{ "#": "b", "^": "s", "=": "p", ".": "e" }[ch]}" data-r="${r}" data-c="${c}">${{ "#": "", "^": "▲", "=": "▬", ".": "" }[ch]}</div>`).join("")).join("")
      + Array.from({ length: L }, (_, c) => `<div class="rnum">${c % 5 === 0 ? c : ""}</div>`).join("");
    grid.querySelectorAll(".rc").forEach(d => {
      d.onpointerdown = e => { e.preventDefault(); painting = true; paint(+d.dataset.c, +d.dataset.r); };
      d.onpointerenter = () => { if (painting) paint(+d.dataset.c, +d.dataset.r); };
    });
  };
  window.addEventListener("pointerup", () => painting = false);
  draw();
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
