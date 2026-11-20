/* Майстерня ігор (5 клас): сцена на сітці, правила «коли → що зробити», гра стрілками і пошук багів */
(function () {
"use strict";
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// ---------- що буває на сцені ----------
// сцену задаємо рядками: # стіна, P гравець, c монетка, e ворог ↔, v ворог ↕, F прапорець, h сердечко, . порожньо
const TILES = {
  "#": { name: "Стіна", icon: "" }, P: { name: "Гравець", icon: "🐍" }, c: { name: "Монетка", icon: "🪙" },
  e: { name: "Ворог ↔", icon: "👾" }, v: { name: "Ворог ↕", icon: "👻" }, F: { name: "Прапорець", icon: "🏁" }, h: { name: "Сердечко", icon: "❤️" },
};
// події (коли) і дії (що зробити); n — число, яке можна змінити
const WHEN = {
  start: { t: "На початку гри" },
  coin: { t: "Гравець торкається монетки" },
  enemy: { t: "Гравець торкається ворога" },
  flag: { t: "Гравець торкається прапорця" },
  heart: { t: "Гравець торкається сердечка" },
  wall: { t: "Гравець торкається стіни" },
  score: { t: "Очок стало", n: 5, unit: "" },
  nolives: { t: "Життів стало 0" },
};
const DO = {
  addScore: { t: "Додати очки", n: 1 },
  subScore: { t: "Відняти очки", n: 1 },
  setLives: { t: "Життів зробити", n: 3 },
  addLife: { t: "Додати життя", n: 1 },
  loseLife: { t: "Забрати життя", n: 1 },
  remove: { t: "Предмет зникає" },
  stop: { t: "Гравець зупиняється" },
  back: { t: "Гравець на старт" },
  win: { t: "Перемога!" },
  lose: { t: "Програш" },
};
const copy = x => JSON.parse(JSON.stringify(x));

// ---------- гра ----------
function makeGame(box, scene, rules, onEnd) {
  const H = scene.length, W = scene[0].length;
  const grid = scene.map(r => r.split(""));
  let px = 0, py = 0; const start = [0, 0];
  const items = [], enemies = [];
  grid.forEach((row, y) => row.forEach((ch, x) => {
    if (ch === "P") { px = x; py = y; start[0] = x; start[1] = y; row[x] = "."; }
    else if ("chF".includes(ch)) { items.push({ k: ch, x, y, on: true }); row[x] = "."; }
    else if (ch === "e" || ch === "v") { enemies.push({ x, y, dx: ch === "e" ? 1 : 0, dy: ch === "v" ? 1 : 0, ic: TILES[ch].icon }); row[x] = "."; }
  }));
  const st = { score: 0, lives: null, over: "", fired: new Set(), log: [] };
  const R = rules.map(r => ({ w: r.w, n: r.n, a: r.a.map(x => Object.assign({}, x)) }));
  const isWall = (x, y) => grid[y] && grid[y][x] === "#";
  let touchingEnemy = false, timer = null;
  const msg = (t) => { st.log.push(t); if (st.log.length > 3) st.log.shift(); };
  function fire(w, item, n) {
    let any = false;
    R.filter(r => r.w === w && (w !== "score" || st.score >= (r.n ?? WHEN.score.n))).forEach(r => {
      if (w === "score") { if (st.fired.has(r)) return; st.fired.add(r); }
      any = true; r.a.forEach(a => act(a, item));
    });
    return any;
  }
  function act(a, item) {
    if (st.over) return;
    const n = a.n ?? (DO[a.k] && DO[a.k].n) ?? 1;
    if (a.k === "addScore") st.score += n;
    else if (a.k === "subScore") st.score -= n;
    else if (a.k === "setLives") { st.lives = n; if (n === 0) fire("nolives"); }
    else if (a.k === "addLife") st.lives = (st.lives || 0) + n;
    else if (a.k === "loseLife") { if (st.lives == null) st.lives = 0; st.lives = Math.max(0, st.lives - n); if (st.lives === 0) fire("nolives"); }
    else if (a.k === "remove" && item) item.on = false;
    else if (a.k === "back") { px = start[0]; py = start[1]; }
    else if (a.k === "win") end("win");
    else if (a.k === "lose") end("lose");
    if (a.k === "addScore" || a.k === "subScore") fire("score");
  }
  function end(how) { if (st.over) return; st.over = how; clearInterval(timer); draw(); onEnd && onEnd(how, st); }
  function touchAt() {
    items.filter(i => i.on && i.x === px && i.y === py).forEach(i => fire({ c: "coin", h: "heart", F: "flag" }[i.k], i));
    const hit = enemies.some(e => e.x === px && e.y === py);
    if (hit && !touchingEnemy) fire("enemy");
    touchingEnemy = hit;
  }
  function move(dx, dy) {
    if (st.over) return;
    const nx = px + dx, ny = py + dy;
    if (nx < 0 || ny < 0 || nx >= W || ny >= H) return;   // край поля — завжди межа
    if (isWall(nx, ny)) { const stops = R.some(r => r.w === "wall" && r.a.some(a => a.k === "stop")); fire("wall"); if (stops) { draw(); return; } }
    px = nx; py = ny; touchAt(); draw();
  }
  function tick() {
    if (st.over) return;
    enemies.forEach(e => {
      let nx = e.x + e.dx, ny = e.y + e.dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || isWall(nx, ny)) { e.dx = -e.dx; e.dy = -e.dy; nx = e.x + e.dx; ny = e.y + e.dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || isWall(nx, ny)) return; }
      e.x = nx; e.y = ny;
    });
    touchAt(); draw();
  }
  function draw() {
    const cells = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let ic = "";
      const it = items.find(i => i.on && i.x === x && i.y === y); if (it) ic = TILES[it.k].icon;
      const en = enemies.find(e => e.x === x && e.y === y); if (en) ic = en.ic;
      if (x === px && y === py) ic = TILES.P.icon + (en ? "💥" : "");
      cells.push(`<div class="ac${isWall(x, y) ? " wall" : ""}${x === px && y === py && isWall(x, y) ? " ghost" : ""}">${ic}</div>`);
    }
    box.querySelector(".astage").innerHTML = cells.join("");
    box.querySelector(".ahud").innerHTML = `<span>Очки: <b>${st.score}</b></span><span>Життя: <b>${st.lives == null ? "—" : "❤️".repeat(Math.min(st.lives, 8)) || "0"}</b></span>`
      + (st.over ? `<span class="aover ${st.over}">${st.over === "win" ? "🏆 Перемога!" : "💀 Програш"}</span>` : "");
  }
  box.querySelector(".astage").style.gridTemplateColumns = `repeat(${W}, 1fr)`;
  fire("start");
  draw();
  timer = setInterval(tick, 450);
  return { move, stop: () => clearInterval(timer), st };
}

// ---------- редактор правил ----------
function ruleRow(r, i, ro) {
  const w = WHEN[r.w];
  const sel = `<select class="rw" data-i="${i}" ${ro ? "disabled" : ""} aria-label="Подія">${Object.entries(WHEN).map(([k, v]) => `<option value="${k}" ${k === r.w ? "selected" : ""}>${v.t}</option>`).join("")}</select>`
    + (w && w.n != null ? `<input class="rn" data-i="${i}" type="number" min="0" max="99" value="${r.n ?? w.n}" ${ro ? "disabled" : ""} aria-label="Скільки">` : "");
  const acts = r.a.map((a, j) => `<span class="ra">${esc(DO[a.k].t)}${DO[a.k].n != null ? ` <input class="an" data-i="${i}" data-j="${j}" type="number" min="0" max="99" value="${a.n ?? DO[a.k].n}" ${ro ? "disabled" : ""} aria-label="Скільки">` : ""}${ro ? "" : `<button class="ax" data-i="${i}" data-j="${j}" aria-label="Прибрати дію">✕</button>`}</span>`).join("");
  return `<div class="rule"><div class="rwhen"><b>Коли</b> ${sel}</div><div class="rdo"><b>то</b> ${acts || `<span class="muted">поки нічого</span>`}
    ${ro ? "" : `<select class="radd" data-i="${i}" aria-label="Додати дію"><option value="">+ дія</option>${Object.entries(DO).map(([k, v]) => `<option value="${k}">${v.t}</option>`).join("")}</select>`}</div>
    ${ro ? "" : `<button class="rx" data-i="${i}" aria-label="Видалити правило">🗑</button>`}</div>`;
}
function ruleEditor(el, rules, onChange) {
  const draw = () => {
    el.innerHTML = `${rules.map((r, i) => ruleRow(r, i)).join("") || `<p class="muted">Правил ще немає. Додай перше!</p>`}<button class="btn ghost radd-rule">+ Правило</button>`;
    el.querySelectorAll(".rw").forEach(s => s.onchange = () => { const r = rules[+s.dataset.i]; r.w = s.value; r.n = WHEN[s.value].n; draw(); onChange && onChange(); });
    el.querySelectorAll(".rn").forEach(s => s.onchange = () => { rules[+s.dataset.i].n = Math.max(0, +s.value || 0); onChange && onChange(); });
    el.querySelectorAll(".an").forEach(s => s.onchange = () => { rules[+s.dataset.i].a[+s.dataset.j].n = Math.max(0, +s.value || 0); onChange && onChange(); });
    el.querySelectorAll(".radd").forEach(s => s.onchange = () => { if (!s.value) return; const a = { k: s.value }; if (DO[s.value].n != null) a.n = DO[s.value].n; rules[+s.dataset.i].a.push(a); draw(); onChange && onChange(); });
    el.querySelectorAll(".ax").forEach(b => b.onclick = () => { rules[+b.dataset.i].a.splice(+b.dataset.j, 1); draw(); onChange && onChange(); });
    el.querySelectorAll(".rx").forEach(b => b.onclick = () => { rules.splice(+b.dataset.i, 1); draw(); onChange && onChange(); });
    el.querySelector(".radd-rule").onclick = () => { rules.push({ w: "coin", a: [] }); draw(); onChange && onChange(); };
  };
  draw();
  return { draw };
}

// ---------- ігрова зона з кнопками ----------
function playArea(el, getScene, getRules, onEnd) {
  el.innerHTML = `<div class="aplay"><div class="ahud"></div><div class="astage" tabindex="0" aria-label="Ігрове поле. Керуй стрілками"></div>
    <div class="apad"><button data-d="up" aria-label="Вгору">▲</button><div><button data-d="left" aria-label="Ліворуч">◀</button><button data-d="down" aria-label="Вниз">▼</button><button data-d="right" aria-label="Праворуч">▶</button></div></div>
    <div class="arow"><button class="btn" data-run>▶ Грати</button><span class="muted">Стрілки на клавіатурі або кнопки</span></div></div>`;
  let g = null;
  const D = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
  const run = () => { if (g) g.stop(); g = makeGame(el, getScene(), getRules(), (how, st) => onEnd && onEnd(how, st)); el.querySelector("[data-run]").textContent = "⟲ Заново"; el.querySelector(".astage").focus(); };
  el.querySelector("[data-run]").onclick = run;
  el.querySelectorAll(".apad button").forEach(b => b.onclick = () => { if (!g) run(); const d = D[b.dataset.d]; g.move(d[0], d[1]); });
  el.querySelector(".astage").addEventListener("keydown", e => { if (!D[e.key]) return; e.preventDefault(); if (!g) run(); g.move(D[e.key][0], D[e.key][1]); });
  // показуємо поле одразу, але гра стоїть, поки не натиснуть «Грати»
  const preview = () => { const tmp = makeGame(el, getScene(), [], null); tmp.stop(); el.querySelector(".ahud").innerHTML = `<span class="muted">Натисни «Грати», щоб перевірити свою гру</span>`; };
  preview();
  return { stop: () => g && g.stop(), reset: () => { if (g) g.stop(); g = null; el.querySelector("[data-run]").textContent = "▶ Грати"; preview(); } };
}

// ---------- перевірка правил ----------
// need: [{ w, a: [дії], n?, nMax? }] — має бути правило з такою подією і всіма цими діями
// forbid: [{ w, a }] — такого правила бути не повинно
function checkRules(rules, need, forbid) {
  const miss = (need || []).filter(q => !rules.some(r => r.w === q.w && (q.nMax == null || (r.n ?? WHEN[r.w].n) <= q.nMax) && (q.n == null || (r.n ?? WHEN[r.w].n) === q.n)
    && q.a.every(k => r.a.some(a => a.k === k && (a.k !== "loseLife" && a.k !== "addScore" || (a.n ?? 1) > 0) && (!q.an || q.an[k] == null || (a.n ?? DO[k].n) === q.an[k]) && (!q.anMin || q.anMin[k] == null || (a.n ?? DO[k].n) >= q.anMin[k])))));
  const bad = (forbid || []).filter(q => rules.some(r => r.w === q.w && q.a.some(k => r.a.some(a => a.k === k))));
  return { miss, bad };
}
const say = q => `«Коли ${WHEN[q.w].t.toLowerCase()}${q.nMax != null ? " (не більше " + q.nMax + ")" : ""} → ${q.a.map(k => DO[k].t.toLowerCase()).join(", ")}»`;

// ---------- тип завдання: зроби гру / знайди баг ----------
const T = {};
T.gmake = (it, A) => {
  const rules = A.st.rules || (A.st.rules = copy(it.rules || []));
  let tries = 0, done = false, played = false;
  A.frame(it, `<div class="q">${A.md(it.q)}</div><div class="amake"><div class="aleft" id="aplay"></div><div class="aright"><h3>Правила гри</h3><div id="arules"></div></div></div><div id="ahint" class="fhint"></div>`);
  const area = playArea(A.$("#aplay"), () => it.scene, () => rules, () => { played = true; });
  ruleEditor(A.$("#arules"), rules, () => area.reset());
  A.$("#aplay").addEventListener("click", e => { if (e.target.closest("[data-run]")) played = true; });
  const check = () => {
    if (done) return;
    const { miss, bad } = checkRules(rules, it.need, it.forbid);
    if (!miss.length && !bad.length) { done = true; area.stop(); A.feedback(tries === 0, tries === 0 ? A.praise() : "Тепер працює!", (it.why || "") + (played ? "" : " Не забудь пограти у свою гру — так перевіряють справжні розробники.")); A.nextBtn(); return; }
    tries++; if (tries === 1) { A.lose(); A.frame0Hearts(); }
    if (tries >= 3) { done = true; area.stop(); A.feedback(false, "Ось чого бракувало", [...miss.map(q => "Потрібне правило " + say(q) + "."), ...bad.map(q => "Зайве правило " + say(q) + ".")].join(" ") + " " + (it.why || "")); A.nextBtn(); return; }
    const hint = tries === 1 ? (it.hint || "Пограй і подивись, що відбувається не так, як треба.") : [...miss.map(q => "Бракує: " + say(q)), ...bad.map(q => "Заважає правило з подією «" + WHEN[q.w].t + "»")].join(". ");
    A.feedback(false, "Гра ще працює не так", hint);
  };
  A.setActs(`<button class="btn" id="ck">Перевірити</button>`, { ck: check });
};

window.ARC = { TILES, WHEN, DO, makeGame, ruleEditor, playArea, checkRules };
window.GAME_TYPES = Object.assign(window.GAME_TYPES || {}, T);
})();
