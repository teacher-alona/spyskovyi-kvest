// Пісочниця блок-схем: учень сам складає схему, стрілки й гілки малюються автоматично
(function () {
"use strict";
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const KEY = "kv-flow-sandbox";
const { svgOf, chip, SH } = window.FLOW;

// ---------- схема ----------
let uid = 1;
const nid = () => "b" + (uid++);
const NEW = {
  proc: () => ({ k: "proc", text: "Дія" }),
  io: () => ({ k: "io", text: "Ввести число" }),
  if: () => ({ k: "if", text: "Умова?", yes: [], no: [] }),
  loop: () => ({ k: "loop", text: "Повторити 3 рази", body: [] }),
  while: () => ({ k: "while", text: "Умова?", body: [] }),
};
const KNAME = { term: "Початок / кінець", proc: "Процес — дія", io: "Дані — ввести чи вивести", if: "Умова — розгалуження", loop: "Цикл — повторити кілька разів", while: "Цикл з умовою — повторювати, доки…" };
const PAL = ["proc", "io", "if", "loop", "while"];
const PAL_NAME = { proc: "Процес", io: "Дані", if: "Умова", loop: "Цикл", while: "Цикл з умовою" };
const blankChart = () => ({ title: "", fc: [{ k: "term", text: "Початок" }, { k: "term", text: "Кінець" }] });

const S = (t, o) => Object.assign({ k: "term", text: t }, o);
const P = t => ({ k: "proc", text: t }), D = t => ({ k: "io", text: t });
const EX = [
  ["Заварити чай", [S("Початок"), P("Закип'ятити воду"), P("Покласти чай у чашку"), P("Налити окріп"), D("Подати чай"), S("Кінець")]],
  ["Парасолька", [S("Початок"), D("Подивитися у вікно"), { k: "if", text: "Іде дощ?", yes: [P("Взяти парасольку")], no: [P("Взяти кепку")] }, P("Вийти з дому"), S("Кінець")]],
  ["Більше з двох чисел", [S("Початок"), D("Ввести a, b"), { k: "if", text: "a > b?", yes: [D("Вивести a")], no: [D("Вивести b")] }, S("Кінець")]],
  ["Зарядка", [S("Початок"), { k: "loop", text: "Повторити 10 разів", body: [P("Присісти"), P("Встати")] }, D("Вивести «Готово!»"), S("Кінець")]],
  ["Поки не зварилося", [S("Початок"), P("Поставити каструлю"), { k: "while", text: "Вода холодна?", body: [P("Чекати 1 хвилину")] }, P("Кинути макарони"), S("Кінець")]],
];

let chart = blankChart(), sel = null, where = "after", hist = [], confirmDel = false;
const each = (seq, f) => (seq || []).forEach(n => { f(n); each(n.yes, f); each(n.no, f); each(n.body, f); });
function ids(seq) {
  const seen = new Set();
  each(seq, n => { if (/^b\d+$/.test(n.id || "")) uid = Math.max(uid, +n.id.slice(1) + 1); });
  each(seq, n => { if (!/^b\d+$/.test(n.id || "") || seen.has(n.id)) n.id = nid(); seen.add(n.id); });
}
const strip = seq => JSON.parse(JSON.stringify(seq));
function locate(id, seq = chart.fc) {
  for (let i = 0; i < seq.length; i++) {
    const n = seq[i];
    if (n.id === id) return { arr: seq, i, n };
    for (const k of ["yes", "no", "body"]) if (n[k]) { const r = locate(id, n[k]); if (r) return r; }
  }
  return null;
}
const isRootEnd = loc => loc.arr === chart.fc && (loc.i === 0 || loc.i === chart.fc.length - 1) && loc.n.k === "term";
let count = 0;
const countAll = seq => (seq || []).reduce((s, n) => s + 1 + countAll(n.yes) + countAll(n.no) + countAll(n.body), 0);

// ---------- збереження в браузері й історія ----------
const keep = () => { try { localStorage.setItem(KEY, JSON.stringify({ title: chart.title, fc: chart.fc })); } catch (e) {} };
const snap = () => { hist.push(JSON.stringify(chart)); if (hist.length > 60) hist.shift(); $("#undo").disabled = false; };
function undo() {
  if (!hist.length) return;
  chart = JSON.parse(hist.pop()); ids(chart.fc); $("#title").value = chart.title || "";
  if (sel && !locate(sel)) sel = null;
  $("#undo").disabled = !hist.length; keep(); draw();
}
function setChart(c, select) {
  chart = { title: c.title || "", fc: strip(c.fc) }; ids(chart.fc);
  $("#title").value = chart.title; sel = select === false ? null : chart.fc[0].id; where = "after"; keep(); draw();
}

// ---------- малювання ----------
function draw() {
  const state = {}; if (sel) state[sel] = { cls: "sel" };
  const box = $("#canvas");
  box.innerHTML = svgOf(chart.fc, { state, click: true });
  const svg = box.querySelector("svg"), vb = svg.viewBox.baseVal;
  svg.style.maxWidth = "none"; svg.style.width = Math.round(vb.width * 1.15) + "px";
  box.querySelectorAll(".fn").forEach(g => g.onclick = e => { e.stopPropagation(); pick(g.dataset.id); });
  count = countAll(chart.fc);
  panel();
}
function pick(id) {
  if (sel !== id) { sel = id; where = "after"; confirmDel = false; }
  draw();
  if (window.innerWidth < 860) { const p = $("#panel").getBoundingClientRect(); if (p.top > window.innerHeight - 120) $("#panel").scrollIntoView({ behavior: "smooth", block: "start" }); }
}
$("#canvas").onclick = () => { if (sel) { sel = null; draw(); } };

function panel() {
  const loc = sel && locate(sel), box = $("#panel");
  if (!loc) { box.innerHTML = `<div class="fsb-empty"><b>Клацни на будь-який блок схеми.</b><p>Потім тут можна буде змінити його напис або додати після нього новий блок.</p><p class="muted">Блоків у схемі: ${count}</p></div>`; return; }
  const n = loc.n, fixed = isRootEnd(loc), isLast = loc.arr === chart.fc && loc.i === chart.fc.length - 1;
  const spots = n.k === "if" ? [["after", "після умови"], ["yes", "у гілку «так»"], ["no", "у гілку «ні»"]]
    : n.k === "loop" || n.k === "while" ? [["after", "після циклу"], ["body", "всередину циклу"]] : null;
  if (!spots || !spots.some(s => s[0] === where)) where = "after";
  const canUp = loc.i > (loc.arr === chart.fc ? 1 : 0), canDown = loc.i < loc.arr.length - (loc.arr === chart.fc ? 2 : 1);
  box.innerHTML = `
    <div class="fsb-kind">${chip(n.k, "", 60)}<b>${esc(KNAME[n.k])}</b></div>
    <label class="fsb-lab" for="txt">Напис у блоці</label>
    <textarea id="txt" class="answer-input fsb-txt" rows="2" maxlength="80" spellcheck="false">${esc(n.text)}</textarea>
    <p class="muted fsb-small">Новий рядок — Shift + Enter.</p>
    ${n.k === "proc" || n.k === "io" ? `<div class="fsb-row"><span>Форма:</span>${["proc", "io"].map(k => `<button class="btn ghost fsb-tg${n.k === k ? " on" : ""}" data-kind="${k}">${PAL_NAME[k]}</button>`).join("")}</div>` : ""}
    ${!fixed ? `<div class="fsb-row"><button class="btn ghost" id="up" ${canUp ? "" : "disabled"} title="Вище">↑</button><button class="btn ghost" id="down" ${canDown ? "" : "disabled"} title="Нижче">↓</button><button class="btn ghost fsb-del" id="del">${confirmDel ? "Точно видалити?" + (n.yes || n.body ? " Разом із тим, що всередині" : "") : "🗑 Видалити"}</button></div>` : ""}
    <h3 class="fsb-h">${isLast ? "Додати перед «" + esc(n.text) + "»" : "Додати новий блок"}</h3>
    ${spots ? `<div class="fsb-row fsb-where">${spots.map(([w, t]) => `<button class="btn ghost fsb-tg${where === w ? " on" : ""}" data-where="${w}">${t}</button>`).join("")}</div>` : ""}
    <div class="fsb-pal">${PAL.map(k => `<button class="fchip" data-add="${k}" title="${esc(KNAME[k])}">${chip(k, "", 64)}<span>${PAL_NAME[k]}</span></button>`).join("")}</div>`;
  const ta = $("#txt");
  let typed = false;
  ta.oninput = () => { if (!typed) { snap(); typed = true; } n.text = ta.value.split("\n").slice(0, 3).join("\n"); keep(); redrawOnly(); };
  ta.onkeydown = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ta.blur(); } };
  box.querySelectorAll("[data-kind]").forEach(b => b.onclick = () => { if (n.k === b.dataset.kind) return; snap(); n.k = b.dataset.kind; keep(); draw(); });
  box.querySelectorAll("[data-where]").forEach(b => b.onclick = () => { where = b.dataset.where; panel(); });
  box.querySelectorAll("[data-add]").forEach(b => b.onclick = () => add(b.dataset.add));
  if (!fixed) {
    $("#up").onclick = () => move(-1); $("#down").onclick = () => move(1);
    $("#del").onclick = () => { if (!confirmDel) { confirmDel = true; panel(); return; } snap(); loc.arr.splice(loc.i, 1); sel = (loc.arr[Math.min(loc.i, loc.arr.length - 1)] || {}).id || null; if (!sel) sel = chart.fc[0].id; confirmDel = false; keep(); draw(); };
  }
}
// лише перемалювати схему (поки учень пише текст — поле вводу не чіпаємо)
function redrawOnly() {
  const state = {}; if (sel) state[sel] = { cls: "sel" };
  const box = $("#canvas"), keepScroll = [box.scrollLeft, box.scrollTop];
  box.innerHTML = svgOf(chart.fc, { state, click: true });
  const svg = box.querySelector("svg"); svg.style.maxWidth = "none"; svg.style.width = Math.round(svg.viewBox.baseVal.width * 1.15) + "px";
  box.querySelectorAll(".fn").forEach(g => g.onclick = e => { e.stopPropagation(); pick(g.dataset.id); });
  [box.scrollLeft, box.scrollTop] = keepScroll;
}
function add(k) {
  const loc = locate(sel); if (!loc) return;
  if (count >= 80) { $("#st").textContent = "Схема вже дуже велика — 80 блоків. Спробуй розділити її на кілька схем."; return; }
  snap();
  const n = NEW[k](); n.id = nid();
  if (where === "yes" || where === "no" || where === "body") { loc.n[where] = loc.n[where] || []; loc.n[where].unshift(n); }
  else if (loc.arr === chart.fc && loc.i === chart.fc.length - 1) loc.arr.splice(loc.i, 0, n);   // перед «Кінцем»
  else loc.arr.splice(loc.i + 1, 0, n);
  sel = n.id; where = "after"; confirmDel = false; keep(); draw();
  const ta = $("#txt"); if (ta && window.innerWidth >= 860) { ta.focus(); ta.select(); }
}
function move(d) {
  const loc = locate(sel); if (!loc) return;
  const j = loc.i + d; snap();
  [loc.arr[loc.i], loc.arr[j]] = [loc.arr[j], loc.arr[loc.i]]; keep(); draw();
}

// ---------- кнопки ----------
$("#ex").innerHTML += EX.map((e, i) => `<option value="${i}">${esc(e[0])}</option>`).join("");
$("#ex").onchange = () => { const i = $("#ex").value; if (i === "") return; snap(); setChart({ title: EX[i][0], fc: EX[i][1] }); $("#ex").value = ""; };
$("#fresh").onclick = () => { snap(); setChart(blankChart()); };
$("#undo").onclick = undo;
$("#undo").disabled = true;
$("#title").oninput = () => { chart.title = $("#title").value; keep(); };
document.addEventListener("keydown", e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); undo(); }
  if ((e.key === "Delete") && sel && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { const d = $("#del"); if (d) d.click(); }
});

// картинка PNG: стилі схеми вбудовуємо прямо в SVG
const CSS = `text{font-family:Nunito,Arial,sans-serif;font-weight:700;fill:#1f2430}.fn>rect,.fn>polygon{stroke:#39404d;stroke-width:2}.k-term>rect{fill:#ffd9a8}.k-proc>rect{fill:#cfe6ff}.k-io>polygon{fill:#d7f2d0}.k-if>polygon,.k-while>polygon{fill:#ffe9a6}.k-loop>polygon{fill:#ead8ff}.ln{fill:none;stroke:#39404d;stroke-width:1.8}.ln.arr{marker-end:url(#fa)}.ah{fill:#39404d}.dot{fill:#39404d}.yn{font-size:11px;font-weight:800;fill:#5a6170}`;
$("#png").onclick = () => {
  const src = svgOf(strip(chart.fc), {}), tmp = document.createElement("div"); tmp.innerHTML = src;
  const svg = tmp.querySelector("svg"), vb = svg.viewBox.baseVal, title = (chart.title || "").trim(), top = title ? 34 : 0;
  const W = vb.width, H = vb.height + top, sc = 2;
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg"); svg.setAttribute("width", W); svg.setAttribute("height", vb.height); svg.removeAttribute("style");
  svg.insertAdjacentHTML("afterbegin", `<style>${CSS}</style>`);
  const img = new Image();
  img.onload = () => {
    const c = document.createElement("canvas"); c.width = W * sc; c.height = H * sc;
    const g = c.getContext("2d"); g.scale(sc, sc); g.fillStyle = "#fff"; g.fillRect(0, 0, W, H);
    if (title) { g.fillStyle = "#1f2430"; g.font = "800 17px Nunito, Arial, sans-serif"; g.textAlign = "center"; g.fillText(title, W / 2, 24); }
    g.drawImage(img, 0, top, W, vb.height);
    c.toBlob(b => { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = (title || "блок-схема").replace(/[\\/:*?"<>|]/g, "") + ".png"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); });
  };
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(svg));
};

// збереження в акаунт: одна схема
const st = t => $("#st").textContent = t;
const when = t => { const d = new Date(t); return d.toLocaleDateString("uk-UA", { day: "numeric", month: "long" }) + " о " + d.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" }); };
const saved = () => { const sb = KV.profile().sandbox; return sb && sb.flow || null; };
const show = () => { const v = saved(); st(!KV.session ? "Щоб зберегти схему в акаунт, увійди на головній сторінці порталу." : v ? `Збережена схема${v.title ? " «" + v.title + "»" : ""}: ${when(v.at)}.` : "Збереженої схеми ще немає."); };
$("#save").onclick = () => {
  if (!KV.session) return show();
  const p = KV.profile(); p.sandbox = Object.assign({}, p.sandbox || {});
  p.sandbox.flow = { at: Date.now(), title: chart.title || "", fc: strip(chart.fc) };
  KV.save("profile"); KV.scheduleSync(true);
  st(`💾 Збережено ${when(p.sandbox.flow.at)}. Відкрити можна з будь-якого комп'ютера після входу.`);
};
$("#open").onclick = () => { const v = saved(); if (!v) return show(); snap(); setChart(v); st(`📂 Відкрито схему від ${when(v.at)}.`); };

let start = null; try { start = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
setChart(start && Array.isArray(start.fc) && start.fc.length >= 2 ? start : blankChart());
show();
if (KV.session && KV.pull) KV.pull().then(show);
})();
