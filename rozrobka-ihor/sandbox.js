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
  $("#adv").hidden = b.dataset.tab !== "adv"; $("#run").hidden = b.dataset.tab !== "run";
  if (b.dataset.tab === "run") rp.refresh(); else area.reset();
});
// ---- пригодницька гра ----
const tiles = [[".", "Порожньо"], ["#", "Стіна"], ["P", "🐍 Гравець"], ["c", "🪙 Монетка"], ["e", "👾 Ворог ↔"], ["v", "👻 Ворог ↕"], ["h", "❤️ Сердечко"], ["F", "🏁 Прапорець"]];
let tool = "#";
$("#tiles").innerHTML = tiles.map(([k, n]) => `<button data-k="${k}" class="${k === tool ? "on" : ""}">${n}</button>`).join("");
$("#tiles").querySelectorAll("button").forEach(b => b.onclick = () => { tool = b.dataset.k; $("#tiles").querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); });
let painting = false;
const drawScene = () => {
  const st = $("#scene"); st.style.gridTemplateColumns = `repeat(${W}, minmax(0, 1fr))`;
  st.innerHTML = S.scene.map((row, y) => row.split("").map((ch, x) => `<div class="ac${ch === "#" ? " wall" : ""}" data-x="${x}" data-y="${y}">${ch === "#" || ch === "." ? "" : ARC.TILES[ch].icon}</div>`).join("")).join("");
  st.querySelectorAll(".ac").forEach(c => {
    c.onpointerdown = e => { e.preventDefault(); painting = true; put(+c.dataset.x, +c.dataset.y); };
    // малюємо, лише поки кнопку справді затиснуто (e.buttons), — інакше пензель «прилипав» після відпускання
    c.onpointerenter = e => { if (painting && (e.buttons & 1) && tool !== "P") put(+c.dataset.x, +c.dataset.y); else if (!(e.buttons & 1)) painting = false; };
  });
};
const put = (x, y) => {
  if (tool === "P") S.scene = S.scene.map(r => r.replace("P", "."));
  const row = S.scene[y].split(""); row[x] = tool; S.scene[y] = row.join("");
  if (!S.scene.join("").includes("P")) { const r0 = S.scene[0].split(""); r0[0] = "P"; S.scene[0] = r0.join(""); }
  save(); drawScene(); area.reset();
};
["pointerup", "pointercancel", "blur"].forEach(ev => window.addEventListener(ev, () => painting = false));
$("#scene").addEventListener("dragstart", e => e.preventDefault());
$("#clr").onclick = () => { S.scene = Array.from({ length: H }, (_, y) => (y === 0 ? "P" : ".") + ".".repeat(W - 1)); save(); drawScene(); area.reset(); };
const area = ARC.playArea($("#aplay"), () => S.scene, () => S.rules, () => {});
// редагуємо або граємо — одне поле на екрані, без дублікатів
$("#toplay").onclick = () => { $("#editbox").hidden = true; $("#playbox").hidden = false; area.reset(); $("#aplay [data-run]").click(); };
$("#toedit").onclick = () => { area.reset(); $("#playbox").hidden = true; $("#editbox").hidden = false; };
ARC.ruleEditor($("#arules"), S.rules, () => { save(); area.reset(); });
drawScene();
// ---- стрибалка ----
const lenInp = $("#rlen");
const setLen = n => { S.level = S.level.map(r => (r + ".".repeat(n)).slice(0, n)); save(); };
lenInp.value = RUN.lenOf(S.level); $("#rlenv").textContent = lenInp.value;
let ed = RUN.editor($("#redit"), S.level, () => { save(); rp.refresh(); $("#rres").textContent = ""; });
const rp = RUN.player($("#rplay"), () => S.level, () => {});
lenInp.oninput = () => { setLen(+lenInp.value); $("#rlenv").textContent = lenInp.value; ed.draw(); rp.refresh(); };
$("#rclr").onclick = () => { S.level = RUN.blank(RUN.lenOf(S.level)); save(); ed = RUN.editor($("#redit"), S.level, () => { save(); rp.refresh(); }); rp.refresh(); };
$("#rck").onclick = () => { const r = RUN.solve(S.level); $("#rres").textContent = r.ok ? "✅ Так, рівень можна пройти!" : `❌ Ні — застрягаєш біля колонки ${r.col}.`; };
})();
