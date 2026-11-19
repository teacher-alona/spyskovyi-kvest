/* Графи: малюємо граф, генеруємо випадкові графи, алгоритми (BFS, DFS, Дейкстра) і завдання до них (10 клас) */
(function () {
"use strict";
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

// ---------- граф ----------
// g = { n, edges: [[a, b, w?], ...], directed, weighted, names? }
function adj(g) {
  const A = Array.from({ length: g.n }, () => []);
  g.edges.forEach(([a, b, w]) => { A[a].push([b, w || 1]); if (!g.directed && a !== b) A[b].push([a, w || 1]); });
  A.forEach(l => l.sort((x, y) => x[0] - y[0]));
  return A;
}
const nbrs = (g, v) => [...new Set(adj(g)[v].map(x => x[0]))];
function matrix(g) {
  const M = Array.from({ length: g.n }, () => Array(g.n).fill(0));
  g.edges.forEach(([a, b]) => { M[a][b] = 1; if (!g.directed) M[b][a] = 1; });
  return M;
}
function degree(g, v) {   // неорієнтований: петля дає 2
  return g.edges.reduce((s, [a, b]) => s + (a === v) + (b === v), 0);
}
const outDeg = (g, v) => g.edges.filter(e => e[0] === v).length;
const inDeg = (g, v) => g.edges.filter(e => e[1] === v).length;
function bfs(g, s) {   // сусідів беремо за зростанням номерів
  const seen = new Set([s]), order = [], q = [s];
  while (q.length) { const v = q.shift(); order.push(v); nbrs(g, v).forEach(u => { if (!seen.has(u)) { seen.add(u); q.push(u); } }); }
  return order;
}
function dfs(g, s) {
  const seen = new Set(), order = [];
  const go = v => { seen.add(v); order.push(v); nbrs(g, v).forEach(u => { if (!seen.has(u)) go(u); }); };
  go(s); return order;
}
function bfsDist(g, s) {
  const d = Array(g.n).fill(-1); d[s] = 0; const q = [s];
  while (q.length) { const v = q.shift(); nbrs(g, v).forEach(u => { if (d[u] < 0) { d[u] = d[v] + 1; q.push(u); } }); }
  return d;
}
function dijkstra(g, s) {
  const A = adj(g), d = Array(g.n).fill(Infinity), prev = Array(g.n).fill(-1), done = Array(g.n).fill(false), steps = [];
  d[s] = 0;
  for (;;) {
    let v = -1; for (let i = 0; i < g.n; i++) if (!done[i] && d[i] < Infinity && (v < 0 || d[i] < d[v])) v = i;
    if (v < 0) break; done[v] = true; steps.push(v);
    A[v].forEach(([u, w]) => { if (d[v] + w < d[u]) { d[u] = d[v] + w; prev[u] = v; } });
  }
  return { d, prev, steps };
}
function pathTo(prev, t) { const p = []; for (let v = t; v >= 0; v = prev[v]) p.unshift(v); return p; }

// випадковий зв'язний граф: спершу дерево, потім зайві ребра
function randGraph(o) {
  o = Object.assign({ n: 6, extra: 2, directed: false, weighted: false, wmin: 1, wmax: 9, loops: 0 }, o);
  const n = o.n, has = new Set(), edges = [];
  const key = (a, b) => o.directed ? a + ">" + b : Math.min(a, b) + "-" + Math.max(a, b);
  const add = (a, b) => { const k = key(a, b); if (a === b || has.has(k)) return false; has.add(k); edges.push([a, b]); return true; };
  const perm = shuffle([...Array(n).keys()]);
  for (let i = 1; i < n; i++) { const j = rnd(0, i - 1); o.directed && Math.random() < 0.5 ? add(perm[i], perm[j]) : add(perm[j], perm[i]); }
  let tries = 0; for (let k = 0; k < o.extra && tries < 200; tries++) if (add(rnd(0, n - 1), rnd(0, n - 1))) k++;
  for (let k = 0; k < o.loops; k++) { const v = rnd(0, n - 1); if (!has.has(v + "@")) { has.add(v + "@"); edges.push([v, v]); } }
  if (o.weighted) edges.forEach(e => e[2] = rnd(o.wmin, o.wmax));
  edges.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  return { n, edges, directed: o.directed, weighted: o.weighted };
}

// ---------- малюнок ----------
const W = 340, H = 300, R = 18;
function layout(n) {
  const cx = W / 2, cy = H / 2 + 4, rr = n <= 4 ? 90 : 108;
  return Array.from({ length: n }, (_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)]; });
}
// розставляємо вершини по колу так, щоб ребра якомога менше перетиналися (і ваги не налазили одна на одну)
function cross(p1, p2, p3, p4) {
  const d = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const d1 = d(p3, p4, p1), d2 = d(p3, p4, p2), d3 = d(p1, p2, p3), d4 = d(p1, p2, p4);
  return d1 * d2 < -1e-6 && d3 * d4 < -1e-6;
}
function nicePos(g) {
  const slots = layout(g.n), E = g.edges.filter(e => e[0] !== e[1]);
  let best = null, bestC = Infinity;
  for (let t = 0; t < 120 && bestC > 0; t++) {
    const perm = t === 0 ? [...Array(g.n).keys()] : shuffle([...Array(g.n).keys()]), P = perm.map(i => slots[i]);
    let c = 0;
    for (let i = 0; i < E.length; i++) for (let j = i + 1; j < E.length; j++) {
      const [a, b] = E[i], [x, y] = E[j];
      if (a === x || a === y || b === x || b === y) continue;
      if (cross(P[a], P[b], P[x], P[y])) c++;
    }
    if (c < bestC) { bestC = c; best = P; }
  }
  return best;
}
function svgOf(g, o) {
  o = o || {};
  if (!g.pos) g.pos = nicePos(g);
  const P = g.pos, out = [], labels = [], wl = [];
  // точки перетину ребер: підпис ваги туди не ставимо, щоб було видно, якому ребру він належить
  const X = [];
  if (g.weighted) { const E = g.edges.filter(e => e[0] !== e[1]); for (let i = 0; i < E.length; i++) for (let j = i + 1; j < E.length; j++) {
    const [a1, b1] = E[i], [a2, b2] = E[j]; if (a1 === a2 || a1 === b2 || b1 === a2 || b1 === b2 || !cross(P[a1], P[b1], P[a2], P[b2])) continue;
    const [x1, y1] = P[a1], [x2, y2] = P[b1], [x3, y3] = P[a2], [x4, y4] = P[b2], den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4), t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
    X.push([x1 + t * (x2 - x1), y1 + t * (y2 - y1)]); } }
  const pairs = new Set(g.edges.map(([a, b]) => a + ">" + b));
  const st = o.state || {};
  g.edges.forEach(([a, b, w], i) => {
    const cls = "ge" + (st.e && st.e[i] ? " " + st.e[i] : "");
    if (a === b) {   // петля — назовні від центру
      const [x, y] = P[a], dx = x - W / 2, dy = y - H / 2 - 4, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
      const cx = x + ux * (R + 12), cy = y + uy * (R + 12);
      out.push(`<circle class="${cls}" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="12"/>`);
      if (g.directed) out.push(`<path class="gah" d="M${(cx - uy * 12 - 4).toFixed(1)} ${(cy + ux * 12 - 3).toFixed(1)} l5 3 -5 3 z"/>`);
      if (g.weighted) out.push(wlabel(cx + ux * 18, cy + uy * 18, w));
      return;
    }
    const [x1, y1] = P[a], [x2, y2] = P[b], dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
    const both = g.directed && pairs.has(b + ">" + a);   // дві дуги навзустріч — розводимо дугою
    const bend = both ? 16 : 0, mx = (x1 + x2) / 2 - uy * bend, my = (y1 + y2) / 2 + ux * bend;
    const sx = x1 + ux * R, sy = y1 + uy * R, ex = x2 - ux * (R + (g.directed ? 3 : 0)), ey = y2 - uy * (R + (g.directed ? 3 : 0));
    out.push(`<path class="${cls}${g.directed ? " arr" : ""}" d="M${sx.toFixed(1)} ${sy.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}"/>`);
    if (g.weighted) {   // підпис ваги — там, де він не налазить на інші підписи
      const at = t => [(1 - t) * (1 - t) * x1 + 2 * t * (1 - t) * mx + t * t * x2, (1 - t) * (1 - t) * y1 + 2 * t * (1 - t) * my + t * t * y2];
      let pt = at(0.5);
      for (const t of [0.5, 0.36, 0.64, 0.28, 0.72, 0.22, 0.78]) { const c = at(t); if (labels.every(([a2, b2]) => Math.hypot(a2 - c[0], b2 - c[1]) > 22) && X.every(([a2, b2]) => Math.hypot(a2 - c[0], b2 - c[1]) > 18)) { pt = c; break; } }
      labels.push(pt); wl.push(wlabel(pt[0], pt[1], w));
    }
  });
  out.push(...wl);
  P.forEach(([x, y], v) => {
    const c = (st.v && st.v[v]) || "";
    out.push(`<g class="gv ${c}${o.click ? " can" : ""}" data-v="${v}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${R}"/><text x="${x.toFixed(1)}" y="${(y + 5).toFixed(1)}" text-anchor="middle">${esc(g.names ? g.names[v] : v)}</text>${st.tag && st.tag[v] != null ? `<text class="gtag" x="${(x + R + 2).toFixed(1)}" y="${(y - R + 4).toFixed(1)}">${esc(st.tag[v])}</text>` : ""}</g>`);
  });
  return `<svg class="graph" viewBox="0 0 ${W} ${H}" role="img" aria-label="Граф"><defs><marker id="garr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" class="gah"/></marker></defs>${out.join("")}</svg>`;
}
function wlabel(x, y, w) { return `<g class="gw"><rect x="${(x - 9).toFixed(1)}" y="${(y - 9).toFixed(1)}" width="18" height="16" rx="4"/><text x="${x.toFixed(1)}" y="${(y + 3.5).toFixed(1)}" text-anchor="middle">${w}</text></g>`; }
const matText = M => M.map(r => r.join(" ")).join("\n");
const edgesText = g => g.edges.map(e => e.slice(0, g.weighted ? 3 : 2).join(" ")).join("\n");
const pyList = A => "[" + A.map(x => Array.isArray(x) ? pyList(x) : x).join(", ") + "]";

window.GR = { adj, nbrs, matrix, degree, outDeg, inDeg, bfs, dfs, bfsDist, dijkstra, pathTo, randGraph, svgOf, matText, edgesText, pyList, rnd, shuffle, layout };

// ---------- типи завдань ----------
const T = {};
const box = g => `<div class="gbox">${svgOf(g)}</div>`;
// питання до графа з варіантами (варіант може бути текстом або іншим графом)
T.gq = (it, A) => {
  const order = A.st.order || (A.st.order = shuffle(it.options.map((_, i) => i)));
  const opt = o => typeof o === "object" && o.n ? `<div class="gmini">${svgOf(o)}</div>` : A.md(String(o));
  A.frame(it, `<div class="q">${A.md(it.q)}</div>${it.g ? box(it.g) : ""}${it.pre ? A.pre(it.pre) : ""}
    <div class="options${typeof it.options[0] === "object" ? " gopts" : ""}">${order.map(i => `<button class="opt" data-i="${i}">${opt(it.options[i])}</button>`).join("")}</div>`);
  A.setActs("");
  document.querySelectorAll(".opt").forEach(b => b.onclick = () => {
    const ok = +b.dataset.i === it.a;
    document.querySelectorAll(".opt").forEach(o => { o.disabled = true; if (+o.dataset.i === it.a) o.classList.add("right"); });
    if (!ok) { b.classList.add("wrong"); A.lose(); A.frame0Hearts(); }
    A.feedback(ok, ok ? A.praise() : "Не зовсім", it.why || "");
    A.nextBtn();
  });
};
// відповідь числом або словом
T.gnum = (it, A) => {
  A.frame(it, `<div class="q">${A.md(it.q)}</div>${it.g ? box(it.g) : ""}${it.pre ? A.pre(it.pre) : ""}
    <label class="answer-label" for="gans">Відповідь:</label><input id="gans" class="answer" autocomplete="off" spellcheck="false">`);
  const norm = s => String(s).trim().toLowerCase().replace(/[,;]+/g, " ").replace(/\s+/g, " ");
  const okOf = v => [it.a, ...(it.accept || [])].some(x => norm(x) === norm(v));
  let tries = 0;
  const check = () => {
    const v = A.$("#gans").value; if (!v.trim()) return;
    if (okOf(v)) { A.$("#gans").disabled = true; A.feedback(tries === 0, tries === 0 ? A.praise() : "Тепер правильно!", it.why || ""); A.nextBtn(); return; }
    tries++; if (tries === 1) { A.lose(); A.frame0Hearts(); }
    if (tries >= 2) { A.$("#gans").disabled = true; A.feedback(false, `Правильна відповідь: ${esc(it.a)}`, it.why || ""); A.nextBtn(); return; }
    A.feedback(false, "Не зовсім, спробуй ще раз", "");
  };
  A.setActs(`<button class="btn" id="ck">Перевірити</button>`, { ck: check });
  A.$("#gans").addEventListener("keydown", e => { if (e.key === "Enter") check(); });
  A.$("#gans").focus();
};
// клацати вершини по черзі (порядок обходу, шлях)
T.gorder = (it, A) => {
  let seq = [], tries = 0, done = false;
  A.frame(it, `<div class="q">${A.md(it.q)}</div><div class="gbox" id="gb"></div>
    <div class="gseq" id="gseq"></div>`);
  const accept = it.accept || [it.a];
  const draw = (cls) => {
    const v = {}; seq.forEach(x => v[x] = "on"); if (cls) Object.assign(v, cls);
    const tag = {}; seq.forEach((x, i) => tag[x] = i + 1);
    A.$("#gb").innerHTML = svgOf(it.g, { click: !done, state: { v, tag } });
    A.$("#gseq").innerHTML = seq.length ? `Твій порядок: <b>${seq.join(" → ")}</b>` : `<span class="muted">Клацай на вершини по черзі.</span>`;
    if (!done) A.$("#gb").querySelectorAll(".gv").forEach(n => n.onclick = () => {
      const x = +n.dataset.v;
      if (seq.includes(x)) { if (seq[seq.length - 1] === x) seq.pop(); } else if (seq.length < it.a.length) seq.push(x);
      draw();
    });
  };
  const check = () => {
    if (seq.length < it.a.length) { A.$("#gseq").innerHTML += ` <span class="muted">— ще не всі вершини.</span>`; return; }
    const ok = accept.some(a => a.join() === seq.join());
    if (ok) { done = true; draw(); A.feedback(tries === 0, tries === 0 ? A.praise() : "Тепер правильно!", it.why || ""); A.nextBtn(); return; }
    tries++; if (tries === 1) { A.lose(); A.frame0Hearts(); }
    if (tries >= 2) { done = true; seq = it.a.slice(); draw(); A.feedback(false, `Правильно так: ${it.a.join(" → ")}`, it.why || ""); A.nextBtn(); return; }
    const k = seq.findIndex((x, i) => x !== it.a[i]);
    A.feedback(false, `Перші ${k} вершин правильні, далі помилка. Спробуй ще раз.`, "");
    seq = seq.slice(0, k); draw();
  };
  A.setActs(`<button class="btn ghost" id="gclr">Почати спочатку</button><button class="btn" id="ck">Перевірити</button>`, { ck: check, gclr: () => { if (!done) { seq = []; draw(); } } });
  draw();
};
// заповнити матрицю суміжності: клітинка 0 ↔ 1
T.gmat = (it, A) => {
  const M = matrix(it.g), n = it.g.n, cur = Array.from({ length: n }, () => Array(n).fill(0));
  let tries = 0, done = false;
  A.frame(it, `<div class="q">${A.md(it.q)}</div><div class="gwrap">${box(it.g)}<div class="gmat" id="gm"></div></div>`);
  const draw = (mark) => {
    A.$("#gm").innerHTML = `<table><tr><th></th>${[...Array(n).keys()].map(j => `<th>${j}</th>`).join("")}</tr>${cur.map((r, i) => `<tr><th>${i}</th>${r.map((x, j) => `<td><button class="gc${x ? " one" : ""}${mark && mark[i][j] ? " " + mark[i][j] : ""}" data-i="${i}" data-j="${j}" ${done ? "disabled" : ""} aria-label="рядок ${i}, стовпець ${j}">${x}</button></td>`).join("")}</tr>`).join("")}</table>`;
    A.$("#gm").querySelectorAll(".gc").forEach(c => c.onclick = () => { cur[+c.dataset.i][+c.dataset.j] ^= 1; draw(); });
  };
  const check = () => {
    const bad = cur.map((r, i) => r.map((x, j) => x !== M[i][j] ? "wrong" : ""));
    const nb = bad.flat().filter(Boolean).length;
    if (!nb) { done = true; draw(cur.map(r => r.map(() => "right"))); A.feedback(tries === 0, tries === 0 ? A.praise() : "Тепер правильно!", it.why || ""); A.nextBtn(); return; }
    tries++; if (tries === 1) { A.lose(); A.frame0Hearts(); }
    if (tries >= 2) { done = true; M.forEach((r, i) => r.forEach((x, j) => cur[i][j] = x)); draw(bad.map(r => r.map(x => x ? "fixed" : ""))); A.feedback(false, "Ось правильна матриця", it.why || ""); A.nextBtn(); return; }
    draw(bad); A.feedback(false, `Неправильних клітинок: ${nb}. Їх позначено червоним.`, "");
  };
  A.setActs(`<button class="btn" id="ck">Перевірити</button>`, { ck: check });
  draw();
};
// таблиця відстаней від стартової вершини (BFS у кроках або Дейкстра у вагах)
T.gdist = (it, A) => {
  const n = it.g.n, right = it.d;
  let tries = 0, done = false;
  A.frame(it, `<div class="q">${A.md(it.q)}</div><div class="gwrap">${box(it.g)}<div class="gmat"><table><tr><th>Вершина</th>${[...Array(n).keys()].map(j => `<th>${j}</th>`).join("")}</tr>
    <tr><th>Відстань</th>${[...Array(n).keys()].map(j => `<td>${j === it.s ? `<input class="gdi" value="0" disabled>` : `<input class="gdi" data-j="${j}" inputmode="numeric" autocomplete="off" aria-label="відстань до ${j}">`}</td>`).join("")}</tr></table></div></div>`);
  const check = () => {
    const ins = [...document.querySelectorAll(".gdi[data-j]")];
    if (ins.some(x => !x.value.trim())) { A.feedback(false, "Заповни всі клітинки", ""); return; }
    const wrong = ins.filter(x => +x.value.trim() !== right[+x.dataset.j]);
    ins.forEach(x => x.classList.remove("wrong", "right"));
    if (!wrong.length) { done = true; ins.forEach(x => { x.disabled = true; x.classList.add("right"); }); A.feedback(tries === 0, tries === 0 ? A.praise() : "Тепер правильно!", it.why || ""); A.nextBtn(); return; }
    tries++; if (tries === 1) { A.lose(); A.frame0Hearts(); }
    if (tries >= 2) { ins.forEach(x => { x.disabled = true; const ok = +x.value === right[+x.dataset.j]; x.value = right[+x.dataset.j]; x.classList.add(ok ? "right" : "fixed"); }); A.feedback(false, "Ось правильні відстані", it.why || ""); A.nextBtn(); return; }
    wrong.forEach(x => x.classList.add("wrong"));
    A.feedback(false, `Неправильних відстаней: ${wrong.length}. Спробуй ще раз.`, "");
  };
  A.setActs(`<button class="btn" id="ck">Перевірити</button>`, { ck: check });
};
window.GAME_TYPES = Object.assign(window.GAME_TYPES || {}, T);
})();
