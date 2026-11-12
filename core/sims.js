/* Тренажери для ігор без Python: гарячі клавіші, сортування файлів за розширенням, імітація Провідника.
   Підключається перед game.js; рушій викликає GAME_TYPES[t](it, api). */
(function () {
"use strict";
window.GAME_TYPE_LABELS = Object.assign(window.GAME_TYPE_LABELS || {}, { keys: "Натисни клавіші", sort: "Розклади файли", explorer: "Провідник" });
const T = window.GAME_TYPES = window.GAME_TYPES || {};
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// ---------- спільне: значок файлу за розширенням ----------
const KIND = {
  docx: "doc", doc: "doc", txt: "doc", pdf: "pdf", pptx: "ppt", xlsx: "xls",
  jpg: "img", jpeg: "img", png: "img", gif: "img", bmp: "img",
  mp3: "snd", wav: "snd", mp4: "vid", avi: "vid", exe: "exe", zip: "zip", rar: "zip", lnk: "lnk",
};
const APP = { doc: "Word", pdf: "переглядачі PDF", ppt: "PowerPoint", xls: "Excel", img: "Фотографіях", snd: "аудіопрогравачі", vid: "відеопрогравачі", zip: "архіваторі", exe: "", lnk: "" };
const extOf = n => { const i = n.lastIndexOf("."); return i > 0 ? n.slice(i + 1).toLowerCase() : ""; };
const icon = (n, dir) => dir ? `<span class="fi dir" aria-hidden="true"></span>`
  : `<span class="fi k-${KIND[extOf(n)] || "none"}" aria-hidden="true">${esc((extOf(n) || "?").slice(0, 4))}</span>`;
window.KVfileIcon = icon;

// слухач клавіатури живе, доки на екрані наш елемент
let ctl = null;
function listen(el, fn) {
  if (ctl) ctl.abort();
  ctl = new AbortController();
  const c = ctl;
  document.addEventListener("keydown", e => { if (!document.body.contains(el)) { c.abort(); return; } fn(e); }, { signal: c.signal, capture: true });
}

// =====================================================================
// 1. Гарячі клавіші: { t:"keys", q, keys:["Ctrl","C"], hint, phys, scene, why }
//    phys:false — комбінацію не можна натискати по-справжньому (Win, Alt+F4…), лише на екранній клавіатурі
// =====================================================================
const MODS = ["Ctrl", "Shift", "Alt", "Win"];
const KB = [
  ["Esc", "F1", "F2", "F4", "F5", "F11", "PrtSc", "Delete"],
  ["Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "Backspace"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Enter"],
  ["Shift", "Z", "X", "C", "V", "B", "N", "M"],
  ["Ctrl", "Win", "Alt", "Пробіл"],
];
const canon = arr => { const m = MODS.filter(k => arr.includes(k)); const r = arr.filter(k => !MODS.includes(k)).sort(); return m.concat(r).join(" + "); };
const kbd = arr => arr.map(k => `<kbd>${esc(k)}</kbd>`).join(" + ");
function fromEvent(e) {
  const c = e.code || "";
  let main = null;
  if (/^Key[A-Z]$/.test(c)) main = c.slice(3);
  else if (/^F\d{1,2}$/.test(c)) main = c;
  else main = { Delete: "Delete", Enter: "Enter", NumpadEnter: "Enter", Tab: "Tab", Escape: "Esc", Backspace: "Backspace", Space: "Пробіл", PrintScreen: "PrtSc" }[c] || null;
  if (!main) return null;
  const k = [];
  if (e.ctrlKey) k.push("Ctrl"); if (e.shiftKey) k.push("Shift"); if (e.altKey) k.push("Alt"); if (e.metaKey) k.push("Win");
  k.push(main); return k;
}
function scene(sc) {
  if (!sc) return "";
  if (sc.kind === "file") return `<div class="mini"><div class="mini-bar"><span>${esc(sc.path || "D:\\Школа")}</span></div>
    <div class="mini-body">${(sc.files || [sc.name]).map(n => `<div class="mini-row ${n === sc.name ? "sel" : ""}">${icon(n, !/\./.test(n))}<span>${esc(n)}</span></div>`).join("")}</div></div>`;
  if (sc.kind === "text") return `<div class="mini"><div class="mini-bar"><span>${esc(sc.title || "Документ — Word")}</span></div>
    <div class="mini-body doc">${sc.before ? esc(sc.before) : ""}<mark>${esc(sc.sel || "")}</mark>${sc.after ? esc(sc.after) : ""}</div></div>`;
  if (sc.kind === "windows") return `<div class="mini"><div class="mini-bar"><span>Робочий стіл</span></div>
    <div class="mini-body wins">${(sc.wins || []).map((w, i) => `<span class="win ${i === 0 ? "on" : ""}">${esc(w)}</span>`).join("")}</div></div>`;
  return "";
}
T.keys = (it, A) => {
  const phys = it.phys !== false;
  const want = canon(it.keys);
  let picked = [];
  A.frame(it, `<div class="q">${A.md(it.q)}</div>${scene(it.scene)}
    ${it.hint ? `<div class="keyhint">Натисни: ${kbd(it.keys)}</div>` : ""}
    <div class="answer-label">${phys ? "Натисни ці клавіші на справжній клавіатурі або клацни їх на екранній." : "Цю комбінацію <b>не натискай</b> на справжній клавіатурі: просто клацни клавіші на екранній, а потім «Перевірити»."}</div>
    <div class="vkb" id="vkb">${KB.map(r => `<div class="vrow">${r.map(k => `<button class="vk ${k.length > 2 ? "wide" : ""} ${k === "Пробіл" ? "space" : ""}" data-k="${esc(k)}">${esc(k)}</button>`).join("")}</div>`).join("")}</div>
    <div class="combo" id="combo">&nbsp;</div>`);
  const box = A.$("#vkb");
  const draw = () => {
    box.querySelectorAll(".vk").forEach(b => b.classList.toggle("on", picked.includes(b.dataset.k)));
    A.$("#combo").innerHTML = picked.length ? kbd(MODS.filter(k => picked.includes(k)).concat(picked.filter(k => !MODS.includes(k)))) : "&nbsp;";
  };
  let done = false;
  const judge = got => {
    if (done) return;
    const g = canon(got);
    if (g === want) {
      done = true; box.querySelectorAll(".vk").forEach(b => { b.disabled = true; b.classList.toggle("right", it.keys.includes(b.dataset.k)); });
      A.feedback(true, A.praise(), it.why); A.nextBtn(); return;
    }
    A.st.tries = (A.st.tries || 0) + 1;
    if (A.st.tries === 1) { A.lose(); A.frame0Hearts(); }
    if (A.st.tries >= 2 || A.hearts <= 0) {
      done = true; box.querySelectorAll(".vk").forEach(b => { b.disabled = true; b.classList.toggle("right", it.keys.includes(b.dataset.k)); });
      A.feedback(false, "Не зовсім", it.why, `<p>Ти вибрала ${kbd(got)}. Правильно: ${kbd(it.keys)}.</p>`); A.nextBtn(); return;
    }
    A.feedback(false, "Спробуй ще раз", `Це було ${got.join(" + ")}. ${it.hint ? "Подивись на підказку вгорі." : "Подумай, яка літера чи клавіша відповідає цій дії."}`);
    picked = []; draw();
  };
  box.querySelectorAll(".vk").forEach(b => b.onclick = () => {
    const k = b.dataset.k; picked = picked.includes(k) ? picked.filter(x => x !== k) : picked.concat([k]); draw();
  });
  A.setActs(`<button class="btn ghost" id="clr">Очистити</button><button class="btn" id="ck">Перевірити</button>`, {
    clr: () => { picked = []; draw(); },
    ck: () => { if (picked.length) judge(picked); },
  });
  if (phys) listen(box, e => {
    if (done) return;
    if (["Control", "Shift", "Alt", "Meta", "OS", "AltGraph", "CapsLock"].includes(e.key)) return;
    if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
    const k = fromEvent(e); if (!k) return;
    if (k.length === 1 && (k[0] === "Enter" || k[0] === "Tab") && document.activeElement && document.activeElement.tagName === "BUTTON" && !it.keys.includes(k[0])) return; // Enter на кнопці
    if (k[0] === "Esc" && !it.keys.includes("Esc")) return;
    e.preventDefault(); e.stopPropagation();
    picked = k; draw(); judge(k);
  });
};

// =====================================================================
// 2. Розклади файли: { t:"sort", q, bins:[{id,label}], files:[{name,bin}], why }
// =====================================================================
T.sort = (it, A) => {
  const files = it.files.map((f, i) => Object.assign({ i, placed: false }, f));
  let sel = null, wrong = 0;
  A.frame(it, `<div class="q">${A.md(it.q)}</div>
    <div class="answer-label">Клацни на файл, а потім на кошик, куди його покласти.</div>
    <div class="pool" id="pool"></div>
    <div class="bins" id="bins">${it.bins.map(b => `<button class="bin" data-b="${esc(b.id)}"><span class="bin-t">${esc(b.label)}</span><span class="bin-in" data-in="${esc(b.id)}"></span></button>`).join("")}</div>
    <div id="sortmsg" class="status"></div>`);
  const draw = () => {
    A.$("#pool").innerHTML = files.filter(f => !f.placed).map(f => `<button class="fchip ${sel === f.i ? "on" : ""}" data-i="${f.i}">${icon(f.name)}<span>${esc(f.name)}</span></button>`).join("") || `<div class="empty">Усі файли розкладено</div>`;
    it.bins.forEach(b => { A.$(`.bin-in[data-in="${b.id}"]`).innerHTML = files.filter(f => f.placed && f.bin === b.id).map(f => `<span class="fchip small done">${icon(f.name)}<span>${esc(f.name)}</span></span>`).join(""); });
    A.$("#pool").querySelectorAll(".fchip").forEach(c => c.onclick = () => { sel = +c.dataset.i; draw(); });
  };
  A.$("#bins").querySelectorAll(".bin").forEach(b => b.onclick = () => {
    if (sel == null) { A.$("#sortmsg").textContent = "Спершу клацни на файл."; return; }
    const f = files[sel];
    if (f.bin === b.dataset.b) {
      f.placed = true; sel = null; A.$("#sortmsg").textContent = "";
      draw();
      if (files.every(x => x.placed)) { A.feedback(wrong === 0, wrong === 0 ? A.praise() : "Готово", it.why); A.nextBtn(); }
    } else {
      wrong++;
      if (wrong === 1) { A.lose(); A.frame0Hearts(); }
      const right = it.bins.find(x => x.id === f.bin);
      b.classList.add("shake"); setTimeout(() => b.classList.remove("shake"), 450);
      A.$("#sortmsg").innerHTML = `Ні: <b>${esc(f.name)}</b> має розширення <b>${esc(extOf(f.name))}</b>, тож це «${esc(right.label)}». Поклади туди.`;
    }
  });
  A.setActs("");
  draw();
};

// =====================================================================
// 3. Провідник: { t:"explorer", q, fs, start, goal(S)→bool, hint, why }
//    fs: [{ n:"D:", k:"disk", c:[{ n:"Школа", k:"dir", c:[…] }, { n:"вірш.docx", k:"file" }] }]
// =====================================================================
const BAD = /[\\/:*?"<>|]/;
const clone = x => JSON.parse(JSON.stringify(x));
const isDir = n => n.k !== "file";
const sortKids = a => a.slice().sort((x, y) => (isDir(y) - isDir(x)) || x.n.localeCompare(y.n, "uk"));
function makeState(it) {
  const root = { n: "Цей ПК", k: "pc", c: clone(it.fs) };
  const S = { root, cwd: [root], sel: null, clip: null, bin: clone(it.binItems || []).map(n => ({ node: n, from: ["D:"] })), inBin: false, opened: null };
  (it.start || []).forEach(name => { const cur = S.cwd[S.cwd.length - 1]; const nx = (cur.c || []).find(x => x.n === name); if (nx) S.cwd.push(nx); });
  return S;
}
// шлях у вигляді рядка: D:\Школа\5 клас
const pathOf = nodes => nodes.length <= 1 ? "Цей ПК" : nodes.slice(1).map(x => x.n).join("\\").replace(/^([A-Z]:)$/, "$1\\");
function findPath(S, p) {
  const parts = String(p).split("\\").filter(Boolean);
  let cur = S.root;
  for (const part of parts) { const nx = (cur.c || []).find(x => x.n.toLowerCase() === part.toLowerCase()); if (!nx) return null; cur = nx; }
  return cur;
}
function helpers(S) {
  return {
    get: p => findPath(S, p),
    has: p => !!findPath(S, p),
    dir: p => { const n = findPath(S, p); return !!n && isDir(n); },
    file: p => { const n = findPath(S, p); return !!n && n.k === "file"; },
    names: p => { const n = findPath(S, p); return n && n.c ? n.c.map(x => x.n) : []; },
    cwd: () => S.inBin ? "Кошик" : pathOf(S.cwd),
    inBin: name => S.bin.some(b => b.node.n.toLowerCase() === String(name).toLowerCase()),
    opened: () => S.opened,
  };
}
T.explorer = (it, A) => {
  let S = makeState(it);
  let renaming = null, menu = null, solved = false, errs = 0;
  A.frame(it, `<div class="q">${A.md(it.q)}</div>
    <div class="xp" id="xp" tabindex="0">
      <div class="xp-tools">
        <button class="xt" data-a="up" title="Вгору (Backspace)">↑ Вгору</button>
        <button class="xt" data-a="newdir" title="Створити папку">+ Нова папка</button>
        <button class="xt" data-a="rename" title="Перейменувати (F2)">Перейменувати</button>
        <button class="xt" data-a="copy" title="Копіювати (Ctrl + C)">Копіювати</button>
        <button class="xt" data-a="cut" title="Вирізати (Ctrl + X)">Вирізати</button>
        <button class="xt" data-a="paste" title="Вставити (Ctrl + V)">Вставити</button>
        <button class="xt" data-a="del" title="Видалити (Delete)">Видалити</button>
        <button class="xt" data-a="restore" title="Відновити з Кошика">Відновити</button>
      </div>
      <div class="xp-addr"><span class="xp-addr-l">Адреса</span><span id="addr"></span></div>
      <div class="xp-main">
        <div class="xp-side" id="side"></div>
        <div class="xp-list" id="list"></div>
      </div>
      <div class="xp-status" id="xst"></div>
    </div>
    <div class="status">Подвійний клік відкриває папку. Права кнопка миші відкриває меню. Працюють і клавіші: Ctrl + C, Ctrl + X, Ctrl + V, F2, Delete.</div>`);
  const xp = A.$("#xp");
  const cur = () => S.cwd[S.cwd.length - 1];
  const here = () => S.inBin ? S.bin.map(b => b.node) : sortKids(cur().c || []);
  const canWrite = () => !S.inBin && S.cwd.length > 1;
  const msg = (t, bad) => { const el = A.$("#xst"); el.innerHTML = t || ""; el.classList.toggle("bad", !!bad); };
  const oops = t => { msg(t, true); errs++; if (errs === 1) { A.lose(); A.frame0Hearts(); } };
  const side = () => {
    const disks = S.root.c.filter(d => d.k === "disk");
    A.$("#side").innerHTML = `<button class="xs ${!S.inBin && S.cwd.length === 1 ? "on" : ""}" data-s="pc">Цей ПК</button>` +
      disks.map(d => `<button class="xs ${!S.inBin && S.cwd[1] === d ? "on" : ""}" data-s="${esc(d.n)}">${esc(d.n)}</button>`).join("") +
      `<button class="xs ${S.inBin ? "on" : ""}" data-s="bin">Кошик${S.bin.length ? ` (${S.bin.length})` : ""}</button>`;
    A.$("#side").querySelectorAll(".xs").forEach(b => b.onclick = () => {
      closeMenu(); renaming = null; S.sel = null;
      const v = b.dataset.s;
      if (v === "bin") { S.inBin = true; } else { S.inBin = false; S.cwd = [S.root]; if (v !== "pc") S.cwd.push(S.root.c.find(d => d.n === v)); }
      draw();
    });
  };
  function draw() {
    side();
    A.$("#addr").textContent = S.inBin ? "Кошик" : pathOf(S.cwd);
    const items = here();
    const list = A.$("#list");
    list.innerHTML = items.length ? items.map((n, i) => {
      const cut = S.clip && S.clip.cut && S.clip.node === n;
      if (renaming === n) {
        return `<div class="xr sel" data-i="${i}">${icon(n.n, isDir(n))}<input id="ren" value="${esc(n.n)}" spellcheck="false" autocomplete="off"></div>`;
      }
      return `<button class="xr ${S.sel === n ? "sel" : ""} ${cut ? "cut" : ""}" data-i="${i}">${n.k === "disk" ? `<span class="fi disk" aria-hidden="true"></span>` : icon(n.n, isDir(n))}<span class="xn">${esc(n.n)}</span><span class="xk">${n.k === "disk" ? "Локальний диск" : isDir(n) ? "Папка" : (extOf(n.n) || "файл").toUpperCase()}</span></button>`;
    }).join("") : `<div class="empty">${S.inBin ? "Кошик порожній" : "Ця папка порожня"}</div>`;
    list.querySelectorAll(".xr[data-i]").forEach(r => {
      const n = items[+r.dataset.i];
      if (r.tagName === "BUTTON") {
        r.onclick = e => { e.stopPropagation(); closeMenu(); S.sel = n; draw(); xp.focus({ preventScroll: true }); };
        r.ondblclick = e => { e.stopPropagation(); open(n); };
        r.oncontextmenu = e => { e.preventDefault(); e.stopPropagation(); S.sel = n; draw(); showMenu(e, true); };
      }
    });
    list.onclick = () => { closeMenu(); if (S.sel) { S.sel = null; draw(); } };
    list.oncontextmenu = e => { e.preventDefault(); S.sel = null; draw(); showMenu(e, false); };
    xp.querySelectorAll(".xt").forEach(b => {
      const a = b.dataset.a;
      b.disabled = solved || (a === "up" && (S.inBin || S.cwd.length === 1)) || (a === "newdir" && !canWrite()) || (["rename", "copy", "cut", "del"].includes(a) && (!S.sel || S.inBin || S.sel.k === "disk")) ||
        (a === "paste" && (!S.clip || !canWrite())) || (a === "restore" && !(S.inBin && S.sel));
      b.hidden = a === "restore" && !S.inBin;
    });
    const ren = A.$("#ren");
    if (ren) {
      ren.focus();
      const v = ren.value, dot = v.lastIndexOf(".");
      ren.setSelectionRange(0, renaming.k === "file" && dot > 0 ? dot : v.length);
      ren.onkeydown = e => { e.stopPropagation(); if (e.key === "Enter") { e.preventDefault(); finishRename(ren.value); } if (e.key === "Escape") { e.preventDefault(); renaming = null; draw(); } };
      ren.onblur = () => { if (renaming) finishRename(ren.value); };
    }
    check();
  }
  function check() {
    if (solved || !it.goal) return;
    let ok = false; try { ok = !!it.goal(helpers(S)); } catch (e) { ok = false; }
    if (ok) {
      solved = true; closeMenu();
      xp.querySelectorAll(".xt").forEach(b => b.disabled = true);
      A.feedback(errs === 0, errs === 0 ? A.praise() : "Готово", it.why);
      A.nextBtn();
    }
  }
  function open(n) {
    if (solved) return;
    if (S.inBin) { msg("Файли в Кошику не відкриваються. Спершу віднови файл."); return; }
    if (isDir(n)) { S.cwd.push(n); S.sel = null; msg(""); draw(); return; }
    S.opened = pathOf(S.cwd.concat([n])).replace(/\\\\/g, "\\");
    const k = KIND[extOf(n.n)];
    msg(k === "exe" ? `Запущено програму ${esc(n.n)}.` : k && APP[k] ? `Файл ${esc(n.n)} відкрито в ${APP[k]}.` : `Windows не знає, якою програмою відкрити ${esc(n.n)}.`);
    draw();
  }
  function uniq(dirNode, name) {
    const names = (dirNode.c || []).map(x => x.n.toLowerCase());
    if (!names.includes(name.toLowerCase())) return name;
    const dot = name.lastIndexOf("."), base = dot > 0 ? name.slice(0, dot) : name, ext = dot > 0 ? name.slice(dot) : "";
    let k = 2, cand = `${base} — копія${ext}`;
    while (names.includes(cand.toLowerCase())) cand = `${base} — копія (${k++})${ext}`;
    return cand;
  }
  function finishRename(v) {
    const n = renaming; if (!n) return;
    v = v.trim();
    if (!v || v === n.n) { renaming = null; draw(); return; }
    if (BAD.test(v)) { renaming = null; draw(); oops(`Ім'я не може містити такі символи: \\ / : * ? " < > |`); return; }
    const parent = cur();
    if ((parent.c || []).some(x => x !== n && x.n.toLowerCase() === v.toLowerCase())) { renaming = null; draw(); oops(`У цій папці вже є «${esc(v)}». Вибери інше ім'я.`); return; }
    const oldExt = extOf(n.n);
    renaming = null; n.n = v;
    msg(n.k === "file" && oldExt && extOf(v) !== oldExt ? "Увага: ти змінила розширення. Windows може не відкрити такий файл." : "");
    draw();
  }
  function act(a) {
    if (solved) return;
    closeMenu();
    const s = S.sel;
    if (a === "up") { if (!S.inBin && S.cwd.length > 1) { S.cwd.pop(); S.sel = null; draw(); } return; }
    if (a === "open") { if (s) open(s); return; }
    if (a === "newdir") {
      if (!canWrite()) { msg("Тут не можна створювати папки. Відкрий диск або папку."); return; }
      const d = { n: uniq(cur(), "Нова папка").replace(" — копія", " (2)"), k: "dir", c: [] };
      cur().c.push(d); S.sel = d; renaming = d; msg(""); draw(); return;
    }
    if (a === "rename") { if (s && !S.inBin && s.k !== "disk") { renaming = s; draw(); } return; }
    if (a === "copy" || a === "cut") { if (s && !S.inBin && s.k !== "disk") { S.clip = { node: s, cut: a === "cut", from: cur() }; msg(a === "cut" ? `Вирізано: ${esc(s.n)}. Відкрий потрібну папку й встав.` : `Скопійовано: ${esc(s.n)}. Відкрий потрібну папку й встав.`); draw(); } return; }
    if (a === "paste") {
      if (!S.clip) return;
      if (!canWrite()) { msg("Сюди вставити не можна. Відкрий диск або папку."); return; }
      const target = cur(), { node, cut, from } = S.clip;
      if (S.cwd.includes(node)) { oops("Не можна вставити папку саму в себе."); return; }
      if (cut) {
        if (from === target) { S.clip = null; msg(""); draw(); return; }
        if ((target.c || []).some(x => x.n.toLowerCase() === node.n.toLowerCase())) { oops(`У цій папці вже є «${esc(node.n)}».`); return; }
        from.c = from.c.filter(x => x !== node); target.c.push(node); S.clip = null; S.sel = node; msg(`Переміщено: ${esc(node.n)}.`);
      } else {
        const cp = clone(node); cp.n = uniq(target, node.n); target.c.push(cp); S.sel = cp; msg(`Вставлено копію: ${esc(cp.n)}.`);
      }
      draw(); return;
    }
    if (a === "del") {
      if (!s || S.inBin || s.k === "disk") return;
      const parent = cur(); parent.c = parent.c.filter(x => x !== s);
      S.bin.push({ node: s, from: S.cwd.slice(1).map(x => x.n) });
      if (S.clip && S.clip.node === s) S.clip = null;
      S.sel = null; msg(`${esc(s.n)} переміщено в Кошик.`); draw(); return;
    }
    if (a === "restore") {
      if (!S.inBin || !s) return;
      const rec = S.bin.find(b => b.node === s);
      const parent = findPath(S, rec.from.join("\\"));
      if (!parent) { oops("Папки, з якої видалили файл, вже немає."); return; }
      parent.c.push(s); S.bin = S.bin.filter(b => b !== rec); S.sel = null; msg(`Відновлено: ${esc(s.n)} → ${esc(rec.from.join("\\"))}`); draw(); return;
    }
  }
  function closeMenu() { if (menu) { menu.remove(); menu = null; } }
  function showMenu(e, onItem) {
    closeMenu();
    if (solved) return;
    const opts = S.inBin ? (onItem ? [["restore", "Відновити"]] : [])
      : onItem ? [["open", "Відкрити"], ["cut", "Вирізати"], ["copy", "Копіювати"], ["rename", "Перейменувати"], ["del", "Видалити"]]
      : [["newdir", "Створити → Папку"], ["paste", "Вставити"]];
    if (!opts.length) return;
    menu = document.createElement("div"); menu.className = "ctx";
    menu.innerHTML = opts.map(([a, l]) => `<button data-a="${a}" ${a === "paste" && !S.clip ? "disabled" : ""} ${a === "newdir" && !canWrite() ? "disabled" : ""}>${l}</button>`).join("");
    xp.appendChild(menu);
    const r = xp.getBoundingClientRect();
    menu.style.left = Math.min(e.clientX - r.left, r.width - 190) + "px"; menu.style.top = (e.clientY - r.top) + "px";
    menu.querySelectorAll("button").forEach(b => b.onclick = ev => { ev.stopPropagation(); act(b.dataset.a); });
  }
  xp.querySelectorAll(".xt").forEach(b => b.onclick = () => act(b.dataset.a));
  listen(xp, e => {
    if (solved || renaming) return;
    if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
    const k = fromEvent(e); if (!k) return;
    const c = k.join("+");
    const map = { "Ctrl+C": "copy", "Ctrl+X": "cut", "Ctrl+V": "paste", "F2": "rename", "Delete": "del", "Enter": "open", "Backspace": "up" };
    if (map[c]) {
      if (c === "Enter" && document.activeElement && document.activeElement.tagName === "BUTTON" && !xp.contains(document.activeElement)) return;
      e.preventDefault(); e.stopPropagation(); act(map[c]);
    }
  });
  A.setActs(`<button class="btn ghost" id="reset">Почати заново</button>`, { reset: () => { S = makeState(it); renaming = null; closeMenu(); msg(""); draw(); } });
  draw();
};
})();
