/* Блок-схеми: малюємо схему з опису і завдання до неї (5 клас) */
(function () {
"use strict";
// Опис схеми — масив кроків. Крок: { k, text, id }
//   k: "term" (Початок/Кінець), "proc" (дія), "io" (ввести/вивести), "if" (умова), "loop" (цикл-шестикутник), "while" (умова-цикл)
//   if: yes: [...], no: [...], onlyYes: true — намалювати лише один вихід (для завдань «знайди помилку»)
//   loop/while: body: [...]
// Особливі позначки кроку: blank — порожнє місце (для «збери схему»), ask — форму обирає учень.
const SH = {
  term: { w: 120, h: 38, name: "Термінатор", about: "початок або кінець алгоритму" },
  proc: { w: 140, h: 40, name: "Процес", about: "дія або обчислення" },
  io: { w: 150, h: 40, name: "Дані", about: "введення або виведення" },
  if: { w: 156, h: 62, name: "Умова", about: "перевірка, два виходи «так» і «ні»" },
  loop: { w: 150, h: 42, name: "Цикл", about: "повторення кілька разів" },
  while: { w: 156, h: 62, name: "Умова", about: "перевірка, два виходи «так» і «ні»" },
};
const GAP = 26, ARM = 22;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// форма блока з центром (x, y)
function shapePath(k, x, y, w, h) {
  const a = w / 2, b = h / 2;
  if (k === "term") return `<rect x="${x - a}" y="${y - b}" width="${w}" height="${h}" rx="${b}"/>`;
  if (k === "proc") return `<rect x="${x - a}" y="${y - b}" width="${w}" height="${h}"/>`;
  if (k === "io") { const s = 14; return `<polygon points="${x - a + s},${y - b} ${x + a},${y - b} ${x + a - s},${y + b} ${x - a},${y + b}"/>`; }
  if (k === "if" || k === "while") return `<polygon points="${x},${y - b} ${x + a},${y} ${x},${y + b} ${x - a},${y}"/>`;
  if (k === "loop") { const s = 16; return `<polygon points="${x - a + s},${y - b} ${x + a - s},${y - b} ${x + a},${y} ${x + a - s},${y + b} ${x - a + s},${y + b} ${x - a},${y}"/>`; }
  return `<rect x="${x - a}" y="${y - b}" width="${w}" height="${h}" rx="6"/>`;
}
function label(text, x, y, k) {
  const lines = String(text || "").split("\n"), fs = (k === "if" || k === "while") && lines.length > 1 ? 11.5 : 12.5, lh = fs + 2;
  return lines.map((ln, i) => `<text x="${x}" y="${y + (i - (lines.length - 1) / 2) * lh + fs * 0.35}" text-anchor="middle" font-size="${fs}">${esc(ln)}</text>`).join("");
}

// розміщення: повертає ширину ліворуч/праворуч від осі і висоту, малює в out
function laySeq(seq, ctx) {
  const parts = (seq || []).map(n => layNode(n, ctx));
  const h = parts.reduce((s, p) => s + p.h, 0) + Math.max(0, parts.length - 1) * GAP;
  return {
    l: Math.max(0, ...parts.map(p => p.l)), r: Math.max(0, ...parts.map(p => p.r)), h,
    draw(cx, y, out) { let yy = y; parts.forEach((p, i) => { if (i) arrow(out, cx, yy - GAP, cx, yy, ctx, parts[i].node); p.draw(cx, yy, out); yy += p.h + GAP; }); },
  };
}
// ширина блока росте разом із підписом, щоб текст не вилазив за фігуру
function fitW(k, text) {
  const s = SH[k] || SH.proc, t = Math.max(0, ...String(text || "").split("\n").map(l => l.length)) * 7.4;
  const pad = { term: 34, proc: 26, io: 44, loop: 48 }[k];
  return Math.round(Math.max(s.w, k === "if" || k === "while" ? t * 1.6 + 34 : t + (pad || 26)));
}
function nodeSize(n) { const s = SH[n.k] || SH.proc; return { w: n.w || fitW(n.k, n.text), h: s.h }; }
function layNode(n, ctx) {
  if (!n.id) n.id = "n" + (ctx.n++);
  const { w, h } = nodeSize(n);
  if (n.k === "if") {
    const Y = laySeq(n.yes, ctx), N = n.onlyYes ? { l: 0, r: 0, h: 0, draw() {} } : laySeq(n.no, ctx);
    const xl = -Math.max(w / 2 + 16, Y.r + 18), xr = Math.max(w / 2 + 16, N.l + 18);
    const top = h + 22, bh = Math.max(Y.h, N.h), ym = top + bh + 18;
    return { node: n, l: Math.max(w / 2, -xl + Y.l), r: n.onlyYes ? w / 2 : Math.max(w / 2, xr + N.r), h: ym,
      draw(cx, y, out) {
        box(out, n, cx, y + h / 2, w, h, ctx);
        const vy = y + h / 2;
        const branch = (S, x, word, side) => {
          out.push(`<path class="ln" d="M${cx + side * w / 2} ${vy} H${cx + x}"/>`);
          out.push(`<text class="yn" x="${cx + side * (w / 2 + 4)}" y="${vy - 5}" text-anchor="${side < 0 ? "end" : "start"}">${word}</text>`);
          if (S.h) { arrow(out, cx + x, vy, cx + x, y + top, ctx, (n[side < 0 ? "yes" : "no"] || [])[0]); S.draw(cx + x, y + top, out); out.push(`<path class="ln" d="M${cx + x} ${y + top + S.h} V${y + ym} H${cx}"/>`); }
          else out.push(`<path class="ln" d="M${cx + x} ${vy} V${y + ym} H${cx}"/>`);
        };
        branch(Y, xl, "так", -1);
        if (!n.onlyYes) branch(N, xr, "ні", 1);
        out.push(`<circle class="dot" cx="${cx}" cy="${y + ym}" r="2.6"/>`);
      } };
  }
  if (n.k === "loop" || n.k === "while") {
    const B = laySeq(n.body, ctx);
    const L = Math.max(B.l, w / 2) + ARM, R = Math.max(B.r, w / 2) + ARM;
    const bt = h + GAP, bb = bt + B.h, back = bb + 14, exit = back + 16;
    return { node: n, l: L, r: R, h: exit,
      draw(cx, y, out) {
        box(out, n, cx, y + h / 2, w, h, ctx);
        const my = y + h / 2;
        arrow(out, cx, y + h, cx, y + bt, ctx, (n.body || [])[0]);
        B.draw(cx, y + bt, out);
        out.push(`<path class="ln arr" d="M${cx} ${y + bb} V${y + back} H${cx - L} V${my} H${cx - w / 2}"/>`);
        out.push(`<path class="ln" d="M${cx + w / 2} ${my} H${cx + R} V${y + exit} H${cx}"/>`);
        if (n.k === "while") {
          out.push(`<text class="yn" x="${cx + 6}" y="${y + h + 12}">так</text>`);
          out.push(`<text class="yn" x="${cx + w / 2 + 4}" y="${my - 5}">ні</text>`);
        }
      } };
  }
  return { node: n, l: w / 2, r: w / 2, h, draw(cx, y, out) { box(out, n, cx, y + h / 2, w, h, ctx); } };
}
function arrow(out, x1, y1, x2, y2, ctx, to) {
  // стрілка без наконечника, якщо так задумано в завданні «знайди помилку»
  out.push(`<path class="ln${to && to.noArrow ? "" : " arr"}" d="M${x1} ${y1} V${y2}"/>`);
}
function box(out, n, x, y, w, h, ctx) {
  const st = ctx.state[n.id] || {};
  const blank = n.blank && !st.fill, unknown = n.ask && !st.k;
  const k = blank ? null : n.blank ? st.fill.k : n.ask ? st.k : n.k;
  const text = blank ? "?" : n.blank ? st.fill.text : n.text;
  const cls = ["fn", blank || unknown ? "unk" : "k-" + k, st.cls || "", ctx.click || n.blank || n.ask ? "can" : ""].join(" ");
  out.push(`<g class="${cls}" data-id="${n.id}">${blank || unknown ? `<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="8"/>` : shapePath(k, x, y, w, h)}${label(text, x, y, k)}</g>`);
}
function svgOf(fc, ctx) {
  ctx = Object.assign({ n: 0, state: {} }, ctx);
  const S = laySeq(fc, ctx), pad = 14, W = S.l + S.r + pad * 2, H = S.h + pad * 2;
  const out = [];
  S.draw(pad + S.l, pad, out);
  return `<svg class="flow" viewBox="0 0 ${W} ${H}" style="max-width:${Math.round(W * 1.12)}px" role="img" aria-label="Блок-схема">
    <defs><marker id="fa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" class="ah"/></marker></defs>${out.join("")}</svg>`;
}
// одиночний блок для плиток і варіантів
function chip(k, text, w) {
  const s = SH[k], ww = w || fitW(k, text), hh = s.h, W = ww + 8, H = hh + 8;
  return `<svg class="flow chipsvg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><g class="fn k-${k}">${shapePath(k, W / 2, H / 2, ww, hh)}${label(text || "", W / 2, H / 2, k)}</g></svg>`;
}
const walk = (seq, f) => (seq || []).forEach(n => { f(n); walk(n.yes, f); walk(n.no, f); walk(n.body, f); });
const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const KNAME = { term: "термінатор", proc: "процес", io: "дані", if: "умова", while: "умова", loop: "цикл" };

window.FLOW = { svgOf, chip, SH };
const T = {};

// питання до схеми з варіантами відповіді
T.fcq = (it, A) => {
  const order = A.st.order || (A.st.order = shuffle(it.options.map((_, i) => i)));
  A.frame(it, `<div class="q">${A.md(it.q)}</div><div class="flowbox">${it.fc ? svgOf(it.fc) : ""}</div>
    <div class="options">${order.map(i => `<button class="opt" data-i="${i}">${A.md(it.options[i])}</button>`).join("")}</div>`);
  A.setActs("");
  document.querySelectorAll(".opt").forEach(b => b.onclick = () => {
    const ok = +b.dataset.i === it.a;
    document.querySelectorAll(".opt").forEach(o => { o.disabled = true; if (+o.dataset.i === it.a) o.classList.add("right"); });
    if (!ok) { b.classList.add("wrong"); A.lose(); A.frame0Hearts(); }
    A.feedback(ok, ok ? A.praise() : "Не зовсім", it.why || "");
    A.nextBtn();
  });
};

// «Яка це фігура?» — блок без підпису і варіанти назв
T.fcname = (it, A) => {
  const names = ["term", "proc", "io", "if", "loop"];
  A.frame(it, `<div class="q">${A.md(it.q || "Як називається цей блок?")}</div><div class="flowbox one">${chip(it.k, it.text || "")}</div>
    <div class="options">${shuffle(names).map(k => `<button class="opt" data-k="${k}">${SH[k].name}</button>`).join("")}</div>`);
  A.setActs("");
  const right = it.k === "while" ? "if" : it.k;
  document.querySelectorAll(".opt").forEach(b => b.onclick = () => {
    const ok = b.dataset.k === right;
    document.querySelectorAll(".opt").forEach(o => { o.disabled = true; if (o.dataset.k === right) o.classList.add("right"); });
    if (!ok) { b.classList.add("wrong"); A.lose(); A.frame0Hearts(); }
    A.feedback(ok, ok ? A.praise() : "Не зовсім", `Це ${SH[right].name.toLowerCase()}: ${SH[right].about}. ${it.why || ""}`);
    A.nextBtn();
  });
};

// «Клацни на блок»: знайти помилку або потрібний крок
T.fcclick = (it, A) => {
  const ok = [].concat(it.a);
  const state = {};
  const draw = () => { A.$("#fbox").innerHTML = svgOf(it.fc, { state, click: true }); bind(); };
  A.frame(it, `<div class="q">${A.md(it.q)}</div><div class="flowbox" id="fbox"></div>`);
  A.setActs("");
  let done = false;
  const bind = () => A.$("#fbox").querySelectorAll(".fn").forEach(g => g.onclick = () => {
    if (done) return; done = true;
    const good = ok.includes(g.dataset.id);
    ok.forEach(id => state[id] = { cls: "right" });
    if (!good) { state[g.dataset.id] = { cls: "wrong" }; A.lose(); A.frame0Hearts(); }
    draw();
    A.feedback(good, good ? A.praise() : "Ось де", it.why || "");
    A.nextBtn();
  });
  draw();
};

// «Збери схему»: у порожні місця ставимо блоки із запасу (у запасі є й зайві)
T.fcfill = (it, A) => {
  const blanks = []; walk(it.fc, n => { if (n.blank) blanks.push(n); });
  if (!A.st.pool) A.st.pool = shuffle([...blanks.map(n => ({ k: n.k, text: n.text })), ...(it.extra || [])]).map((b, i) => Object.assign({ i }, b));
  const pool = A.st.pool, state = {}, used = {};
  let sel = null, tries = 0, done = false;
  A.frame(it, `<div class="q">${A.md(it.q)}</div><div class="flowbox" id="fbox"></div>
    <div class="fhint" id="fhint">Клацни на блок унизу — він стане на перше порожнє місце. Щоб прибрати блок зі схеми, клацни на нього.</div>
    <div class="fpool" id="fpool"></div>`);
  const draw = () => {
    A.$("#fbox").innerHTML = svgOf(it.fc, { state });
    A.$("#fbox").querySelectorAll(".fn.can").forEach(g => g.onclick = () => {
      if (done) return;
      const st = state[g.dataset.id];
      if (st && st.fill) { delete used[st.fill.i]; delete state[g.dataset.id]; sel = g.dataset.id; }
      else sel = g.dataset.id;
      draw();
    });
    if (sel) { const g = A.$("#fbox").querySelector(`.fn[data-id="${sel}"]`); if (g) g.classList.add("sel"); }
    A.$("#fpool").innerHTML = pool.map(b => `<button class="fchip" data-i="${b.i}" ${used[b.i] || done ? "disabled" : ""}>${chip(b.k, b.text)}</button>`).join("");
    A.$("#fpool").querySelectorAll(".fchip").forEach(c => c.onclick = () => {
      const b = pool[+c.dataset.i];
      const target = sel && !(state[sel] && state[sel].fill) ? sel : (blanks.find(n => !(state[n.id] && state[n.id].fill)) || {}).id;
      if (!target) return;
      state[target] = { fill: b }; used[b.i] = true; sel = null;
      draw();
    });
  };
  const right = n => state[n.id] && state[n.id].fill && state[n.id].fill.k === n.k && state[n.id].fill.text === n.text;
  const check = () => {
    if (blanks.some(n => !(state[n.id] && state[n.id].fill))) { A.$("#fhint").textContent = "Спершу заповни всі порожні місця."; return; }
    if (blanks.every(right)) { done = true; A.$("#fhint").textContent = ""; blanks.forEach(n => state[n.id].cls = "right"); draw(); A.feedback(tries === 0, tries === 0 ? A.praise() : "Тепер правильно!", it.why || ""); A.nextBtn(); return; }
    tries++;
    if (tries === 1) { A.lose(); A.frame0Hearts(); }
    if (tries >= 2) {
      done = true;
      blanks.forEach(n => { const ok = right(n); state[n.id] = { fill: { k: n.k, text: n.text }, cls: ok ? "right" : "fixed" }; });
      draw(); A.$("#fhint").textContent = ""; A.feedback(false, "Ось правильна схема", it.why || ""); A.nextBtn(); return;
    }
    blanks.forEach(n => { if (!right(n)) { delete used[state[n.id].fill.i]; state[n.id] = { cls: "" }; } });
    sel = null; draw();
    A.$("#fhint").textContent = "Неправильні блоки повернулися вниз. Спробуй ще раз.";
  };
  A.setActs(`<button class="btn" id="ck">Перевірити</button>`, { ck: check });
  draw();
};

// «Яка форма?»: підписи вже є, форму кожного блока обирає учень
T.fcshape = (it, A) => {
  const asks = []; walk(it.fc, n => { if (n.ask) asks.push(n); });
  const state = {}; let brush = null, tries = 0, done = false;
  const kinds = ["term", "proc", "io", "if", "loop"];
  A.frame(it, `<div class="q">${A.md(it.q)}</div>
    <div class="fhint" id="fhint">Обери форму вгорі, а потім клацай на блоки з пунктирною рамкою.</div>
    <div class="fpal" id="fpal">${kinds.map(k => `<button class="fchip pal" data-k="${k}">${chip(k, "", 96)}<span>${SH[k].name}</span></button>`).join("")}</div>
    <div class="flowbox" id="fbox"></div>`);
  A.$("#fpal").querySelectorAll(".pal").forEach(b => b.onclick = () => { if (done) return; brush = b.dataset.k; A.$("#fpal").querySelectorAll(".pal").forEach(x => x.classList.toggle("on", x === b)); });
  const norm = k => k === "while" ? "if" : k;
  const draw = () => {
    A.$("#fbox").innerHTML = svgOf(it.fc, { state });
    A.$("#fbox").querySelectorAll(".fn.can").forEach(g => g.onclick = () => {
      if (done) return;
      if (!brush) { A.$("#fhint").textContent = "Спершу обери форму вгорі."; return; }
      state[g.dataset.id] = { k: brush }; draw();
    });
  };
  const check = () => {
    if (asks.some(n => !state[n.id])) { A.$("#fhint").textContent = "Ще не всім блокам обрано форму."; return; }
    const wrong = asks.filter(n => norm(state[n.id].k) !== norm(n.k));
    if (!wrong.length) { done = true; A.$("#fhint").textContent = ""; asks.forEach(n => state[n.id].cls = "right"); draw(); A.feedback(tries === 0, tries === 0 ? A.praise() : "Тепер правильно!", it.why || ""); A.nextBtn(); return; }
    tries++;
    if (tries === 1) { A.lose(); A.frame0Hearts(); }
    if (tries >= 2) {
      done = true;
      asks.forEach(n => { const ok = norm(state[n.id].k) === norm(n.k); state[n.id] = { k: n.k, cls: ok ? "right" : "fixed" }; });
      draw(); A.$("#fhint").textContent = ""; A.feedback(false, "Ось правильні форми", wrong.map(n => `«${n.text.replace(/\n/g, " ")}» — ${KNAME[n.k]}`).join("; ") + ". " + (it.why || "")); A.nextBtn(); return;
    }
    wrong.forEach(n => state[n.id] = { k: state[n.id].k, cls: "wrong" });
    draw();
    A.$("#fhint").textContent = `Неправильних форм — ${wrong.length}. Їх позначено червоним, виправ.`;
  };
  A.setActs(`<button class="btn" id="ck">Перевірити</button>`, { ck: check });
  draw();
};

window.GAME_TYPES = Object.assign(window.GAME_TYPES || {}, T);
})();
