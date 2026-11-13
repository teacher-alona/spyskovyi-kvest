/* «Списковий квест» — гра порталу на спільному рушії (core/core.js). */
(function () {
"use strict";
const LEVELS = window.LEVELS;
const GI = Object.assign({ id: "spysky", title: "Списковий квест", eyebrow: "Python · списки", intro: "Кожен рівень починається з розминки з основ. На рівнях «нова тема» спершу коротке пояснення, потім задачі. Наступний рівень відкривається, коли пройдено попередній." }, window.GAME_INFO || {});
const GAME = GI.id;
const MAX_HEARTS = KV.N;
const KIND = { practice: "закріплення", learn: "нова тема", boss: "фінал" };
const TYPE = Object.assign({ quiz: "Питання", output: "Що виведе?", bug: "Знайди помилку", order: "Збери код", fill: "Встав пропущене", code: "Напиши код", lesson: "Нове" }, window.GAME_TYPE_LABELS || {}, GI.types || {});
const PLAIN = !!GI.plain; // гра без Python: звичайні підписи, відповіді без урахування великих літер
const { esc, md, shuffle, fmtTime, starStr, snakeSVG, achieve, isOpen, openIds, SKINS, ACCS } = KV;
const N = KV.N;
const app = KV.app();
const gd = () => KV.gameData(GAME);          // прогрес цієї гри
const pf = () => KV.profile();               // змійка: ім'я, скін, аксесуар (спільна для всіх ігор)
const save = () => KV.save();
const GRACE = KV.leave.GRACE;
// що записати в аркуш цієї гри в таблиці
KV.useGame(GAME, g => ({
  levels: LEVELS.map(l => (g.stars || {})[l.id] || 0),
  levelTitles: LEVELS.map(l => l.title),
  total: LEVELS.reduce((a, l) => a + ((g.stars || {})[l.id] || 0), 0),
  bytes: g.bytes || 0, leaves: g.leaves || 0,
  awayMin: Math.round((g.awayMs || 0) / 6000) / 10,
  attemptsTotal: LEVELS.reduce((a, l) => a + ((g.attempts || {})[l.id] || 0), 0),
  attempts: LEVELS.map(l => (g.attempts || {})[l.id] || 0),
}), LEVELS.map(l => l.id));

const KW = new Set("def return for in if elif else while break continue True False None and or not import from lambda is pass as with try except".split(" "));
const BI = new Set("print len range input int str float sum max min sorted list round type enumerate zip map abs".split(" "));
function hl(code) {
  const re = /(#.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_Ѐ-ӿ][\wЀ-ӿ]*)/gm;
  let out = "", last = 0, m;
  while ((m = re.exec(code))) {
    out += esc(code.slice(last, m.index));
    const t = m[0];
    if (m[1]) out += `<span class="tok-com">${esc(t)}</span>`;
    else if (m[2]) out += `<span class="tok-str">${esc(t)}</span>`;
    else if (m[3]) out += `<span class="tok-num">${esc(t)}</span>`;
    else if (KW.has(t)) out += `<span class="tok-kw">${t}</span>`;
    else if (BI.has(t)) out += `<span class="tok-fn">${t}</span>`;
    else out += esc(t);
    last = m.index + t.length;
  }
  return out + esc(code.slice(last));
}
const pre = code => `<pre class="code">${hl(code)}</pre>`;
const normOut0 = s => String(s).replace(/\r/g, "").replace(/"/g, "'").split("\n").map(l => l.trim().replace(/\s*([,\[\]\(\)])\s*/g, "$1").replace(/\s+/g, " ")).join("\n").replace(/^\n+|\n+$/g, "");
const normOut = s => PLAIN ? normOut0(s).toLowerCase() : normOut0(s);
const normFill = s => { const v = String(s).trim().replace(/"/g, "'").replace(/\s+/g, ""); return PLAIN ? v.toLowerCase() : v; };
const levelOpen = i => !!GI.openAll || i === 0 || (gd().stars[LEVELS[i - 1].id] || 0) > 0;

// ---------- змійка й гардероб — у core ----------

// ---------- Python у браузері (Skulpt) ----------
let skPromise = null;
function loadPy() {
  if (skPromise) return skPromise;
  const add = src => new Promise((ok, fail) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = fail; document.head.appendChild(s); });
  skPromise = add("https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt.min.js")
    .then(() => add("https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt-stdlib.js"))
    .catch(e => { skPromise = null; throw e; });
  return skPromise;
}
async function runPy(code, inputs) {
  await loadPy();
  let out = ""; const q = (inputs || []).slice();
  Sk.configure({
    output: s => { out += s; },
    read: x => { if (Sk.builtinFiles && Sk.builtinFiles.files[x] !== undefined) return Sk.builtinFiles.files[x]; throw new Error("Немає модуля " + x); },
    inputfun: () => { if (!q.length) throw new Error("NOINPUT"); return q.shift(); },
    inputfunTakesPrompt: true,
    execLimit: 4000,
    __future__: Sk.python3,
  });
  try {
    await Sk.misceval.asyncToPromise(() => Sk.importMainWithBody("<stdin>", false, code, true));
    return { out, err: null };
  } catch (e) {
    return { out, err: explainErr(e) };
  }
}
function explainErr(e) {
  const raw = e && e.toString ? e.toString() : String(e);
  const tips = [
    [/NOINPUT/, "Програма викликає input() більше разів, ніж є даних у тесті."],
    [/TimeLimitError/, "Програма працює занадто довго. Можливо, цикл ніколи не закінчується."],
    [/IndentationError|unindent|expected an indented/i, "Помилка відступів. Перевір, що тіло циклу, умови чи функції зсунуте на 4 пробіли."],
    [/SyntaxError/, "Синтаксична помилка. Перевір двокрапки, дужки, лапки й відступи."],
    [/IndexError/, "Індекс за межами списку. Ти звертаєшся до елемента, якого немає."],
    [/NameError/, "Невідоме ім'я. Змінна чи функція ще не створена або написана з помилкою."],
    [/TypeError/, "Помилка типів. Наприклад, додаєш число до рядка або передаєш у функцію не те."],
    [/ValueError/, "Неправильне значення. Наприклад, int() від тексту або remove() елемента, якого немає."],
    [/ZeroDivisionError/, "Ділення на нуль."],
    [/AttributeError/, "У цього об'єкта немає такого методу. Перевір назву, наприклад append, а не add."],
    [/KeyError/, "Немає такого ключа."],
  ];
  const tip = (tips.find(([r]) => r.test(raw)) || [null, "Під час виконання сталася помилка."])[1];
  return { tip, raw: raw.replace("ExternalError: Error: NOINPUT", "input()").replace(/^ExternalError: Error: /, "") };
}

// ---------- стан рівня ----------
let run = null; // { li, idx, hearts, mistakes, items, st }
// ---------- варіанти завдань ----------
// V(...) — беремо випадковий варіант, але не той самий, що минулого разу; G(...) — генеруємо нове завдання
function resolveItems(lv) {
  gd().lastPick = gd().lastPick || {};
  const last = gd().lastPick[lv.id] || [], now = [];
  const items = lv.items.map((w, k) => {
    let it;
    if (w.pick) {
      const n = w.pick.length;
      let i = Math.floor(Math.random() * n);
      if (n > 1 && i === last[k]) i = (i + 1 + Math.floor(Math.random() * (n - 1))) % n;
      now[k] = i; it = w.pick[i];
    } else if (w.gen) { it = w.gen(); now[k] = -1; }
    else it = w;
    return Object.assign({}, it, { warm: !!(w.warm || it.warm), _gen: w.gen || null });
  });
  gd().lastPick[lv.id] = now;
  return items;
}
// відповіді до «Що виведе?» і «Збери код» з шаблонів рахує сам Python
async function prepareItems(items) {
  for (let k = 0; k < items.length; k++) {
    let it = items[k], tries = 0;
    while ((it.t === "output" && it.a == null) || (it.t === "order" && it.out == null)) {
      const r = await runPy(it.code, []);
      if (!r.err && r.out.trim()) {
        if (it.t === "output") it.a = r.out.replace(/\s+$/, ""); else it.out = r.out.replace(/\s+$/, "");
        break;
      }
      if (++tries > 6 || !it._gen) throw new Error("gen");
      it = items[k] = Object.assign({}, it._gen(), { warm: it.warm, _gen: it._gen });
    }
  }
}
const itemType = w => w.pick ? w.pick[0].t : w.gen ? (w._t || (w._t = w.gen().t)) : w.t;

async function startLevel(li) {
  const lv = LEVELS[li];
  goFullscreen();
  hideGuard();
  run = null;
  app.innerHTML = `<div class="center"><div class="eyebrow">${PLAIN ? `Рівень ${li + 1}` : `levels[${li}]`}</div><h2>${esc(lv.title)}</h2>${snakeSVG({ len: N, cls: "big" })}<p class="status">Готую завдання…</p></div>`;
  const items = resolveItems(lv);
  try {
    if (!PLAIN) await loadPy(); // ігри без Python не тягнуть Skulpt
    await prepareItems(items);
  } catch (e) {
    app.innerHTML = `<div class="center"><h2>${esc(lv.title)}</h2><p>Не вдалося підготувати завдання. Найчастіше причина — немає інтернету, бо Python завантажується з мережі.</p>
      <div class="row"><button class="btn" id="retry">Спробувати ще раз</button><button class="btn ghost" id="map">На карту</button></div></div>`;
    $("#retry").onclick = () => startLevel(li);
    $("#map").onclick = renderMap;
    return;
  }
  run = { li, idx: 0, hearts: MAX_HEARTS, shown: MAX_HEARTS, mistakes: 0, leaves: 0, awayMs: 0, items, st: {} };
  gd().attempts = gd().attempts || {}; gd().attempts[lv.id] = (gd().attempts[lv.id] || 0) + 1; save();
  renderItem();
  scrollTo(0, 0);
}
// ---------- вихід з гри під час рівня (логіка спостереження — у core) ----------
const active = () => run && !run.over;
KV.leave.configure({
  isActive: active,
  onHide: () => { if (run) { run.guardLost = 0; run.guardTime = 0; } },
  // n — скільки сегментів зняти, t — скільки мс учня не було, wasOpen — заслона вже висіла
  onPenalty: (reason, n, t, wasOpen) => {
    if (!active()) return;
    const g = gd(), lv = LEVELS[run.li].id;
    if (n <= 0) {
      if (wasOpen && t) { run.guardTime = (run.guardTime || 0) + t; run.awayMs = (run.awayMs || 0) + t; g.awayMs = (g.awayMs || 0) + t; save(); showGuard(reason); }
      return;
    }
    if (!wasOpen) {
      run.leaves = (run.leaves || 0) + 1;
      g.leaves = (g.leaves || 0) + 1;
      g.lvLeaves = g.lvLeaves || {}; g.lvLeaves[lv] = (g.lvLeaves[lv] || 0) + 1;
    }
    if (t) { run.awayMs = (run.awayMs || 0) + t; g.awayMs = (g.awayMs || 0) + t; }
    save();
    lose(n);
    frame0Hearts();
    if (run.hearts <= 0) { KV.hideGuard(); renderFail(); return; }
    run.guardLost = (wasOpen ? (run.guardLost || 0) : 0) + n;
    run.guardTime = (wasOpen ? (run.guardTime || 0) : 0) + (t || 0);
    showGuard(reason);
  },
});
const showGuard = reason => KV.showGuard({ reason, lost: run.guardLost, time: run.guardTime, hearts: run.hearts, max: MAX_HEARTS });
const hideGuard = () => KV.hideGuard();
const goFullscreen = () => KV.goFullscreen();
const leaveFullscreen = () => KV.leaveFullscreen();

function lose(n) { run.shown = run.hearts; run.hearts = Math.max(0, run.hearts - (n || 1)); run.mistakes += (n || 1); }
function next() {
  if (run.hearts <= 0) return renderFail();
  run.idx++; run.st = {};
  if (run.idx >= run.items.length) return renderDone();
  renderItem(); scrollTo(0, 0);
}

// ---------- карта ----------
function renderMap() {
  run = null; hideGuard(); leaveFullscreen();
  const total = LEVELS.reduce((s, l) => s + (gd().stars[l.id] || 0), 0);
  const n = LEVELS.length;
  app.innerHTML = `
  <header class="hero">
    <div class="topnav"><a class="link" href="../">← Усі ігри</a>${KV.whoami()}</div>
    <div class="eyebrow">${esc(GI.eyebrow)}</div>
    <h1>${esc(GI.title)}</h1>
    <p>${esc(GI.intro)}</p>
    <div class="pet">
      ${snakeSVG({ len: N, cls: "big" })}
      <div class="petinfo">
        <div class="petname">${esc(pf().name)}</div>
        <div class="score">${PLAIN ? "Зірок:" : "sum(stars) ="} <b>${total}</b> / ${n * 3} · Байтів: <b>${KV.bytesLeft()}</b> · ${KV.streakBadge()}</div>
        <div class="mystats">Спроб рівнів: <b>${LEVELS.reduce((a, l) => a + ((gd().attempts || {})[l.id] || 0), 0)}</b> · Виходів з гри: <b class="${gd().leaves ? "bad" : ""}">${gd().leaves || 0}</b>${gd().awayMs ? ` · Поза грою: <b class="bad">${fmtTime(gd().awayMs)}</b>` : ""}</div>
        <button class="btn ghost small" id="wardrobe">Гардероб${(() => { const k = openIds().length - 2; return k > 0 ? ` · ${k} відкрито` : ""; })()}</button>
      </div>
    </div>
  </header>
  <div class="listopen">${PLAIN ? "Рівні" : "levels = ["}</div>
  <div class="levels">
    ${LEVELS.map((l, i) => {
      const open = levelOpen(i); const s = gd().stars[l.id] || 0;
      return `<button class="cell ${l.kind}" data-li="${i}" ${open ? "" : "disabled"} aria-label="Рівень ${i + 1}: ${esc(l.title)}">
        <span class="idx">${PLAIN ? `<span>${i + 1}</span>` : `<span>[${i}]</span><span>[${i - n}]</span>`}</span>
        <span class="kind">${KIND[l.kind]}</span>
        <h3>${esc(l.title)}</h3>
        ${open ? starStr(s, "stars") : `<span class="lock">Спершу пройди ${PLAIN ? "рівень " + i : `[${i - 1}]`}</span>`}
        ${open && ((gd().attempts || {})[l.id] || (gd().lvLeaves || {})[l.id]) ? `<span class="cellstat">спроб: ${(gd().attempts || {})[l.id] || 0}${(gd().lvLeaves || {})[l.id] ? ` · <b>виходів: ${gd().lvLeaves[l.id]}</b>` : ""}</span>` : ""}
      </button>`;
    }).join("")}
  </div>
  <div class="listclose">${PLAIN ? "" : "]"}</div>
  <div class="version">версія ${KV.VERSION}</div>
  <div class="legend"><span>★★★ — не більше однієї помилки на рівні</span><span>У змійки ${N} сегментів. Кожна помилка — ${PLAIN ? "мінус сегмент з хвоста" : "<code>pop()</code> з хвоста"}</span>${PLAIN ? "" : "<span>Задачі з кодом сегментів не забирають</span>"}<span>Зірки відкривають нові скіни</span><span>Байти дають за правильні відповіді з першої спроби (тільки поки рівень ще не пройдено). За них купують речі в гардеробі</span><span>Вийшов(-ла) з гри на іншу вкладку чи в інший застосунок — мінус сегмент</span></div>
  `;
  app.querySelectorAll(".cell").forEach(b => b.onclick = () => renderIntro(+b.dataset.li));
  app.querySelector("#wardrobe").onclick = renderWardrobe;
  KV.bindWhoami();
}

function renderWardrobe() { KV.renderWardrobe(renderMap, "На карту"); }

function renderIntro(li) {
  const lv = LEVELS[li];
  const counts = {};
  lv.items.forEach(it => { const k = it.warm ? "Розминка з основ" : TYPE[itemType(it)]; counts[k] = (counts[k] || 0) + 1; });
  const best = gd().stars[lv.id] || 0;
  app.innerHTML = `
  <div class="center intro">
    <button class="link" id="back">← На карту</button>
    <div class="eyebrow">levels[${li}] · ${KIND[lv.kind]}</div>
    <h2>${esc(lv.title)}</h2>
    <p>${md(lv.about)}</p>
    <ul class="plan">${Object.entries(counts).map(([k, v]) => `<li><span>×${v}</span>${k}</li>`).join("")}</ul>
    ${best ? `<div>Твій рекорд: ${starStr(best, "stars")}</div>` : ""}
    ${(gd().attempts || {})[lv.id] ? `<div class="mystats">Ти починав(-ла) цей рівень: <b>${gd().attempts[lv.id]}</b> раз(и)${(gd().lvLeaves || {})[lv.id] ? ` · виходив(-ла) з гри: <b class="bad">${gd().lvLeaves[lv.id]}</b> раз(и)` : ""}</div>` : ""}
    <p class="status">Під час рівня не перемикайся на інші вкладки й застосунки: вихід з гри коштує змійці сегмент, а кожні 30 секунд поза грою — ще один.</p>
    <button class="btn" id="go">${best ? "Пройти ще раз" : "Почати"}</button>
  </div>`;
  app.querySelector("#back").onclick = renderMap;
  app.querySelector("#go").onclick = () => startLevel(li);
  scrollTo(0, 0);
}

// ---------- задача ----------
function frame(it, body) {
  const lv = LEVELS[run.li];
  const pct = Math.round(run.idx / run.items.length * 100);
  const chips = [];
  if (it.warm) chips.push(`<span class="chip warm">Розминка</span>`);
  chips.push(`<span class="chip ${it.t === "lesson" ? "new" : ""}">${TYPE[it.t]}</span>`);
  if (it.stars === 3) chips.push(`<span class="chip">★★★ складна</span>`);
  app.innerHTML = `
  <div class="topbar">
    <div class="row"><button class="link" id="quit">← Карта</button><span class="lvtitle">${esc(lv.title)} · ${run.idx + 1}/${run.items.length}</span></div>
    <div class="snakebar" id="snake">${snakeSVG({ len: run.hearts, mood: run.hearts <= 1 ? "sad" : "happy" })}</div>
    <div class="progress"><div style="width:${pct}%"></div></div>
  </div>
  <section class="card ${it.t === "lesson" ? "lesson" : ""}">
    <div class="chips">${chips.join("")}</div>
    ${body}
    <div id="fb"></div>
    <div class="actions" id="acts"></div>
  </section>`;
  app.querySelector("#quit").onclick = renderMap;
}
const $ = s => app.querySelector(s);
function feedback(good, title, text, extra) {
  // байт — за правильну відповідь з першої спроби
  if (!good) run.st.bad = true;
  else if (!run.st.bad && !run.st.paid && run.mistakes === run.st.m0 && run.items[run.idx].t !== "lesson") { run.st.paid = true; run.clean = (run.clean || 0) + 1; }
  if (good && $("#snake")) { $("#snake").innerHTML = snakeSVG({ len: run.hearts, mood: "wow", cls: "hop" }); }
  $("#fb").innerHTML = `<div class="feedback ${good ? "good" : "bad"}"><div class="verdict">${title}</div>${extra || ""}${text ? `<p>${md(text)}</p>` : ""}</div>`;
}
function setActs(html, handlers) {
  $("#acts").innerHTML = html;
  Object.entries(handlers || {}).forEach(([id, fn]) => { const el = $("#" + id); if (el) el.onclick = fn; });
}
function nextBtn() { setActs(`<button class="btn" id="nx">${run.hearts <= 0 ? "Далі" : "Далі →"}</button>`, { nx: next }); $("#nx").focus({ preventScroll: true }); }
const PRAISE = ["Правильно!", "Молодець!", "Так і є!", "Супер!", "Чудово!"];
const praise = () => PRAISE[Math.floor(Math.random() * PRAISE.length)];

function renderItem() {
  const it = run.items[run.idx];
  if (run.st.m0 === undefined) run.st.m0 = run.mistakes;   // для байтів: чи були помилки в цьому завданні
  const base = { lesson: rLesson, quiz: rQuiz, output: rOutput, bug: rBug, order: rOrder, fill: rFill, code: rCode };
  if (base[it.t]) return base[it.t](it);
  (window.GAME_TYPES || {})[it.t](it, API); // тренажери з core/sims.js
}
// усе, що потрібно тренажерам з інших файлів
const API = {
  frame: (it, body) => frame(it, body), feedback, setActs, nextBtn, praise, frame0Hearts, $, md, esc, pre,
  lose: n => lose(n), get hearts() { return run.hearts; }, get st() { return run.st; },
};

function rLesson(it) {
  frame(it, `<h2>${esc(it.title)}</h2><p>${md(it.text)}</p>${it.code ? pre(it.code) : ""}`);
  setActs(`<button class="btn" id="nx">Зрозуміло, далі →</button>`, { nx: next });
}

function rQuiz(it) {
  const order = shuffle(it.options.map((_, i) => i));
  frame(it, `<div class="q">${md(it.q)}</div>${it.code ? pre(it.code) : ""}
    <div class="options">${order.map(i => `<button class="opt" data-i="${i}">${md(it.options[i])}</button>`).join("")}</div>`);
  app.querySelectorAll(".opt").forEach(b => b.onclick = () => {
    const i = +b.dataset.i, ok = i === it.a;
    app.querySelectorAll(".opt").forEach(o => { o.disabled = true; if (+o.dataset.i === it.a) o.classList.add("right"); });
    if (!ok) { b.classList.add("wrong"); lose(); }
    frame0Hearts();
    feedback(ok, ok ? praise() : "Не зовсім", it.why);
    nextBtn();
  });
}
function frame0Hearts() {
  const box = $("#snake"); if (!box) return;
  const falling = Math.max(0, (run.shown ?? MAX_HEARTS) - run.hearts);
  run.shown = run.hearts;
  box.innerHTML = snakeSVG({ len: run.hearts, falling, mood: run.hearts <= 1 ? "sad" : falling ? "sad" : "happy" });
}

function attemptWrong(it, revealHtml) {
  run.st.tries = (run.st.tries || 0) + 1; lose(); frame0Hearts();
  if (run.st.tries >= 2 || run.hearts <= 0) {
    feedback(false, "Не зовсім", it.why, revealHtml);
    nextBtn(); return true;
  }
  feedback(false, "Спробуй ще раз", "");
  return false;
}

function rOutput(it) {
  const lines = it.a.split("\n").length;
  frame(it, `<div class="q">${md(it.q || "Що виведе ця програма?")}</div>${it.code ? pre(it.code) : ""}
    <label class="answer-label" for="ans">Твоя відповідь${lines > 1 ? ` (${lines} рядки, кожен з нового рядка)` : ""}:</label>
    <textarea id="ans" rows="${Math.max(2, lines + 1)}" spellcheck="false" autocomplete="off"></textarea>
    ${!PLAIN && /[\[(']/.test(it.a) ? `<div class="status">Пиши точно так, як надрукує Python: список — у квадратних дужках, рядки всередині списку — в лапках.</div>` : ""}`);
  const loose = s => normOut(s).replace(/[\[\]()'\s]/g, "");
  const check = () => {
    const v = $("#ans").value;
    if (!v.trim()) return;
    if (normOut(v) === normOut(it.a) || (it.accept || []).some(x => normOut(v) === normOut(x))) {
      $("#ans").disabled = true;
      feedback(true, praise(), it.why); nextBtn();
    } else if (!PLAIN && loose(v) === loose(it.a)) {
      const why = /\[/.test(it.a) && !/\[/.test(v)
        ? "Значення правильні, але `print` виводить список разом із квадратними дужками, наприклад `[1, 2]`. Допиши дужки й перевір ще раз."
        : "Значення правильні, але Python друкує їх трохи інакше. Перевір дужки та лапки: рядки всередині списку виводяться в лапках, наприклад `['а', 'б']`.";
      feedback(false, "Майже!", why);
    } else if (attemptWrong(it, `<p>Правильна відповідь:</p><pre class="code">${esc(it.a)}</pre>`)) $("#ans").disabled = true;
  };
  setActs(`<button class="btn" id="ck">Перевірити</button>`, { ck: check });
  $("#ans").focus({ preventScroll: true });
}

function rBug(it) {
  const lines = it.code.split("\n");
  frame(it, `<div class="q">${md(it.q)}</div>
    <div class="buglines">${lines.map((l, i) => `<button class="bugline" data-i="${i}"><span class="ln">${i + 1}</span><span>${hl(l) || " "}</span></button>`).join("")}</div>`);
  app.querySelectorAll(".bugline").forEach(b => b.onclick = () => {
    const ok = +b.dataset.i === it.a;
    app.querySelectorAll(".bugline").forEach(o => { o.disabled = true; if (+o.dataset.i === it.a) o.classList.add("right"); });
    if (!ok) { b.classList.add("wrong"); lose(); frame0Hearts(); }
    feedback(ok, ok ? praise() : "Не зовсім", it.why); nextBtn();
  });
}

function rOrder(it) {
  const correct = it.code.split("\n");
  let pool = shuffle(correct.map((_, i) => i));
  if (pool.every((v, i) => v === i) && pool.length > 1) pool.push(pool.shift());
  let ans = [];
  frame(it, `<div class="q">${md(it.q)}</div>
    <div class="answer-label">${PLAIN ? "Натискай рядки по черзі в правильному порядку. Натисни на вибраний рядок, щоб повернути його назад." : "Натискай рядки по черзі, щоб скласти програму. Натисни на рядок у програмі, щоб повернути його назад."}</div>
    <div class="zone target" id="tz"></div>
    <div class="answer-label">Рядки:</div>
    <div class="zone" id="pz"></div>`);
  let locked = false;
  const draw = () => {
    $("#tz").innerHTML = ans.length ? ans.map((k, p) => `<button class="piece" data-p="${p}">${hl(correct[k])}</button>`).join("") : `<div class="empty">${PLAIN ? "Тут з'явиться твоя відповідь" : "Тут з'явиться твоя програма"}</div>`;
    $("#pz").innerHTML = pool.length ? pool.map((k, p) => `<button class="piece" data-q="${p}">${hl(correct[k])}</button>`).join("") : `<div class="empty">Усі рядки використано</div>`;
    if (locked) { app.querySelectorAll(".piece").forEach(b => b.disabled = true); return; }
    app.querySelectorAll("#tz .piece").forEach(b => b.onclick = () => { pool.push(ans.splice(+b.dataset.p, 1)[0]); draw(); });
    app.querySelectorAll("#pz .piece").forEach(b => b.onclick = () => { ans.push(pool.splice(+b.dataset.q, 1)[0]); draw(); });
    $("#ck").disabled = pool.length > 0;
  };
  const reveal = `<p>${PLAIN ? "Правильний порядок:" : "Правильна програма:"}</p>${pre(it.code)}`;
  const check = async () => {
    const exact = ans.every((v, i) => v === i);
    let ok = exact, note = "";
    if (!exact && it.out) {
      setActs(`<span class="status">Запускаю програму…</span>`);
      try {
        const r = await runPy(ans.map(k => correct[k]).join("\n"), []);
        ok = !r.err && normOut(r.out) === normOut(it.out);
        note = r.err ? `<p>Програма видала помилку: ${esc(r.err.tip)}</p>` : `<p>Твоя програма вивела:</p><pre class="code">${esc(r.out.trim() || "(нічого)")}</pre>`;
      } catch (e) { ok = false; }
      setActs(`<button class="btn" id="ck">Перевірити</button>`, { ck: check });
    }
    if (ok) { locked = true; draw(); feedback(true, praise(), it.why); nextBtn(); return; }
    run.st.tries = (run.st.tries || 0) + 1; lose(); frame0Hearts();
    if (run.st.tries >= 2 || run.hearts <= 0) { locked = true; draw(); feedback(false, "Не зовсім", it.why, note + reveal); nextBtn(); }
    else feedback(false, "Спробуй ще раз", "Порядок неправильний. Переставляй рядки й перевір знову.", note);
  };
  setActs(`<button class="btn" id="ck">Перевірити</button>`, { ck: check });
  draw();
}

function rFill(it) {
  const parts = it.code.split("___");
  let html = "";
  parts.forEach((p, i) => {
    html += hl(p);
    if (i < parts.length - 1) {
      const w = Math.max(3, ...it.a[i].map(s => s.length)) + 1;
      html += `<input type="text" id="b${i}" data-i="${i}" style="width:${w + 2}ch" spellcheck="false" autocomplete="off" aria-label="Пропуск ${i + 1}">`;
    }
  });
  frame(it, `<div class="q">${md(it.q)}</div><pre class="code fillcode">${html}</pre>`);
  const ins = [...app.querySelectorAll(".fillcode input")];
  const check = () => {
    if (ins.some(x => !x.value.trim())) return;
    let all = true;
    ins.forEach((x, i) => { const ok = it.a[i].some(a => normFill(a) === normFill(x.value)); x.classList.toggle("right", ok); x.classList.toggle("wrong", !ok); all = all && ok; });
    if (all) { ins.forEach(x => x.disabled = true); feedback(true, praise(), it.why); nextBtn(); return; }
    let filled = it.code; it.a.forEach(a => { filled = filled.replace("___", a[0]); });
    if (attemptWrong(it, `<p>Правильно так:</p>${pre(filled)}`)) ins.forEach(x => x.disabled = true);
  };
  ins.forEach(x => x.addEventListener("keydown", e => { if (e.key === "Enter") check(); }));
  setActs(`<button class="btn" id="ck">Перевірити</button>`, { ck: check });
  if (ins[0]) ins[0].focus({ preventScroll: true });
}

// --- задача з кодом ---
function editorKeys(ta) {
  ta.addEventListener("keydown", e => {
    const s = ta.selectionStart, v = ta.value;
    if (e.key === "Tab" && !e.shiftKey) { e.preventDefault(); ta.setRangeText("    ", s, ta.selectionEnd, "end"); }
    else if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      const lineStart = v.lastIndexOf("\n", s - 1) + 1;
      const line = v.slice(lineStart, s);
      let ind = (line.match(/^\s*/) || [""])[0];
      if (/:\s*$/.test(line)) ind += "    ";
      ta.setRangeText("\n" + ind, s, ta.selectionEnd, "end");
    } else if (e.key === "Backspace" && s === ta.selectionEnd) {
      const lineStart = v.lastIndexOf("\n", s - 1) + 1;
      const before = v.slice(lineStart, s);
      if (before.length >= 4 && /^ +$/.test(before)) { e.preventDefault(); const n = before.length % 4 || 4; ta.setRangeText("", s - n, s, "end"); }
    }
  });
}
function rCode(it) {
  if (run.st.code === undefined) run.st.code = it.starter || "";
  frame(it, `<div class="q">${md(it.q)}</div>
    <label class="answer-label" for="ed">Твій код:</label>
    <textarea id="ed" class="editor" rows="10" spellcheck="false" autocomplete="off" autocapitalize="off"></textarea>
    <div id="hintbox"></div>
    <div class="tests" id="tests"></div>`);
  const ed = $("#ed"); ed.value = run.st.code;
  let cm = null;
  if (window.CodeMirror) {
    cm = CodeMirror.fromTextArea(ed, {
      mode: "python", lineNumbers: true, indentUnit: 4, tabSize: 4, indentWithTabs: false, smartIndent: true,
      viewportMargin: Infinity, inputStyle: "textarea", spellcheck: false, autocorrect: false,
      extraKeys: { Tab: c => c.somethingSelected() ? c.execCommand("indentMore") : c.execCommand("insertSoftTab"), "Shift-Tab": "indentLess" },
    });
    cm.on("change", () => { run.st.code = cm.getValue(); });
    cm.focus(); cm.setCursor(cm.lineCount(), 0);
  } else {
    editorKeys(ed);
    ed.addEventListener("input", () => { run.st.code = ed.value; });
    ed.focus({ preventScroll: true }); ed.setSelectionRange(ed.value.length, ed.value.length);
  }
  const getSrc = () => cm ? cm.getValue() : ed.value;
  const lockEd = () => { if (cm) cm.setOption("readOnly", "nocursor"); else ed.disabled = true; };
  run.st.fails = run.st.fails || 0;
  const acts = () => {
    setActs(`<button class="link" id="hn">Підказка</button>${run.st.fails >= 2 ? `<button class="link" id="sol">Показати розв'язок (−2 сегменти)</button>` : ""}<span class="spacer"></span><button class="btn" id="ck">Перевірити</button>`, {
      hn: () => { $("#hintbox").innerHTML = `<div class="hint">${md(it.hint)}</div>`; },
      sol: () => { lose(2); frame0Hearts(); lockEd(); const f = achieve("peek"); feedback(false, "Розв'язок", "Розбери його і спробуй написати сам наступного разу." + (f.length ? " А ще в гардеробі тепер є каструля на голову. Для підглядачів." : ""), pre(it.solution)); nextBtn(); },
      ck: check,
    });
  };
  const check = async () => {
    const src = getSrc();
    // заборонена функція — це саме виклик sort(...) чи .sort(...), а не частина назви на кшталт is_sorted
    const usesForbidden = f => new RegExp("(^|[^A-Za-z0-9_])" + f + "\\s*\\(").test(src.replace(/#.*$/gm, ""));
    if (it.forbid && it.forbid.some(usesForbidden)) {
      $("#tests").innerHTML = `<div class="test fail"><div class="head">Заборонено</div>У цій задачі не можна використовувати ${it.forbid.map(f => `<code>${esc(f)}()</code>`).join(", ")}. Напиши алгоритм сам.</div>`;
      return;
    }
    setActs(`<span class="status">Перевіряю…</span>`);
    let results = [];
    try {
      for (const t of it.tests) {
        if (t.call) {
          const r = await runPy(src + "\n__r = repr(" + t.call + ")\nprint('@@R@@' + __r)\n", []);
          const [printed, got] = r.out.split("@@R@@");
          const ok = !r.err && got !== undefined && got.trim() === t.expect;
          results.push({ ok, label: t.label || t.call, expect: t.expect, got: got !== undefined ? got.trim() : null, printed: (printed || "").trim(), err: r.err, call: t.call });
        } else {
          const r = await runPy(src, t.input);
          const norm = s => s.replace(/\r/g, "").split("\n").map(l => l.replace(/\s+$/, "")).join("\n").trim();
          const ok = !r.err && norm(r.out) === norm(t.expect);
          results.push({ ok, label: "Введення: " + t.input.join(" ↵ "), expect: t.expect, got: norm(r.out), err: r.err });
        }
      }
    } catch (e) {
      $("#tests").innerHTML = `<div class="test fail"><div class="head">Не вдалося завантажити Python</div>Перевір інтернет і натисни «Перевірити» ще раз.</div>`;
      acts(); return;
    }
    const allOk = results.every(r => r.ok);
    $("#tests").innerHTML = results.map(r => `<div class="test ${r.ok ? "ok" : "fail"}">
      <div class="head">${r.ok ? "✓" : "✗"} ${esc(r.label)}</div>
      ${r.ok ? "" : r.err ? `<div>${esc(r.err.tip)}</div><pre>${esc(r.err.raw)}</pre>` : `<div>Очікували:</div><pre>${esc(r.expect)}</pre><div>Отримали:</div><pre>${esc(r.got === null || r.got === "" ? "(нічого)" : r.got)}</pre>`}
      ${!r.ok && r.call && !r.err && r.got === "None" ? `<div>Функція нічого не повертає. Можливо, забув(-ла) <code>return</code>?</div>` : ""}
    </div>`).join("");
    if (allOk) { lockEd(); feedback(true, praise(), "Усі тести пройдено.", ""); nextBtn(); }
    else { run.st.fails++; acts(); }
  };
  acts();
}

// ---------- кінець рівня ----------
function renderDone() {
  run.over = true; hideGuard(); leaveFullscreen();
  const lv = LEVELS[run.li];
  const s = run.mistakes <= 1 ? 3 : run.mistakes <= 3 ? 2 : 1;
  const prev = gd().stars[lv.id] || 0;
  const before = openIds();
  if (s > prev) { gd().stars[lv.id] = s; }
  const sk = KV.streakTouch();
  // байти дають лише за перше успішне проходження рівня (коли зірок ще не було)
  const earned = prev ? 0 : (run.clean || 0) + (run.mistakes === 0 ? KV.BYTES_PERFECT : 0);
  if (earned) gd().bytes = (gd().bytes || 0) + earned;
  save(); KV.scheduleSync(true);
  if (run.mistakes === 0) achieve("perfect");
  if (run.mistakes === 0 && KV.hasAcc("devil")) achieve("angel");
  if (lv.id === "slices" && pf().skin === "loaf" && KV.hasAcc("pot")) achieve("loafhat");
  const fresh = [...SKINS, ...ACCS].filter(x => isOpen(x) && !before.includes(x.id));
  const hasNext = run.li + 1 < LEVELS.length;
  const msg = s === 3 ? "Відмінно!" : s === 2 ? "Добре!" : "Пройдено!";
  app.innerHTML = `<div class="center">
    <div class="stamp">${msg}</div>
    <h2>${esc(lv.title)}</h2>
    ${snakeSVG({ len: run.hearts, mood: s === 3 ? "wow" : "happy", cls: "big" })}
    ${starStr(s, "bigstars")}
    ${fresh.length ? `<div class="unlock">Відкрито в гардеробі: ${fresh.map(x => `<b>${esc(x.name)}</b>`).join(", ")}</div>` : ""}
    ${sk.grew ? `<div class="streakgot">🔥 Серія: ${sk.n} ${KV.daysWord(sk.n)} поспіль!${sk.bonus ? ` +${sk.bonus} байтів за ${sk.n} ${KV.daysWord(sk.n)}` : ""}</div>` : ""}
    <div class="bytesgot">${earned ? `+${earned} ${KV.bytesWord(earned)}${run.mistakes === 0 ? ` (з них ${KV.BYTES_PERFECT} — бонус за рівень без помилок)` : ""}. Усього: ${KV.bytesLeft()}` : prev ? `За повторне проходження байтів не дають. У тебе ${KV.bytesLeft()} ${KV.bytesWord(KV.bytesLeft())}` : ""}</div>
    <p>Помилок: ${run.mistakes}. ${s < 3 ? "Три зірки дають, якщо помилок не більше однієї." : run.mistakes === 0 ? "Чистий рівень!" : "Майже ідеально!"}${s > prev && prev ? " Новий рекорд!" : ""}${run.leaves ? ` Виходів з гри: ${run.leaves}${run.awayMs >= GRACE ? `, поза грою ${fmtTime(run.awayMs)}` : ""}.` : ""} Це твоя ${gd().attempts[lv.id] || 1}-а спроба цього рівня.</p>
    <div class="syncbox">${KV.syncLabel()}</div>
    <div class="row">${hasNext ? `<button class="btn" id="nx">Наступний рівень →</button>` : ""}<button class="btn ghost" id="map">На карту</button><button class="link" id="again">Пройти ще раз</button>${fresh.length ? `<button class="link" id="ward">Приміряти</button>` : ""}</div>
  </div>`;
  const li = run.li;
  if (fresh.length) $("#ward").onclick = renderWardrobe;
  if (hasNext) $("#nx").onclick = () => renderIntro(li + 1);
  $("#map").onclick = renderMap;
  $("#again").onclick = () => startLevel(li);
  scrollTo(0, 0);
}
function renderFail() {
  run.over = true; hideGuard(); leaveFullscreen();
  const li = run.li;
  const fresh = [...achieve("fail"), ...(run.idx >= run.items.length - 1 ? achieve("lastdeath") : [])];
  app.innerHTML = `<div class="center">
    <div class="stamp">${esc(pf().name)} лишилась без хвоста</div>
    ${snakeSVG({ len: 0, mood: "sad", cls: "big" })}
    <h2>${esc(LEVELS[li].title)}</h2>
    <p>Нічого страшного. Перечитай пояснення до задач, де були помилки, і спробуй ще раз — задачі ті самі, відповіді в питаннях перемішаються, а хвіст відросте.</p>
    ${fresh.length ? `<div class="unlock">${fresh.length > 1 ? "Утішні призи" : "Утішний приз"} у гардеробі: ${fresh.map(x => `<b>${esc(x.name)}</b>`).join(", ")}</div>` : ""}
    <div class="row"><button class="btn" id="again">Почати рівень заново</button><button class="btn ghost" id="map">На карту</button>${fresh.length ? `<button class="link" id="ward">Приміряти</button>` : ""}</div>
  </div>`;
  if (fresh.length) $("#ward").onclick = renderWardrobe;
  $("#again").onclick = () => startLevel(li);
  $("#map").onclick = renderMap;
  scrollTo(0, 0);
}


window.__game = { runPy, LEVELS, startLevel, items: () => run && run.items, goto: async (li, k) => { await startLevel(li); run.idx = k; run.st = {}; renderItem(); } };
KV.boot({ title: GI.title, eyebrow: GI.eyebrow, onReady: renderMap, isIdle: () => !run && (!app.firstElementChild || !!app.querySelector(".hero") || !!app.querySelector(".bootwait")) });
})();
