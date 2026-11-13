/* Спільний рушій для всіх ігор порталу: вхід, профіль і прогрес, синхронізація з таблицею,
   змійка з гардеробом, заслона при виході з гри. Кожна гра підключає цей файл і додає свої рівні. */
(function () {
"use strict";
const VERSION = "2026.11.13-24";
const API = "https://script.google.com/macros/s/AKfycbzPtRGlYI4osS-xL-J_pAZ2A2HxTWUeuecjy9-13MgAdFIzkDnYuCr1qmLHqZvqWkQMWQ/exec";

// Усі ігри порталу. sheet — назва аркуша з прогресом у таблиці вчительки.
const GAMES = [
  { id: "spysky", title: "Списковий квест", sub: "Python · списки", path: "spysky/", sheet: "Прогрес: Списки", max: 36,
    levelIds: ["index","slices","methods","loops","search","strings","tools","sorting","comprehension","nested","copy","boss"] },
  { id: "python6", title: "Перші кроки в Python", sub: "Python · print, змінні, input", path: "python6/", sheet: "Прогрес: Перші кроки", max: 21,
    levelIds: ["intro","print","math","types","vars","input","final"] },
  { id: "fajly", title: "Файли і папки", sub: "Цифрова грамотність · 5 клас", path: "fajly/", sheet: "Прогрес: Файли", max: 30,
    levelIds: ["basics","names","extlearn","ext","path","shortcuts","actions","explorer","final","hardware"] },
  { id: "klavishi", title: "Гарячі клавіші", sub: "Цифрова грамотність · 5 клас", path: "klavishi/", sheet: "Прогрес: Клавіші", max: 18,
    levelIds: ["copy","edit","files","windows","train","test"] },
  { id: "trenazhery", title: "Тренажери", sub: "Розширення, Провідник і гарячі клавіші · відкриті завжди", path: "trenazhery/", sheet: "Прогрес: Тренажери", max: 42,
    levelIds: ["ext_media", "ext_docs", "ext_exe", "ext_all", "xp_nav", "xp_make", "xp_copy", "xp_bin", "xp_tidy", "k_copy", "k_text", "k_files", "k_win", "k_all"] },
];

// ---------- утиліти ----------
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const md = s => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>");
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const fmtTime = ms => { const t = Math.round(ms / 1000), m = Math.floor(t / 60), sec = t % 60; return m ? `${m} хв ${sec} с` : `${sec} с`; };
const starStr = (n, cls) => `<span class="${cls}">${[1, 2, 3].map(k => `<span class="${k <= n ? "on" : ""}">★</span>`).join("")}</span>`;
const app = () => document.getElementById("app");
const $ = s => app().querySelector(s);
const lsGet = k => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const lsDel = k => { try { localStorage.removeItem(k); } catch (e) {} };

// ---------- сховище: профіль (змійка, спільна для всіх ігор) + прогрес кожної гри ----------
const SKEY = "kv-session", DKEY = "kv-store";
const PROFILE_KEYS = ["name", "skin", "acc", "ach", "bought"];
// поля старого формату «Спискового квесту», які тепер живуть у профілі
const splitLegacy = old => {
  const profile = {}, game = {};
  Object.entries(old || {}).forEach(([k, v]) => { if (PROFILE_KEYS.includes(k)) profile[k] = v; else if (k !== "owner" && k !== "all") game[k] = v; });
  profile.updatedAt = old && old.updatedAt || 0;
  return { profile, game };
};
let store = lsGet(DKEY);
let session = lsGet(SKEY);
// переїзд зі старої гри: ключі spyskovyi-kvest-*
if (!store) {
  const old = lsGet("spyskovyi-kvest-v1");
  if (old && old.stars) { const sp = splitLegacy(old); store = { owner: old.owner || null, profile: sp.profile, games: { spysky: sp.game } }; }
}
if (!session) { session = lsGet("spyskovyi-kvest-session"); if (session) lsSet(SKEY, session); }
const blankStore = () => ({ owner: null, profile: {}, games: {} });
if (!store) store = blankStore();
function fixStore() {
  store.profile = store.profile || {}; store.games = store.games || {};
  const p = store.profile; p.skin = p.skin || "classic"; p.acc = p.acc || "none"; p.name = p.name || "Пітоша"; p.ach = p.ach || {}; p.bought = Array.isArray(p.bought) ? p.bought : []; p.mix = p.mix && typeof p.mix === "object" ? p.mix : {};
  // прибрана з крамниці паляниця: повертаємо байти, якщо хтось устиг купити
  if (p.bought.includes("palianytsia")) { p.bought = p.bought.filter(x => x !== "palianytsia"); p.spent = Math.max(0, (p.spent || 0) - 20); }
}
fixStore();
const gameData = id => { const g = store.games[id] = store.games[id] || {}; g.stars = g.stars || {}; return g; };
const profile = () => store.profile;
let currentGame = null; // id гри на цій сторінці (null — портал)
let gameSummary = null; // функція гри: що записати в її аркуш
function persist() { lsSet(DKEY, store); }
// save(): після будь-якої зміни прогресу чи профілю
function save(part) {
  const now = Date.now();
  if (part === "profile" || !currentGame) store.profile.updatedAt = now;
  if (currentGame) gameData(currentGame).updatedAt = now;
  if (part === "both") store.profile.updatedAt = now;
  persist(); scheduleSync();
}
const totalStars = () => Object.values(store.games).reduce((s, g) => s + Object.values((g && g.stars) || {}).reduce((a, b) => a + b, 0), 0);

// ---------- зв'язок з таблицею ----------
let offline = false;
let serverV = +(lsGet("kv-server-v") || 1);   // 2 — новий скрипт таблиці (кілька ігор)
async function api(body) {
  const r = await fetch(API, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body), redirect: "follow" });
  return r.json();
}
function payload() {
  const body = { action: "save", login: session.login, pin: session.pin, v: 2, profile: store.profile };
  if (currentGame) {
    const G = GAMES.find(g => g.id === currentGame), g = gameData(currentGame), s = gameSummary ? gameSummary(g) : {};
    Object.assign(s, { snake: store.profile.name, skin: store.profile.skin, acc: store.profile.acc });
    body.game = { id: currentGame, sheet: G.sheet, data: g, summary: s };
    // для старого скрипта (одна гра, аркуш «Прогрес»)
    if (currentGame === "spysky") { body.data = Object.assign({}, g, { name: store.profile.name, skin: store.profile.skin, acc: store.profile.acc, ach: store.profile.ach }); body.summary = s; }
  }
  return body;
}
let syncTimer = null, syncing = false, dirty = false, again = false;
function scheduleSync(now) {
  if (!session || offline) return;
  if (serverV < 2 && !currentGame) return;   // старий скрипт уміє зберігати лише прогрес гри
  dirty = true;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(syncNow, now ? 0 : 1500);
}
async function syncNow() {
  if (!session || offline || !dirty) return;
  if (syncing) { again = true; return; }
  syncing = true; dirty = false; again = false;
  setSync("saving");
  let failed = false, why = "";
  try {
    const r = await api(payload());
    if (!r.ok) { failed = true; why = r.error || "server"; }
  } catch (e) { failed = true; why = "network"; }
  syncing = false;
  if (failed) { dirty = true; setSync("fail", why); syncTimer = setTimeout(syncNow, 8000); }
  else if (again || dirty) { dirty = true; syncTimer = setTimeout(syncNow, 300); }
  else setSync("ok");
}
let syncState = "ok", syncWhy = "";
function syncLabel() {
  if (!session || offline) return "";
  if (syncState === "saving") return `<span class="sync saving">Зберігаю…</span>`;
  if (syncState === "fail") return `<span class="sync fail">Не збережено${syncWhy === "network" ? ": немає зв'язку з таблицею" : syncWhy ? ": " + esc(syncWhy) : ""}. Спробую ще раз</span>`;
  return `<span class="sync ok">Збережено ✓</span>`;
}
function setSync(st, why) { syncState = st; syncWhy = why || ""; document.querySelectorAll(".syncbox").forEach(el => { el.innerHTML = syncLabel(); }); }
function beacon() {
  if (!dirty || !session || offline || !navigator.sendBeacon) return;
  try { navigator.sendBeacon(API, new Blob([JSON.stringify(payload())], { type: "text/plain;charset=utf-8" })); } catch (e) {}
}
window.addEventListener("pagehide", beacon);
document.addEventListener("visibilitychange", () => { if (document.hidden) beacon(); });

// ---------- зведення даних з таблиці й браузера ----------
const mx = (a, b) => { const o = Object.assign({}, b || {}); Object.entries(a || {}).forEach(([k, v]) => { o[k] = Math.max(v, o[k] || 0); }); return o; };
function mergeGame(local, remote) {
  if (!remote) return local || {};
  if (!local) return remote;
  const newer = (local.updatedAt || 0) > (remote.updatedAt || 0) ? local : remote;
  const m = Object.assign({}, newer);
  m.stars = mx(local.stars, remote.stars);
  m.attempts = mx(local.attempts, remote.attempts);
  m.lvLeaves = mx(local.lvLeaves, remote.lvLeaves);
  ["leaves", "bytes", "awayMs"].forEach(k => { m[k] = Math.max(local[k] || 0, remote[k] || 0); });
  return m;
}
function mergeProfile(local, remote) {
  if (!remote) return local || {};
  if (!local) return remote;
  const newer = (local.updatedAt || 0) > (remote.updatedAt || 0) ? local : remote;
  const m = Object.assign({}, newer);
  m.ach = Object.assign({}, remote.ach || {}, local.ach || {});
  m.bought = [...new Set([...(remote.bought || []), ...(local.bought || [])])];   // куплене не зникає
  // серія: беремо ту, де останній день пізніший (або довша, якщо день той самий)
  const a = remote.streak || {}, b = local.streak || {};
  m.streak = (a.last || "") > (b.last || "") ? a : (b.last || "") > (a.last || "") ? b : ((a.n || 0) >= (b.n || 0) ? a : b);
  m.streak = Object.assign({}, m.streak, { best: Math.max(a.best || 0, b.best || 0, m.streak.n || 0) });
  m.bonus = Math.max(remote.bonus || 0, local.bonus || 0);
  m.spent = Math.max(remote.spent || 0, local.spent || 0);
  return m;
}
// r — відповідь сервера на вхід (новий скрипт: profile + games; старий: data + levels + bytes)
function applyServer(r) {
  serverV = r.v >= 2 ? 2 : 1; lsSet("kv-server-v", serverV);
  const mine = store.owner === session.login;
  if (!mine && store.owner) store = blankStore();               // браузер іншого учня
  const before = JSON.stringify(store);
  let remoteProfile = r.profile || null;
  const remoteGames = {};
  if (r.games) Object.entries(r.games).forEach(([id, x]) => { remoteGames[id] = x; });
  else if ("data" in r) remoteGames.spysky = { data: r.data, levels: r.levels, bytes: r.bytes };   // старий скрипт
  Object.entries(remoteGames).forEach(([id, x]) => {
    let data = x && x.data;
    if (data && (data.name || data.skin || data.acc || data.ach)) {   // старий формат: профіль усередині гри
      const sp = splitLegacy(data); data = sp.game;
      if (!remoteProfile) remoteProfile = sp.profile; else remoteProfile.ach = Object.assign({}, sp.profile.ach || {}, remoteProfile.ach || {});
    }
    const merged = mergeGame(store.games[id], data);
    merged.stars = merged.stars || {};
    // ручні зміни вчительки в колонках рівнів (лише збільшення)
    const G = GAMES.find(g => g.id === id);
    if (x && x.levels && G && G.levelIds) x.levels.forEach((v, i) => { const lid = G.levelIds[i], n = Math.min(3, Math.max(0, Math.round(v))); if (lid && n > (merged.stars[lid] || 0)) merged.stars[lid] = n; });
    if (x && x.bytes > (merged.bytes || 0)) merged.bytes = x.bytes;
    store.games[id] = merged;
  });
  store.profile = mergeProfile(store.profile, remoteProfile);
  store.owner = session.login;
  fixStore();
  const changed = JSON.stringify(store) !== before;
  persist();
  // зберігаємо лише якщо щось справді змінилось (або новий скрипт ще не має профілю), щоб не затерти ручні зміни вчительки
  if (changed || (r.v >= 2 && !r.profile)) { dirty = true; scheduleSync(true); }
  return changed;
}
const loginBody = (login, pin) => ({ action: "login", login, pin, v: 2, games: GAMES.map(g => ({ id: g.id, sheet: g.sheet })) });
let access = lsGet("kv-access");

// ---------- вхід ----------
// opts.onReady — що показати після входу; opts.title/eyebrow — заголовок екрана входу
let bootOpts = {};
function renderLogin(msg) {
  app().innerHTML = `<div class="center login">
    <div class="eyebrow">${esc(bootOpts.eyebrow || "Python, цифрова грамотність і не тільки")}</div>
    <h1 class="logintitle">${esc(bootOpts.title || "ІТ-квести")}</h1>
    ${snakeSVG({ len: 5, cls: "big", skin: "classic", acc: "none" })}
    <form id="lf" class="loginform" autocomplete="off">
      <label class="answer-label" for="lg">Логін</label>
      <input type="text" id="lg" autocapitalize="off" spellcheck="false" placeholder="наприклад, prizvyshche.i" required>
      <label class="answer-label" for="pn">PIN</label>
      <input type="text" id="pn" inputmode="numeric" maxlength="8" placeholder="4 цифри" required>
      <div id="lmsg" class="status">${msg ? esc(msg) : "Логін і PIN дає вчителька."}</div>
      <div class="row"><button class="btn" id="lgo" type="submit">Увійти</button><span id="lalt"></span></div>
    </form>
    <div class="version">версія ${VERSION}</div>
  </div>`;
  $("#lf").addEventListener("submit", async e => {
    e.preventDefault();
    const login = $("#lg").value.trim().toLowerCase(), pin = $("#pn").value.trim();
    if (!login || !pin) return;
    $("#lgo").disabled = true; $("#lmsg").textContent = "Перевіряю…";
    try {
      const r = await api(loginBody(login, pin));
      if (!r.ok) { $("#lgo").disabled = false; $("#lmsg").textContent = r.error === "auth" || !r.error ? "Невірний логін або PIN. Перевір і спробуй ще раз." : "Таблиця відповіла помилкою: " + r.error; return; }
      session = { login, pin, name: r.name, cls: r.cls };
      lsSet(SKEY, session);
      access = r.access || null; lsSet("kv-access", access);
      applyServer(r);
      bootOpts.onReady();
    } catch (err) {
      $("#lgo").disabled = false;
      $("#lmsg").textContent = "Не вдалося з'єднатися з сервером. Перевір інтернет і спробуй ще раз.";
      $("#lalt").innerHTML = `<button class="link" type="button" id="off">Грати без збереження</button>`;
      $("#off").onclick = () => { offline = true; bootOpts.onReady(); };
    }
  });
  $("#lg").focus();
}
// boot: показує екран входу або одразу гру; onRefresh — перемалювати, якщо з таблиці прийшли нові дані
async function boot(opts) {
  bootOpts = opts;
  if (!session) return renderLogin();
  if (store.owner === session.login) opts.onReady(); else app().innerHTML = `<div class="center"><p class="status">Завантажую твій прогрес…</p></div>`;
  try {
    const r = await api(loginBody(session.login, session.pin));
    if (!r.ok && r.error === "auth") { session = null; lsDel(SKEY); return renderLogin("Вхід застарів. Увійди ще раз."); }
    if (!r.ok) throw new Error(r.error || "server");
    session.name = r.name; session.cls = r.cls; lsSet(SKEY, session);
    access = r.access || null; lsSet("kv-access", access);
    const changed = applyServer(r);
    if (opts.isIdle()) opts.onReady(changed);
  } catch (e) {
    if (store.owner === session.login) { if (opts.isIdle()) opts.onReady(); }
    else renderLogin("Не вдалося з'єднатися з сервером.");
  }
}
function logout() {
  if (dirty) syncNow();
  session = null; offline = false;
  lsDel(SKEY); lsDel(DKEY); lsDel("kv-access");
  store = blankStore(); fixStore();
  renderLogin();
}
// рядок «хто увійшов» для шапки
function whoami() {
  return `<div class="whoami">${session ? `<span class="syncbox">${syncLabel()}</span><span>${esc(session.name)}${session.cls ? " · " + esc(session.cls) : ""}</span><button class="link" id="logout">Вийти</button>` : offline ? `<span>Гра без збереження</span><button class="link" id="logout">Увійти</button>` : ""}</div>`;
}
function bindWhoami() { const b = $("#logout"); if (b) b.onclick = logout; }

// ---------- змійка ----------
const N = 5;
const mix = (a, b, t) => { t = Math.max(0, Math.min(1, t)); const h = x => [1, 3, 5].map(k => parseInt(x.substr(k, 2), 16)); const A = h(a), B = h(b); return "rgb(" + A.map((v, k) => Math.round(v + (B[k] - v) * t)).join(",") + ")"; };
const SKINS = [
  { id: "classic", name: "Класика", need: 0, col: () => "#3fae6b" },
  { id: "loaf", name: "Батон", need: 2, col: () => "#d9a35b", rx: 9,
    seg: (x, y) => `<path d="M${x + 5} ${y + 5} l5 -10 M${x + 12} ${y + 5} l5 -10" stroke="#f6d9a2" stroke-width="2.4" stroke-linecap="round"/>` },
  { id: "sky", name: "Небо", need: 4, col: () => "#3d8bfd" },
  { id: "sausage", name: "Сосиска", need: 6, col: () => "#e07a6e", rx: 11,
    seg: (x, y, i) => (i > 0 ? `<path d="M${x + 23} ${y - 4} v8" stroke="#7a4a2a" stroke-width="2.2" stroke-linecap="round"/>` : "") + `<path d="M${x + 5} ${y - 6} q6 -3 12 0" stroke="rgba(255,255,255,.45)" stroke-width="2" fill="none" stroke-linecap="round"/>` },
  { id: "sunset", name: "Захід сонця", need: 9, col: i => mix("#ff4f7b", "#ffa53d", i / N) },
  { id: "melon", name: "Кавун", need: 11, col: () => "#2f8f3a", idx: "rgba(255,255,255,.8)",
    seg: (x, y) => `<path d="M${x + 7} ${y - 10} v20 M${x + 15} ${y - 10} v20" stroke="#1b5e25" stroke-width="2.6"/>`,
    head: "#ff5a63", headStroke: "#2f8f3a",
    headDeco: (hx, hy) => [[6, -7], [8, 5], [31, -8], [5, -1]].map(([dx, dy]) => `<ellipse cx="${hx + dx}" cy="${hy + dy}" rx="1.3" ry="2" fill="#1b1b1b"/>`).join("") },
  { id: "night", name: "Нічна", need: 15, col: () => "#4b3a8f", idx: "rgba(255,255,255,.75)",
    seg: (x, y) => `<circle cx="${x + 4.5}" cy="${y - 6.5}" r="1.2" fill="#fff"/><circle cx="${x + 18}" cy="${y + 6.5}" r="1" fill="#fff"/>` },
  { id: "train", name: "Потяг", need: 17, col: () => "#5b7bd5", rx: 3, idx: "#1b2a55",
    seg: (x, y) => `<rect x="${x + 4}" y="${y - 7}" width="14" height="9" rx="2" fill="#dbe7ff"/><circle cx="${x + 6}" cy="${y + 11}" r="3.2" fill="#222"/><circle cx="${x + 16}" cy="${y + 11}" r="3.2" fill="#222"/>` + `<path d="M${x + 22} ${y + 3} h4" stroke="#444" stroke-width="2"/>`,
    head: "#d64545", headRx: 5,
    headDeco: (hx, hy, acc) => (acc === "none" ? `<rect x="${hx + 22}" y="${hy - 23}" width="7" height="10" fill="#333"/><circle cx="${hx + 26}" cy="${hy - 28}" r="3.4" fill="#cfd5df" opacity=".9"/><circle cx="${hx + 20}" cy="${hy - 32}" r="2.6" fill="#cfd5df" opacity=".7"/>` : "") + `<circle cx="${hx + 8}" cy="${hy + 15}" r="3.6" fill="#222"/><circle cx="${hx + 26}" cy="${hy + 15}" r="3.6" fill="#222"/>` },
  { id: "cheese", name: "Сирна", need: 21, col: () => "#f5c84c", idx: "#8a6510",
    seg: (x, y) => `<circle cx="${x + 5}" cy="${y - 5}" r="2.2" fill="#d9a92a"/><circle cx="${x + 17}" cy="${y + 5}" r="3" fill="#d9a92a"/><circle cx="${x + 6}" cy="${y + 7}" r="1.5" fill="#d9a92a"/>`,
    headDeco: (hx, hy) => `<circle cx="${hx + 6}" cy="${hy + 6}" r="2.6" fill="#d9a92a"/><circle cx="${hx + 9}" cy="${hy - 9}" r="1.6" fill="#d9a92a"/>` },
  { id: "gold", name: "Золота", need: 24, col: () => "#e0aa2b",
    seg: (x, y) => `<rect x="${x + 4}" y="${y - 8}" width="5" height="3" rx="1.5" fill="rgba(255,255,255,.6)"/>` },
  { id: "sock", name: "Шкарпетка", need: 27, col: i => (i % 2 ? "#fdfdfd" : "#ff6b6b"), rx: 5,
    seg: (x, y) => `<path d="M${x + 1} ${y - 6} h20" stroke="#3d8bfd" stroke-width="2"/>`, head: "#ff6b6b",
    headDeco: (hx, hy) => `<path d="M${hx + 1} ${hy + 9} h32" stroke="#3d8bfd" stroke-width="2"/>` },
  { id: "rocket", name: "Ракета", need: 30, col: () => "#e9eef6", rx: 4, idx: "#1b2a55",
    seg: (x, y, i) => `<rect x="${x}" y="${y - 2}" width="22" height="4" fill="#e8483f"/>`
      + (i === N - 1 ? `<path d="M${x + 2} ${y - 11} L${x - 6} ${y - 19} L${x + 10} ${y - 11} Z M${x + 2} ${y + 11} L${x - 6} ${y + 19} L${x + 10} ${y + 11} Z" fill="#e8483f"/><g class="flame"><path d="M${x} ${y - 6} Q${x - 14} ${y} ${x} ${y + 6} Z" fill="#ffb02e"/><path d="M${x} ${y - 3} Q${x - 8} ${y} ${x} ${y + 3} Z" fill="#fff3b0"/></g>` : ""),
    head: "#e9eef6", headRx: 8,
    headDeco: (hx, hy) => `<path d="M${hx + 30} ${hy - 13} Q${hx + 46} ${hy - 6} ${hx + 48} ${hy} Q${hx + 46} ${hy + 6} ${hx + 30} ${hy + 13} Z" fill="#e8483f" stroke="rgba(0,0,0,.25)" stroke-width="1.2"/><rect x="${hx}" y="${hy + 7}" width="30" height="3" fill="#e8483f"/>` },
  // за байти
  // шкільна форма А+ (для всіх, без зірок і байтів)
  { id: "aplus", name: "Форма А+", need: 0, col: () => "#c8102e", idx: "#fff", head: "#c8102e",
    seg: (x, y) => `<circle cx="${x + 11}" cy="${y - 6.5}" r="1.3" fill="#d9dbe0"/><circle cx="${x + 11}" cy="${y + 7}" r="1.3" fill="#d9dbe0"/>`,
    headDeco: (hx, hy) => `<text x="${hx + 6}" y="${hy + 12}" font-family="Georgia, 'Times New Roman', serif" font-size="9" fill="#fff" opacity=".9">A<tspan font-size="6" dy="-3.5">+</tspan></text>` },
  { id: "tartan", name: "Шотландка А+", need: 0, col: () => "#b3122a", idx: "#fff", head: "#b3122a",
    seg: (x, y) => `<g opacity=".85"><path d="M${x + 1} ${y - 4} h20 M${x + 1} ${y + 5} h20" stroke="#1f5a3a" stroke-width="3.2"/><path d="M${x + 7} ${y - 10} v20 M${x + 15} ${y - 10} v20" stroke="#1f5a3a" stroke-width="3.2" opacity=".75"/><path d="M${x + 1} ${y + .5} h20 M${x + 11} ${y - 10} v20" stroke="#1d2a5c" stroke-width="1"/><path d="M${x + 1} ${y + 8.5} h20" stroke="#f0d04a" stroke-width=".8"/></g>` },
  { id: "battery", name: "Батарейка", price: 25, col: () => "#2b2f36", idx: "#fff", head: "#2b2f36", rx: 4,
    seg: (x, y, i) => `<rect x="${x + 15}" y="${y - 11}" width="7" height="22" rx="2" fill="#e0a526"/><rect x="${x + 22}" y="${y - 3.5}" width="2.5" height="7" rx="1" fill="#c48d17"/><text x="${x + 18.5}" y="${y + 3}" text-anchor="middle" font-size="7" font-weight="900" fill="#2b2f36">+</text><rect x="${x + 2.5}" y="${y + 6}" width="11" height="2.6" rx="1" fill="${["#3ddc6a", "#3ddc6a", "#ffd24d", "#ffd24d", "#ff5a4d"][i] || "#3ddc6a"}"/>` },
  { id: "tiger67", name: "Тигр 67", price: 35, col: () => "#f39a1e", idx: "#7a3d00", head: "#f39a1e",
    seg: (x, y) => `<g font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="10" fill="#3a1f05" opacity=".55"><text x="${x + 2}" y="${y - 2}" transform="rotate(-14 ${x + 5} ${y - 5})">6</text><text x="${x + 14}" y="${y + 10}" transform="rotate(-14 ${x + 17} ${y + 7})">7</text></g>`,
    headDeco: (hx, hy) => `<g font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="8" fill="#3a1f05"><text x="${hx + 3}" y="${hy + 12}" transform="rotate(-14 ${hx + 6} ${hy + 9})">6</text><text x="${hx + 27}" y="${hy + 12}" transform="rotate(-14 ${hx + 30} ${hy + 9})">7</text></g>` },
  { id: "neon", name: "Неон", price: 40, col: () => "#141826", idx: "#39ff14", head: "#141826", headStroke: "#39ff14",
    seg: (x, y) => `<rect x="${x + 2.5}" y="${y - 8.5}" width="17" height="17" rx="5" fill="none" stroke="#39ff14" stroke-width="1.6"/>` },
  { id: "zebra", name: "Зебра", price: 60, col: () => "#fafafa", idx: "#1b1b1b",
    seg: (x, y) => `<path d="M${x + 5} ${y - 11} q3 11 -1 22 M${x + 12} ${y - 11} q-3 11 1 22 M${x + 18} ${y - 11} q3 11 -1 22" stroke="#1b1b1b" stroke-width="2.4" fill="none"/>` },
  { id: "galaxy", name: "Галактика", price: 100, col: i => mix("#2a1b5c", "#7b2ff7", i / N), idx: "rgba(255,255,255,.8)", head: "#22164d",
    seg: (x, y) => `<circle cx="${x + 5}" cy="${y - 6}" r="1.1" fill="#fff"/><circle cx="${x + 17}" cy="${y - 2}" r="1.4" fill="#ffe27a"/><circle cx="${x + 8}" cy="${y + 7}" r="0.9" fill="#fff"/>`,
    headDeco: (hx, hy) => `<circle cx="${hx + 7}" cy="${hy + 8}" r="1.3" fill="#fff"/><circle cx="${hx + 30}" cy="${hy - 9}" r="1.1" fill="#ffe27a"/>` },
  { id: "rainbow", name: "Веселка", need: 33, col: i => `hsl(${(i * 62 + 330) % 360} 72% 55%)` },
  { id: "glitch", name: "Глітч", ach: "fail", col: () => "#1a1a1a", idx: "#39ff14", jitter: true,
    seg: () => "", head: "#1a1a1a",
    headDeco: (hx, hy) => `<text x="${hx + 3}" y="${hy + 12}" font-family="monospace" font-size="6" fill="#39ff14">ERR</text>` },
];
const ACCS = [
  { id: "none", name: "Без нічого", need: 0 },
  { id: "moustache", name: "Вуса", need: 1 },
  { id: "glasses", name: "Окуляри", need: 3 },
  { id: "catears", name: "Котячі вушка", need: 5 },
  { id: "cap", name: "Кепка", need: 7 },
  { id: "cowboy", name: "Ковбойський капелюх", need: 9 },
  { id: "scarf", name: "Шарф", need: 12 },
  { id: "propeller", name: "Шапка з пропелером", need: 14 },
  { id: "phones", name: "Навушники", need: 19 },
  { id: "duck", name: "Каченя", need: 22 },
  { id: "horn", name: "Ріжок єдинорога", need: 25 },
  { id: "crown", name: "Корона", need: 30 },
  { id: "halo", name: "Німб", ach: "perfect" },
  { id: "pot", name: "Каструля", ach: "peek" },
  { id: "devil", name: "Роги диявола", ach: "lastdeath", secret: true },
  { id: "wings", name: "Крила янгола", ach: "angel", secret: true },
  // за байти
  { id: "bow", name: "Бантик", price: 15 },
  { id: "flower", name: "Квітка", price: 25 },
  { id: "pirate", name: "Пов'язка пірата", price: 35 },
  { id: "wizard", name: "Капелюх чарівника", price: 60 },
  { id: "bearhood", name: "Капюшон-ведмедик", price: 45 },
  { id: "gasmask", name: "Протигаз", price: 50 },
  { id: "sunhood", name: "Соняшниковий капюшон", price: 10 },
  { id: "glasses67", name: "Очі 6 і 7", price: 25 },
  { id: "badgeaplus", name: "Значок А+", need: 0 },
  { id: "polo", name: "Комірець поло", need: 0 },
  { id: "iron", name: "Паяльник", price: 25 },
  { id: "hat67", name: "Шапка 67", price: 20 },
  { id: "loafhat", name: "Батон на голові", ach: "loafhat", secret: true },
];
// місце аксесуара: з одного місця можна вдягти лише одну річ, з різних — скільки завгодно
const SLOT = { cap: "hat", cowboy: "hat", propeller: "hat", crown: "hat", horn: "hat", halo: "hat", pot: "hat", loafhat: "hat", devil: "hat", wizard: "hat", duck: "hat", catears: "hat", bearhood: "hat", sunhood: "hat", hat67: "hat", glasses67: "eyes",
  glasses: "eyes", pirate: "eyes", moustache: "face", gasmask: "face", scarf: "neck", polo: "neck", badgeaplus: "decor", iron: "tool", phones: "ears", bow: "decor", flower: "decor", wings: "back" };
const SLOT_NAME = { hat: "на голову", eyes: "на очі", face: "на обличчя", neck: "на шию", ears: "навушники", decor: "прикраса", tool: "паяє хвіст", back: "на спину" };
const accList = () => String(store.profile.acc || "").split(",").map(x => x.trim()).filter(x => x && x !== "none");
const hasAcc = id => accList().includes(id);
const ACH = { fail: "Лишитися без хвоста", perfect: "Пройти рівень без жодної помилки", peek: "Підглянути розв'язок задачі", lastdeath: "", loafhat: "", angel: "" };
// ---------- байти ----------
const BYTES_PERFECT = 5;
const bytesEarned = () => Object.values(store.games).reduce((s, g) => s + ((g && g.bytes) || 0), 0) + (store.profile.bonus || 0);
// ---------- щоденна серія: дні поспіль, коли пройдено хоча б один рівень ----------
const STREAK_EVERY = 7, STREAK_BONUS = 10;   // кожен 7-й день серії — +10 байтів
const dayStr = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dayStr(d); };
const streakNow = () => { const st = store.profile.streak || {}; return st.last === dayStr() || st.last === yesterday() ? (st.n || 0) : 0; };
const streakDoneToday = () => (store.profile.streak || {}).last === dayStr();
function streakTouch() {   // викликається, коли рівень пройдено; повертає {n, grew, bonus}
  const p = store.profile, st = p.streak || {}, today = dayStr();
  if (st.last === today) return { n: st.n, grew: false, bonus: 0 };
  const n = st.last === yesterday() ? (st.n || 0) + 1 : 1;
  const bonus = n % STREAK_EVERY === 0 ? STREAK_BONUS : 0;
  p.streak = { last: today, n, best: Math.max(st.best || 0, n) };
  if (bonus) p.bonus = (p.bonus || 0) + bonus;
  save("profile");
  return { n, grew: true, bonus };
}
const daysWord = n => { n = Math.abs(n) % 100; const d = n % 10; return n > 10 && n < 20 ? "днів" : d === 1 ? "день" : d >= 2 && d <= 4 ? "дні" : "днів"; };
const streakBadge = () => { const n = streakNow(), today = streakDoneToday();
  return `<span class="streak ${n ? "on" : ""} ${today ? "today" : ""}" title="Дні поспіль, коли ти проходиш хоча б один рівень">🔥 ${n} ${daysWord(n)}${n && !today ? " · пройди рівень сьогодні, щоб не згасла" : ""}</span>`; };
// анімації змійки (видно на великій змійці: головна сторінка, гардероб)
// форма блоків змійки (голова лишається з обличчям)
const SHAPES = [
  { id: "square", name: "Квадратики", need: 0 },
  { id: "circle", name: "Кружечки", price: 10 },
  { id: "diamond", name: "Ромбики", price: 15 },
  { id: "hexagon", name: "Шестикутники", price: 15 },
  { id: "heart", name: "Сердечка", price: 20 },
  { id: "star", name: "Зірочки", price: 25 },
];
// фігура в квадраті 22×22 з лівим верхнім кутом (x, y): атрибути заливки й обведення передаються готовими
function shapeEl(kind, x, y, rx, attrs) {
  const cx = x + 11, cy = y + 11, pts = arr => arr.map(([a, b]) => `${(cx + a).toFixed(1)},${(cy + b).toFixed(1)}`).join(" ");
  const poly = (n, r1, r2, rot) => pts(Array.from({ length: n * (r2 ? 2 : 1) }, (_, k) => { const r = r2 && k % 2 ? r2 : r1, a = rot + k * Math.PI * 2 / (n * (r2 ? 2 : 1)); return [r * Math.cos(a), r * Math.sin(a)]; }));
  if (kind === "circle") return `<circle cx="${cx}" cy="${cy}" r="11.5" ${attrs}/>`;
  if (kind === "diamond") return `<polygon points="${pts([[0, -13], [13, 0], [0, 13], [-13, 0]])}" stroke-linejoin="round" ${attrs}/>`;
  if (kind === "hexagon") return `<polygon points="${poly(6, 12.5, 0, 0)}" stroke-linejoin="round" ${attrs}/>`;
  if (kind === "star") return `<polygon points="${poly(5, 14, 7.5, -Math.PI / 2)}" stroke-linejoin="round" ${attrs}/>`;
  if (kind === "heart") return `<path d="M${cx} ${cy + 11} C${cx - 16} ${cy + 1} ${cx - 12} ${cy - 15} ${cx} ${cy - 6} C${cx + 12} ${cy - 15} ${cx + 16} ${cy + 1} ${cx} ${cy + 11} Z" stroke-linejoin="round" ${attrs}/>`;
  return `<rect x="${x}" y="${y}" width="22" height="22" rx="${rx}" ${attrs}/>`;
}
// яка голова в змійки
const HEADS = [
  { id: "snake", name: "Голова змійки", need: 0 },
  { id: "unicorn", name: "Голова єдинорога", price: 40 },
];
const ANIMS = [
  { id: "none", name: "Без анімації", need: 0 },
  { id: "jump", name: "Підстрибує", price: 15 },
  { id: "crawl", name: "Повзе", price: 20 },
  { id: "six7", name: "Танець 67", price: 30 },
];
// комплекти: усе разом дешевше
const SETS = [{ id: "set67", name: "Комплект 67", price: 67, items: ["tiger67", "glasses67", "hat67", "six7"] }];
const ALLITEMS = () => [...SKINS, ...ACCS, ...ANIMS, ...SHAPES, ...HEADS, ...SETS];
const setCost = st => Math.max(0, st.price - st.items.reduce((s, id) => { const x = ALLITEMS().find(y => y.id === id); return s + (x && isOpen(x) ? x.price : 0); }, 0));
// витрачене: тепер ведемо рахунок (spent); для старих покупок рахуємо за списком
const bytesSpent = () => Math.max(store.profile.spent || 0, (store.profile.bought || []).reduce((s, id) => { const x = [...SKINS, ...ACCS].find(y => y.id === id); return s + (x && x.price || 0); }, 0));
const bytesLeft = () => Math.max(0, bytesEarned() - bytesSpent());
const bytesWord = n => { n = Math.abs(n) % 100; const d = n % 10; return n > 10 && n < 20 ? "байтів" : d === 1 ? "байт" : d >= 2 && d <= 4 ? "байти" : "байтів"; };
const isOpen = x => x.price ? ((store.profile.bought || []).includes(x.id) || SETS.some(st => st.items.includes(x.id) && (store.profile.bought || []).includes(st.id))) : x.ach ? !!(store.profile.ach && store.profile.ach[x.ach]) : x.need <= totalStars();
const openIds = () => [...SKINS, ...ACCS].filter(isOpen).map(x => x.id);
function achieve(key) {
  const p = store.profile; p.ach = p.ach || {};
  if (p.ach[key]) return [];
  p.ach[key] = true; save("both");
  return [...SKINS, ...ACCS].filter(x => x.ach === key);
}
const skinOf = id => SKINS.find(s => s.id === id) || SKINS[0];
const popName = () => (store.profile.name || "змійка").trim().toLowerCase().replace(/[^\wЀ-ӿ]+/g, "_") || "змійка";
// len — скільки сегментів лишилось; falling — скільки щойно відвалилось
// голова єдинорога: біла, з веселковою гривою, вушком і золотим рогом; очі й усмішка малюються як у змійки
const unicornHead = (hx, hy) => {
  const mane = ["#ff8fc7", "#ffd24d", "#7ee0b5", "#7fb6ff", "#c39bff"].map((c, k) => `<circle cx="${hx + 1 - k * 1.2}" cy="${hy - 13 + k * 6.5}" r="6" fill="${c}"/>`).join("");
  return mane
    + `<path d="M${hx + 3} ${hy - 6} Q${hx + 3} ${hy - 15} ${hx + 14} ${hy - 15} L${hx + 26} ${hy - 15} Q${hx + 33} ${hy - 15} ${hx + 34} ${hy - 7} L${hx + 35} ${hy - 2} Q${hx + 44} ${hy - 1} ${hx + 44} ${hy + 6} Q${hx + 44} ${hy + 14} ${hx + 35} ${hy + 14} L${hx + 10} ${hy + 14} Q${hx + 3} ${hy + 14} ${hx + 3} ${hy + 6} Z" fill="#fdfbff" stroke="#b9a5d6" stroke-width="1.5"/>`
    + `<path d="M${hx + 7} ${hy - 13} L${hx + 9} ${hy - 24} L${hx + 15} ${hy - 14} Z" fill="#fdfbff" stroke="#b9a5d6" stroke-width="1.3"/><path d="M${hx + 9} ${hy - 15} L${hx + 9.8} ${hy - 20} L${hx + 12.5} ${hy - 15} Z" fill="#ffc6df"/>`
    + `<path d="M${hx + 18} ${hy - 14} L${hx + 23} ${hy - 36} L${hx + 27} ${hy - 14} Z" fill="#ffd54a" stroke="#c79a12" stroke-width="1.2" stroke-linejoin="round"/><path d="M${hx + 19.5} ${hy - 19} l7 -2.2 M${hx + 20.8} ${hy - 25} l5 -1.6 M${hx + 22} ${hy - 30.5} l2.8 -.9" stroke="#c79a12" stroke-width="1.1"/>`
    + `<circle cx="${hx + 40}" cy="${hy + 3}" r="1.4" fill="#e58bb3"/>`;
};
function snakeSVG(o) {
  const p = store.profile;
  // аксесуари: o.acc — для попереднього перегляду, інакше вдягнуте (лише відкрите)
  const A = new Set(o.acc ? String(o.acc).split(",").filter(x => x !== "none") : accList().filter(id => { const it = ACCS.find(a => a.id === id); return it && isOpen(it); }));
  const has = id => A.has(id), acc = A.size ? [...A].join(",") : "none";
  // забарвлення: o.skin — уся змійка одного кольору; інакше кожен блок може мати своє (p.mix)
  const mix = o.skin ? {} : (p.mix || {});
  const skinAt = k => { const id = mix[k]; const it = id && SKINS.find(x => x.id === id); return it && isOpen(it) ? it : skinOf(o.skin || p.skin); };
  const len = o.len, falling = o.falling || 0, mood = o.mood || "happy";
  // анімація: o.anim — для попереднього перегляду; інакше обрана, але лише на великій змійці
  const shIt = SHAPES.find(x => x.id === (o.shape || p.shape));
  const shape = shIt && (o.shape || isOpen(shIt)) ? shIt.id : "square";
  const hdIt = HEADS.find(x => x.id === (o.headType || p.head));
  const headType = hdIt && (o.headType || isOpen(hdIt)) ? hdIt.id : "snake";
  const uid = "s" + Math.random().toString(36).slice(2, 8);   // для clipPath, щоб візерунок скіна не вилазив за фігуру
  const animIt = ANIMS.find(a => a.id === (o.anim || (String(o.cls || "").includes("big") ? p.anim : "")));
  const anim = animIt && animIt.id !== "none" && (o.anim || isOpen(animIt)) ? animIt.id : "";
  const W = 18 + N * 26 + 58, H = 66;
  const segX = i => 18 + (N - 1 - i) * 26, segY = i => 40 + Math.sin((N - i) * 1.15) * 5;
  let g = "";
  for (let i = N - 1; i >= 0; i--) {
    const x = segX(i), y = segY(i), sk = skinAt(i);
    const ghost = shapeEl(shape, x, y - 11, 7, `class="ghost"`);
    const jx = sk.jitter ? [2, -3, 1, -2, 3][i] : 0, jy = sk.jitter ? [-2, 3, -3, 1, 2][i] : 0;
    const rect = (fill, dx, op) => shapeEl(shape, x + jx + dx, y + jy - 11, sk.rx ?? 7, `fill="${fill}"${op ? ` opacity="${op}"` : ` stroke="rgba(0,0,0,.22)" stroke-width="1.5"`}`);
    const body = (sk.jitter ? rect("#00e5ff", -2.5, .8) + rect("#ff2bd6", 2.5, .8) : "") + rect(sk.col(i), 0)
      + (sk.seg ? (shape !== "square" ? `<clipPath id="${uid}c${i}">${shapeEl(shape, x + jx, y + jy - 11, 7, "")}</clipPath>` : "") + `<g transform="translate(${jx} ${jy})"${shape !== "square" ? ` clip-path="url(#${uid}c${i})"` : ""}>${sk.seg(x, y, i)}</g>` : "")
      + `<text x="${x + jx + 11}" y="${y + jy + 3.5}" class="segidx"${sk.idx ? ` style="fill:${sk.idx}"` : ""}>${i}</text>`;
    const wing = (dx, fill) => `<path d="M${x + 12 + dx} ${y - 8} C${x + 7 + dx} ${y - 26} ${x - 5 + dx} ${y - 32} ${x - 16 + dx} ${y - 30} Q${x - 12 + dx} ${y - 26} ${x - 13 + dx} ${y - 22} Q${x - 7 + dx} ${y - 21} ${x - 8 + dx} ${y - 17} Q${x - 2 + dx} ${y - 16} ${x - 2 + dx} ${y - 12} Q${x + 4 + dx} ${y - 12} ${x + 5 + dx} ${y - 8} Z" fill="${fill}"/><path d="M${x + 9 + dx} ${y - 12} Q${x + dx} ${y - 22} ${x - 11 + dx} ${y - 27}" fill="none" stroke-width=".9"/>`;
    const wings = has("wings") && i === 2 ? `<g class="wings" stroke="#8fa3c4" stroke-width="1.2" stroke-linejoin="round">${wing(8, "#e6edfa")}${wing(0, "#fff")}</g>` : "";
    if (i < len) g += `<g class="seg ${i % 2 ? "o" : "e"}" style="--i:${i}">${wings}${body}</g>`;
    else if (i < len + falling) g += ghost + `<g class="fall">${body}</g>`;
    else g += ghost;
  }
  // паяльник стоїть за хвостом і з кожним втраченим блоком переїжджає ближче до голови
  if (has("iron") && len > 0) { const x = segX(len - 1) - 12, y = segY(len - 1); g += `<g stroke-linecap="round"><path d="M${x - 9} ${y - 33} L${x + 1} ${y - 23}" stroke="#2b5fc7" stroke-width="5.2"/><path d="M${x - 7} ${y - 32} L${x} ${y - 25}" stroke="#4d82e8" stroke-width="1.4"/><path d="M${x + 1} ${y - 23} L${x + 4} ${y - 20}" stroke="#d4d7dc" stroke-width="3.4"/><path d="M${x + 4} ${y - 20} L${x + 9} ${y - 15}" stroke="#9aa1ad" stroke-width="2.2"/><path d="M${x + 9} ${y - 15} l2 2" stroke="#e07b2a" stroke-width="1.8"/><path d="M${x + 14} ${y - 14} l3 -2 M${x + 13} ${y - 17} l1 -3.5 M${x + 15} ${y - 11} l3.5 0" stroke="#ffc83d" stroke-width="1.3"/></g>`; }
  const sk = skinAt("h"), hx = segX(0) + 24, hy = 38, hc = sk.head || sk.col(-0.6);
  let head = (sk.jitter ? `<rect x="${hx - 2.5}" y="${hy - 14}" width="34" height="28" rx="11" fill="#00e5ff" opacity=".8"/><rect x="${hx + 2.5}" y="${hy - 14}" width="34" height="28" rx="11" fill="#ff2bd6" opacity=".8"/>` : "")
    + (headType === "unicorn" ? unicornHead(hx, hy)
      : `<rect x="${hx}" y="${hy - 14}" width="34" height="28" rx="${sk.headRx ?? 11}" fill="${hc}" stroke="${sk.headStroke || "rgba(0,0,0,.25)"}" stroke-width="${sk.headStroke ? 3 : 1.5}"/>`
        + (sk.headDeco ? sk.headDeco(hx, hy, acc) : ""));
  if (has("scarf")) head = `<rect x="${hx - 7}" y="${hy + 1}" width="13" height="10" rx="3" fill="#e8483f"/><rect x="${hx - 4}" y="${hy + 8}" width="6" height="14" rx="2" fill="#e8483f" transform="rotate(14 ${hx - 1} ${hy + 8})"/><rect x="${hx - 7}" y="${hy + 4}" width="13" height="2.5" fill="#fff" opacity=".8"/>` + head;
  const eye = (ex) => `<circle cx="${ex}" cy="${hy - 4}" r="4.6" fill="#fff"/><circle cx="${ex + 1.3}" cy="${hy - 3.6}" r="2.3" fill="#1b1b1b"/>`;
  head += mood === "sad"
    ? `<path d="M${hx + 12} ${hy - 5} l6 -2.5 M${hx + 21} ${hy - 7.5} l6 2.5" stroke="#1b1b1b" stroke-width="1.6"/>` + `<circle cx="${hx + 15}" cy="${hy - 1}" r="1.8" fill="#1b1b1b"/><circle cx="${hx + 24}" cy="${hy - 1}" r="1.8" fill="#1b1b1b"/>`
    : eye(hx + 15) + eye(hx + 24);
  if (mood === "happy") head += `<path d="M${hx + 20} ${hy + 6} Q${hx + 25} ${hy + 11} ${hx + 30} ${hy + 5}" stroke="#1b1b1b" stroke-width="1.7" fill="none" stroke-linecap="round"/><circle cx="${hx + 10}" cy="${hy + 5}" r="2.6" fill="rgba(255,120,150,.55)"/>`;
  if (mood === "sad") head += `<path d="M${hx + 20} ${hy + 10} Q${hx + 25} ${hy + 5} ${hx + 30} ${hy + 10}" stroke="#1b1b1b" stroke-width="1.7" fill="none" stroke-linecap="round"/>`;
  if (mood === "wow") head += `<ellipse cx="${hx + 26}" cy="${hy + 7}" rx="2.6" ry="3.2" fill="#1b1b1b"/><path d="M${hx + 33} ${hy + 3} l6 1 l3 -3 M${hx + 39} ${hy + 4} l3 3" stroke="#e8483f" stroke-width="1.5" fill="none"/>`;
  if (has("glasses")) head += `<g stroke="#1b1b1b" stroke-width="1.8" fill="rgba(160,210,255,.25)"><circle cx="${hx + 15}" cy="${hy - 4}" r="5.6"/><circle cx="${hx + 27}" cy="${hy - 4}" r="5.6"/></g><path d="M${hx + 20.6} ${hy - 4} h0.8 M${hx + 9.4} ${hy - 5} l-6 -1" stroke="#1b1b1b" stroke-width="1.8"/>`;
  if (has("cap")) head += `<path d="M${hx + 3} ${hy - 11} Q${hx + 15} ${hy - 29} ${hx + 30} ${hy - 11} Z" fill="#2f5bd3"/><ellipse cx="${hx + 34}" cy="${hy - 11}" rx="10" ry="3" fill="#1d3f9e"/><circle cx="${hx + 16}" cy="${hy - 21}" r="2" fill="#f2c94c"/>`;
  if (has("phones")) head += `<path d="M${hx + 4} ${hy - 4} Q${hx + 10} ${hy - 26} ${hx + 30} ${hy - 13}" stroke="#2b2b2b" stroke-width="3.2" fill="none"/><rect x="${hx}" y="${hy - 8}" width="9" height="13" rx="3.5" fill="#2b2b2b"/><circle cx="${hx + 4.5}" cy="${hy - 1.5}" r="2" fill="#ff4f7b"/>`;
  if (has("moustache")) head += `<g fill="#3a2416"><ellipse cx="${hx + 22}" cy="${hy + 4}" rx="5" ry="2.2" transform="rotate(-18 ${hx + 22} ${hy + 4})"/><ellipse cx="${hx + 30}" cy="${hy + 4}" rx="5" ry="2.2" transform="rotate(18 ${hx + 30} ${hy + 4})"/></g>`;
  if (has("catears")) head += `<path d="M${hx + 5} ${hy - 11} L${hx + 8} ${hy - 25} L${hx + 16} ${hy - 13} Z M${hx + 20} ${hy - 13} L${hx + 28} ${hy - 25} L${hx + 31} ${hy - 11} Z" fill="${hc}" stroke="rgba(0,0,0,.25)" stroke-width="1.2"/><path d="M${hx + 8} ${hy - 13} L${hx + 9} ${hy - 20} L${hx + 13} ${hy - 14} Z M${hx + 23} ${hy - 14} L${hx + 27} ${hy - 20} L${hx + 28} ${hy - 13} Z" fill="#ff9fb8"/>`;
  if (has("cowboy")) head += `<path d="M${hx + 7} ${hy - 13} Q${hx + 7} ${hy - 28} ${hx + 17} ${hy - 23} Q${hx + 27} ${hy - 28} ${hx + 27} ${hy - 13} Z" fill="#a0693a"/><rect x="${hx + 7}" y="${hy - 17}" width="20" height="3" fill="#3a2416"/><ellipse cx="${hx + 17}" cy="${hy - 13}" rx="21" ry="3.6" fill="#8b5a2b"/>`;
  if (has("propeller")) head += `<path d="M${hx + 4} ${hy - 11} Q${hx + 17} ${hy - 29} ${hx + 30} ${hy - 11} Z" fill="#e8483f"/><path d="M${hx + 17} ${hy - 20} v-14" stroke="#555" stroke-width="1.6"/><g class="prop" style="transform-origin:${hx + 17}px ${hy - 33}px"><ellipse cx="${hx + 11}" cy="${hy - 33}" rx="6" ry="1.8" fill="#f2c94c"/><ellipse cx="${hx + 23}" cy="${hy - 33}" rx="6" ry="1.8" fill="#3d8bfd"/></g><path d="M${hx + 6} ${hy - 13} Q${hx + 17} ${hy - 18} ${hx + 28} ${hy - 13}" stroke="#f2c94c" stroke-width="2" fill="none"/>`;
  if (has("duck")) head += `<ellipse cx="${hx + 15}" cy="${hy - 18}" rx="8.5" ry="5.5" fill="#ffd43b" stroke="#d9a400" stroke-width="1"/><circle cx="${hx + 21}" cy="${hy - 24}" r="4.6" fill="#ffd43b" stroke="#d9a400" stroke-width="1"/><path d="M${hx + 25} ${hy - 24.5} l5 1 l-5 2 Z" fill="#ff8c1a"/><circle cx="${hx + 22.5}" cy="${hy - 25.5}" r="1" fill="#1b1b1b"/>`;
  if (has("horn")) head += `<path d="M${hx + 13} ${hy - 13} L${hx + 19} ${hy - 35} L${hx + 24} ${hy - 13} Z" fill="#ffd6f0" stroke="#c45bab" stroke-width="1.2"/><path d="M${hx + 15} ${hy - 19} l7 -2 M${hx + 16.5} ${hy - 25} l5 -1.5" stroke="#c45bab" stroke-width="1.2"/>`;
  if (has("loafhat")) head += `<g transform="rotate(-8 ${hx + 17} ${hy - 19})"><rect x="${hx + 1}" y="${hy - 25}" width="32" height="12" rx="6" fill="#d9a35b" stroke="#a8743a" stroke-width="1.3"/><path d="M${hx + 8} ${hy - 15} l4 -8 M${hx + 15} ${hy - 15} l4 -8 M${hx + 22} ${hy - 15} l4 -8" stroke="#f6d9a2" stroke-width="2" stroke-linecap="round"/></g>`;
  if (has("devil")) head += `<g fill="#d42a2a" stroke="#8a1010" stroke-width="1.2" stroke-linejoin="round"><path d="M${hx + 6} ${hy - 12} Q${hx + 1} ${hy - 21} ${hx + 6} ${hy - 29} Q${hx + 8} ${hy - 20} ${hx + 14} ${hy - 13} Z"/><path d="M${hx + 21} ${hy - 13} Q${hx + 27} ${hy - 20} ${hx + 29} ${hy - 29} Q${hx + 34} ${hy - 21} ${hx + 29} ${hy - 12} Z"/></g>`;
  if (has("bow")) head += `<path d="M${hx + 9} ${hy - 15} l-9 -6 v12 Z M${hx + 9} ${hy - 15} l9 -6 v12 Z" fill="#ff5fa2" stroke="#d6337a" stroke-width="1"/><circle cx="${hx + 9}" cy="${hy - 15}" r="2.6" fill="#d6337a"/>`;
  if (has("flower")) head += [0, 72, 144, 216, 288].map(a => `<circle cx="${hx + 27 + 4.6 * Math.cos(a * Math.PI / 180)}" cy="${hy - 15 + 4.6 * Math.sin(a * Math.PI / 180)}" r="3.4" fill="#fff" stroke="#f0a1c0" stroke-width="1"/>`).join("") + `<circle cx="${hx + 27}" cy="${hy - 15}" r="2.8" fill="#ffcf3d"/>`;
  if (has("pirate")) head += `<path d="M${hx + 3} ${hy - 12} L${hx + 33} ${hy + 1}" stroke="#1b1b1b" stroke-width="1.8"/><ellipse cx="${hx + 24}" cy="${hy - 4}" rx="5.6" ry="5" fill="#1b1b1b"/>`;
  if (has("wizard")) head += `<path d="M${hx + 5} ${hy - 12} L${hx + 19} ${hy - 37} L${hx + 30} ${hy - 12} Z" fill="#3b2f8f" stroke="#241a66" stroke-width="1.2"/><ellipse cx="${hx + 17}" cy="${hy - 12}" rx="17" ry="3.4" fill="#2c2275"/><path d="M${hx + 14} ${hy - 24} l1.2 2.6 2.8 .3 -2.1 1.9 .6 2.8 -2.5 -1.4 -2.5 1.4 .6 -2.8 -2.1 -1.9 2.8 -.3 Z" fill="#ffd43b"/><circle cx="${hx + 22}" cy="${hy - 17}" r="1.2" fill="#ffd43b"/>`;
  if (has("halo")) head += `<ellipse cx="${hx + 17}" cy="${hy - 22}" rx="12" ry="3.4" fill="none" stroke="#f2c230" stroke-width="2.6"/>`;
  if (has("pot")) head += `<rect x="${hx + 2}" y="${hy - 25}" width="30" height="15" rx="2" fill="#b8c0cc" stroke="#7d8794" stroke-width="1.2"/><rect x="${hx - 4}" y="${hy - 22}" width="7" height="3" rx="1.5" fill="#7d8794"/><rect x="${hx + 31}" y="${hy - 22}" width="7" height="3" rx="1.5" fill="#7d8794"/><path d="M${hx + 2} ${hy - 20} h30" stroke="#9aa3b0" stroke-width="1"/><rect x="${hx + 6}" y="${hy - 22}" width="5" height="9" rx="1.5" fill="rgba(255,255,255,.45)"/>`;
  const hoodShape = (fill, stroke) => `<path fill-rule="evenodd" fill="${fill}" stroke="${stroke}" stroke-width="1.2" d="M${hx - 4} ${hy - 4} Q${hx - 4} ${hy - 20} ${hx + 17} ${hy - 20} Q${hx + 38} ${hy - 20} ${hx + 38} ${hy - 4} L${hx + 38} ${hy + 12} Q${hx + 38} ${hy + 17} ${hx + 33} ${hy + 17} L${hx + 1} ${hy + 17} Q${hx - 4} ${hy + 17} ${hx - 4} ${hy + 12} Z M${hx + 4} ${hy - 6} Q${hx + 4} ${hy - 13} ${hx + 12} ${hy - 13} L${hx + 30} ${hy - 13} Q${hx + 35} ${hy - 13} ${hx + 35} ${hy - 7} L${hx + 35} ${hy + 9} Q${hx + 35} ${hy + 14} ${hx + 30} ${hy + 14} L${hx + 9} ${hy + 14} Q${hx + 4} ${hy + 14} ${hx + 4} ${hy + 9} Z"/>`;
  if (has("bearhood")) head += `<g stroke="#4f7fa6" stroke-width="1.2"><circle cx="${hx + 5}" cy="${hy - 17}" r="5.5" fill="#7fb3d9"/><circle cx="${hx + 29}" cy="${hy - 17}" r="5.5" fill="#7fb3d9"/><circle cx="${hx + 5}" cy="${hy - 17}" r="2.6" fill="#f6c6d4" stroke="none"/><circle cx="${hx + 29}" cy="${hy - 17}" r="2.6" fill="#f6c6d4" stroke="none"/><path fill-rule="evenodd" fill="#7fb3d9" d="M${hx - 4} ${hy - 4} Q${hx - 4} ${hy - 20} ${hx + 17} ${hy - 20} Q${hx + 38} ${hy - 20} ${hx + 38} ${hy - 4} L${hx + 38} ${hy + 12} Q${hx + 38} ${hy + 17} ${hx + 33} ${hy + 17} L${hx + 1} ${hy + 17} Q${hx - 4} ${hy + 17} ${hx - 4} ${hy + 12} Z M${hx + 4} ${hy - 6} Q${hx + 4} ${hy - 13} ${hx + 12} ${hy - 13} L${hx + 30} ${hy - 13} Q${hx + 35} ${hy - 13} ${hx + 35} ${hy - 7} L${hx + 35} ${hy + 9} Q${hx + 35} ${hy + 14} ${hx + 30} ${hy + 14} L${hx + 9} ${hy + 14} Q${hx + 4} ${hy + 14} ${hx + 4} ${hy + 9} Z"/></g>`;
  if (has("sunhood")) head += hoodShape("#f7cc1e", "#b8930a");
  if (has("gasmask")) head += `<path d="M${hx + 9} ${hy - 7} L${hx + 1} ${hy - 11}" stroke="#2b2b2b" stroke-width="2.2"/><ellipse cx="${hx + 21}" cy="${hy + 1}" rx="13" ry="11.5" fill="#56664a" stroke="#2f3a28" stroke-width="1.2"/><circle cx="${hx + 15}" cy="${hy - 4}" r="4.3" fill="#a8dcea" stroke="#1f1f1f" stroke-width="1.6"/><circle cx="${hx + 25}" cy="${hy - 4}" r="4.3" fill="#a8dcea" stroke="#1f1f1f" stroke-width="1.6"/><rect x="${hx + 25}" y="${hy + 3}" width="11" height="11" rx="3.5" fill="#2e2e2e"/><path d="M${hx + 28} ${hy + 5} v7 M${hx + 31} ${hy + 5} v7 M${hx + 34} ${hy + 5} v7" stroke="#6b6b6b" stroke-width="1"/>`;
  if (has("polo")) head = `<path d="M${hx - 6} ${hy + 4} L${hx + 4} ${hy + 1} L${hx + 2} ${hy + 13} Z" fill="#c8102e" stroke="#8a0b20" stroke-width="1.1" stroke-linejoin="round"/><path d="M${hx - 6} ${hy + 15} L${hx + 4} ${hy + 1} L${hx + 6} ${hy + 15} Z" fill="#a50d26" stroke="#8a0b20" stroke-width="1.1" stroke-linejoin="round"/>` + head;
  if (has("badgeaplus")) head += `<circle cx="${hx + 6}" cy="${hy - 13}" r="6.2" fill="#5c1229" stroke="#f4a7b9" stroke-width="1"/><text x="${hx + 5.3}" y="${hy - 9.5}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="9" fill="#f4a7b9">A<tspan font-size="6" dy="-3.5">+</tspan></text>`;
  if (has("hat67")) head += `<path d="M${hx + 3} ${hy - 12} Q${hx + 17} ${hy - 36} ${hx + 31} ${hy - 12} Z" fill="#e8483f" stroke="#a8261f" stroke-width="1.2"/><rect x="${hx + 1}" y="${hy - 15}" width="32" height="6" rx="3" fill="#b8302a"/><circle cx="${hx + 17}" cy="${hy - 31}" r="3.6" fill="#fff" stroke="#ddd"/><text x="${hx + 17}" y="${hy - 17.5}" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="8" fill="#fff">67</text>`;
  if (has("glasses67")) head += `<g font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="7.5" text-anchor="middle"><circle cx="${hx + 14.5}" cy="${hy - 4}" r="5" fill="#fff" stroke="#1b1b1b" stroke-width="1.5"/><circle cx="${hx + 25.5}" cy="${hy - 4}" r="5" fill="#fff" stroke="#1b1b1b" stroke-width="1.5"/><path d="M${hx + 19.5} ${hy - 4} h1" stroke="#1b1b1b" stroke-width="1.5"/><text x="${hx + 14.5}" y="${hy - 1.2}" fill="#1b1b1b">6</text><text x="${hx + 25.5}" y="${hy - 1.2}" fill="#1b1b1b">7</text></g>`;
  if (has("crown")) head += `<path d="M${hx + 8} ${hy - 13} L${hx + 7} ${hy - 25} L${hx + 12.5} ${hy - 19} L${hx + 17} ${hy - 28} L${hx + 21.5} ${hy - 19} L${hx + 27} ${hy - 25} L${hx + 26} ${hy - 13} Z" fill="#f2c230" stroke="#b8860b" stroke-width="1.2"/><circle cx="${hx + 17}" cy="${hy - 17}" r="1.8" fill="#e8483f"/>`;
  const pop = falling ? `<text class="poptxt" x="${segX(len + falling - 1) - 2}" y="12">${esc(popName())}.pop()</text>` : "";
  const t67 = anim === "six7" ? `<text class="t67 a" x="${segX(N - 1) + 4}" y="14">6</text><text class="t67 b" x="${segX(0) + 30}" y="14">7</text>` : "";
  return `<svg class="snake ${o.cls || ""} ${anim ? "anim-" + anim : ""}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Змійка, сегментів: ${len} з ${N}">${g}<g class="head">${head}</g>${pop}${t67}</svg>`;
}

// ---------- гардероб (спільний для всіх ігор) ----------
let pendingBuy = null; // перший клік по товару — «натисни ще раз», другий — купівля
let paintTarget = "all"; // що фарбуємо: "all" — усю змійку, "h" — голову, 0..N-1 — блок
function renderWardrobe(back, backLabel) {
  const total = totalStars(), maxAll = GAMES.reduce((s, g) => s + g.max, 0), p = store.profile, left = bytesLeft();
  const tile = (x, kind) => {
    const curSkin = paintTarget === "all" ? (Object.keys(p.mix || {}).length ? null : p.skin) : ((p.mix || {})[paintTarget] || p.skin);
    const curAnim = p.anim && p.anim !== "none" ? p.anim : "none", curShape = p.shape || "square";
    const open = isOpen(x), sel = open && (kind === "set" ? false : kind === "anim" ? curAnim === x.id : kind === "shape" ? curShape === x.id : kind === "headtype" ? (p.head || "snake") === x.id : kind === "skin" ? curSkin === x.id : x.id === "none" ? !accList().length : hasAcc(x.id));
    const prev = kind === "set" ? snakeSVG({ len: N, skin: x.items[0], acc: x.items.slice(1, 3).join(","), anim: x.items[3] })
      : kind === "anim" ? snakeSVG({ len: N, anim: x.id, acc: "none" })
      : kind === "shape" ? snakeSVG({ len: N, shape: x.id, acc: "none" })
      : kind === "headtype" ? snakeSVG({ len: N, headType: x.id, acc: "none" })
      : snakeSVG(kind === "skin" ? { len: N, skin: x.id, acc: "none" } : { len: N, acc: x.id });
    const cost = kind === "set" ? setCost(x) : x.price;
    const shop = x.price && !open, can = shop && left >= cost;
    if (kind === "set" && open) return `<div class="wtile set" data-id="${x.id}">${prev}<span class="wname">${esc(x.name)}</span><span class="wlock">Куплено</span></div>`;
    const label = sel ? (kind === "acc" && x.id !== "none" ? "Вдягнуто · зняти" : "Обрано") : open ? (kind === "acc" && SLOT[x.id] ? "Відкрито · " + SLOT_NAME[SLOT[x.id]] : "Відкрито")
      : shop ? (pendingBuy === x.id ? `Натисни ще раз, щоб купити за ${cost}` : can ? `Купити за ${cost} ${bytesWord(cost)}` : `Коштує ${cost} ${bytesWord(cost)}`)
      : (x.secret ? "Секрет" : x.ach ? "Секрет: " + ACH[x.ach].toLowerCase() : `Потрібно ★ ${x.need}`);
    return `<button class="wtile ${sel ? "sel" : ""} ${shop ? "shop" : ""} ${pendingBuy === x.id ? "confirm" : ""}" data-kind="${kind}" data-id="${x.id}" ${open || can ? "" : "disabled"}>
      ${prev}<span class="wname">${esc(x.name)}</span>
      <span class="wlock">${label}</span></button>`;
  };
  const items = kind => (kind === "skin" ? SKINS : ACCS);
  app().innerHTML = `<div class="center wardrobe">
    <button class="link" id="back">← ${esc(backLabel || "Назад")}</button>
    <h2>Гардероб</h2>
    <div class="pet">${snakeSVG({ len: N, cls: "big" })}
      <div class="petinfo"><label class="answer-label" for="petname">Ім'я змійки</label>
      <input type="text" id="petname" maxlength="16" value="${esc(p.name)}" autocomplete="off">
      <div class="status">У тебе ★ ${total} з ${maxAll} в усіх іграх. Більше зірок — більше скінів.</div>
      <div class="status">${streakBadge()} Найдовша серія: ${(p.streak || {}).best || 0} ${daysWord((p.streak || {}).best || 0)}.</div>
      <div class="status bytes">Байтів: <b>${left}</b>. Їх дають за правильні відповіді з першої спроби на рівнях, які ти проходиш уперше, і ще ${BYTES_PERFECT} за рівень без помилок.</div></div></div>
    <h3>Забарвлення</h3>
    <p class="status">Змійку можна зібрати з різних блоків. Обери, що фарбуєш, а потім забарвлення.</p>
    <div class="paint">${[["all", "Усю змійку"], ["h", "Голову"], ...Array.from({ length: N }, (_, i) => [String(i), "Блок " + i])].map(([k, t]) => `<button class="pchip ${String(paintTarget) === k ? "on" : ""}" data-t="${k}">${t}</button>`).join("")}</div>
    <div class="wgrid">${SKINS.filter(x => !x.price).map(x => tile(x, "skin")).join("")}</div>
    <h3>Аксесуари</h3>
    <p class="status">Можна вдягти кілька речей одразу, але по одній на кожне місце: одну шапку, одні окуляри і так далі. Клік по вдягнутій речі знімає її.</p>
    <div class="wgrid">${ACCS.filter(x => !x.price).map(x => tile(x, "acc")).join("")}</div>
    <h3>Голова</h3>
    <div class="wgrid">${HEADS.map(x => tile(x, "headtype")).join("")}</div>
    <h3>Форма блоків</h3>
    <div class="wgrid">${SHAPES.map(x => tile(x, "shape")).join("")}</div>
    <h3>Анімації</h3>
    <p class="status">Анімацію видно на великій змійці: на головній сторінці й тут, у гардеробі.</p>
    <div class="wgrid">${ANIMS.map(x => tile(x, "anim")).join("")}</div>
    <h3>Крамниця</h3>
    <div class="wgrid">${SETS.map(x => tile(x, "set")).join("")}${SKINS.filter(x => x.price).map(x => tile(x, "skin")).join("")}${ACCS.filter(x => x.price).map(x => tile(x, "acc")).join("")}</div>
  </div>`;
  $("#back").onclick = back;
  $("#petname").addEventListener("change", e => { p.name = e.target.value.trim().slice(0, 16) || "Пітоша"; save("profile"); renderWardrobe(back, backLabel); });
  app().querySelectorAll(".wtile").forEach(b => b.onclick = () => {
    const kind = b.dataset.kind, x = ALLITEMS().find(y => y.id === b.dataset.id);
    if (x.price && !isOpen(x)) {
      if (pendingBuy !== x.id) { pendingBuy = x.id; renderWardrobe(back, backLabel); return; }
      const cost = kind === "set" ? setCost(x) : x.price;
      if (bytesLeft() < cost) return;
      p.spent = bytesSpent() + cost;
      p.bought = [...(p.bought || []), x.id]; toast(`Куплено: ${x.name}!`);
    }
    pendingBuy = null;
    const id = b.dataset.id;
    if (kind === "set") {   // одразу вдягаємо весь комплект
      x.items.forEach(it => { if (SKINS.some(y => y.id === it)) { p.skin = it; p.mix = {}; } else if (ANIMS.some(y => y.id === it)) p.anim = it;
        else { const l = accList().filter(a => !SLOT[it] || SLOT[a] !== SLOT[it]); l.push(it); p.acc = l.join(","); } });
    } else if (kind === "anim") p.anim = id;
    else if (kind === "shape") p.shape = id;
    else if (kind === "headtype") p.head = id;
    else if (kind === "skin") {
      if (paintTarget === "all") { p.skin = id; p.mix = {}; }
      else { p.mix = Object.assign({}, p.mix, { [paintTarget]: id }); }
    } else if (id === "none") p.acc = "none";
    else if (hasAcc(id)) { const l = accList().filter(a => a !== id); p.acc = l.length ? l.join(",") : "none"; }
    else { const l = accList().filter(a => !SLOT[id] || SLOT[a] !== SLOT[id]); l.push(id); p.acc = l.join(","); }
    save("profile"); renderWardrobe(back, backLabel);
  });
  app().querySelectorAll(".paint .pchip").forEach(b => b.onclick = () => { paintTarget = b.dataset.t; renderWardrobe(back, backLabel); });
}

// ---------- вихід з гри під час рівня ----------
// Гра повідомляє, чи йде рівень (isActive), і отримує штраф (onPenalty) з причиною, кількістю сегментів і часом.
const GRACE = 1500, AWAY_STEP = 30000;
let leaveCfg = { isActive: () => false, onPenalty: () => {} };
let awaySince = 0, guardOpen = false, wasFull = false;
function goneAway() { if (leaveCfg.isActive() && !awaySince) awaySince = Date.now(); }
function cameBack() {
  if (!awaySince || document.hidden) return;
  const t = Date.now() - awaySince; awaySince = 0;
  if (t < GRACE || !leaveCfg.isActive()) return;
  // якщо заслона вже висить, за сам вихід уже знято — рахуємо лише час
  const n = (guardOpen ? 0 : 1) + Math.floor(t / AWAY_STEP);
  leaveCfg.onPenalty("away", n, t, guardOpen);
}
document.addEventListener("visibilitychange", () => document.hidden ? goneAway() : cameBack());
window.addEventListener("blur", goneAway);
window.addEventListener("focus", cameBack);
document.addEventListener("fullscreenchange", () => {
  if (document.fullscreenElement) { wasFull = true; return; }
  if (!wasFull) return;
  wasFull = false;
  if (leaveCfg.isActive()) leaveCfg.onPenalty("fullscreen", 1, 0, guardOpen);
});
// o: { reason, lost, time, hearts, max }
function showGuard(o) {
  guardOpen = true;
  let g = document.getElementById("guard");
  if (!g) { g = document.createElement("div"); g.id = "guard"; g.setAttribute("role", "alertdialog"); g.setAttribute("aria-modal", "true"); document.body.appendChild(g); }
  const what = o.reason === "fullscreen" ? "Ти вийшов(-ла) з повноекранного режиму." : "Ти переходив(-ла) на іншу вкладку чи в інший застосунок.";
  const lost = o.lost || 1, tm = o.time || 0;
  const word = lost === 1 ? "сегмент" : lost < 5 ? "сегменти" : "сегментів";
  g.innerHTML = `<div class="guardcard">
    ${snakeSVG({ len: o.hearts, mood: "sad", cls: "big" })}
    <div class="stamp">Мінус ${lost === 1 ? "сегмент" : lost + " " + word}!</div>
    <p>${what}${tm >= GRACE ? ` Тебе не було ${fmtTime(tm)}.` : ""} ${esc(store.profile.name)} злякалась і загубила ${lost === 1 ? "шматок хвоста" : lost + " " + word}. Лишилось сегментів: ${o.hearts} з ${o.max}.</p>
    <p class="status">Кожні 30 секунд поза грою — ще мінус сегмент.</p>
    <button class="btn" id="guard-back">Повернутися до гри</button>
  </div>`;
  g.hidden = false;
  document.getElementById("guard-back").onclick = () => { hideGuard(); goFullscreen(); };
  document.getElementById("guard-back").focus();
}
function hideGuard() { guardOpen = false; awaySince = 0; const g = document.getElementById("guard"); if (g) g.hidden = true; if (leaveCfg.onHide) leaveCfg.onHide(); }
function goFullscreen() {
  try { const el = document.documentElement; if (!document.fullscreenElement && el.requestFullscreen) el.requestFullscreen().catch(() => {}); } catch (e) {}
}
function leaveFullscreen() {
  wasFull = false;
  try { if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {}); } catch (e) {}
}
function toast(text) {
  let t = document.getElementById("toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; t.setAttribute("role", "alert"); document.body.appendChild(t); }
  t.textContent = text; t.className = "show";
  clearTimeout(toast.tm); toast.tm = setTimeout(() => { t.className = ""; }, 4500);
}

window.KV = {
  VERSION, GAMES, esc, md, shuffle, fmtTime, starStr, $, app,
  get session() { return session; }, get offline() { return offline; }, get access() { return access; },
  profile, gameData, totalStars, save, scheduleSync, syncLabel, boot, logout, whoami, bindWhoami,
  useGame: (id, summaryFn, levelIds) => { currentGame = id; gameSummary = summaryFn; const G = GAMES.find(g => g.id === id); if (G) G.levelIds = levelIds; },
  N, SKINS, ACCS, isOpen, openIds, achieve, snakeSVG, renderWardrobe, hasAcc, bytesLeft, bytesWord, BYTES_PERFECT, streakTouch, streakNow, streakBadge, daysWord, STREAK_EVERY,
  leave: { configure: cfg => { leaveCfg = Object.assign({ isActive: () => false, onPenalty: () => {} }, cfg); }, GRACE, AWAY_STEP },
  get guardOpen() { return guardOpen; }, showGuard, hideGuard, goFullscreen, leaveFullscreen, toast,
};
})();
