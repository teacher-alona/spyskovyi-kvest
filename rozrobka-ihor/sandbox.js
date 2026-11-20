/* Пісочниця: власна сцена з правилами і власний рівень стрибалки. Зберігаємо в localStorage цього браузера */
(function () {
"use strict";
const KEY = "kv-sandbox";
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
const W = 12, H = 8;
const S = load() || {
  scene: ["P...........", "....c.......", "..####......", "......e..c..", "c...........", ".....####...", "..c.......h.", "..........F."],
  rules: [{ w: "coin", a: [{ k: "addScore", n: 1 }, { k: "remove" }] }, { w: "wall", a: [{ k: "stop" }] }, { w: "flag", a: [{ k: "win" }] }],
  level: RUN.blank(40),
};
const $ = s => document.querySelector(s);
// вкладки
document.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => {
  document.querySelectorAll("[data-tab]").forEach(x => x.classList.toggle("on", x === b));
  ["adv", "run", "gal"].forEach(k => $("#" + k).hidden = b.dataset.tab !== k);
  area.reset(); rp.stop(); closeView();
  if (b.dataset.tab === "run") rp.refresh();
  if (b.dataset.tab === "gal") loadGallery();
});
// ---- пригодницька гра ----
const tiles = [[".", "Порожньо"], ["#", "Стіна"], ["P", "🐍 Гравець"], ["c", "🪙 Монетка"], ["e", "👾 Ворог ↔"], ["v", "👻 Ворог ↕"], ["h", "❤️ Сердечко"], ["F", "🏁 Прапорець"], ["move", "✋ Пересунути"]];
let tool = "#";
$("#tiles").innerHTML = tiles.map(([k, n]) => `<button data-k="${k}" class="${k === tool ? "on" : ""}">${n}</button>`).join("");
$("#tiles").querySelectorAll("button").forEach(b => b.onclick = () => { tool = b.dataset.k; held = null; $("#tiles").querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); drawScene(); });
let painting = false, held = null;
const setAt = (x, y, ch) => { const row = S.scene[y].split(""); row[x] = ch; S.scene[y] = row.join(""); };
// ✋ взяти предмет і поставити в іншу клітинку (на старому місці стає порожньо)
const drop = (x, y) => { if (!held) return; if (x !== held.x || y !== held.y) { setAt(held.x, held.y, "."); setAt(x, y, held.ch); held = null; save(); drawScene(); area.reset(); } };
const drawScene = () => {
  const st = $("#scene"); st.style.gridTemplateColumns = `repeat(${W}, minmax(0, 1fr))`;
  st.classList.toggle("moving", tool === "move");
  $("#mvhint").hidden = tool !== "move";
  $("#mvhint").textContent = held ? "Тепер клацни клітинку, куди поставити (або відпусти мишку над нею)" : "Візьми предмет або стіну і перетягни на нове місце";
  st.innerHTML = S.scene.map((row, y) => row.split("").map((ch, x) => `<div class="ac${ch === "#" ? " wall" : ""}${held && held.x === x && held.y === y ? " held" : ""}" data-x="${x}" data-y="${y}">${ch === "#" || ch === "." ? "" : ARC.TILES[ch].icon}</div>`).join("")).join("");
  st.querySelectorAll(".ac").forEach(c => {
    c.onpointerdown = e => {
      e.preventDefault(); const x = +c.dataset.x, y = +c.dataset.y;
      if (tool === "move") {
        if (held) { if (held.x === x && held.y === y) { held = null; drawScene(); } else drop(x, y); }
        else if (S.scene[y][x] !== ".") { held = { x, y, ch: S.scene[y][x], drag: true }; drawScene(); }
        return;
      }
      painting = true; put(x, y);
    };
    // малюємо, лише поки кнопку справді затиснуто (e.buttons), — інакше пензель «прилипав» після відпускання
    c.onpointerenter = e => { if (tool === "move") return; if (painting && (e.buttons & 1) && tool !== "P") put(+c.dataset.x, +c.dataset.y); else if (!(e.buttons & 1)) painting = false; };
  });
};
const put = (x, y) => {
  if (tool === "P") S.scene = S.scene.map(r => r.replace("P", "."));
  const row = S.scene[y].split(""); row[x] = tool; S.scene[y] = row.join("");
  if (!S.scene.join("").includes("P")) { const r0 = S.scene[0].split(""); r0[0] = "P"; S.scene[0] = r0.join(""); }
  save(); drawScene(); area.reset();
};
["pointerup", "pointercancel", "blur"].forEach(ev => window.addEventListener(ev, () => painting = false));
window.addEventListener("pointerup", e => {
  if (tool !== "move" || !held || !held.drag) return;
  held.drag = false; const d = document.elementFromPoint(e.clientX, e.clientY);
  if (d && d.classList.contains("ac") && $("#scene").contains(d)) drop(+d.dataset.x, +d.dataset.y);
});
$("#scene").addEventListener("dragstart", e => e.preventDefault());
$("#clr").onclick = () => { S.scene = Array.from({ length: H }, (_, y) => (y === 0 ? "P" : ".") + ".".repeat(W - 1)); save(); drawScene(); area.reset(); };
const area = ARC.playArea($("#aplay"), () => S.scene, () => S.rules, () => {});
// редагуємо або граємо — одне поле на екрані, без дублікатів
$("#toplay").onclick = () => { $("#editbox").hidden = true; $("#playbox").hidden = false; area.reset(); $("#aplay [data-run]").click(); };
$("#toedit").onclick = () => { area.reset(); $("#playbox").hidden = true; $("#editbox").hidden = false; };
const mkRules = () => ARC.ruleEditor($("#arules"), S.rules, () => { save(); area.reset(); });
mkRules();
drawScene();
// ---- стрибалка ----
const lenInp = $("#rlen");
// змінюємо рядки на місці: редактор і гра дивляться на той самий масив (інакше нові шипи й блоки не потрапляли в гру)
const setLen = n => { S.level.forEach((r, i) => S.level[i] = (r + ".".repeat(n)).slice(0, n)); save(); };
lenInp.value = RUN.lenOf(S.level); $("#rlenv").textContent = lenInp.value;
const mkEd = () => RUN.editor($("#redit"), S.level, () => { save(); rp.refresh(); $("#rres").textContent = ""; });
let ed = mkEd();
const rp = RUN.player($("#rplay"), () => S.level, () => {});
lenInp.oninput = () => { setLen(+lenInp.value); $("#rlenv").textContent = lenInp.value; ed.draw(); rp.refresh(); };
$("#rclr").onclick = () => { S.level = RUN.blank(RUN.lenOf(S.level)); save(); ed = mkEd(); rp.refresh(); };
$("#rck").onclick = () => { const r = RUN.solve(S.level); $("#rres").textContent = r.ok ? "✅ Так, рівень можна пройти!" : `❌ Ні — застрягаєш біля колонки ${r.col}.`; };
// ---- збереження в акаунт: по одній грі кожного виду ----
const clone = x => JSON.parse(JSON.stringify(x));
const when = t => { const d = new Date(t); return d.toLocaleDateString("uk-UA", { day: "numeric", month: "long" }) + " о " + d.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" }); };
const saved = k => { const sb = KV.profile().sandbox; return sb && sb[k] || null; };
const status = (k, text) => { const el = document.querySelector(`[data-st="${k}"]`); if (el) el.textContent = text; };
const showSaved = k => { const v = saved(k); status(k, !KV.session ? "Щоб зберегти гру в акаунт, увійди в Майстерні ігор (там, де рівні)." : v ? `Збережена гра: ${when(v.at)}.` : "Збереженої гри ще немає."); };
const store = k => {
  if (!KV.session) return showSaved(k);
  const v = saved(k);
  if (v && !confirmBox(k, "Замінити збережену гру новою?", () => store2(k))) return;
  store2(k);
};
const store2 = k => {
  const p = KV.profile(); p.sandbox = Object.assign({}, p.sandbox || {});
  p.sandbox[k] = Object.assign(k === "adv" ? { scene: clone(S.scene), rules: clone(S.rules) } : { level: clone(S.level) }, { at: Date.now(), title: titleOf(k) });
  KV.save("profile"); KV.scheduleSync(true);
  status(k, `💾 Збережено ${when(p.sandbox[k].at)}. Відкрити її можна з будь-якого комп'ютера після входу.`);
};
const open = k => {
  const v = saved(k);
  if (!v) return showSaved(k);
  confirmBox(k, "Відкрити збережену гру? Те, що зараз на екрані, заміниться.", () => {
    if (k === "adv") { S.scene = clone(v.scene); S.rules.splice(0, S.rules.length, ...clone(v.rules)); held = null; save(); drawScene(); mkRules(); area.reset(); $("#toedit").click(); }
    else { S.level = clone(v.level); save(); lenInp.value = RUN.lenOf(S.level); $("#rlenv").textContent = lenInp.value; ed = mkEd(); rp.refresh(); $("#rres").textContent = ""; }
    status(k, `📂 Відкрито гру від ${when(v.at)}.`);
  });
};
// підтвердження прямо в рядку (без вікон браузера)
function confirmBox(k, q, yes) {
  const el = document.querySelector(`[data-st="${k}"]`);
  el.innerHTML = `${q} <button class="btn small" data-yes>Так</button> <button class="btn ghost small" data-no>Ні</button>`;
  el.querySelector("[data-yes]").onclick = () => { el.textContent = ""; yes(); };
  el.querySelector("[data-no]").onclick = () => showSaved(k);
  return false;
}
// ---- публікація для інших і галерея ----
const titleOf = k => (document.querySelector(`[data-title="${k}"]`).value || "").trim().slice(0, 40);
const pst = (k, t) => document.querySelector(`[data-pst="${k}"]`).textContent = t;
["adv", "run"].forEach(k => { const v = saved(k); if (v && v.title) document.querySelector(`[data-title="${k}"]`).value = v.title; });
const ERR = { login: "Щоб публікувати, увійди в Майстерні ігор (там, де рівні).", net: "Немає зв'язку з сервером. Спробуй ще раз.", unknown_action: "Учителька ще не оновила скрипт таблиці — публікація запрацює після оновлення." };
const publish = async k => {
  if (!KV.session) return pst(k, ERR.login);
  if (!titleOf(k)) { pst(k, "Спершу придумай назву гри ✏️"); document.querySelector(`[data-title="${k}"]`).focus(); return; }
  if (k === "run" && !RUN.solve(S.level).ok) return pst(k, "Цей рівень неможливо пройти — виправ його, щоб іншим було цікаво. Перевір кнопкою «Чи можна пройти?».");
  if (k === "adv" && !S.scene.join("").includes("F") && !S.rules.some(r => r.a.some(a => a.k === "win"))) return pst(k, "У грі немає способу перемогти: додай 🏁 прапорець або правило «перемога».");
  pst(k, "Публікую…");
  store2(k);   // опублікована гра — це й твоя збережена гра
  const game = k === "adv" ? { scene: S.scene, rules: S.rules } : { level: S.level };
  const r = await KV.call("publish", { kind: k, title: titleOf(k), game });
  if (!r.ok) return pst(k, ERR[r.error] || "Не вдалося: " + r.error);
  pst(k, r.hidden ? "Гру оновлено, але вчителька поки сховала її з галереї." : "🌍 Опубліковано! Її видно у вкладці «Ігри інших». Нова публікація замінить цю.");
  galCache = null;
};
document.querySelectorAll("[data-pub]").forEach(b => b.onclick = () => publish(b.dataset.pub));
let galCache = null, gf = "all";
const KIND = { adv: "🐍 Пригодницька", run: "🟩 Стрибалка" };
const loadGallery = async force => {
  const box = $("#glist");
  if (!KV.session) { box.innerHTML = `<p class="muted">${ERR.login}</p>`; return; }
  if (!galCache || force) {
    box.innerHTML = `<p class="muted">Завантажую ігри…</p>`;
    const r = await KV.call("gallery");
    if (!r.ok) { box.innerHTML = `<p class="muted">${KV.esc(ERR[r.error] || "Не вдалося: " + r.error)}</p>`; return; }
    galCache = r.items || [];
  }
  const list = galCache.filter(x => gf === "all" || x.kind === gf);
  box.innerHTML = list.length ? list.map((x, i) => `<div class="gitem${x.mine ? " mine" : ""}"><div class="gk">${KIND[x.kind]}</div><b>${KV.esc(x.title)}</b>
    <div class="muted">🐍 ${KV.esc(x.snake)}${x.cls ? " · " + KV.esc(x.cls) : ""}${x.mine ? " · твоя гра" : ""}</div>
    <div class="arow"><button class="btn" data-gplay="${KV.esc(x.id)}">▶ Грати</button><button class="btn ghost" data-gcopy="${KV.esc(x.id)}">📥 Копія собі</button>${x.mine ? `<button class="btn ghost" data-gun="${x.kind}">Прибрати</button>` : ""}</div>
    <div class="muted gmsg" data-gmsg="${KV.esc(x.id)}"></div></div>`).join("") : `<p class="muted">Поки що тут порожньо. Стань першим — опублікуй свою гру!</p>`;
  const byId = id => galCache.find(x => x.id === id);
  box.querySelectorAll("[data-gplay]").forEach(b => b.onclick = () => playView(byId(b.dataset.gplay)));
  box.querySelectorAll("[data-gcopy]").forEach(b => b.onclick = () => copyMine(byId(b.dataset.gcopy)));
  box.querySelectorAll("[data-gun]").forEach(b => b.onclick = async () => { b.disabled = true; await KV.call("unpublish", { kind: b.dataset.gun }); loadGallery(true); });
};
document.querySelectorAll("[data-gf]").forEach(b => b.onclick = () => { gf = b.dataset.gf; document.querySelectorAll("[data-gf]").forEach(x => x.classList.toggle("on", x === b)); loadGallery(); });
$("#grefresh").onclick = () => loadGallery(true);
let viewer = null;
function closeView() { if (viewer && viewer.stop) viewer.stop(); viewer = null; $("#gview").hidden = true; $("#gvbox").innerHTML = ""; }
$("#gclose").onclick = closeView;
function playView(x) {
  if (!x) return; closeView();
  $("#gview").hidden = false; $("#gvtitle").textContent = `${KIND[x.kind]} «${x.title}» — 🐍 ${x.snake}`;
  const el = document.createElement("div"); $("#gvbox").appendChild(el);   // нове поле щоразу — старі клавіші не заважають
  if (x.kind === "run") viewer = RUN.player(el, () => x.game.level, () => {});
  else viewer = ARC.playArea(el, () => x.game.scene, () => x.game.rules, () => {});
  $("#gview").scrollIntoView({ behavior: "smooth", block: "start" });
}
function copyMine(x) {
  if (!x) return;
  const el = document.querySelector(`[data-gmsg="${x.id}"]`);
  el.innerHTML = `Замінити твою ${x.kind === "adv" ? "пригодницьку гру" : "стрибалку"} на екрані копією цієї? <button class="btn small" data-yes>Так</button> <button class="btn ghost small" data-no>Ні</button>`;
  el.querySelector("[data-no]").onclick = () => el.textContent = "";
  el.querySelector("[data-yes]").onclick = () => {
    if (x.kind === "adv") { S.scene = clone(x.game.scene); S.rules.splice(0, S.rules.length, ...clone(x.game.rules)); held = null; save(); drawScene(); mkRules(); area.reset(); }
    else { S.level = clone(x.game.level); save(); lenInp.value = RUN.lenOf(S.level); $("#rlenv").textContent = lenInp.value; ed = mkEd(); rp.refresh(); }
    el.textContent = "📥 Готово! Копія вже у вкладці «" + (x.kind === "adv" ? "Пригодницька гра" : "Стрибалка") + "». Твоя збережена в акаунті гра не змінилась.";
  };
}
document.querySelectorAll("[data-save]").forEach(b => b.onclick = () => store(b.dataset.save));
document.querySelectorAll("[data-open]").forEach(b => b.onclick = () => open(b.dataset.open));
showSaved("adv"); showSaved("run");
// свіжий профіль із таблиці — щоб збережене на іншому комп'ютері теж було видно
if (KV.session && KV.pull) KV.pull().then(() => { showSaved("adv"); showSaved("run"); });
})();
