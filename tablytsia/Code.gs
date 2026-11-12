/**
 * ІТ-квести — сервер для всіх ігор порталу.
 * Аркуш «Учні»: Логін | PIN | Ім'я | Клас — заповнює вчителька.
 * Аркуш «Доступ»: Клас | Ігри — які ігри бачить клас (через кому). Якщо класу немає в списку, він бачить усі ігри.
 * Аркуш «Профілі»: змійка учня (спільна для всіх ігор) — заповнюється сам.
 * Аркуші «Прогрес: <гра>»: прогрес у кожній грі — заповнюються самі.
 * Старий аркуш «Прогрес» сам перейменовується на «Прогрес: Списки».
 */
const VERSION = "2026.11.12";
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
      const res = { ok: true, v: 2, version: VERSION, name: st.name, cls: st.cls, access: accessFor(st.cls), profile: readProfile(st.login), games: {} };
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
function accessSheet() {
  let sh = ss().getSheetByName("Доступ");
  if (sh) return sh;
  sh = ss().insertSheet("Доступ");
  sh.getRange(1, 1, 1, 3).setValues([["Клас", "Ігри", "Підказка"]]).setFontWeight("bold");
  const classes = [];
  ss().getSheetByName("Учні").getDataRange().getDisplayValues().slice(1).forEach(r => { if (r[3] && classes.indexOf(r[3]) < 0) classes.push(r[3]); });
  if (classes.length) sh.getRange(2, 1, classes.length, 2).setValues(classes.map(c => [c, "spysky"]));
  sh.getRange(2, 3).setValue("Ігри пишемо через кому. Коди ігор: spysky — «Списковий квест». Якщо класу немає в списку, він бачить усі ігри.");
  sh.setFrozenRows(1);
  return sh;
}
function accessFor(cls) {
  const rows = accessSheet().getDataRange().getDisplayValues();
  for (let i = 1; i < rows.length; i++) {
    if (norm(rows[i][0]) === norm(cls)) return String(rows[i][1]).split(",").map(norm).filter(x => x);
  }
  return null;
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
// Колонки: Логін | Ім'я | Клас | Зірки всього | Байти | Виходів з гри | <рівні…> | Ім'я змійки | Забарвлення | Аксесуар | Оновлено | Дані гри | Поза грою, хв | Спроб рівнів | Спроби по рівнях
function gameSheet(name, create, levelTitles) {
  let sh = ss().getSheetByName(name);
  if (!sh && name === SPYSKY_SHEET) {
    const old = ss().getSheetByName("Прогрес");
    if (old) { old.setName(SPYSKY_SHEET); sh = old; }
  }
  if (!sh && create) {
    sh = ss().insertSheet(name);
    const head = ["Логін", "Ім'я", "Клас", "Зірки всього", "Байти", "Виходів з гри"].concat(levelTitles || [])
      .concat(["Ім'я змійки", "Забарвлення", "Аксесуар", "Оновлено", DATA_HEADER, "Поза грою, хв", "Спроб рівнів", "Спроби по рівнях"]);
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
  const extra = sh.getRange(1, dc + 1, 1, 3).getDisplayValues()[0];
  if (!extra[0]) sh.getRange(1, dc + 1, 1, 3).setValues([["Поза грою, хв", "Спроб рівнів", "Спроби по рівнях"]]);
  const row = [st.login, st.name, st.cls, Number(s.total) || 0, Number(s.bytes) || 0, Number(s.leaves) || 0]
    .concat(levels)
    .concat([s.snake || "", s.skin || "", s.acc || "", new Date(), JSON.stringify(data),
      Number(s.awayMin) || 0, Number(s.attemptsTotal) || 0, (s.attempts || []).join(" · ")]);
  const r = findRow(sh, st.login) || sh.getLastRow() + 1;
  sh.getRange(r, 1, 1, row.length).setValues([row]);
}
