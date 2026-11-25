// Піксельна малювалка: полотно від 2×2 до 64×64, олівець, гумка, заливка, піпетка, лінія, прямокутник, дзеркало
(function () {
"use strict";
const $ = s => document.querySelector(s);
const KEY = "kv-pix";
const PAL = ["#000000", "#ffffff", "#7f7f7f", "#c3c3c3", "#5a3a22", "#a0662f", "#f2c28b", "#ffe0bd",
  "#e53935", "#ff8a80", "#ff9800", "#ffd43b", "#fff59d", "#43a047", "#a5d6a7", "#1b5e20",
  "#1e88e5", "#81d4fa", "#0d47a1", "#00bcd4", "#8e24aa", "#ce93d8", "#ec407a", "#f8bbd0"];
const TOOLS = [
  ["pen", "✏️", "олівець"], ["eraser", "🧽", "гумка"], ["fill", "🪣", "заливка"], ["pick", "💧", "піпетка"],
  ["line", "📏", "лінія"], ["rect", "⬜", "рамка"], ["box", "⬛", "квадрат"],
];

let W = 16, H = 16, px = [], color = "#e53935", tool = "pen", hist = [], fut = [], recent = [];
const cv = $("#cv"), g = cv.getContext("2d"), mini = $("#mini"), mg = mini.getContext("2d");
let cell = 20;

// ---------- збереження ----------
// малюнок кодуємо коротко: палітра використаних кольорів + по символу на піксель ("." — порожньо)
const CH = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function encode() {
  const pal = [], ix = new Map();
  const d = px.map(c => { if (!c) return "."; if (!ix.has(c)) { if (pal.length >= CH.length) return "."; ix.set(c, pal.length); pal.push(c); } return CH[ix.get(c)]; }).join("");
  return { w: W, h: H, pal, d };
}
function decode(o) {
  if (!o || !o.w || !o.h || typeof o.d !== "string") return false;
  W = Math.min(64, Math.max(2, o.w | 0)); H = Math.min(64, Math.max(2, o.h | 0));
  px = Array.from({ length: W * H }, (_, i) => { const c = o.d[i]; return !c || c === "." ? null : (o.pal || [])[CH.indexOf(c)] || null; });
  return true;
}
const keep = () => { try { localStorage.setItem(KEY, JSON.stringify(Object.assign(encode(), { recent }))); } catch (e) {} };
const snap = () => { hist.push(JSON.stringify(encode())); if (hist.length > 80) hist.shift(); fut = []; btns(); };
function undo() { if (!hist.length) return; fut.push(JSON.stringify(encode())); decode(JSON.parse(hist.pop())); fit(); keep(); btns(); }
function redo() { if (!fut.length) return; hist.push(JSON.stringify(encode())); decode(JSON.parse(fut.pop())); fit(); keep(); btns(); }
const btns = () => { $("#undo").disabled = !hist.length; $("#redo").disabled = !fut.length; };

// ---------- малювання полотна ----------
function fit() {
  const box = $("#stage"), avail = Math.max(160, box.clientWidth - 28), maxH = Math.max(220, window.innerHeight * 0.72);
  cell = Math.max(4, Math.floor(Math.min(avail / W, maxH / H, 40)));
  cv.width = W * cell; cv.height = H * cell;
  mini.width = W; mini.height = H; mini.style.width = Math.min(W * 3, 192) + "px";
  draw();
  $("#size").value = [...$("#size").options].some(o => o.value === W + "x" + H) ? W + "x" + H : "custom";
  $("#custom").hidden = $("#size").value !== "custom";
}
function draw(preview) {
  // шахова дошка під прозорими пікселями
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = (preview && preview.has(y * W + x)) ? preview.get(y * W + x) : px[y * W + x];
    if (c) { g.fillStyle = c; g.fillRect(x * cell, y * cell, cell, cell); }
    else { const h = cell / 2; g.fillStyle = "#fff"; g.fillRect(x * cell, y * cell, cell, cell); g.fillStyle = "#e3e6ea"; g.fillRect(x * cell, y * cell, h, h); g.fillRect(x * cell + h, y * cell + h, cell - h, cell - h); }
  }
  if ($("#grid").checked && cell >= 6) {
    g.strokeStyle = "rgba(0,0,0,.14)"; g.lineWidth = 1; g.beginPath();
    for (let x = 1; x < W; x++) { g.moveTo(x * cell + .5, 0); g.lineTo(x * cell + .5, H * cell); }
    for (let y = 1; y < H; y++) { g.moveTo(0, y * cell + .5); g.lineTo(W * cell, y * cell + .5); }
    g.stroke();
  }
  if ($("#mirror").checked) { g.strokeStyle = "rgba(229,57,53,.7)"; g.lineWidth = 2; g.beginPath(); g.moveTo(W * cell / 2, 0); g.lineTo(W * cell / 2, H * cell); g.stroke(); }
  mg.clearRect(0, 0, W, H);
  for (let i = 0; i < W * H; i++) { const c = (preview && preview.has(i)) ? preview.get(i) : px[i]; if (c) { mg.fillStyle = c; mg.fillRect(i % W, (i / W) | 0, 1, 1); } }
}

// ---------- інструменти ----------
const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
function put(map, x, y, c) {
  if (!inside(x, y)) return;
  map.set(y * W + x, c);
  if ($("#mirror").checked) map.set(y * W + (W - 1 - x), c);
}
function lineCells(x0, y0, x1, y1) {   // алгоритм Брезенхема
  const out = [], dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) { out.push([x0, y0]); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
  return out;
}
function rectCells(x0, y0, x1, y1, full) {
  const out = [], [a, b] = [Math.min(x0, x1), Math.max(x0, x1)], [c, d] = [Math.min(y0, y1), Math.max(y0, y1)];
  for (let y = c; y <= d; y++) for (let x = a; x <= b; x++) if (full || x === a || x === b || y === c || y === d) out.push([x, y]);
  return out;
}
function flood(x, y, c) {
  const from = px[y * W + x]; if (from === c) return false;
  const st = [[x, y]], seen = new Set();
  while (st.length) {
    const [a, b] = st.pop(), i = b * W + a;
    if (!inside(a, b) || seen.has(i) || px[i] !== from) continue;
    seen.add(i); px[i] = c;
    st.push([a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]);
  }
  return true;
}
const paintColor = () => tool === "eraser" ? null : color;

let drag = null;
function cellAt(e) {
  const r = cv.getBoundingClientRect();
  return [Math.floor((e.clientX - r.left) / r.width * W), Math.floor((e.clientY - r.top) / r.height * H)];
}
cv.addEventListener("pointerdown", e => {
  e.preventDefault(); cv.setPointerCapture(e.pointerId);
  const [x, y] = cellAt(e); if (!inside(x, y)) return;
  if (tool === "pick") { const c = px[y * W + x]; if (c) setColor(c); else setTool("eraser"); return; }
  if (tool === "fill") {
    snap();
    let changed = flood(x, y, color);
    if ($("#mirror").checked) changed = flood(W - 1 - x, y, color) || changed;
    if (changed) { useColor(color); keep(); draw(); } else { hist.pop(); btns(); }
    return;
  }
  snap();
  drag = { x0: x, y0: y, lx: x, ly: y, map: new Map() };
  if (tool === "pen" || tool === "eraser") { put(drag.map, x, y, paintColor()); commit(drag.map); drag.map = new Map(); }
  else { put(drag.map, x, y, color); draw(drag.map); }
});
cv.addEventListener("pointermove", e => {
  if (!drag) return;
  const [x, y] = cellAt(e);
  if (x === drag.lx && y === drag.ly) return;
  if (tool === "pen" || tool === "eraser") {
    const m = new Map(); lineCells(drag.lx, drag.ly, x, y).forEach(([a, b]) => put(m, a, b, paintColor())); commit(m);
  } else {
    const m = new Map(), cells = tool === "line" ? lineCells(drag.x0, drag.y0, x, y) : rectCells(drag.x0, drag.y0, x, y, tool === "box");
    cells.forEach(([a, b]) => put(m, a, b, color)); drag.map = m; draw(m);
  }
  drag.lx = x; drag.ly = y;
});
const up = () => {
  if (!drag) return;
  if (tool !== "pen" && tool !== "eraser") commit(drag.map);
  if (tool !== "eraser") useColor(color);
  drag = null; keep();
};
cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
function commit(map) { map.forEach((c, i) => { px[i] = c; }); draw(); }

// ---------- панелі ----------
$("#tools").innerHTML = TOOLS.map(([id, ic, nm]) => `<button class="px-tool" data-tool="${id}" title="${nm}">${ic}<small>${nm}</small></button>`).join("");
document.querySelectorAll("[data-tool]").forEach(b => b.onclick = () => setTool(b.dataset.tool));
function setTool(t) { tool = t; document.querySelectorAll("[data-tool]").forEach(b => b.classList.toggle("on", b.dataset.tool === t)); }
function swatches(el, list) {
  el.innerHTML = list.map(c => `<button class="px-sw ${c === color ? "on" : ""}" data-c="${c}" style="background:${c}" title="${c}"></button>`).join("");
  el.querySelectorAll("[data-c]").forEach(b => b.onclick = () => setColor(b.dataset.c));
}
function setColor(c) {
  color = c; $("#cur").style.background = c; $("#picker").value = c;
  if (tool === "eraser" || tool === "pick") setTool("pen");
  swatches($("#pal"), PAL); swatches($("#recent"), recent);
}
function useColor(c) {
  if (PAL.includes(c) && recent.includes(c)) return;
  recent = [c, ...recent.filter(x => x !== c)].slice(0, 8); swatches($("#recent"), recent);
}
$("#picker").oninput = () => setColor($("#picker").value);
$("#grid").onchange = () => draw();
$("#mirror").onchange = () => draw();

// ---------- розмір полотна ----------
function newCanvas(w, h) {
  const used = px.some(Boolean);
  if (used && !confirmSize()) { fit(); return; }
  snap();
  // переносимо намальоване в лівий верхній кут нового полотна
  const old = px, ow = W, oh = H;
  W = w; H = h; px = Array(W * H).fill(null);
  for (let y = 0; y < Math.min(oh, H); y++) for (let x = 0; x < Math.min(ow, W); x++) px[y * W + x] = old[y * ow + x];
  fit(); keep();
}
let sizeAsk = 0;
function confirmSize() {   // без браузерних діалогів: друге натискання протягом 4 с — підтвердження
  if (Date.now() - sizeAsk < 4000) return true;
  sizeAsk = Date.now();
  st("Малюнок перенесеться на нове полотно, а те, що не влізе, обріжеться. Обери розмір ще раз, щоб підтвердити.");
  return false;
}
$("#size").onchange = () => {
  const v = $("#size").value;
  if (v === "custom") { $("#custom").hidden = false; return; }
  const [w, h] = v.split("x").map(Number); newCanvas(w, h);
};
$("#cok").onclick = () => {
  const w = Math.min(64, Math.max(2, +$("#cw").value || 16)), h = Math.min(64, Math.max(2, +$("#ch").value || 16));
  $("#cw").value = w; $("#ch").value = h; newCanvas(w, h);
};
let clearAsk = 0;
$("#clear").onclick = () => {
  if (Date.now() - clearAsk > 4000) { clearAsk = Date.now(); $("#clear").textContent = "Точно очистити?"; setTimeout(() => $("#clear").textContent = "Очистити", 4000); return; }
  clearAsk = 0; $("#clear").textContent = "Очистити"; snap(); px = Array(W * H).fill(null); draw(); keep();
};
$("#undo").onclick = undo; $("#redo").onclick = redo;
document.addEventListener("keydown", e => {
  if (/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;
  const k = e.key.toLowerCase();
  if ((e.ctrlKey || e.metaKey) && k === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); }
  else if ((e.ctrlKey || e.metaKey) && k === "y") { e.preventDefault(); redo(); }
  else if (!e.ctrlKey && !e.metaKey) { const t = { b: "pen", p: "pen", e: "eraser", g: "fill", f: "fill", i: "pick", l: "line", r: "rect" }[k]; if (t) setTool(t); }
});
window.addEventListener("resize", () => { clearTimeout(window.__pxr); window.__pxr = setTimeout(fit, 150); });

// ---------- картинка й акаунт ----------
const st = t => $("#st").textContent = t;
$("#png").onclick = () => {
  const s = +$("#scale").value, c = document.createElement("canvas"); c.width = W * s; c.height = H * s;
  const x = c.getContext("2d");
  px.forEach((col, i) => { if (col) { x.fillStyle = col; x.fillRect((i % W) * s, ((i / W) | 0) * s, s, s); } });
  c.toBlob(b => { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `піксельарт-${W}x${H}.png`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); });
};
const when = t => { const d = new Date(t); return d.toLocaleDateString("uk-UA", { day: "numeric", month: "long" }) + " о " + d.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" }); };
const saved = () => { const sb = KV.profile().sandbox; return sb && sb.pix || null; };
const show = () => { const v = saved(); st(!KV.session ? "Щоб зберегти малюнок в акаунт, увійди на головній сторінці порталу." : v ? `Збережений малюнок ${v.w} × ${v.h}: ${when(v.at)}.` : "Збереженого малюнка ще немає."); };
$("#save").onclick = () => {
  if (!KV.session) return show();
  const p = KV.profile(); p.sandbox = Object.assign({}, p.sandbox || {});
  p.sandbox.pix = Object.assign(encode(), { at: Date.now() });
  KV.save("profile"); KV.scheduleSync(true);
  st(`💾 Збережено ${when(p.sandbox.pix.at)}. Відкрити можна з будь-якого комп'ютера після входу.`);
};
$("#open").onclick = () => { const v = saved(); if (!v) return show(); snap(); decode(v); fit(); keep(); st(`📂 Відкрито малюнок від ${when(v.at)}.`); };

// ---------- старт ----------
let start = null; try { start = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
if (!decode(start)) { W = 16; H = 16; px = Array(W * H).fill(null); }
recent = start && Array.isArray(start.recent) ? start.recent.slice(0, 8) : [];
setTool("pen"); setColor(color); btns(); fit(); show();
if (KV.session && KV.pull) KV.pull().then(show);
if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) window.__pix = { get px() { return px; }, get W() { return W; }, get H() { return H; } };
})();
