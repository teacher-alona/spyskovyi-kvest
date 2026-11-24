/* «Python-роботи» — мережева настільна гра на 2–4 гравців.
   Кожен раунд гравці одночасно складають з карт маленьку програму на Python, потім усі програми виконуються
   по кроку по черзі. Сервер (Google-таблиця) лише зберігає програми; гру кожен комп'ютер рахує сам — однаково. */
(function () {
"use strict";
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const N = 9, ROUNDS = 8, HAND = 6, SLOTS = 5;
const COLORS = ["#e53935", "#2f6fe4", "#2fa84f", "#ff9800"], CNAMES = ["червоний", "синій", "зелений", "помаранчевий"];
const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];          // схід, південь, захід, північ

// ---------- карти ----------
const CARDS = {
  F: { py: "forward()", act: true, tip: "Крок уперед" },
  L: { py: "left()", act: true, tip: "Поворот ліворуч" },
  R: { py: "right()", act: true, tip: "Поворот праворуч" },
  J: { py: "jump()", act: true, tip: "Стрибок на 2 клітинки — через стіну чи робота" },
  for2: { py: "for _ in range(2):", tip: "Наступний рядок — 2 рази" },
  for3: { py: "for _ in range(3):", tip: "Наступний рядок — 3 рази" },
  ifcoin: { py: "if coin_ahead():", tip: "Наступний рядок — лише якщо попереду монета" },
  ifwall: { py: "if wall_ahead():", tip: "Наступний рядок — лише якщо попереду стіна чи край" },
  while: { py: "while not wall_ahead():", tip: "Повторювати наступний рядок, доки попереду немає стіни (до 8 разів)" },
};
const DECK = [["F", 30], ["L", 11], ["R", 11], ["J", 8], ["for2", 10], ["for3", 6], ["ifcoin", 8], ["ifwall", 6], ["while", 8]];

// ---------- випадковість з одним «зерном» на всіх комп'ютерах ----------
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hand(seed, round, idx) {
  const r = rng(seed * 31 + round * 1009 + idx * 7919 + 17), total = DECK.reduce((s, d) => s + d[1], 0), out = [];
  for (let i = 0; i < HAND; i++) { let x = r() * total; for (const [c, w] of DECK) { if ((x -= w) < 0) { out.push(c); break; } } }
  if (!out.includes("F")) out[0] = "F";   // хоч один крок завжди є
  return out;
}

// ---------- поле: стіни й монети симетрично (чесно для всіх кутів) ----------
const rot = ([x, y]) => [N - 1 - y, x];
function makeBoard(seed) {
  const r = rng(seed), walls = new Set(), coins = new Map(), K = (x, y) => x + "," + y;
  const all4 = p => { const out = [p]; for (let i = 0; i < 3; i++) out.push(rot(out[out.length - 1])); return out; };
  const forbidden = ([x, y]) => (x <= 1 && y <= 1) || (x === 4 && y === 4);
  let tries = 0;
  while (walls.size < 12 && tries++ < 200) { const p = [Math.floor(r() * 5), Math.floor(r() * 5)]; if (forbidden(p) || (p[0] === 4 && p[1] === 4)) continue; if (all4(p).some(q => walls.has(K(...q)))) continue; all4(p).forEach(q => walls.add(K(...q))); }
  tries = 0;
  while (coins.size < 16 && tries++ < 300) { const p = [Math.floor(r() * 5), Math.floor(r() * 5)]; if ((p[0] === 0 && p[1] === 0) || walls.has(K(...p)) || coins.has(K(...p)) || (p[0] === 4 && p[1] === 4)) continue; all4(p).forEach(q => coins.set(K(...q), 1)); }
  coins.set(K(4, 4), 3);   // самоцвіт у центрі
  return { walls, coins };
}
const STARTS = [{ x: 0, y: 0, d: 0 }, { x: 8, y: 0, d: 1 }, { x: 8, y: 8, d: 2 }, { x: 0, y: 8, d: 3 }];
function startsFor(n) { return n === 2 ? [STARTS[0], STARTS[2]] : STARTS.slice(0, n); }

// ---------- програма ----------
function validate(prog) {
  if (!prog.length) return "Програма порожня — додай хоч одну карту.";
  for (let i = 0; i < prog.length; i++) {
    if (!CARDS[prog[i]].act) {
      const b = prog[i + 1];
      if (!b) return `Після «${CARDS[prog[i]].py}» потрібен рядок з дією (forward, left, right, jump).`;
      if (!CARDS[b].act) return `Після «${CARDS[prog[i]].py}» має йти дія, а не ще один «${CARDS[b].py}».`;
      i++;
    }
  }
  return "";
}
// рядки Python: дія після for / if / while пишеться з відступом — це тіло
function pyLines(prog) {
  const out = [];
  prog.forEach((c, k) => out.push({ text: CARDS[c].py, ind: k > 0 && !CARDS[prog[k - 1]].act && !out[k - 1].ind }));
  return out;
}
// інтерпретатор: щоразу віддає одну дію з урахуванням того, що зараз на полі
function interp(prog) {
  const blocks = []; let ok = !validate(prog);
  if (ok) for (let i = 0; i < prog.length; i++) { if (CARDS[prog[i]].act) blocks.push({ act: prog[i] }); else { blocks.push({ ctrl: prog[i], body: prog[i + 1] }); i++; } }
  let pc = 0, cnt = null, iter = 0;
  return world => {
    while (pc < blocks.length) {
      const b = blocks[pc];
      if (b.act) { pc++; return b.act; }
      if (b.ctrl === "for2" || b.ctrl === "for3") { if (cnt === null) cnt = b.ctrl === "for2" ? 2 : 3; if (cnt > 0) { cnt--; return b.body; } cnt = null; pc++; continue; }
      if (b.ctrl === "ifcoin") { pc++; if (world.coinAhead()) return b.body; continue; }
      if (b.ctrl === "ifwall") { pc++; if (world.wallAhead()) return b.body; continue; }
      if (b.ctrl === "while") { if (iter < 8 && !world.wallAhead()) { iter++; return b.body; } iter = 0; pc++; continue; }
    }
    return null;
  };
}

// ---------- гра ----------
function newGame(seed, n) {
  const b = makeBoard(seed);
  return { walls: b.walls, coins: b.coins, bots: startsFor(n).map(s => ({ x: s.x, y: s.y, d: s.d, score: 0 })) };
}
const K = (x, y) => x + "," + y;
// один раунд: програми виконуються по кроку, по черзі; черговість зсувається щораунду
function playRound(g, progs, round) {
  const n = g.bots.length, order = [...Array(n).keys()].map(i => (i + round) % n), ev = [];
  const runs = progs.map(p => interp(p || []));
  const inside = (x, y) => x >= 0 && y >= 0 && x < N && y < N;
  const botAt = (x, y, me) => g.bots.some((b, j) => j !== me && b.x === x && b.y === y);
  const done = Array(n).fill(false);
  for (let tick = 0; tick < 60 && done.includes(false); tick++) {
    for (const i of order) {
      if (done[i]) continue;
      const bot = g.bots[i], [dx, dy] = DIRS[bot.d];
      const world = { wallAhead: () => !inside(bot.x + dx, bot.y + dy) || g.walls.has(K(bot.x + dx, bot.y + dy)), coinAhead: () => g.coins.has(K(bot.x + dx, bot.y + dy)) };
      const a = runs[i](world);
      if (!a) { done[i] = true; continue; }
      if (a === "L" || a === "R") { bot.d = (bot.d + (a === "R" ? 1 : 3)) % 4; ev.push({ i, a, x: bot.x, y: bot.y, d: bot.d }); continue; }
      const k = a === "J" ? 2 : 1, tx = bot.x + dx * k, ty = bot.y + dy * k;
      if (!inside(tx, ty) || g.walls.has(K(tx, ty)) || botAt(tx, ty, i)) { ev.push({ i, a, bump: true, x: bot.x, y: bot.y, d: bot.d }); continue; }
      bot.x = tx; bot.y = ty;
      const c = g.coins.get(K(tx, ty)); if (c) { g.coins.delete(K(tx, ty)); bot.score += c; }
      ev.push({ i, a, x: tx, y: ty, d: bot.d, coin: c || 0 });
    }
  }
  return ev;
}

// ---------- робот-комп'ютер (сильний) ----------
// перебирає всі програми, які можна скласти зі своїх карт, і програє кожну «в голові»:
// скільки балів збере і наскільки близько потім буде до наступної монети
function allProgs(h) {
  const out = new Map(), pre = [], used = [];
  (function rec() {
    if (pre.length) { const k = pre.join(" "); if (!out.has(k) && !validate(pre)) out.set(k, pre.slice()); }
    if (pre.length >= SLOTS) return;
    for (let i = 0; i < h.length; i++) if (!used[i]) { used[i] = 1; pre.push(h[i]); rec(); pre.pop(); used[i] = 0; }
  })();
  return [...out.values()];
}
// найкоротший шлях (у діях) від робота до найближчої монети; самоцвіт вартий трохи довшої дороги
function coinDist(g, b) {
  if (!g.coins.size) return 0;
  const inside = (x, y) => x >= 0 && y >= 0 && x < N && y < N, seen = new Set(), q = [[b.x, b.y, b.d, 0]];
  let best = 99;
  seen.add(b.x + "," + b.y + "," + b.d);
  for (let qi = 0; qi < q.length; qi++) {
    const [x, y, d, c] = q[qi];
    if (c >= best) break;
    const v = g.coins.get(K(x, y));
    if (v && c > 0) best = Math.min(best, c - (v > 1 ? 4 : 0));
    const [dx, dy] = DIRS[d], nx = [];
    nx.push([x, y, (d + 1) % 4], [x, y, (d + 3) % 4]);
    if (inside(x + dx, y + dy) && !g.walls.has(K(x + dx, y + dy))) nx.push([x + dx, y + dy, d]);
    if (inside(x + 2 * dx, y + 2 * dy) && !g.walls.has(K(x + 2 * dx, y + 2 * dy))) nx.push([x + 2 * dx, y + 2 * dy, d]);
    for (const [a, bb, dd] of nx) { const k = a + "," + bb + "," + dd; if (!seen.has(k)) { seen.add(k); q.push([a, bb, dd, c + 1]); } }
  }
  return best === 99 ? 30 : Math.max(0, best);
}
const botCache = new Map();
function botProg(g, i, round, seed) {
  const key = [seed, round, i, g.coins.size, g.bots.map(b => b.x + "," + b.y + "," + b.d).join(";")].join("|");
  if (botCache.has(key)) return botCache.get(key);
  let best = [], bestScore = -1e9;
  for (const p of allProgs(hand(seed, round, i))) {
    const t = { walls: g.walls, coins: new Map(g.coins), bots: g.bots.map(b => Object.assign({}, b)) };
    playRound(t, t.bots.map((_, j) => j === i ? p : []), round);
    const sc = (t.bots[i].score - g.bots[i].score) * 100 - 3 * coinDist(t, t.bots[i]) - p.length * 0.01;
    if (sc > bestScore) { bestScore = sc; best = p; }
  }
  botCache.set(key, best);
  return best;
}
const isBot = id => String(id).indexOf("~bot") === 0;

// ---------- мережа ----------
const API_ERR = { no_room: "Такої кімнати немає (або вона вже закінчилася).", full: "У кімнаті вже 4 гравці.", started: "Гра в цій кімнаті вже почалася.", few: "Потрібно щонайменше 2 гравці.", not_host: "Почати гру може лише той, хто створив кімнату.", net: "Немає зв'язку з сервером. Пробую ще раз…", auth: "Увійди на головній сторінці порталу.", unknown_action: "Учителька ще не оновила скрипт таблиці — гра запрацює після оновлення.", "сервер зайнятий": "Сервер зайнятий, пробую ще раз…" };
const nick = () => { try { return (KV.profile().name || KV.session.name || "").slice(0, 24); } catch (e) { return ""; } };
async function api(action, body) { const r = await KV.call(action, Object.assign({ nick: nick() }, body || {})); return r; }

// ---------- стан сторінки ----------
let drawn = "", room = null, me = null, view = null, shown = 0, prog = [], sent = -1, pollT = null, animating = false, game = null, lastV = 0, clockSkew = 0;
const msg = (t, bad) => { const m = $("#msg"); m.textContent = t || ""; m.className = "rb-msg" + (bad ? " bad" : ""); };

function schedule(ms) { clearTimeout(pollT); pollT = setTimeout(poll, ms + Math.random() * 600); }
async function poll() {
  if (!room) return;
  if (document.hidden) { schedule(4000); return; }
  const r = await api("room_state", { code: room.code, v: lastV });
  if (!r.ok) { if (r.error === "no_room") { msg(API_ERR.no_room, true); room = null; render(); return; } msg(API_ERR[r.error] || r.error, true); schedule(5000); return; }
  if (r.now) clockSkew = r.now - Date.now();
  if (!r.same) apply(r);
  const composing = room && room.status === "play" && sent !== room.round && !animating;
  schedule(composing ? 5000 : 2200);
}
function apply(r) {
  room = r.room; me = r.me; lastV = room.v;
  try { localStorage.setItem("kv-robo-room", room.code); } catch (e) {}
  msg("");
  render();
}

// ---------- малювання ----------
function order() { return room.order || room.players.map(p => p.login); }
function nameOf(login) { const p = room.players.find(x => x.login === login); return p ? p.nick : login + " (вийшов)"; }
// стан гри після всіх завершених раундів (рахуємо заново — так усі комп'ютери бачать одне й те саме)
// програми всіх гравців у раунді: людські — з кімнати, роботів-комп'ютерів — рахуємо (однаково на всіх комп'ютерах)
function roundProgs(g, r) {
  const rr = room.rounds[r] || {};
  return order().map((id, i) => isBot(id) ? botProg(g, i, r, room.seed) : (rr[id] || {}).prog || []);
}
function replay(upto) {
  const ids = order(), g = newGame(room.seed, ids.length), log = [];
  for (let r = 0; r < upto; r++) log.push(playRound(g, roundProgs(g, r), r));
  return { g, log };
}
function finished() { return room.status === "done" ? room.rounds.length : room.round; }

function render() {
  const box = $("#rb");
  if (!room) return lobbyStart();
  if (room.status === "lobby") return lobbyRoom();
  if (animating) return;   // анімація сама перемалює, коли закінчить
  // програму цього раунду вже здано (наприклад, до оновлення сторінки)
  if (room.status === "play" && room.rounds[room.round] && room.rounds[room.round][me]) sent = room.round;
  // гра: якщо з'явилися нові завершені раунди — анімуємо
  const done = finished();
  if (!game || shown > done) { shown = done; const rp = replay(done); game = rp.g; }
  if (done > shown && !animating) return animateRounds(shown, done);
  // поки гравець складає програму, не перебудовуємо сторінку (інакше клік по карті може «загубитися») —
  // лише оновлюємо галочки «здав / ще складає»
  const sc = document.querySelector(".rb-score");
  if (drawn === "compose:" + room.round && sent !== room.round && room.status === "play" && sc) { sc.outerHTML = scores(game, true); return; }
  drawGame();
}

function lobbyStart() {
  drawn = "";
  const solo = `<div class="card rb-lobby">
    <h2>Гра проти комп'ютера</h2>
    <p>Твої суперники — роботи-комп'ютери. Вони грають сильно: перебирають усі програми зі своїх карт і обирають найкращу.</p>
    <div class="arow rb-nb"><span>Скільки роботів:</span>${[1, 2, 3].map(n => `<button class="btn ghost${n === 1 ? " on" : ""}" data-nb="${n}">${n}</button>`).join("")}</div>
    <div class="arow"><button class="btn" id="solo">▶ Грати</button></div>
  </div>`;
  if (!KV.session) {
    $("#rb").innerHTML = solo + `<div class="card"><p>Щоб грати з однокласниками по мережі, <a href="../">увійди на головній сторінці порталу</a>, а потім повернися сюди.</p></div>`;
  } else $("#rb").innerHTML = `<div class="card rb-lobby">
    <h2>Нова гра</h2>
    <p>Один гравець створює кімнату й каже іншим її код. Грають від 2 до 4 гравців — кожен зі свого комп'ютера. У кімнату можна додати й роботів-комп'ютерів.</p>
    <div class="arow"><button class="btn" id="mk">Створити кімнату</button></div>
    <h2>Або приєднайся</h2>
    <div class="arow"><input class="answer-input rb-code" id="code" maxlength="4" placeholder="КОД" autocomplete="off" spellcheck="false"><button class="btn" id="jn">Приєднатися</button></div>
  </div>` + solo;
  let nb = 1;
  document.querySelectorAll("[data-nb]").forEach(b => b.onclick = () => { nb = +b.dataset.nb; document.querySelectorAll("[data-nb]").forEach(x => x.classList.toggle("on", x === b)); });
  $("#solo").onclick = () => startSolo(nb);
  if (!KV.session) return;
  $("#mk").onclick = async () => { $("#mk").disabled = true; const r = await api("room_create"); if (!r.ok) { msg(API_ERR[r.error] || r.error, true); $("#mk").disabled = false; return; } apply(r); schedule(2000); };
  const join = async () => { const code = $("#code").value.trim().toUpperCase(); if (code.length !== 4) return msg("Код кімнати — 4 символи.", true); const r = await api("room_join", { code }); if (!r.ok) return msg(API_ERR[r.error] || r.error, true); apply(r); schedule(2000); };
  $("#jn").onclick = join; $("#code").onkeydown = e => { if (e.key === "Enter") join(); };
  let saved = null; try { saved = localStorage.getItem("kv-robo-room"); } catch (e) {}
  if (saved) $("#code").value = saved;
}
function startSolo(nb) {
  me = "~me"; clearTimeout(pollT);
  const players = [{ login: me, nick: nick() || "Ти" }];
  for (let n = 1; n <= nb; n++) players.push({ login: "~bot" + n, nick: "Робот-" + n + " 🤖", bot: true });
  room = { local: true, code: "", host: me, status: "play", players, order: players.map(p => p.login), seed: Math.floor(Math.random() * 2e9), round: 0, rounds: [{}], deadline: 0, v: 0 };
  game = null; shown = 0; prog = []; sent = -1; msg("");
  render();
}
function lobbyRoom() {
  drawn = "";
  const host = room.host === me;
  $("#rb").innerHTML = `<div class="card rb-lobby">
    <p class="muted">Код кімнати — скажи його іншим:</p><div class="rb-bigcode">${esc(room.code)}</div>
    <h2>Гравці (${room.players.length}/4)</h2>
    <ul class="rb-players">${room.players.map((p, i) => `<li><i style="background:${COLORS[i]}"></i>${esc(p.nick)} <span class="muted">${esc(p.cls || "")}</span>${p.login === room.host ? " 👑" : ""}${p.login === me ? " — це ти" : ""}${host && p.bot ? ` <button class="rb-x" data-bot="${esc(p.login)}" title="Прибрати робота">✕</button>` : ""}</li>`).join("")}</ul>
    ${host && room.players.length < 4 ? `<div class="arow"><button class="btn ghost" id="addbot">+ Додати робота-комп'ютера 🤖</button></div>` : ""}
    <div class="arow">${host ? `<button class="btn" id="go" ${room.players.length < 2 ? "disabled" : ""}>Почати гру</button>` : `<span class="muted">Чекаємо, поки 👑 почне гру…</span>`}<button class="btn ghost" id="lv">Вийти з кімнати</button></div>
  </div>`;
  if (host) $("#go").onclick = async () => { const r = await api("room_start", { code: room.code }); if (!r.ok) return msg(API_ERR[r.error] || r.error, true); apply(r); };
  const botAct = async (action, extra) => { const r = await api(action, Object.assign({ code: room.code }, extra)); if (!r.ok) return msg(API_ERR[r.error] || r.error, true); apply(r); };
  if ($("#addbot")) $("#addbot").onclick = () => { $("#addbot").disabled = true; botAct("room_addbot"); };
  document.querySelectorAll("[data-bot]").forEach(b => b.onclick = () => { b.disabled = true; botAct("room_delbot", { bot: b.dataset.bot }); });
  $("#lv").onclick = leave;
}
async function leave() { if (room && !room.local) await api("room_leave", { code: room.code }); room = null; game = null; shown = 0; prog = []; sent = -1; try { localStorage.removeItem("kv-robo-room"); } catch (e) {} clearTimeout(pollT); render(); }

function boardSVG(g, hi) {
  const C = 40, ids = order();
  let s = `<svg class="rb-board" viewBox="0 0 ${N * C} ${N * C}" role="img" aria-label="Поле 9 на 9">`;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) s += `<rect x="${x * C}" y="${y * C}" width="${C}" height="${C}" fill="${(x + y) % 2 ? "#eef1fb" : "#f8f9fe"}"/>`;
  g.walls.forEach(k => { const [x, y] = k.split(",").map(Number); s += `<rect x="${x * C + 2}" y="${y * C + 2}" width="${C - 4}" height="${C - 4}" rx="5" fill="#5b5f73"/><path d="M${x * C + 6} ${y * C + 14}h${C - 12}M${x * C + 6} ${y * C + 26}h${C - 12}" stroke="#7b8095" stroke-width="2"/>`; });
  g.coins.forEach((v, k) => { const [x, y] = k.split(",").map(Number); s += v > 1 ? `<polygon points="${x * C + 20},${y * C + 6} ${x * C + 33},${y * C + 17} ${x * C + 20},${y * C + 34} ${x * C + 7},${y * C + 17}" fill="#8e44ad" stroke="#5b2a72" stroke-width="2"/>` : `<circle cx="${x * C + 20}" cy="${y * C + 20}" r="9" fill="#ffd23d" stroke="#c99a00" stroke-width="2"/>`; });
  g.bots.forEach((b, i) => {
    const cx = b.x * C + 20, cy = b.y * C + 20, ang = b.d * 90;
    s += `<g class="rb-bot${hi === i ? " hi" : ""}" transform="translate(${cx} ${cy}) rotate(${ang})"><rect x="-15" y="-15" width="30" height="30" rx="8" fill="${COLORS[i]}" stroke="#1d1d1f" stroke-width="2"/><polygon points="9,-7 17,0 9,7" fill="#fff"/><circle cx="2" cy="-6" r="3" fill="#fff"/><circle cx="2" cy="6" r="3" fill="#fff"/></g>`;
    if (ids[i] === me) s += `<circle cx="${cx}" cy="${cy}" r="19" fill="none" stroke="${COLORS[i]}" stroke-width="2" stroke-dasharray="4 3"/>`;
  });
  return s + "</svg>";
}
function scores(g, extra) {
  const ids = order(), cur = room.rounds[room.round] || {};
  return `<ul class="rb-score">${ids.map((id, i) => `<li${id === me ? ' class="me"' : ""}><i style="background:${COLORS[i]}"></i><span>${esc(nameOf(id))}${id === me ? " (ти)" : ""}</span><b>${g.bots[i].score}</b>${extra && room.status === "play" ? (cur[id] || isBot(id) ? `<em title="Програму здано">✓</em>` : `<em class="wait" title="Ще складає програму">…</em>`) : ""}</li>`).join("")}</ul>`;
}

function drawGame() {
  const ids = order(), idx = ids.indexOf(me), over = room.status === "done" || !game.coins.size;
  if (over) return drawEnd();
  const r = room.round, myHand = hand(room.seed, r, idx), spectator = idx < 0;
  const left = Math.max(0, Math.round((room.deadline - (Date.now() + clockSkew)) / 1000));
  const used = new Set(prog.map(p => p.h));
  const lines = pyLines(prog.map(p => p.c));
  $("#rb").innerHTML = `<div class="rb-top"><b>Раунд ${r + 1} з ${ROUNDS}</b>${room.local ? "" : `<span class="rb-clock" id="clock">⏱ ${left} с</span>`}<span class="muted">Ти — ${CNAMES[idx] || "глядач"} робот</span></div>
  <div class="rb-main"><div class="rb-left">${boardSVG(game)}${scores(game, true)}</div>
  <div class="rb-right">${spectator ? `<p>Ти дивишся гру.</p>` : sent === r ? `<div class="card rb-wait"><h3>Програму здано ✓</h3><pre class="code">${esc(pyLines(((room.rounds[r] || {})[me] || {}).prog || prog.map(p => p.c)).map(l => (l.ind ? "    " : "") + l.text).join("\n"))}</pre><p class="muted">${room.local ? "Роботи-комп'ютери думають…" : "Чекаємо інших гравців. Коли всі здадуть — роботи поїдуть."}</p></div>` : `
    <h3>Твої карти</h3>
    <div class="rb-hand">${myHand.map((c, h) => `<button class="rb-card${CARDS[c].act ? "" : " ctl"}" data-h="${h}" ${used.has(h) || prog.length >= SLOTS ? "disabled" : ""} title="${esc(CARDS[c].tip)}"><code>${esc(CARDS[c].py)}</code></button>`).join("")}</div>
    <h3>Програма <span class="muted">(до ${SLOTS} рядків, клацни рядок — щоб забрати)</span></h3>
    <div class="rb-prog">${lines.length ? lines.map((l, k) => `<button class="rb-line" data-k="${k}"><code>${l.ind ? "&nbsp;&nbsp;&nbsp;&nbsp;" : ""}${esc(l.text)}</code></button>`).join("") : `<p class="muted">Клацай карти, щоб скласти програму. Наступний рядок після <code>for</code>, <code>if</code> чи <code>while</code> стає його тілом.</p>`}</div>
    <p class="rb-err" id="perr">${prog.length ? esc(validate(prog.map(p => p.c))) : ""}</p>
    <div class="arow"><button class="btn" id="send" ${prog.length && !validate(prog.map(p => p.c)) ? "" : "disabled"}>▶ Готово</button><button class="btn ghost" id="clr">Очистити</button></div>
    <details class="rb-rules"><summary>Як ходять роботи</summary><p>Коли всі здали програми, роботи виконують їх <b>одночасно, по одній дії по черзі</b>. Монета — 1 бал, фіолетовий самоцвіт у центрі — 3. <code>forward()</code> у стіну, край поля чи іншого робота — робот просто стоїть. <code>jump()</code> перестрибує через стіну чи робота, якщо через клітинку вільно. Після ${ROUNDS} раундів перемагає той, у кого більше балів.</p></details>`}
  </div></div>`;
  drawn = !spectator && sent !== r ? "compose:" + r : "other";
  if (!spectator && sent !== r) {
    document.querySelectorAll(".rb-card").forEach(b => b.onclick = () => { prog.push({ c: myHand[+b.dataset.h], h: +b.dataset.h }); drawGame(); });
    document.querySelectorAll(".rb-line").forEach(b => b.onclick = () => { prog.splice(+b.dataset.k, 1); drawGame(); });
    $("#clr").onclick = () => { prog = []; drawGame(); };
    $("#send").onclick = async () => {
      // одразу показуємо «здано», не чекаючи відповіді таблиці
      const mine = prog.slice();
      if (room.local) {
        room.rounds[r][me] = { prog: mine.map(p => p.c) }; sent = r; drawGame(); prog = [];
        if (r + 1 >= ROUNDS) room.status = "done"; else { room.round++; room.rounds.push({}); }
        setTimeout(render, 250); return;
      }
      sent = r; drawGame();
      const res = await api("room_move", { code: room.code, round: r, prog: mine.map(p => p.c) });
      if (!res.ok) { sent = -1; prog = mine; msg(API_ERR[res.error] || res.error, true); drawGame(); return; }
      prog = []; apply(res); schedule(1500);
    };
  }
  tickClock();
}
let clockT = null;
function tickClock() {
  clearTimeout(clockT);
  const el = $("#clock"); if (!el || !room || room.local || room.status !== "play") return;
  const left = Math.max(0, Math.round((room.deadline - (Date.now() + clockSkew)) / 1000));
  el.textContent = `⏱ ${left} с`; el.classList.toggle("low", left <= 15);
  clockT = setTimeout(tickClock, 1000);
}

// анімація завершених раундів: крок за кроком
async function animateRounds(from, to) {
  animating = true; drawn = "";
  const ids = order();
  for (let r = from; r < to; r++) {
    const rr = room.rounds[r] || {};
    const progs = roundProgs(game, r);
    const before = JSON.parse(JSON.stringify({ bots: game.bots }));
    const g2 = { walls: game.walls, coins: new Map(game.coins), bots: before.bots.map(b => Object.assign({}, b)) };
    const ev = playRound(g2, progs, r);
    // показ: копія стану, яку міняємо подія за подією
    const view = { walls: game.walls, coins: new Map(game.coins), bots: before.bots.map(b => Object.assign({}, b)) };
    $("#rb").innerHTML = `<div class="rb-top"><b>Раунд ${r + 1}: роботи їдуть</b></div><div class="rb-main"><div class="rb-left"><div id="anim">${boardSVG(view)}</div>${scores(view)}</div>
      <div class="rb-right"><h3>Програми</h3>${ids.map((id, i) => `<div class="rb-pv"><i style="background:${COLORS[i]}"></i><b>${esc(nameOf(id))}</b>${rr[id] && rr[id].late ? ' <span class="muted">(не встиг — стоїть)</span>' : ""}<pre class="code">${esc(pyLines(progs[i]).map(l => (l.ind ? "    " : "") + l.text).join("\n") || "# порожньо")}</pre></div>`).join("")}<div class="rb-log" id="log"></div></div></div>`;
    for (const e of ev) {
      const b = view.bots[e.i]; b.x = e.x; b.y = e.y; b.d = e.d;
      if (e.coin) { view.coins.delete(K(e.x, e.y)); b.score += e.coin; }
      $("#anim").innerHTML = boardSVG(view, e.i);
      if (e.coin || e.bump) $("#log").insertAdjacentHTML("afterbegin", `<div><i style="background:${COLORS[e.i]}"></i>${esc(nameOf(ids[e.i]))}: ${e.coin ? (e.coin > 1 ? "самоцвіт! +3" : "монета +1") : "бум — шлях закритий"}</div>`);
      document.querySelector(".rb-score").outerHTML = scores(view);
      await new Promise(ok => setTimeout(ok, 380));
    }
    await new Promise(ok => setTimeout(ok, 700));
    game = g2; shown = r + 1;
  }
  animating = false;
  render();
}
function drawEnd() {
  const ids = order(), rank = ids.map((id, i) => ({ id, i, s: game.bots[i].score })).sort((a, b) => b.s - a.s), best = rank[0].s;
  $("#rb").innerHTML = `<div class="rb-main"><div class="rb-left">${boardSVG(game)}</div><div class="rb-right card">
    <h2>${rank.filter(x => x.s === best).map(x => x.id).includes(me) ? "🏆 Перемога!" : "Гру завершено"}</h2>
    <ol class="rb-rank">${rank.map(x => `<li><i style="background:${COLORS[x.i]}"></i>${esc(nameOf(x.id))} — <b>${x.s}</b>${x.s === best ? " 🏆" : ""}</li>`).join("")}</ol>
    <div class="arow">${room.local ? `<button class="btn" id="more">Ще раз</button>` : ""}<button class="btn${room.local ? " ghost" : ""}" id="again">Нова гра</button></div></div></div>`;
  $("#again").onclick = leave;
  if ($("#more")) $("#more").onclick = () => startSolo(room.players.length - 1);
  clearTimeout(pollT);
}

// повернутися в кімнату після оновлення сторінки
async function resume() {
  render();
  let code = null; try { code = localStorage.getItem("kv-robo-room"); } catch (e) {}
  if (!code || !KV.session) return;
  const r = await api("room_state", { code });
  if (r.ok && r.room && r.room.players.some(p => p.login === r.me)) { apply(r); schedule(2000); }
}
document.addEventListener("visibilitychange", () => { if (!document.hidden && room && !room.local) schedule(200); });
window.ROBO = { CARDS, hand, makeBoard, newGame, playRound, validate, interp, pyLines, botProg, allProgs };
if (!window.ROBO_TEST) resume();
})();
