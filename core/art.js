/* Цифрове мистецтво: тренажери для растрової і векторної графіки
   pxpaint — розфарбуй пікселі за кодом; pxwrite — запиши код картинки;
   vfill — заливка й обведення як у Inkscape; vorder — порядок об'єктів (Home/End/PageUp/PageDown) або шари Photopea */
(function () {
"use strict";
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// таблиця кольорів із презентації
const PAL8 = [[0, "Чорний", "#1d1d1f"], [1, "Синій", "#2f6fe4"], [2, "Зелений", "#2fa84f"], [3, "Коричневий", "#8a5a2b"], [4, "Червоний", "#e53935"], [5, "Фіолетовий", "#8e44ad"], [6, "Жовтий", "#ffd23d"], [7, "Білий", "#ffffff"]];
const colorOf = (pal, c) => (pal.find(p => p[0] === c) || [0, "", "#ccc"])[2];

// маленька картинка з пікселів у SVG (для питань і уроків)
function pxSVG(w, h, codes, pal, cell) {
  pal = pal || PAL8; cell = cell || 22;
  let r = "";
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) r += `<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}" fill="${colorOf(pal, codes[y * w + x])}" stroke="#c9c9d6" stroke-width="1"/>`;
  return `<svg class="px-svg" viewBox="-1 -1 ${w * cell + 2} ${h * cell + 2}" width="${w * cell + 2}" height="${h * cell + 2}" role="img" aria-label="Піксельна картинка ${w} на ${h}">${r}</svg>`;
}
const palTable = pal => `<div class="px-pal">${pal.map(([c, n, css]) => `<span class="px-sw"><i style="background:${css}"></i><b>${c}</b> ${esc(n)}</span>`).join("")}</div>`;

// ---------- pxpaint: розфарбуй за кодом ----------
function rPaint(it, A) {
  const st = A.st, pal = it.pal || PAL8, w = it.w, h = it.h;
  st.grid = st.grid || Array(w * h).fill(it.bg ?? 7);
  let cur = pal[0][0];
  const seq = [h, w].concat(it.codes);
  A.frame(it, `<div class="q">${A.md(it.q || "Розфарбуй пікселі за кодом. Перші два числа — висота і ширина малюнка, далі — коди кольорів рядок за рядком, зліва направо.")}</div>
    <div class="px-code"><span class="muted">Код:</span> <code>${seq.join(", ")}</code></div>
    ${palTable(pal)}
    <div class="px-work"><div class="px-brushes">${pal.map(([c, n, css]) => `<button class="px-brush${c === cur ? " on" : ""}" data-c="${c}" style="--c:${css}" title="${esc(n)}"><i></i>${c}</button>`).join("")}</div>
    <div class="px-grid" style="grid-template-columns:repeat(${w}, var(--px))" role="grid" aria-label="Поле ${w} на ${h}"></div></div>
    <div id="hintbox"></div>`);
  const grid = A.$(".px-grid");
  let painting = false, done = false;
  const draw = () => {
    grid.innerHTML = st.grid.map((c, i) => `<div class="px-cell" data-i="${i}" style="background:${colorOf(pal, c)}"></div>`).join("");
    grid.querySelectorAll(".px-cell").forEach(d => {
      d.onpointerdown = e => { if (done) return; e.preventDefault(); painting = true; paint(+d.dataset.i); };
      d.onpointerenter = e => { if (painting && (e.buttons & 1)) paint(+d.dataset.i); else painting = false; };
    });
  };
  const paint = i => { if (st.grid[i] === cur) return; st.grid[i] = cur; const d = grid.children[i]; d.style.background = colorOf(pal, cur); };
  ["pointerup", "pointercancel", "blur"].forEach(ev => window.addEventListener(ev, () => painting = false));
  grid.addEventListener("dragstart", e => e.preventDefault());
  A.$(".px-brushes").querySelectorAll("button").forEach(b => b.onclick = () => { cur = +b.dataset.c; A.$(".px-brushes").querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); });
  draw();
  st.tries = st.tries || 0;
  const check = () => {
    const bad = st.grid.reduce((n, c, i) => n + (c !== it.codes[i] ? 1 : 0), 0);
    if (!bad) { done = true; A.feedback(true, A.praise(), it.why || "Малюнок відповідає коду.", ""); A.nextBtn(); return; }
    st.tries++; A.lose(); A.frame0Hearts();
    if (st.tries >= 2) {
      done = true;
      A.feedback(false, "Ось як мало бути", `Неправильних пікселів: ${bad}. Порівняй зі своїм малюнком.`, `<div class="px-answer">${pxSVG(w, h, it.codes, pal, 26)}</div>`);
      A.nextBtn(); return;
    }
    A.feedback(false, "Майже", `Неправильних пікселів: ${bad}. Перевір код ще раз — рядок за рядком.`);
    A.setActs(`<span class="spacer"></span><button class="btn" id="ck">Перевірити</button>`, { ck: check });
  };
  A.setActs(`<span class="spacer"></span><button class="btn" id="ck">Перевірити</button>`, { ck: check });
}

// ---------- pxwrite: запиши код картинки ----------
function rWrite(it, A) {
  const st = A.st, pal = it.pal || PAL8;
  A.frame(it, `<div class="q">${A.md(it.q || "Запиши код цього малюнка: спершу висоту і ширину, потім коди кольорів рядок за рядком. Числа розділяй комами.")}</div>
    <div class="px-show">${pxSVG(it.w, it.h, it.codes, pal, 30)}</div>${palTable(pal)}
    <label class="answer-label" for="ans">Код:</label><input class="answer-input" id="ans" autocomplete="off" spellcheck="false" placeholder="наприклад: 2, 3, 7, 0, …">`);
  const want = [it.h, it.w].concat(it.codes);
  st.tries = st.tries || 0;
  const check = () => {
    const got = (A.$("#ans").value.match(/-?\d+/g) || []).map(Number);
    if (got.length === want.length && got.every((x, i) => x === want[i])) { A.$("#ans").disabled = true; A.feedback(true, A.praise(), it.why || "Код правильний.", ""); A.nextBtn(); return; }
    let tip = "";
    if (got.length && (got[0] !== it.h || got[1] !== it.w)) tip = `Перші два числа — висота (${it.h}) і ширина (${it.w}).`;
    else if (got.length !== want.length) tip = `Чисел має бути ${want.length}: 2 розміри і ${it.w * it.h} пікселів.`;
    else { const i = got.findIndex((x, k) => x !== want[k]); tip = `Перша помилка — ${i + 1}-те число.`; }
    st.tries++; A.lose(); A.frame0Hearts();
    if (st.tries >= 2) { A.$("#ans").disabled = true; A.feedback(false, "Правильний код", tip, `<pre class="code">${want.join(", ")}</pre>`); A.nextBtn(); return; }
    A.feedback(false, "Ще раз", tip);
  };
  A.setActs(`<span class="spacer"></span><button class="btn" id="ck">Перевірити</button>`, { ck: check });
  A.$("#ans").addEventListener("keydown", e => { if (e.key === "Enter") check(); });
}

// ---------- фігури для векторних тренажерів ----------
const VCOL = [["none", "Без заливки"], ["#e53935", "Червоний"], ["#ff9800", "Помаранчевий"], ["#ffd23d", "Жовтий"], ["#2fa84f", "Зелений"], ["#2f6fe4", "Синій"], ["#8e44ad", "Фіолетовий"], ["#1d1d1f", "Чорний"], ["#ffffff", "Білий"]];
const colName = c => (VCOL.find(x => x[0] === c) || [c, c])[1];
function shapeSVG(kind, f, s, sw, extra) {
  const a = `fill="${f === "none" ? "none" : f}" stroke="${s === "none" ? "none" : s}" stroke-width="${s === "none" ? 0 : sw}" stroke-linejoin="round" ${extra || ""}`;
  if (kind === "rect") return `<rect x="30" y="40" width="140" height="100" rx="6" ${a}/>`;
  if (kind === "ellipse") return `<ellipse cx="100" cy="90" rx="72" ry="52" ${a}/>`;
  if (kind === "circle") return `<circle cx="100" cy="90" r="60" ${a}/>`;
  if (kind === "star") {
    const pts = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 30 : 70, t = -Math.PI / 2 + i * Math.PI / 5; pts.push((100 + r * Math.cos(t)).toFixed(1) + "," + (95 + r * Math.sin(t)).toFixed(1)); }
    return `<polygon points="${pts.join(" ")}" ${a}/>`;
  }
  if (kind === "heart") return `<path d="M100 150 C 20 95 40 30 100 62 C 160 30 180 95 100 150 Z" ${a}/>`;
  return "";
}
const board = (inner, cls) => `<svg class="v-board ${cls || ""}" viewBox="0 0 200 180" role="img">${inner}</svg>`;

// ---------- vfill: заливка й обведення ----------
function rFill(it, A) {
  const st = A.st, t = it.target;
  st.me = st.me || { fill: "none", stroke: "#1d1d1f", sw: 2 };
  let tab = "fill";
  A.frame(it, `<div class="q">${A.md(it.q || "Зроби фігуру такою, як зразок: налаштуй заливку, колір обведення і його товщину — як у вікні «Заливка й обведення» (Shift+Ctrl+F) в Inkscape.")}</div>
    <div class="v-pair"><figure><figcaption>Зразок</figcaption>${board(shapeSVG(it.shape, t.fill, t.stroke, t.sw))}</figure><figure><figcaption>Твоя фігура</figcaption><div id="vme"></div></figure></div>
    <div class="v-dlg"><div class="v-dlgtitle">Заливка й обведення</div>
      <div class="v-tabs"><button data-t="fill" class="on">Заливка</button><button data-t="stroke">Колір обведення</button><button data-t="sw">Стиль обведення</button></div>
      <div class="v-tabbody" id="vtab"></div></div>`);
  const me = () => { A.$("#vme").innerHTML = board(shapeSVG(it.shape, st.me.fill, st.me.stroke, st.me.sw)); };
  const body = () => {
    const box = A.$("#vtab");
    if (tab === "sw") {
      box.innerHTML = `<label class="v-sw">Товщина: <button class="btn ghost" id="swm">−</button><b id="swv">${st.me.sw}</b> px<button class="btn ghost" id="swp">+</button></label><p class="muted">Товщину видно, лише якщо в обведення є колір.</p>`;
      const set = v => { st.me.sw = Math.max(0, Math.min(16, v)); A.$("#swv").textContent = st.me.sw; me(); };
      A.$("#swm").onclick = () => set(st.me.sw - 1); A.$("#swp").onclick = () => set(st.me.sw + 1);
      return;
    }
    const key = tab === "fill" ? "fill" : "stroke";
    box.innerHTML = `<div class="v-swatches">${VCOL.map(([c, n]) => `<button class="v-chip${st.me[key] === c ? " on" : ""}" data-c="${c}" title="${n}" aria-label="${n}" style="--c:${c === "none" ? "transparent" : c}">${c === "none" ? "✕" : ""}</button>`).join("")}</div><p class="muted">${tab === "fill" ? "Заливка" : "Обведення"}: <b>${colName(st.me[key])}</b></p>`;
    box.querySelectorAll(".v-chip").forEach(b => b.onclick = () => { st.me[key] = b.dataset.c; body(); me(); });
  };
  A.$(".v-tabs").querySelectorAll("button").forEach(b => b.onclick = () => { tab = b.dataset.t; A.$(".v-tabs").querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); body(); });
  me(); body();
  st.tries = st.tries || 0;
  const check = () => {
    const m = st.me, errs = [];
    if (m.fill !== t.fill) errs.push(`заливка має бути «${colName(t.fill)}»`);
    if (m.stroke !== t.stroke) errs.push(`колір обведення — «${colName(t.stroke)}»`);
    else if (t.stroke !== "none" && m.sw !== t.sw) errs.push(`товщина обведення — ${t.sw} px`);
    if (!errs.length) { A.feedback(true, A.praise(), it.why || "Фігура така сама, як зразок.", ""); A.nextBtn(); return; }
    st.tries++; A.lose(); A.frame0Hearts();
    if (st.tries >= 2) { A.feedback(false, "Ось що треба було", errs.join("; ") + "."); A.nextBtn(); return; }
    A.feedback(false, "Майже", `Не збігається: ${errs.length} з 3. Порівняй уважно зі зразком.`);
  };
  A.setActs(`<span class="spacer"></span><button class="btn" id="ck">Перевірити</button>`, { ck: check });
}

// ---------- vorder: порядок об'єктів / шарів ----------
// items: [{id, name, svg}] — svg малюється в board; start і goal — порядок знизу вгору
function rOrder(it, A) {
  const st = A.st;
  st.order = st.order || it.start.slice();
  let sel = st.sel || null;
  const layers = !!it.layers;
  const byId = id => it.items.find(x => x.id === id);
  A.frame(it, `<div class="q">${A.md(it.q)}</div>
    <div class="v-pair"><figure><figcaption>Як має бути</figcaption>${board(it.goal.map(id => byId(id).svg).join(""))}</figure>
      <figure><figcaption>${layers ? "Твій малюнок" : "Клацни фігуру, щоб виділити"}</figcaption><div id="vcan" tabindex="0" aria-label="Полотно"></div></figure></div>
    ${layers ? `<div class="v-layers"><div class="v-dlgtitle">Шари</div><div id="vlist"></div><div class="v-lbtns"><button class="btn ghost" data-m="up">▲ Вище</button><button class="btn ghost" data-m="down">▼ Нижче</button></div></div>`
      : `<div class="v-objs"><span class="muted">Виділити:</span> <span id="vchips"></span></div><div class="v-zbtns"><button class="btn ghost" data-m="top">⤒ На передній план <kbd>Home</kbd></button><button class="btn ghost" data-m="up">↑ Вище <kbd>Page Up</kbd></button><button class="btn ghost" data-m="down">↓ Нижче <kbd>Page Down</kbd></button><button class="btn ghost" data-m="bottom">⤓ На задній план <kbd>End</kbd></button></div>`}`);
  const draw = () => {
    A.$("#vcan").innerHTML = board(st.order.map(id => `<g data-id="${id}" class="v-obj${id === sel ? " sel" : ""}">${byId(id).svg}</g>`).join(""), "can");
    A.$("#vcan").querySelectorAll(".v-obj").forEach(g => g.onclick = () => { sel = st.sel = g.dataset.id; draw(); });
    // фігура може бути повністю закрита іншою — тоді виділяємо її за назвою (як у панелі «Об'єкти» Inkscape)
    if (!layers) {
      A.$("#vchips").innerHTML = it.items.map(o => `<button class="v-ochip${o.id === sel ? " on" : ""}" data-id="${o.id}">${esc(o.name)}</button>`).join("");
      A.$("#vchips").querySelectorAll(".v-ochip").forEach(b => b.onclick = () => { sel = st.sel = b.dataset.id; draw(); });
    }
    if (layers) {
      A.$("#vlist").innerHTML = st.order.slice().reverse().map(id => `<button class="v-layer${id === sel ? " on" : ""}" data-id="${id}"><span class="v-thumb">${board(byId(id).svg)}</span>${esc(byId(id).name)}</button>`).join("");
      A.$("#vlist").querySelectorAll(".v-layer").forEach(b => b.onclick = () => { sel = st.sel = b.dataset.id; draw(); });
    }
  };
  const move = m => {
    if (!sel) { A.feedback(false, "Спершу виділи", layers ? "Клацни шар у списку." : "Клацни фігуру на полотні."); return; }
    const o = st.order, i = o.indexOf(sel);
    o.splice(i, 1);
    const j = m === "top" ? o.length : m === "bottom" ? 0 : m === "up" ? Math.min(o.length, i + 1) : Math.max(0, i - 1);
    o.splice(j, 0, sel); draw();
  };
  document.querySelectorAll("#app [data-m]").forEach(b => b.onclick = () => move(b.dataset.m));
  A.$("#vcan").addEventListener("keydown", e => { const m = { Home: "top", End: "bottom", PageUp: "up", PageDown: "down" }[e.key]; if (m) { e.preventDefault(); move(m); } });
  draw();
  st.tries = st.tries || 0;
  // правильно, якщо малюнок виглядає так само, як зразок: у кожній точці зверху та сама фігура
  // (тож порядок фігур, які не торкаються, не має значення)
  const topAt = (order, pts) => {
    const svg = A.$("#vcan svg"), sm = svg.getScreenCTM();
    const shapes = order.map(id => [id, [...A.$(`#vcan g[data-id="${id}"]`).querySelectorAll("rect,circle,ellipse,polygon,path")]]);
    return pts.map(([x, y]) => {
      for (let k = shapes.length - 1; k >= 0; k--) for (const el of shapes[k][1]) {
        const sp = svg.createSVGPoint(); sp.x = x; sp.y = y;
        const lp = sp.matrixTransform(sm).matrixTransform(el.getScreenCTM().inverse());
        if (el.isPointInFill(lp)) return shapes[k][0];
      }
      return "";
    }).join();
  };
  const PTS = []; for (let y = 2; y < 180; y += 4) for (let x = 2; x < 200; x += 4) PTS.push([x, y]);
  const same = () => topAt(st.order, PTS) === topAt(it.goal, PTS);
  // якщо випадковий початок уже виглядає як зразок — перемішуємо ще
  for (let n = 0; n < 20 && same() && !st.checked; n++) { const o = st.order; for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } draw(); }
  const check = () => {
    st.checked = true;
    if (same()) { A.feedback(true, A.praise(), it.why || "Порядок правильний.", ""); A.nextBtn(); return; }
    st.tries++; A.lose(); A.frame0Hearts();
    if (st.tries >= 2) { A.feedback(false, "Правильний порядок", `Згори вниз: ${it.goal.slice().reverse().map(id => byId(id).name).join(" → ")}.`); A.nextBtn(); return; }
    A.feedback(false, "Ще не так", "Порівняй, що лежить зверху, а що знизу.");
  };
  A.setActs(`<span class="spacer"></span><button class="btn" id="ck">Перевірити</button>`, { ck: check });
}

window.ART = { PAL8, pxSVG, palTable, shapeSVG, board, VCOL };
window.GAME_TYPES = Object.assign(window.GAME_TYPES || {}, { pxpaint: rPaint, pxwrite: rWrite, vfill: rFill, vorder: rOrder });
})();
