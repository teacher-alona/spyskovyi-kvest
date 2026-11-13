/* Портал: вхід один раз, далі список ігор для класу учня, змійка й гардероб. */
(function () {
"use strict";
const { esc, $ } = KV;
const app = KV.app();
const sum = o => Object.values(o || {}).reduce((a, b) => a + b, 0);
function renderHome() {
  const access = KV.access, p = KV.profile();
  const games = KV.GAMES.filter(g => !access || access.includes(g.id) || access.includes(g.title.toLowerCase()));
  const total = KV.totalStars(), maxAll = KV.GAMES.reduce((s, g) => s + g.max, 0);
  const first = (KV.session && KV.session.name || "").split(" ").slice(-1)[0];
  app.innerHTML = `
  <header class="hero hasboard">
    ${KV.whoami()}
    <div class="heromain">
    <div class="eyebrow">Python, цифрова грамотність і не тільки</div>
    <h1>ІТ-квести</h1>
    <p>${first ? `Привіт, ${esc(first)}! ` : ""}Вибери гру. Зірки з усіх ігор рахуються разом і відкривають нові скіни для змійки.</p>
    <div class="pet">
      ${KV.snakeSVG({ len: KV.N, cls: "big" })}
      <div class="petinfo">
        <div class="petname">${esc(p.name)}</div>
        <div class="score">★ <b>${total}</b> / ${maxAll} в усіх іграх</div>
        <div class="score">${KV.streakBadge()}</div>
        <button class="btn ghost small" id="wardrobe">Гардероб${(() => { const k = KV.openIds().length - 2; return k > 0 ? ` · ${k} відкрито` : ""; })()}</button>
      </div>
    </div>
    </div>
    <aside class="lboard" id="lb"><h2>Лідерборд</h2><div class="lbody status">Завантажую…</div></aside>
  </header>
  <div class="games">
    ${games.length ? games.map(g => {
      const d = KV.gameData(g.id), s = sum(d.stars), att = sum(d.attempts);
      return `<a class="game" href="${g.path}">
        <span class="gsub">${esc(g.sub)}</span>
        <h3>${esc(g.title)}</h3>
        <div class="gbar"><div style="width:${Math.round(s / g.max * 100)}%"></div></div>
        <span class="gstat">★ ${s} / ${g.max}${att ? ` · спроб: ${att}` : ""}${d.leaves ? ` · виходів з гри: ${d.leaves}` : ""}</span>
      </a>`;
    }).join("") : `<p class="empty-games">Для твого класу ігор поки немає.</p>`}
  </div>
  <div class="version">версія ${KV.VERSION}</div>`;
  KV.bindWhoami();
  $("#wardrobe").onclick = () => KV.renderWardrobe(renderHome, "До ігор");
  fillBoard();
}
// ---------- лідерборд ----------
let lbTab = null;
async function fillBoard() {
  const box = $("#lb"); if (!box) return;
  const r = await KV.leaders();
  if (!$("#lb")) return;
  const body = box.querySelector(".lbody");
  if (!r.ok) {
    body.textContent = r.error === "unknown_action" ? "Лідерборд з'явиться, щойно вчителька оновить скрипт таблиці." : "Лідерборд з'явиться, коли буде зв'язок з таблицею.";
    return;
  }
  const teacher = !!r.all;
  const tabs = teacher ? [["school", "Уся школа"], ...r.classes.map(c => ["c:" + c, c])] : [["cls", "Мій клас"], ["school", "Уся школа"]];
  if (!lbTab || !tabs.some(t => t[0] === lbTab)) lbTab = tabs[0][0];
  const list = lbTab === "cls" ? r.cls : lbTab === "school" ? (teacher ? r.all : r.school) : r.all.filter(x => x.cls === lbTab.slice(2));
  const medal = i => ["🥇", "🥈", "🥉"][i] || `<span class="lnum">${i + 1}</span>`;
  body.classList.remove("status");
  body.innerHTML = `<div class="ltabs">${tabs.map(([k, t]) => `<button class="ltab ${k === lbTab ? "on" : ""}" data-k="${esc(k)}">${esc(t)}</button>`).join("")}</div>
    ${list.length ? `<ol class="lrows">${list.map((x, i) => `<li class="${x.me ? "me" : ""}">
      <span class="lrank">${medal(i)}</span>
      ${KV.snakeSVG({ len: 2, skin: x.look.skin || "classic", acc: x.look.acc || "none", shape: x.look.shape || undefined, headType: x.look.head || undefined, cls: "lsn", crop: true })}
      <span class="lwho"><b>${esc(x.name)}${x.me ? " (ти)" : ""}</b>${x.snake ? `<small>${esc(x.snake)}${lbTab === "school" ? " · " + esc(x.cls) : ""}</small>` : lbTab === "school" ? `<small>${esc(x.cls)}</small>` : ""}</span>
      <span class="lstars">★ ${x.stars}${x.streak ? `<small>🔥 ${x.streak}</small>` : ""}</span></li>`).join("")}</ol>` : `<p class="status">Тут поки нікого немає.</p>`}`;
  body.querySelectorAll(".ltab").forEach(b => b.onclick = () => { lbTab = b.dataset.k; fillBoard(); });
}
KV.boot({ title: "ІТ-квести", eyebrow: "Python, цифрова грамотність і не тільки", onReady: renderHome, isIdle: () => !app.firstElementChild || !!app.querySelector(".hero") });
})();
