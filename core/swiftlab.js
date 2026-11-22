/* SwiftUI-лабораторія: редактор + живий екран, перевірки практичних і тип завдання «swlab» */
(function () {
"use strict";
const S = window.SWIFTSIM;

// ---------- редактор ----------
function editor(ta, onChange) {
  if (window.CodeMirror) {
    const cm = CodeMirror.fromTextArea(ta, {
      mode: "swift", lineNumbers: true, indentUnit: 4, tabSize: 4, indentWithTabs: false, smartIndent: true,
      autoCloseBrackets: true, matchBrackets: true, viewportMargin: Infinity, inputStyle: "textarea", spellcheck: false, autocorrect: false,
      extraKeys: { Tab: c => c.somethingSelected() ? c.execCommand("indentMore") : c.execCommand("insertSoftTab"), "Shift-Tab": "indentLess" },
    });
    cm.on("change", () => onChange && onChange(cm.getValue()));
    return {
      get: () => cm.getValue(), set: v => cm.setValue(v), cm,
      mark(line) { cm.eachLine(l => cm.removeLineClass(l, "background", "sl-errline")); if (line) cm.addLineClass(line - 1, "background", "sl-errline"); },
      lock() { cm.setOption("readOnly", "nocursor"); }, refresh() { cm.refresh(); },
    };
  }
  ta.addEventListener("input", () => onChange && onChange(ta.value));
  ta.addEventListener("keydown", e => { if (e.key === "Tab") { e.preventDefault(); ta.setRangeText("    ", ta.selectionStart, ta.selectionEnd, "end"); onChange && onChange(ta.value); } });
  return { get: () => ta.value, set: v => { ta.value = v; }, mark() {}, lock() { ta.disabled = true; }, refresh() {} };
}

// живе оновлення екрана з невеликою паузою
function live(ed, sim, els) {
  let t = null;
  const out = (res) => {
    const e = sim.error;
    if (els.err) { els.err.hidden = !e; els.err.innerHTML = e ? `<b>Рядок ${e.line || "?"}</b> ${esc(e.message)}` : ""; }
    ed.mark(e ? e.line : 0);
  };
  const go = () => { sim.setSource(ed.get()); out(); };
  return { schedule() { clearTimeout(t); t = setTimeout(go, 350); }, now: go, out };
}

// ---------- перевірки ----------
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const probe = document.createElement("i");
function rgb(css) {
  if (!css) return null;
  if (S.COLORS[css]) css = S.COLORS[css];
  probe.style.color = ""; probe.style.color = css;
  document.body.appendChild(probe);
  const c = getComputedStyle(probe).color; probe.remove();
  const m = /rgba?\(([^)]+)\)/.exec(c); if (!m) return null;
  const p = m[1].split(",").map(x => parseFloat(x));
  return p;
}
const sameRGB = (a, b) => a && b && Math.abs(a[0] - b[0]) < 3 && Math.abs(a[1] - b[1]) < 3 && Math.abs(a[2] - b[2]) < 3 && (a[3] === undefined || a[3] > 0.01);
function textOf(el) {
  const t = el.dataset.sx;
  if (t === "Button" || t === "NavigationLink" || t === "Toggle" || t === "Stepper") return el.dataset.label || "";
  if (t === "Label") return el.dataset.text || "";
  if (t === "TextField") return el.dataset.placeholder || "";
  return el.textContent.trim();
}
function scaleOf(screen) { const r = screen.getBoundingClientRect(); return r.width / screen.offsetWidth || 1; }
function upTo(el, screen, f) { for (let e = el; e && e !== screen; e = e.parentElement) if (f(e)) return e; return null; }
// тло під елементом: у когось із предків, у шарі .background(…) або нижчим шаром у ZStack
function bgMatch(el, screen, want) {
  const w = rgb(want);
  const paints = k => sameRGB(rgb(getComputedStyle(k).backgroundColor), w);
  let prev = el;
  return !!upTo(el, screen, e => {
    if (paints(e)) return true;
    const lay = e.querySelector(":scope > .sx-layer.bg");
    if (lay) { for (const k of lay.querySelectorAll("*")) if (paints(k)) return true; }
    if (e.dataset.sx === "ZStack") {
      for (const k of e.children) { if (k === prev || k.contains(prev)) break; if (paints(k) || [...k.querySelectorAll(".sx-color, .sx-shape")].some(paints)) return true; }
    }
    prev = e;
    return false;
  });
}
// розмір шрифту: значок без власного .font бере розмір від батька
function fontPx(el) {
  if (el.classList.contains("sx-sym") && !el.style.fontSize && el.parentElement) return parseFloat(getComputedStyle(el.parentElement).fontSize);
  return parseFloat(getComputedStyle(el).fontSize);
}
function match(el, sel, screen) {
  if (sel.type && el.dataset.sx !== sel.type) return false;
  if (sel.text !== undefined) { const t = textOf(el); if (sel.text instanceof RegExp ? !sel.text.test(t) : t !== sel.text) return false; }
  if (sel.symbol && !(el.dataset.symbol === sel.symbol || (sel.symbol.endsWith("*") && (el.dataset.symbol || "").startsWith(sel.symbol.slice(0, -1))))) return false;
  const cs = getComputedStyle(el);
  if (sel.font) { const f = S.FONTS[sel.font]; if (!f || Math.abs(fontPx(el) - f[0]) > .5) return false; }
  if (sel.size && Math.abs(fontPx(el) - sel.size) > .5) return false;
  if (sel.minSize && fontPx(el) < sel.minSize) return false;
  if (sel.bold && parseInt(cs.fontWeight, 10) < 600) return false;
  if (sel.color && !sameRGB(rgb(cs.color), rgb(sel.color)) && !sameRGB(rgb(cs.backgroundColor), rgb(sel.color))) return false;
  if (sel.fill && !sameRGB(rgb(cs.backgroundColor), rgb(sel.fill)) && !sameRGB(rgb(cs.borderTopColor), rgb(sel.fill))) return false;
  if (sel.bg && !bgMatch(el, screen, sel.bg)) return false;
  if (sel.inside && !upTo(el.parentElement, screen, e => e.dataset.sx === sel.inside)) return false;
  if (sel.rounded && !upTo(el, screen, e => parseFloat(getComputedStyle(e).borderTopLeftRadius) > 0)) return false;
  if (sel.circle && !upTo(el, screen, e => e.dataset.clip === "Circle" || e.classList.contains("sx-circle"))) return false;
  if (sel.shadow && !upTo(el, screen, e => e.dataset.shadow)) return false;
  if (sel.on !== undefined && String(sel.on) !== el.dataset.on) return false;
  if (sel.style && !upTo(el, screen, e => e.classList.contains("bs-" + sel.style))) return false;
  if (sel.w || sel.h) { const k = scaleOf(screen), r = el.getBoundingClientRect(); if (sel.w && Math.abs(r.width / k - sel.w) > 3) return false; if (sel.h && Math.abs(r.height / k - sel.h) > 3) return false; }
  if (sel.wide) { const k = scaleOf(screen), r = el.getBoundingClientRect(); if (r.width / k < 300) return false; }
  if (sel.fn && !sel.fn(el)) return false;
  return true;
}
const findAll = (screen, sel) => [...screen.querySelectorAll("[data-sx]")].filter(e => match(e, sel, screen));

function evalChecks(sim, src, checks) {
  const screen = sim.screen, out = [];
  for (const c of checks) {
    let ok = true;
    if (c.code) ok = c.code.test(src.replace(/\/\/.*$/gm, ""));
    else if (c.nocode) ok = !c.nocode.test(src.replace(/\/\/.*$/gm, ""));
    else if (c.has) ok = findAll(screen, c.has).length >= (c.min || 1);
    else if (c.not) ok = findAll(screen, c.not).length === 0;
    else if (c.count) ok = findAll(screen, c.count[0]).length === c.count[1];
    else if (c.order) {
      const a = findAll(screen, c.order[0])[0], b = findAll(screen, c.order[1])[0];
      if (!a || !b) ok = false;
      else { const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(); ok = c.axis === "h" ? ra.left + ra.width / 2 < rb.left + rb.width / 2 - 1 : ra.top + ra.height / 2 < rb.top + rb.height / 2 - 1; }
    }
    else if (c.nav) { const t = screen.querySelector("[data-title]"); ok = !!t && (c.nav === true || t.dataset.title === c.nav); }
    else if (c.fn) ok = !!c.fn(screen, sim);
    else if (c.act) {
      // дії на свіжому екрані, потім вкладені перевірки
      sim.setSource(src);
      let fine = !sim.error, miss = "";
      const WHAT = { tap: "кнопку", type: "поле з підказкою", toggle: "перемикач", step: "Stepper" };
      for (const a of c.act) { if (!fine) break; fine = sim[a[0]](...a.slice(1)) && !sim.error; if (!fine && !sim.error) miss = `Не знайшла на екрані ${WHAT[a[0]] || "елемент"} «${a[1]}»`; }
      if (!fine) { out.push({ ok: false, msg: c.msg, why: sim.error ? `Під час натискання сталася помилка (рядок ${sim.error.line || "?"}): ${sim.error.message}` : miss }); sim.setSource(src); continue; }
      const sub = evalChecks(sim, src, c.then);
      ok = sub.every(r => r.ok);
      sim.setSource(src);
    }
    out.push({ ok, msg: c.msg });
  }
  return out;
}
// окремий прихований екран для перевірок
function checker() {
  let host = document.getElementById("sl-checkhost");
  if (!host) { host = document.createElement("div"); host.id = "sl-checkhost"; host.style.cssText = "position:fixed;left:-2000px;top:0;width:414px;pointer-events:none;opacity:0"; document.body.appendChild(host); }
  host.innerHTML = "<div></div>";
  return S.mount(host.firstChild, {});
}
function check(src, checks) {
  const sim = checker();
  const r = sim.setSource(src);
  if (!r.ok) return { error: sim.error, results: [] };
  const results = evalChecks(sim, src, checks);
  return { error: null, results };
}

// ---------- тип завдання для гри ----------
function rLab(it, A) {
  const st = A.st;
  if (st.code === undefined) st.code = it.starter || "";
  A.frame(it, `<div class="q">${A.md(it.q)}</div>
    <div class="sl-work lab">
      <div class="sl-code"><div class="sl-file">ContentView.swift</div><textarea id="sled"></textarea><div class="sl-err" id="slerr" hidden></div><div class="sl-console" id="slcon" hidden><div class="sl-chead">Консоль (print)</div><pre id="slconlog"></pre></div></div>
      <div class="sl-prev"><div class="sl-tabs"><button class="ltab on" data-v="mine">Твій екран</button>${it.solution && !it.noTarget ? `<button class="ltab" data-v="goal">🎯 Як має бути</button>` : ""}</div>
        <div id="slmine"></div><div id="slgoal" hidden></div><p class="muted sl-note" id="slnote"></p></div>
    </div>
    <div id="hintbox"></div><div class="tests" id="tests"></div>`);
  const con = A.$("#slcon"), conlog = A.$("#slconlog");
  const sim = S.mount(A.$("#slmine"), { maxHeight: 560, onLog: s => { con.hidden = false; conlog.textContent += s + "\n"; }, onReset: () => { conlog.textContent = ""; con.hidden = true; } });
  let lv;
  const ed = editor(A.$("#sled"), v => { st.code = v; if (lv) lv.schedule(); });
  ed.set(st.code);
  lv = live(ed, sim, { err: A.$("#slerr") });
  lv.now();
  let goal = null;
  document.querySelectorAll(".sl-tabs .ltab").forEach(b => b.onclick = () => {
    document.querySelectorAll(".sl-tabs .ltab").forEach(x => x.classList.toggle("on", x === b));
    const g = b.dataset.v === "goal";
    A.$("#slmine").hidden = g; A.$("#slgoal").hidden = !g;
    A.$("#slnote").textContent = g ? "Це екран, який треба отримати. Він живий — можна натискати." : "";
    if (g && !goal) { goal = S.mount(A.$("#slgoal"), { maxHeight: 560 }); goal.setSource(it.solution); }
  });
  st.fails = st.fails || 0;
  const acts = () => A.setActs(`<button class="link" id="hn">Підказка</button>${st.fails >= 2 && it.solution ? `<button class="link" id="sol">Показати розв'язок (−2 сегменти)</button>` : ""}<span class="spacer"></span><button class="btn" id="ck">Перевірити</button>`, {
    hn: () => { A.$("#hintbox").innerHTML = `<div class="hint">${A.md(it.hint || "Порівняй свій екран із вкладкою «🎯 Як має бути».")}</div>`; },
    sol: () => { A.lose(2); A.frame0Hearts(); ed.lock(); A.feedback(false, "Розв'язок", "Розбери його і спробуй написати сам наступного разу.", A.pre(it.solution)); A.nextBtn(); },
    ck: run,
  });
  function run() {
    const src = ed.get();
    const r = check(src, it.checks || []);
    if (r.error) {
      A.$("#tests").innerHTML = `<div class="test fail"><div class="head">✗ Код не запускається</div><div>Рядок ${r.error.line || "?"}: ${esc(r.error.message)}</div></div>`;
      st.fails++; acts(); return;
    }
    const all = r.results.every(x => x.ok);
    A.$("#tests").innerHTML = r.results.map(x => `<div class="test ${x.ok ? "ok" : "fail"}"><div class="head">${x.ok ? "✓" : "✗"} ${esc(x.msg)}</div>${!x.ok && x.why ? `<div>${esc(x.why)}</div>` : ""}</div>`).join("");
    if (all) { ed.lock(); A.feedback(true, A.praise(), it.done || "Екран зроблено правильно.", ""); A.nextBtn(); }
    else { st.fails++; acts(); }
  }
  acts();
}

window.SWLAB = { editor, live, check, evalChecks, findAll };
window.GAME_TYPES = Object.assign(window.GAME_TYPES || {}, { swlab: rLab });
})();
