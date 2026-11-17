/**
 * ІТ-квести — сервер для всіх ігор порталу.
 * Аркуш «Учні»: Логін | PIN | Ім'я | Клас — заповнює вчителька.
 * Аркуш «Доступ»: таблиця з галочками — рядки ігри, стовпці класи. Клас, якого там немає, бачить усі ігри.
 * Аркуш «Профілі»: змійка учня (спільна для всіх ігор) — заповнюється сам.
 * Аркуші «Прогрес: <гра>»: прогрес у кожній грі — заповнюються самі.
 * Старий аркуш «Прогрес» сам перейменовується на «Прогрес: Списки».
 */
const VERSION = "2026.11.17-9";
const SPYSKY_SHEET = "Прогрес: Списки";
const DATA_HEADER = "Дані гри (не змінювати)";

function doGet() {
  return out({ ok: true, msg: "ІТ-квести: сервер працює", version: VERSION });
}

function doPost(e) {
  let req;
  try { req = JSON.parse(e.postData.contents); } catch (err) { return out({ ok: false, error: "bad_request" }); }
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return out({ ok: false, error: "сервер зайнятий" });
  try {
    const st = findStudent(req.login, req.pin);
    if (!st) return out({ ok: false, error: "auth" });

    if (req.action === "login") {
      const res = { ok: true, v: 2, version: VERSION, name: st.name, cls: st.cls, access: accessFor(st.cls, req.games || []), profile: readProfile(st.login), games: {} };
      const games = req.games || [{ id: "spysky", sheet: SPYSKY_SHEET }];
      games.forEach(g => { res.games[g.id] = readGame(g.sheet, st.login); });
      // стара версія гри чекає data / levels / bytes
      const sp = res.games.spysky || readGame(SPYSKY_SHEET, st.login);
      res.data = sp.data; res.levels = sp.levels; res.bytes = sp.bytes;
      return out(res);
    }

    if (req.action === "save") {
      if (req.profile) writeProfile(st, req.profile);
      if (req.game) writeGame(st, req.game.sheet, req.game.data || {}, req.game.summary || {});
      else if (!req.v && req.data) writeGame(st, SPYSKY_SHEET, req.data, req.summary || {});   // стара версія гри
      return out({ ok: true });
    }
    if (req.action === "leaders") return out(Object.assign({ ok: true }, leaders(st)));
    return out({ ok: false, error: "unknown_action" });
  } catch (err) {
    return out({ ok: false, error: "помилка таблиці: " + (err && err.message ? err.message : err) });
  } finally {
    lock.releaseLock();
  }
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function norm(s) { return String(s == null ? "" : s).trim().toLowerCase(); }
function ss() { return SpreadsheetApp.getActive(); }

// ---------- учні й доступ ----------
function findStudent(login, pin) {
  const sh = ss().getSheetByName("Учні");
  if (!sh) throw new Error("немає аркуша «Учні»");
  const rows = sh.getDataRange().getDisplayValues();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r[0] && norm(r[0]) === norm(login) && String(r[1]).trim() === String(pin).trim()) return { login: norm(r[0]), name: r[2], cls: r[3] };
  }
  return null;
}
// ---------- доступ: таблиця з прапорцями ----------
// Рядки — ігри, стовпці — класи; галочка на перетині означає, що клас бачить гру.
// Нові класи (з аркуша «Учні») і нові ігри додаються самі: клас — з усіма галочками, гра — без галочок.
// Якщо класу в таблиці немає, він бачить усі ігри.
const GAME_LIST = [["spysky", "Списковий квест"], ["python6", "Перші кроки в Python"], ["fajly", "Файли і папки"],
  ["klavishi", "Гарячі клавіші"], ["trenazhery", "Тренажери"], ["robo", "Робототехніка"], ["swift", "SwiftUI"], ["flow", "Блок-схеми"]];
const isTrue = v => v === true || String(v).trim().toUpperCase() === "TRUE";
function accessSheet(extraCodes) {
  const book = ss();
  let sh = book.getSheetByName("Доступ");
  // що вже позначено: { код: { клас: true/false } }, порядок класів і ігор
  const marks = {}, classes = [], games = [];
  const addGame = (code, title) => {
    code = norm(code); if (!code) return;
    const g = games.find(x => x[0] === code);
    if (!g) games.push([code, title || code]);
    else if (title && g[1] === code) { g[1] = title; changed = true; }   // раніше назви не знали — підставляємо
  };
  let changed = !sh;
  if (sh) {
    const v = sh.getDataRange().getValues();
    if (norm(v[0][0]) === "клас") {
      // старий вигляд «Клас | Ігри»: переносимо в нову таблицю, а старий аркуш лишаємо як «Доступ (старий)»
      const old = {};
      v.slice(1).forEach(r => { if (String(r[0]).trim()) old[String(r[0]).trim()] = String(r[1]).split(",").map(norm).filter(x => x); });
      sh.setName("Доступ (старий)"); sh = null; changed = true;
      GAME_LIST.forEach(g => addGame(g[0], g[1]));
      Object.keys(old).forEach(c => { classes.push(c); games.forEach(g => { (marks[g[0]] = marks[g[0]] || {})[c] = old[c].indexOf(g[0]) >= 0; }); });
    } else {
      const head = v[0].slice(2).map(x => String(x).trim());
      head.forEach(c => { if (c) classes.push(c); });
      v.slice(1).forEach(r => { const code = norm(r[1]); if (!code) return; addGame(code, String(r[0]).trim()); marks[code] = marks[code] || {}; head.forEach((c, k) => { if (c) marks[code][c] = isTrue(r[2 + k]); }); });
    }
  }
  const before = games.length;
  GAME_LIST.forEach(g => addGame(g[0], g[1]));
  // ігри, які надсилає сайт: нова гра з'являється в таблиці сама, оновлювати цей скрипт не треба
  (extraCodes || []).forEach(c => typeof c === "string" ? addGame(c) : addGame(c.id, c.title));
  if (games.length !== before) changed = true;
  // класи з аркуша «Учні», яких ще немає в таблиці: бачать усе, як і раніше
  const fresh = [];
  book.getSheetByName("Учні").getDataRange().getDisplayValues().slice(1).forEach(r => {
    const c = String(r[3] || "").trim();
    if (c && !isTeacher(c) && !classes.some(x => norm(x) === norm(c)) && !fresh.some(x => norm(x) === norm(c))) fresh.push(c);
  });
  fresh.sort((a, b) => (parseInt(a) || 99) - (parseInt(b) || 99) || a.localeCompare(b, "uk"));
  fresh.forEach(c => { classes.push(c); games.forEach(g => { (marks[g[0]] = marks[g[0]] || {})[c] = true; }); });
  if (fresh.length) changed = true;
  if (changed) {
    if (!sh) sh = book.insertSheet("Доступ"); else sh.clear();
    const rows = [["Гра", "Код"].concat(classes)].concat(games.map(g => [g[1], g[0]].concat(classes.map(c => !!(marks[g[0]] || {})[c]))));
    sh.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
    sh.getRange(1, 1, 1, rows[0].length).setFontWeight("bold");
    if (classes.length && games.length) sh.getRange(2, 3, games.length, classes.length).insertCheckboxes();
    sh.getRange(1, 1).setNote("Постав галочку на перетині гри й класу — і клас бачитиме цю гру. Нові класи з аркуша «Учні» й нові ігри з'являються тут самі. Клас, якого тут немає, бачить усі ігри. Колонку «Код» не змінюй.");
    sh.setFrozenRows(1); sh.setFrozenColumns(2);
  }
  return { sh, classes, games, marks };
}
function accessFor(cls, extraCodes) {
  const a = accessSheet(extraCodes);
  if (isTeacher(cls)) return null;   // учитель завжди бачить усі ігри
  const col = a.classes.find(c => norm(c) === norm(cls));
  if (!col) return null;
  return a.games.filter(g => (a.marks[g[0]] || {})[col]).map(g => g[0]);
}

// ---------- профіль (змійка) ----------
const PROFILE_HEAD = ["Логін", "Ім'я", "Клас", "Ім'я змійки", "Забарвлення", "Аксесуар", "Секрети", "Оновлено", DATA_HEADER];
function profileSheet() {
  let sh = ss().getSheetByName("Профілі");
  if (!sh) {
    sh = ss().insertSheet("Профілі");
    sh.getRange(1, 1, 1, PROFILE_HEAD.length).setValues([PROFILE_HEAD]).setFontWeight("bold");
    sh.setFrozenRows(1);
  }
  return sh;
}
function findRow(sh, login) {
  const last = sh.getLastRow();
  if (last < 2) return 0;
  const logins = sh.getRange(2, 1, last - 1, 1).getDisplayValues();
  for (let i = 0; i < logins.length; i++) if (norm(logins[i][0]) === login) return i + 2;
  return 0;
}
function readProfile(login) {
  const sh = profileSheet(), r = findRow(sh, login);
  if (!r) return null;
  try { return JSON.parse(sh.getRange(r, PROFILE_HEAD.length).getValue() || "null"); } catch (e) { return null; }
}
function writeProfile(st, p) {
  const sh = profileSheet();
  const row = [st.login, st.name, st.cls, p.name || "", p.skin || "", p.acc || "", Object.keys(p.ach || {}).join(", "), new Date(), JSON.stringify(p)];
  const r = findRow(sh, st.login) || sh.getLastRow() + 1;
  sh.getRange(r, 1, 1, row.length).setValues([row]);
}

// ---------- прогрес гри ----------
// Колонки: Логін | Ім'я | Клас | Зірки всього | Байти | Виходів з гри | <рівні…> | Ім'я змійки | Забарвлення | Аксесуар | Оновлено | Дані гри | Поза грою, хв | Спроб рівнів | Спроби по рівнях | Коротких перемикань | Мишка за вікном
function gameSheet(name, create, levelTitles) {
  let sh = ss().getSheetByName(name);
  if (!sh && name === SPYSKY_SHEET) {
    const old = ss().getSheetByName("Прогрес");
    if (old) { old.setName(SPYSKY_SHEET); sh = old; }
  }
  if (!sh && create) {
    sh = ss().insertSheet(name);
    const head = ["Логін", "Ім'я", "Клас", "Зірки всього", "Байти", "Виходів з гри"].concat(levelTitles || [])
      .concat(["Ім'я змійки", "Забарвлення", "Аксесуар", "Оновлено", DATA_HEADER, "Поза грою, хв", "Спроб рівнів", "Спроби по рівнях", "Коротких перемикань", "Мишка за вікном"]);
    sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight("bold");
    sh.setFrozenRows(1);
  }
  return sh;
}
function dataCol(sh) {
  const head = sh.getRange(1, 1, 1, sh.getLastColumn()).getDisplayValues()[0];
  const i = head.indexOf(DATA_HEADER);
  if (i < 0) throw new Error("в аркуші «" + sh.getName() + "» немає колонки «" + DATA_HEADER + "»");
  return i + 1;
}
function readGame(name, login) {
  const sh = gameSheet(name, false);
  if (!sh) return { data: null, levels: [], bytes: 0 };
  const r = findRow(sh, login);
  if (!r) return { data: null, levels: [], bytes: 0 };
  const dc = dataCol(sh), n = dc - 5 - 6;
  const vals = sh.getRange(r, 1, 1, dc).getValues()[0];
  let data = null;
  try { data = vals[dc - 1] ? JSON.parse(vals[dc - 1]) : null; } catch (e) { data = null; }
  return { data: data, levels: vals.slice(6, 6 + n).map(v => Number(v) || 0), bytes: Number(vals[4]) || 0 };
}
function writeGame(st, name, data, s) {
  const sh = gameSheet(name, true, s.levelTitles);
  const dc = dataCol(sh), n = dc - 5 - 6;
  const levels = (s.levels || []).slice(0, n);
  while (levels.length < n) levels.push("");
  const extra = sh.getRange(1, dc + 1, 1, 5).getDisplayValues()[0];
  if (!extra[0] || !extra[3]) sh.getRange(1, dc + 1, 1, 5).setValues([["Поза грою, хв", "Спроб рівнів", "Спроби по рівнях", "Коротких перемикань", "Мишка за вікном"]]);
  const r0 = findRow(sh, st.login);
  // зірки в таблиці ніколи не зменшуються: ручні трійки вчительки не затре навіть стара копія гри
  if (r0 && n > 0) {
    const cur = sh.getRange(r0, 7, 1, n).getValues()[0];
    for (let i = 0; i < n; i++) {
      const a = Number(cur[i]) || 0, b = Number(levels[i]) || 0;
      if (a > b) levels[i] = a;
    }
  }
  const sum = levels.reduce((t, v) => t + (Number(v) || 0), 0);
  const row = [st.login, st.name, st.cls, Math.max(Number(s.total) || 0, sum), Number(s.bytes) || 0, Number(s.leaves) || 0]
    .concat(levels)
    .concat([s.snake || "", s.skin || "", s.acc || "", new Date(), JSON.stringify(data),
      Number(s.awayMin) || 0, Number(s.attemptsTotal) || 0, (s.attempts || []).join(" · "), Number(s.peeks) || 0, Number(s.mouseOut) || 0]);
  const r = r0 || sh.getLastRow() + 1;
  sh.getRange(r, 1, 1, row.length).setValues([row]);
}

// ---------- лідерборд ----------
// Рахує зірки кожного учня в усіх аркушах «Прогрес: …». Вчителі (клас «вчитель», «вчителька», «вчителі») у список не потрапляють.
const isTeacher = cls => norm(cls).indexOf("вчител") === 0;
function leaders(me) {
  const cache = CacheService.getScriptCache();
  let all = null;
  const hit = cache.get("leaders");
  if (hit) { try { all = JSON.parse(hit); } catch (e) { all = null; } }
  if (!all) { all = buildLeaders(); try { cache.put("leaders", JSON.stringify(all), 120); } catch (e) {} }
  const mineCls = norm(me.cls), teacher = isTeacher(me.cls);
  const cls = teacher ? [] : all.filter(x => norm(x.cls) === mineCls);
  const classes = Array.from(new Set(all.map(x => x.cls))).sort();
  // повний список і всі класи бачать і учні (вкладки по класах), і вчитель
  return { me: me.login, teacher: teacher, cls: cls.map(strip(me)), school: all.slice(0, 10).map(strip(me)), all: all.map(strip(me)), classes: classes };
}
function strip(me) { return function (x) { return { name: x.name, cls: x.cls, stars: x.stars, streak: x.streak, snake: x.snake, look: x.look, me: x.login === me.login }; }; }
function buildLeaders() {
  const book = ss(), people = {};
  const us = book.getSheetByName("Учні");
  us.getDataRange().getDisplayValues().slice(1).forEach(r => {
    if (!r[0] || isTeacher(r[3])) return;
    people[norm(r[0])] = { login: norm(r[0]), name: String(r[2] || r[0]).trim(), cls: String(r[3]).trim(), stars: 0, streak: 0, snake: "", look: {} };
  });
  book.getSheets().forEach(sh => {
    if (sh.getName().indexOf("Прогрес: ") !== 0) return;
    const rows = sh.getDataRange().getValues();
    rows.slice(1).forEach(r => { const p = people[norm(r[0])]; if (p) p.stars += Number(r[3]) || 0; });
  });
  const pf = book.getSheetByName("Профілі");
  if (pf) {
    const today = Utilities.formatDate(new Date(), "Europe/Kyiv", "yyyy-MM-dd");
    const yest = Utilities.formatDate(new Date(Date.now() - 864e5), "Europe/Kyiv", "yyyy-MM-dd");
    pf.getDataRange().getValues().slice(1).forEach(r => {
      const p = people[norm(r[0])]; if (!p) return;
      let j = null; try { j = JSON.parse(r[PROFILE_HEAD.length - 1] || "null"); } catch (e) {}
      if (!j) return;
      p.snake = j.name || "";
      p.look = { skin: j.skin || "", acc: j.acc || "", shape: j.shape || "", head: j.head || "" };
      const k = j.streak || {};
      p.streak = (k.last === today || k.last === yest) ? (k.n || 0) : 0;
    });
  }
  return Object.keys(people).map(k => people[k]).sort((a, b) => b.stars - a.stars || b.streak - a.streak || a.name.localeCompare(b.name, "uk"));
}
