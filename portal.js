/* Портал: вхід один раз, далі список ігор для класу учня, змійка й гардероб. */
(function () {
"use strict";
const { esc, $ } = KV;
const app = KV.app();
const sum = o => Object.values(o || {}).reduce((a, b) => a + b, 0);
function renderHome() {
  document.body.classList.add("is-portal");
  const access = KV.access, p = KV.profile();
  const games = KV.GAMES.filter(g => !access || access.includes(g.id) || access.includes(g.title.toLowerCase()));
  // розділи, у яких учню доступна хоч одна гра; якщо розділ один — одразу показуємо його ігри
  const cats = KV.CATS.map(c => Object.assign({}, c, { list: c.games.map(id => games.find(g => g.id === id)).filter(Boolean) })).filter(c => c.list.length);
  const other = games.filter(g => !KV.CATS.some(c => c.id === g.cat));
  if (other.length) cats.push({ id: "other", title: "Інше", icon: "✨", list: other });
  const want = decodeURIComponent(location.hash.slice(1));
  const cat = cats.length === 1 ? cats[0] : cats.find(c => c.id === want) || null;
  const total = KV.totalStars(), maxAll = KV.GAMES.reduce((s, g) => s + g.max, 0);
  const first = (KV.session && KV.session.name || "").split(" ").slice(-1)[0];
  app.innerHTML = `
  <header class="hero hasboard">
    ${KV.whoami()}
    <div class="intro">
      <div class="eyebrow">Python, цифрова грамотність і не тільки</div>
      <h1>ІТ-квести</h1>
      <p>${first ? `Привіт, ${esc(first)}! ` : ""}Вибери розділ, а в ньому — гру. Зірки з усіх ігор рахуються разом і відкривають нові скіни для змійки.</p>
    </div>
    <section class="pcard" aria-label="Твоя змійка">
      ${KV.snakeSVG({ len: KV.N, cls: "big" })}
      <div class="petname">${esc(p.name)}</div>
      <div class="pstats">
        <div class="pstat"><b class="gold">★ ${total}</b><span>з ${maxAll} зірок</span></div>
        <div class="pstat">${KV.streakBadge(true)}</div>
        <div class="pstat"><b>${KV.bytesLeft()}</b><span>${KV.bytesWord(KV.bytesLeft())}</span></div>
      </div>
      <button class="btn ghost" id="wardrobe">Гардероб${(() => { const k = KV.openIds().length - 2; return k > 0 ? ` · ${k} ${k % 10 === 1 && k % 100 !== 11 ? "річ" : [2, 3, 4].includes(k % 10) && ![12, 13, 14].includes(k % 100) ? "речі" : "речей"}` : ""; })()}</button>
    </section>
    <aside class="lboard" id="lb"><h2>Лідерборд</h2><div class="lbody status">Завантажую…</div></aside>
  </header>
  ${cat ? `<div class="cathead">${cats.length > 1 ? `<a class="link" href="#">← Усі розділи</a>` : ""}<h2>${cat.icon} ${esc(cat.title)}</h2></div>` : ""}
  ${!cat && cats.length ? `<div class="games cats">${cats.map(c => {
      const s = c.list.reduce((a, g) => a + sum(KV.gameData(g.id).stars), 0), m = c.list.reduce((a, g) => a + g.max, 0);
      return `<a class="game cat" href="#${c.id}">
        <span class="caticon" aria-hidden="true">${c.icon}</span>
        <h3>${esc(c.title)}</h3>
        <span class="gsub">${c.list.length} ${c.list.length === 1 ? "гра" : c.list.length < 5 ? "гри" : "ігор"}</span>
        <div class="gbar"><div style="width:${m ? Math.round(s / m * 100) : 0}%"></div></div>
        <span class="gstat">★ ${s} / ${m}</span>
      </a>`; }).join("")}</div>` : ""}
  <div class="games"${cat || !cats.length ? "" : " hidden"}>
    ${(cat ? cat.list : games).length ? (cat ? cat.list : games).map(g => {
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
// «11 ІТ», «5IT» → «11», «5»: так вкладки займають менше місця
const shortCls = c => String(c).replace(/\s*(ІТ|IT|ИТ)\s*/gi, " ").trim() || String(c);
async function fillBoard() {
  const box = $("#lb"); if (!box) return;
  const r = await KV.leaders();
  if (!$("#lb")) return;
  const body = box.querySelector(".lbody");
  if (!r.ok) {
    body.textContent = r.error === "unknown_action" ? "Лідерборд з'явиться, щойно вчителька оновить скрипт таблиці." : "Лідерборд з'явиться, коли буде зв'язок з таблицею.";
    return;
  }
  // новий скрипт каже прямо, чи це вчитель; старий давав повний список (all) лише вчителю
  const teacher = r.teacher !== undefined ? !!r.teacher : !!r.all;
  const clsTabs = (r.classes || []).slice().sort((a, b) => (parseInt(a) || 99) - (parseInt(b) || 99) || a.localeCompare(b, "uk")).map(c => ["c:" + c, shortCls(c)]);
  // учень: вкладка свого класу вже є серед класів, тож окремої «Мій клас» не треба — просто відкриваємо його клас
  const mine = !teacher && ((r.cls || []).find(x => x.me) || (r.cls || [])[0] || {}).cls;
  // 🔥 — окрема вкладка: хто найдовше заходить день у день (серед усіх учнів)
  const tabs = teacher || clsTabs.some(t => t[0] === "c:" + mine) ? [["school", "Усі"], ["fire", "🔥"], ...clsTabs] : [["cls", "Мій клас"], ["school", "Усі"], ["fire", "🔥"], ...clsTabs];
  const fire = lbTab === "fire";
  if (!lbTab || !tabs.some(t => t[0] === lbTab)) lbTab = mine && tabs.some(t => t[0] === "c:" + mine) ? "c:" + mine : tabs[0][0];
  const all = r.all || r.school || [];
  const list = fire ? all.filter(x => x.streak > 0).sort((a, b) => b.streak - a.streak || b.stars - a.stars || a.name.localeCompare(b.name, "uk"))
    : (lbTab === "cls" ? r.cls : lbTab === "school" ? all : all.filter(x => x.cls === lbTab.slice(2))).slice().sort((a, b) => b.stars - a.stars || a.name.localeCompare(b.name, "uk"));
  const score = x => fire ? x.streak : x.stars;
  // однакова кількість зірок — однакове місце, а наступне йде по порядку без пропусків (1, 2, 2, 3…); у межах місця — за абеткою
  const rankOf = i => new Set(list.slice(0, i).map(score).filter(v => v > score(list[i]))).size;
  const medal = i => { const r = rankOf(i); return ["🥇", "🥈", "🥉"][r] || `<span class="lnum">${r + 1}</span>`; };
  body.classList.remove("status");
  body.innerHTML = `<div class="ltabs">${tabs.map(([k, t]) => `<button class="ltab ${k === lbTab ? "on" : ""}" data-k="${esc(k)}"${k === "fire" ? ` title="Серії: днів поспіль" aria-label="Серії днів поспіль"` : ""}>${esc(t)}</button>`).join("")}</div>
    ${fire ? `<p class="lnote">Хто найдовше проходить рівні день у день. Серія згасає, якщо пропустити день.</p>` : ""}
    ${list.length ? `<ol class="lrows">${list.map((x, i) => `<li class="${x.me ? "me" : ""}">
      <span class="lrank">${medal(i)}</span>
      ${KV.snakeSVG({ len: 2, skin: x.look.skin || "classic", acc: x.look.acc || "none", shape: x.look.shape || undefined, headType: x.look.head || undefined, cls: "lsn", crop: true })}
      <span class="lwho"><b>${esc(x.name)}${x.me ? " (ти)" : ""}</b>${x.snake ? `<small>${esc(x.snake)}${lbTab === "school" || fire ? " · " + esc(shortCls(x.cls)) : ""}</small>` : lbTab === "school" || fire ? `<small>${esc(shortCls(x.cls))}</small>` : ""}</span>
      <span class="lstars">${fire ? `🔥 ${x.streak}<small>${KV.daysWord(x.streak)}</small>` : `★ ${x.stars}${x.streak ? `<small>🔥 ${x.streak}</small>` : ""}`}</span></li>`).join("")}</ol>` : `<p class="status">${fire ? "Зараз ні в кого немає серії. Пройди рівень сьогодні — і будеш першим (-ою)!" : "Тут поки нікого немає."}</p>`}`;
  body.querySelectorAll(".ltab").forEach(b => b.onclick = () => { lbTab = b.dataset.k; fillBoard(); });
}
// перехід між розділами — без перезавантаження сторінки; працює й кнопка «назад» у браузері
window.addEventListener("hashchange", () => { if (app.querySelector(".hero")) { renderHome(); window.scrollTo(0, 0); } });
KV.boot({ title: "ІТ-квести", eyebrow: "Python, цифрова грамотність і не тільки", onReady: renderHome, isIdle: () => !app.firstElementChild || !!app.querySelector(".hero") });
})();
