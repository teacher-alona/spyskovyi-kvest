/* Робототехніка: плата Arduino Uno R3, підключення елементів дротами, блокова програма.
   Типи завдань для рушія (GAME_TYPES):
   - board:  { t:"board", q, target:"usb" | "pin:GND" | "group:digital", why }   — клацнути на частину плати
   - wire:   { t:"wire", q, el:"led", why }                                       — під'єднати ніжки елемента до пінів
   - blocks: { t:"blocks", q, setup:[...], loop:[...], extra:[...], code, why }   — скласти програму з блоків
   Підключається перед content.js і game.js. */
(function () {
"use strict";
window.GAME_TYPE_LABELS = Object.assign(window.GAME_TYPE_LABELS || {}, { board: "Знайди на платі", wire: "Підключи", blocks: "Склади програму" });
const T = window.GAME_TYPES = window.GAME_TYPES || {};
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const shuf = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// =====================================================================
// Плата Arduino Uno R3 (USB ліворуч, як на фото з усіх підручників)
// =====================================================================
const TOP = ["SCL", "SDA", "AREF", "GND", "13", "12", "~11", "~10", "~9", "8", null, "7", "~6", "~5", "4", "~3", "2", "TX→1", "RX←0"];
const BOT = ["IOREF", "RESET", "3.3V", "5V", "GND", "GND", "VIN", null, "A0", "A1", "A2", "A3", "A4", "A5"];
const PINS = {}; // id → {x, y, label, group, name}
(function buildPins() {
  let x = 150, gi = 0;
  TOP.forEach(l => { if (l == null) { x += 10; return; }
    const num = l.replace(/[^0-9]/g, ""), isD = /^(~?\d+|TX→1|RX←0)$/.test(l);
    const id = isD ? "D" + num : l === "GND" ? "GND" + (++gi) : l;
    PINS[id] = { x, y: 34, label: l, group: isD ? "digital" : l === "GND" ? "power" : "other", name: isD ? `цифровий пін ${num}` : l === "GND" ? "GND (мінус, «земля»)" : l };
    x += 15; });
  x = 205;
  BOT.forEach(l => { if (l == null) { x += 10; return; }
    const isA = /^A\d$/.test(l);
    const id = l === "GND" ? "GND" + (++gi) : l === "3.3V" ? "3V3" : l;
    PINS[id] = { x, y: 292, label: l, group: isA ? "analog" : "power", name: isA ? `аналоговий вхід ${l}` : l === "GND" ? "GND (мінус, «земля»)" : l === "5V" ? "5V (плюс 5 вольт)" : l === "3.3V" ? "3.3V (плюс 3,3 вольта)" : l };
    x += 15; });
})();
const pinMatches = (id, want) => want === "GND" ? /^GND\d$/.test(id) : id === want;
const pinName = id => (PINS[id] || {}).name || id;

const PARTS = {
  usb: { name: "USB-роз'єм", about: "через нього плату підключають до комп'ютера: він дає живлення і завантажує програму" },
  jack: { name: "роз'єм живлення", about: "сюди підключають блок живлення або батарейку на 7–12 вольт, коли плата працює без комп'ютера" },
  chip: { name: "мікроконтролер ATmega328P", about: "це «мозок» плати: він зберігає і виконує твою програму" },
  reset: { name: "кнопка RESET", about: "перезапускає програму з самого початку" },
  led13: { name: "світлодіод L", about: "вбудований світлодіод, з'єднаний з піном 13. Ним можна блимати без жодних деталей" },
  txrx: { name: "світлодіоди TX і RX", about: "блимають, коли плата передає (TX) або отримує (RX) дані, наприклад під час завантаження програми" },
  on: { name: "світлодіод ON", about: "світиться, коли на плату подано живлення" },
  crystal: { name: "кварцовий резонатор 16 МГц", about: "задає ритм: мікроконтролер виконує 16 мільйонів тактів за секунду" },
  regulator: { name: "стабілізатор напруги", about: "перетворює напругу з роз'єму живлення на рівні 5 вольт для плати" },
  "group:digital": { name: "цифрові піни 0–13", about: "можуть вмикати і вимикати (HIGH/LOW) або читати, натиснуто кнопку чи ні. Піни з ~ вміють ШІМ — «напівувімкнення»" },
  "group:analog": { name: "аналогові входи A0–A5", about: "читають напругу від 0 до 5 вольт як число від 0 до 1023 — для потенціометра, датчика світла тощо" },
  "group:power": { name: "піни живлення", about: "5V і 3.3V — плюс, GND — мінус («земля»), VIN — вхід напруги ззовні" },
};

function boardSVG(o) {
  o = o || {};
  const pin = (id, p) => {
    const lit = (o.hl || []).includes(id);
    return `<g class="pin ${lit ? "hl" : ""} ${o.used && o.used[id] ? "used" : ""}" data-pin="${id}">
      <rect class="hit" x="${p.x - 7}" y="${p.y - 10}" width="14" height="${p.y < 100 ? 34 : 34}" transform="translate(0 ${p.y < 100 ? -4 : -20})"/>
      <rect class="hole" x="${p.x - 4.5}" y="${p.y - 4.5}" width="9" height="9" rx="1.5"/></g>`;
  };
  const lbl = (p) => p.y < 100
    ? `<text class="plbl" transform="translate(${p.x + 2.8} 46) rotate(-90)" text-anchor="end">${esc(p.label)}</text>`
    : `<text class="plbl" transform="translate(${p.x + 2.8} 280) rotate(-90)" text-anchor="start">${esc(p.label)}</text>`;
  const part = (id, inner) => `<g class="part ${(o.hl || []).includes(id) ? "hl" : ""}" data-part="${id}">${inner}</g>`;
  return `
  <g class="board">
    <path d="M10 14 H432 L446 28 V300 L432 314 H10 Z" fill="#00878f" stroke="#006a70" stroke-width="2"/>
    <circle cx="60" cy="300" r="5" fill="#e9f3f3" opacity=".8"/><circle cx="420" cy="24" r="5" fill="#e9f3f3" opacity=".8"/><circle cx="420" cy="300" r="5" fill="#e9f3f3" opacity=".8"/>
    <text x="250" y="150" class="brand">UNO</text><text x="252" y="168" class="brand2">ARDUINO · R3</text>
    ${part("usb", `<rect x="0" y="62" width="62" height="54" rx="3" fill="#c9ced6" stroke="#8a919c" stroke-width="2"/><rect x="10" y="74" width="40" height="30" rx="2" fill="#9aa2ad"/>`)}
    ${part("jack", `<rect x="0" y="222" width="58" height="52" rx="4" fill="#1d1f23"/><circle cx="34" cy="248" r="12" fill="#3a3d44"/><circle cx="34" cy="248" r="4" fill="#9aa2ad"/>`)}
    ${part("reset", `<rect x="76" y="20" width="24" height="24" rx="3" fill="#d6d9de"/><circle cx="88" cy="32" r="7" fill="#c8102e"/>`)}
    ${part("regulator", `<rect x="76" y="236" width="26" height="22" rx="2" fill="#2b2d31"/><rect x="80" y="258" width="18" height="8" fill="#9aa2ad"/>`)}
    ${part("crystal", `<rect x="100" y="178" width="40" height="15" rx="7.5" fill="#d6d9de" stroke="#8a919c"/>`)}
    ${part("led13", `<rect x="182" y="68" width="16" height="9" rx="2" fill="${o.l13 ? "#ffd23d" : "#ffe9a8"}"/><text x="202" y="76" class="tiny">L</text>${o.l13 ? `<circle cx="190" cy="72.5" r="11" class="glow13"/>` : ""}`)}
    ${part("txrx", `<rect x="182" y="86" width="16" height="9" rx="2" fill="#ffe9a8"/><rect x="182" y="100" width="16" height="9" rx="2" fill="#ffe9a8"/><text x="202" y="94" class="tiny">TX</text><text x="202" y="108" class="tiny">RX</text>`)}
    ${part("on", `<rect x="360" y="92" width="16" height="9" rx="2" fill="#7cfc9a"/><text x="380" y="100" class="tiny">ON</text>`)}
    ${part("chip", `<rect x="230" y="206" width="180" height="42" rx="3" fill="#1d1f23"/>${Array.from({ length: 14 }, (_, k) => `<rect x="${236 + k * 12.5}" y="200" width="5" height="6" fill="#b8bec9"/><rect x="${236 + k * 12.5}" y="248" width="5" height="6" fill="#b8bec9"/>`).join("")}<text x="320" y="231" class="chiptxt">ATMEGA328P</text>`)}
    ${part("group:digital", `<rect x="${PINS.D13.x - 8}" y="25" width="${PINS.D0.x - PINS.D13.x + 16}" height="18" rx="2" fill="#1d1f23"/>`)}
    <rect x="${PINS.SCL.x - 8}" y="25" width="${PINS.GND1.x - PINS.SCL.x + 16}" height="18" rx="2" fill="#1d1f23"/>
    ${part("group:power", `<rect x="${PINS.IOREF.x - 8}" y="283" width="${PINS.VIN.x - PINS.IOREF.x + 16}" height="18" rx="2" fill="#1d1f23"/>`)}
    ${part("group:analog", `<rect x="${PINS.A0.x - 8}" y="283" width="${PINS.A5.x - PINS.A0.x + 16}" height="18" rx="2" fill="#1d1f23"/>`)}
    <text x="${(PINS.D7.x + PINS.D0.x) / 2}" y="66" class="hdr">DIGITAL (PWM ~)</text>
    <text x="${(PINS["3V3"].x + PINS.VIN.x) / 2}" y="262" class="hdr">POWER</text>
    <text x="${(PINS.A0.x + PINS.A5.x) / 2}" y="262" class="hdr">ANALOG IN</text>
    ${Object.values(PINS).map(lbl).join("")}
  </g>${o.wiresSVG || ""}<g class="pins">${Object.entries(PINS).map(([id, p]) => pin(id, p)).join("")}</g>`;
}

// =====================================================================
// Елементи: малюнок (праворуч від плати) і ніжки
// =====================================================================
const EX = 470; // ліва межа зони елемента
const EL = {
  led: { name: "світлодіод з резистором 220 Ом",
    pins: [{ id: "plus", label: "+ анод (довга ніжка)", ok: "D13", hint: "Плюс світлодіода йде на пін, яким ми керуємо в програмі — пін 13." },
           { id: "minus", label: "− катод (коротка)", ok: "GND", hint: "Мінус (коротка ніжка) завжди йде на GND." }],
    pic: on => `<g transform="translate(560 120)">${on ? `<circle r="40" class="glowled"/>` : ""}
      <path d="M-18 6 V-10 A18 18 0 0 1 18 -10 V6 Z" fill="${on ? "#ff3b30" : "#d9433a"}" opacity="${on ? 1 : .75}" stroke="#8a1a14" stroke-width="1.5"/>
      <rect x="-22" y="6" width="44" height="7" rx="2" fill="${on ? "#ff3b30" : "#c43a31"}" stroke="#8a1a14" stroke-width="1.2"/>
      <path d="M-7 13 V60 M8 13 V48" stroke="#9aa1ad" stroke-width="3"/>
      <rect x="-14" y="30" width="14" height="26" rx="5" fill="#e8d2a6" stroke="#a88a55"/><path d="M-14 36 h14 M-14 41 h14 M-14 47 h14" stroke="#c0392b" stroke-width="1.6"/>
      <text x="14" y="-26" class="ellbl">${on ? "Світиться!" : ""}</text></g>` },
  button: { name: "кнопка",
    pins: [{ id: "a", label: "ніжка 1", ok: "D2", hint: "Одна ніжка кнопки йде на цифровий пін 2 — його ми читатимемо." },
           { id: "b", label: "ніжка 2", ok: "GND", hint: "Друга ніжка — на GND. Коли кнопку натиснуто, пін 2 з'єднується з «землею»." }],
    pic: on => `<g transform="translate(560 110)"><rect x="-30" y="-30" width="60" height="60" rx="6" fill="#2b2d31"/>
      <circle r="${on ? 15 : 17}" fill="${on ? "#8a1a14" : "#c8102e"}" stroke="#5a0c08" stroke-width="2"/>
      <path d="M-24 30 v24 M24 30 v24" stroke="#9aa1ad" stroke-width="3"/>
      <text y="-42" class="ellbl" text-anchor="middle">${on ? "Натиснуто: пін 2 = LOW" : ""}</text></g>` },
  buzzer: { name: "зумер (пищалка)",
    pins: [{ id: "plus", label: "+ (довша ніжка)", ok: "D8", hint: "Плюс зумера — на цифровий пін 8, на нього ми подаватимемо ноти." },
           { id: "minus", label: "−", ok: "GND", hint: "Мінус — на GND." }],
    pic: on => `<g transform="translate(560 112)"><circle r="32" fill="#1d1f23" stroke="#000" stroke-width="2"/><circle r="5" fill="#000"/><text x="0" y="22" text-anchor="middle" class="ellbl w">+</text>
      <path d="M-8 32 v26 M8 32 v26" stroke="#9aa1ad" stroke-width="3"/>
      ${on ? `<g class="notes"><text x="36" y="-14">♪</text><text x="48" y="-34">♫</text><text x="22" y="-40">♪</text></g>` : ""}</g>` },
  pot: { name: "потенціометр (крутилка)",
    pins: [{ id: "l", label: "ліва ніжка", ok: "5V", hint: "Крайні ніжки — живлення: ліва на 5V." },
           { id: "m", label: "середня (повзунок)", ok: "A0", hint: "Середня ніжка дає змінну напругу — її читає аналоговий вхід A0." },
           { id: "r", label: "права ніжка", ok: "GND", hint: "Права крайня ніжка — на GND." }],
    pic: on => `<g transform="translate(560 108)"><rect x="-30" y="-26" width="60" height="52" rx="6" fill="#1f5fbf"/>
      <g class="${on ? "knob" : ""}"><circle r="17" fill="#d6d9de" stroke="#8a919c" stroke-width="2"/><path d="M0 0 V-15" stroke="#2b2d31" stroke-width="3" stroke-linecap="round"/></g>
      <path d="M-18 26 v30 M0 26 v30 M18 26 v30" stroke="#9aa1ad" stroke-width="3"/>
      <text y="-38" class="ellbl" text-anchor="middle">${on ? "A0 = 512" : ""}</text></g>` },
  ldr: { name: "модуль фоторезистора",
    pins: [{ id: "s", label: "S (сигнал)", ok: "A1", hint: "S — сигнал про яскравість, його читає аналоговий вхід A1." },
           { id: "plus", label: "+ (VCC)", ok: "5V", hint: "Плюс модуля — на 5V." },
           { id: "minus", label: "− (GND)", ok: "GND", hint: "Мінус — на GND." }],
    pic: on => `<g transform="translate(560 112)"><rect x="-34" y="-30" width="68" height="60" rx="4" fill="#c8102e"/>
      <circle cx="0" cy="-6" r="13" fill="#f2b33d" stroke="#a8741a" stroke-width="2"/><path d="M-8 -10 q4 -4 8 0 t8 0 M-8 -2 q4 -4 8 0 t8 0" stroke="#a8261f" stroke-width="1.6" fill="none"/>
      <path d="M-16 30 v26 M0 30 v26 M16 30 v26" stroke="#9aa1ad" stroke-width="3"/>
      ${on ? `<g class="sun"><circle cx="40" cy="-40" r="9" fill="#ffd23d"/><path d="M40 -56 v6 M40 -30 v6 M24 -40 h6 M50 -40 h6" stroke="#ffd23d" stroke-width="2.5"/></g><text x="-34" y="-40" class="ellbl">A1 = 780</text>` : ""}</g>` },
  servo: { name: "сервопривід (серво)",
    pins: [{ id: "brown", label: "коричневий дріт (GND)", ok: "GND", hint: "Коричневий (або чорний) дріт сервоприводу — це мінус, на GND." },
           { id: "red", label: "червоний дріт (+)", ok: "5V", hint: "Червоний — плюс живлення, на 5V." },
           { id: "orange", label: "помаранчевий (сигнал)", ok: "D9", hint: "Помаранчевий (або жовтий) — сигнал, на цифровий пін 9 з ~." }],
    pic: on => `<g transform="translate(560 112)"><rect x="-34" y="-22" width="68" height="44" rx="4" fill="#2b6cd4"/><circle cx="-12" cy="0" r="9" fill="#e9eef6"/>
      <g class="${on ? "arm" : ""}" style="transform-origin:-12px 0px"><rect x="-16" y="-36" width="8" height="40" rx="4" fill="#fff" stroke="#9aa1ad"/></g>
      <path d="M-8 22 v34 M0 22 v34 M8 22 v34" stroke-width="3" stroke="#7a4a20"/><path d="M0 22 v34" stroke="#d33" stroke-width="3"/><path d="M8 22 v34" stroke="#f08a24" stroke-width="3"/></g>` },
  sonar: { name: "ультразвуковий датчик HC-SR04",
    pins: [{ id: "vcc", label: "VCC (+)", ok: "5V", hint: "VCC — плюс живлення, на 5V." },
           { id: "trig", label: "Trig (посилає)", ok: "D7", hint: "Trig — «постріл» ультразвуком, на цифровий пін 7." },
           { id: "echo", label: "Echo (слухає)", ok: "D6", hint: "Echo — ловить відлуння, на цифровий пін 6." },
           { id: "gnd", label: "GND (−)", ok: "GND", hint: "GND — на GND." }],
    pic: on => `<g transform="translate(560 108)"><rect x="-50" y="-24" width="100" height="48" rx="4" fill="#1f5fbf"/>
      <circle cx="-25" cy="0" r="17" fill="#c9ced6" stroke="#8a919c" stroke-width="3"/><circle cx="25" cy="0" r="17" fill="#c9ced6" stroke="#8a919c" stroke-width="3"/>
      <text x="-25" y="4" text-anchor="middle" class="tiny d">T</text><text x="25" y="4" text-anchor="middle" class="tiny d">R</text>
      <path d="M-15 24 v32 M-5 24 v32 M5 24 v32 M15 24 v32" stroke="#9aa1ad" stroke-width="3"/>
      ${on ? `<g class="waves"><path d="M-40 -34 q15 -10 30 0" /><path d="M-46 -44 q21 -14 42 0"/><path d="M-52 -54 q27 -18 54 0"/></g><text x="40" y="-38" class="ellbl">25 см</text>` : ""}</g>` },
};
window.ROBO_EL = EL;

const termY = (k) => 232 + k * 24;
const WIRE_COL = { GND: "#1b1b1b", "5V": "#d33", "3V3": "#e8743b" };
const wireColor = (pinId, k) => /^GND/.test(pinId) ? WIRE_COL.GND : WIRE_COL[pinId] || ["#f2c230", "#2b9bd6", "#38b26b", "#a35bd6"][k % 4];

function sceneSVG(o) {
  const e = o.el ? EL[o.el] : null;
  const wires = e ? e.pins.map((p, k) => {
    const to = o.conn[p.id]; if (!to) return "";
    const a = { x: EX + 6, y: termY(k) }, b = PINS[to];
    const by = b.y < 100 ? b.y : b.y;
    const c1x = a.x - 60, c2x = b.x, c2y = b.y < 100 ? b.y - 40 : b.y + 40;
    return `<path class="wire" data-w="${p.id}" d="M${a.x} ${a.y} C${c1x} ${a.y} ${c2x + 30} ${c2y} ${b.x} ${by}" stroke="${wireColor(to, k)}"/>`;
  }).join("") : "";
  const terms = e ? e.pins.map((p, k) => `<g class="term ${o.sel === p.id ? "on" : ""} ${o.conn[p.id] ? "done" : ""}" data-term="${p.id}">
      <rect class="hit" x="${EX - 4}" y="${termY(k) - 11}" width="178" height="22"/>
      <circle cx="${EX + 6}" cy="${termY(k)}" r="6"/><text x="${EX + 18}" y="${termY(k) + 4}">${esc(p.label)}</text></g>`).join("") : "";
  const H = e ? Math.max(330, termY(e.pins.length - 1) + 20) : 330;
  const W = e ? 700 : 452;
  return `<svg class="robo" viewBox="${o.el ? -6 : -6} 0 ${W + 6} ${H}" role="img" aria-label="Плата Arduino Uno${e ? " і " + esc(e.name) : ""}">
    ${e ? `<g class="elpic">${e.pic(!!o.on)}</g><text x="${EX}" y="${termY(0) - 22}" class="elname">${esc(e.name)}</text>` : ""}
    ${boardSVG({ hl: o.hl, used: o.used, l13: o.l13, wiresSVG: `<g class="wires">${wires}</g>` })}
    ${terms}</svg>`;
}

// =====================================================================
// board: знайди частину плати
// =====================================================================
T.board = (it, A) => {
  let wrong = 0, done = false;
  const what = id => PARTS[id] ? PARTS[id] : null;
  const draw = hl => {
    A.$("#scene").innerHTML = sceneSVG({ hl: hl || [], conn: {} });
    A.$("#scene").querySelectorAll(".part, .pin").forEach(g => g.addEventListener("click", ev => { ev.stopPropagation(); pick(g); }));
  };
  A.frame(it, `<div class="q">${A.md(it.q)}</div><div class="answer-label">Клацни на потрібне місце на платі.</div><div class="scene" id="scene"></div><div id="bmsg" class="status"></div>`);
  draw();
  function hitsOf(g) {
    if (g.dataset.pin) { const id = g.dataset.pin, p = PINS[id]; return { hits: [id, "pin:" + (/^GND/.test(id) ? "GND" : id), "group:" + p.group], label: p.name, hl: [id] }; }
    const id = g.dataset.part; return { hits: [id], label: (PARTS[id] || {}).name || id, hl: [id] };
  }
  function pick(g) {
    if (done) return;
    const h = hitsOf(g);
    if (h.hits.includes(it.target)) {
      done = true; draw(h.hl);
      const info = what(it.target);
      A.feedback(wrong === 0, wrong === 0 ? A.praise() : "Знайшли!", (info ? `Це ${info.name}: ${info.about}. ` : `Це ${h.label}. `) + (it.why || ""));
      A.nextBtn(); return;
    }
    wrong++;
    if (wrong === 1) { A.lose(); A.frame0Hearts(); }
    if (wrong >= 2) {
      done = true;
      const hl = it.target.startsWith("pin:") ? Object.keys(PINS).filter(id => pinMatches(id, it.target.slice(4))) : [it.target];
      draw(hl);
      const t = what(it.target);
      A.feedback(false, "Ось де це", `Твій вибір: ${esc(h.label)}. Потрібне місце підсвічено. ${t ? `Це ${t.name}: ${t.about}. ` : ""}${it.why || ""}`);
      A.nextBtn(); return;
    }
    draw(h.hl);
    A.$("#bmsg").innerHTML = `Це ${esc(h.label)}, а треба інше. Спробуй ще раз.`;
  }
  A.setActs("");
};

// =====================================================================
// wire: під'єднай ніжки елемента до пінів плати
// =====================================================================
T.wire = (it, A) => {
  const e = EL[it.el];
  const conn = {}; let sel = null, selPin = null, tries = 0, done = false;
  A.frame(it, `<div class="q">${A.md(it.q)}</div>
    <div class="answer-label">Клацни на ніжку елемента праворуч, а потім на пін плати. Щоб прибрати дріт, клацни на нього.</div>
    <div class="scene" id="scene"></div><div id="wmsg" class="status"></div>`);
  const draw = (on) => {
    const used = {}; Object.values(conn).forEach(p => used[p] = true);
    A.$("#scene").innerHTML = sceneSVG({ el: it.el, conn, sel, used, hl: selPin ? [selPin] : [], on, l13: on && it.el === "led" });
    if (done) return;
    A.$("#scene").querySelectorAll(".term").forEach(g => g.onclick = () => { sel = g.dataset.term; if (selPin) { conn[sel] = selPin; sel = selPin = null; } draw(); });
    A.$("#scene").querySelectorAll(".pin").forEach(g => g.onclick = () => { const id = g.dataset.pin; if (sel) { conn[sel] = id; sel = null; } else selPin = selPin === id ? null : id; draw(); });
    A.$("#scene").querySelectorAll(".wire").forEach(w => w.onclick = () => { delete conn[w.dataset.w]; draw(); });
    A.$("#ck").disabled = !e.pins.every(p => conn[p.id]);
    A.$("#wmsg").textContent = sel ? `Тепер клацни на пін плати для «${e.pins.find(p => p.id === sel).label}».` : selPin ? `Тепер клацни на ніжку елемента для піна ${PINS[selPin].label}.` : "";
  };
  const check = () => {
    const bad = e.pins.find(p => !pinMatches(conn[p.id], p.ok));
    if (!bad) {
      done = true; draw(true); A.$("#wmsg").textContent = "";
      A.feedback(tries === 0, tries === 0 ? A.praise() + " Працює!" : "Працює!", it.why || "");
      A.nextBtn(); return;
    }
    tries++;
    if (tries === 1) { A.lose(); A.frame0Hearts(); }
    if (tries >= 2) {
      done = true; e.pins.forEach(p => conn[p.id] = p.ok === "GND" ? (Object.keys(PINS).find(id => /^GND/.test(id) && id === conn[p.id]) || "GND2") : p.ok);
      draw(true); A.$("#wmsg").textContent = "";
      A.feedback(false, "Ось як правильно", e.pins.map(p => `«${p.label}» → ${pinName(p.ok)}`).join("; ") + ". " + (it.why || ""));
      A.nextBtn(); return;
    }
    A.$("#wmsg").innerHTML = `Не працює. Перевір ніжку «${esc(bad.label)}»: ${esc(bad.hint)}`;
  };
  A.setActs(`<button class="btn" id="ck" disabled>Перевірити</button>`, { ck: check });
  draw();
};

// =====================================================================
// blocks: склади програму з блоків (з показом коду Arduino)
// =====================================================================
T.blocks = (it, A) => {
  const all = [...it.setup.map(t => ({ t, s: "setup" })), ...it.loop.map(t => ({ t, s: "loop" })), ...(it.extra || []).map(t => ({ t, s: "x" }))];
  const pool = shuf(all.map((b, i) => Object.assign({ i }, b)));
  const prog = { setup: [], loop: [] };
  let target = it.setup.length ? "setup" : "loop", tries = 0, done = false;
  A.frame(it, `<div class="q">${A.md(it.q)}</div>
    <div class="answer-label">Обери розділ, а потім клацай блоки по черзі. Клік по блоку в програмі повертає його назад.</div>
    <div class="bprog" id="bprog"></div>
    <div class="bpool" id="bpool"></div><div id="bmsg" class="status"></div><div id="bcode"></div>`);
  const used = () => new Set([...prog.setup, ...prog.loop]);
  const draw = () => {
    const u = used();
    const sec = (k, title) => `<div class="bsec ${target === k ? "on" : ""}" data-s="${k}"><div class="bhead">${title}</div>
      ${prog[k].map(i => `<button class="blk ${blkClass(all[i].t)}" data-out="${i}">${esc(all[i].t)}</button>`).join("") || `<div class="bempty">порожньо</div>`}</div>`;
    A.$("#bprog").innerHTML = (it.setup.length || (it.extra || []).length ? sec("setup", "Один раз на початку (setup)") : "") + sec("loop", "Повторювати завжди (loop)");
    A.$("#bpool").innerHTML = pool.filter(b => !u.has(b.i)).map(b => `<button class="blk ${blkClass(b.t)}" data-in="${b.i}">${esc(b.t)}</button>`).join("") || `<div class="bempty">Усі блоки в програмі</div>`;
    if (done) return;
    A.$("#bprog").querySelectorAll(".bsec").forEach(s => s.onclick = () => { target = s.dataset.s; draw(); });
    A.$("#bprog").querySelectorAll("[data-out]").forEach(b => b.onclick = ev => { ev.stopPropagation(); const i = +b.dataset.out; ["setup", "loop"].forEach(k => prog[k] = prog[k].filter(x => x !== i)); draw(); });
    A.$("#bpool").querySelectorAll("[data-in]").forEach(b => b.onclick = () => { prog[target].push(+b.dataset.in); draw(); });
  };
  const same = (k) => prog[k].length === it[k].length && prog[k].every((i, n) => all[i].t === it[k][n]);
  const showCode = () => { if (it.code) A.$("#bcode").innerHTML = `<div class="answer-label">Ця ж програма мовою Arduino:</div>${A.pre(it.code)}`; };
  const check = () => {
    if (same("setup") && same("loop")) { done = true; A.$("#bmsg").textContent = ""; draw(); showCode(); A.feedback(tries === 0, tries === 0 ? A.praise() : "Тепер правильно!", it.why || ""); A.nextBtn(); return; }
    tries++;
    if (tries === 1) { A.lose(); A.frame0Hearts(); }
    if (tries >= 2) {
      done = true;
      prog.setup = []; prog.loop = [];
      const take = (k) => it[k].forEach(t => { const i = all.findIndex((b, j) => b.t === t && !prog.setup.includes(j) && !prog.loop.includes(j)); prog[k].push(i); });
      take("setup"); take("loop");
      A.$("#bmsg").textContent = ""; draw(); showCode();
      A.feedback(false, "Ось правильна програма", it.why || ""); A.nextBtn(); return;
    }
    const wrongSetup = !same("setup");
    A.$("#bmsg").textContent = (it.extra || []).some(t => [...prog.setup, ...prog.loop].some(i => all[i].t === t)) ? "У програмі є зайвий блок. Перевір, чи всі блоки потрібні."
      : wrongSetup ? "Перевір розділ «Один раз на початку»." : "Перевір порядок у розділі «Повторювати завжди».";
  };
  A.setActs(`<button class="btn" id="ck">Перевірити</button>`, { ck: check });
  draw();
};
const blkClass = t => /^(чекати|пауза)/.test(t) ? "b-wait" : /^(зробити|підключити|запустити)/.test(t) ? "b-set" : /^(прочитати|виміряти|порахувати)/.test(t) ? "b-read" : /^(надрукувати)/.test(t) ? "b-print" : "b-act";
})();
