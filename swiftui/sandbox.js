// SwiftUI-пісочниця: вільний редактор із живим екраном
(function () {
"use strict";
const $ = s => document.querySelector(s);
const KEY = "kv-swift-sandbox";
const load = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
const keep = v => { try { localStorage.setItem(KEY, v); } catch (e) {} };
const EX = window.SW_EXAMPLES;

const con = $("#con"), conlog = $("#conlog");
const sim = SWIFTSIM.mount($("#phone"), {
  maxHeight: Math.max(520, Math.min(window.innerHeight - 120, 760)),
  onLog: s => { con.hidden = false; conlog.textContent += s + "\n"; conlog.scrollTop = 1e9; },
  onReset: () => { conlog.textContent = ""; con.hidden = true; },
});
let lv;
const ed = SWLAB.editor($("#ed"), v => { keep(v); if (lv) lv.schedule(); });
ed.set(load() || EX[0][1]);
lv = SWLAB.live(ed, sim, { err: $("#err") });
lv.now();

$("#ex").innerHTML += EX.map((e, i) => `<option value="${i}">${e[0]}</option>`).join("");
$("#ex").onchange = () => {
  const i = $("#ex").value; if (i === "") return;
  ed.set(EX[i][1]); keep(EX[i][1]); lv.now(); $("#ex").value = "";
};
$("#restart").onclick = () => lv.now();
$("#fresh").onclick = () => { ed.set(EX[0][1]); keep(EX[0][1]); lv.now(); };

// збереження в акаунт: один файл
const st = t => $("#st").textContent = t;
const when = t => { const d = new Date(t); return d.toLocaleDateString("uk-UA", { day: "numeric", month: "long" }) + " о " + d.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" }); };
const saved = () => { const sb = KV.profile().sandbox; return sb && sb.swift || null; };
const show = () => { const v = saved(); st(!KV.session ? "Щоб зберегти код в акаунт, увійди на головній сторінці порталу." : v ? `Збережений код: ${when(v.at)}.` : "Збереженого коду ще немає."); };
$("#save").onclick = () => {
  if (!KV.session) return show();
  const p = KV.profile(); p.sandbox = Object.assign({}, p.sandbox || {});
  p.sandbox.swift = { at: Date.now(), code: ed.get().slice(0, 20000) };
  KV.save("profile"); KV.scheduleSync(true);
  st(`💾 Збережено ${when(p.sandbox.swift.at)}. Відкрити можна з будь-якого комп'ютера після входу.`);
};
$("#open").onclick = () => { const v = saved(); if (!v) return show(); ed.set(v.code); keep(v.code); lv.now(); st(`📂 Відкрито код від ${when(v.at)}.`); };
show();
if (KV.session && KV.pull) KV.pull().then(show);
})();
