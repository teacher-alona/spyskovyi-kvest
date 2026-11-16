/* SwiftUI: макети екрана iPhone і завдання «Який вигляд?» */
(function () {
"use strict";
const C = { blue: "#007aff", red: "#ff3b30", orange: "#ff9500", yellow: "#ffcc00", green: "#34c759", mint: "#00c7be", teal: "#30b0c7",
  cyan: "#32ade6", indigo: "#5856d6", purple: "#af52de", pink: "#ff2d55", brown: "#a2845e", gray: "#8e8e93", black: "#000", white: "#fff", sec: "#8a8a8e" };
const st = o => o ? ` style="${o}"` : "";
// маленька мова для макетів: t — текст, s — символ, v/h/z — стеки, b — кнопка, box — рамка з оформленням
const SW = window.SW = {
  C,
  phone: (inner, bg) => `<div class="ph"${st(bg ? "background:" + bg : "")}><div class="ph-in">${inner}</div></div>`,
  t: (txt, css) => `<div class="m-t"${st(css)}>${txt}</div>`,
  s: (ch, css) => `<div class="m-s"${st(css)}>${ch}</div>`,
  v: (inner, css) => `<div class="m-v"${st(css)}>${inner}</div>`,
  h: (inner, css) => `<div class="m-h"${st(css)}>${inner}</div>`,
  z: (inner, css) => `<div class="m-z"${st(css)}>${inner}</div>`,
  box: (inner, css) => `<div class="m-box"${st(css)}>${inner}</div>`,
  b: (label, kind, css) => `<div class="m-btn ${kind || "auto"}"${st(css)}>${label}</div>`,
};

// «Який вигляд дасть код?» / «Який код дає цей екран?»
// it: { q, code?, screen?, options: [html | {code}], a, why }
function rLook(it, A) {
  const order = A.st.lookOrder || (A.st.lookOrder = KV.shuffle(it.options.map((_, i) => i)));
  const opt = o => typeof o === "string" ? `<div class="look-mock">${o}</div>` : A.pre(o.code);
  A.frame(it, `<div class="q">${A.md(it.q)}</div>${it.code ? A.pre(it.code) : ""}${it.screen ? `<div class="look-screen">${it.screen}</div>` : ""}
    <div class="looks ${typeof it.options[0] === "string" ? "mocks" : "codes"}">${order.map((i, k) => `<button class="opt look" data-i="${i}"><span class="look-n">${"АБВГ"[k]}</span>${opt(it.options[i])}</button>`).join("")}</div>`);
  A.$("#acts").innerHTML = "";
  document.querySelectorAll(".look").forEach(b => b.onclick = () => {
    const i = +b.dataset.i, ok = i === it.a;
    document.querySelectorAll(".look").forEach(o => { o.disabled = true; if (+o.dataset.i === it.a) o.classList.add("right"); });
    if (!ok) { b.classList.add("wrong"); A.lose(); }
    A.frame0Hearts();
    A.feedback(ok, ok ? A.praise() : "Не зовсім", it.why);
    A.nextBtn();
  });
}
window.GAME_TYPES = Object.assign(window.GAME_TYPES || {}, { look: rLook });
})();
