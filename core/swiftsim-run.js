/* Симулятор SwiftUI — виконання коду: значення, змінні, @State, функції, елементи екрана і модифікатори */
(function () {
"use strict";
const { parse, SwiftErr, similar } = window.SWIFTSIM_PARSE;
const err = (msg, line) => { throw new SwiftErr(msg, line); };

// ---------- значення ----------
class D { constructor(v) { this.v = v; } }            // Double; Int — звичайне число JS
const isNum = x => typeof x === "number" || x instanceof D;
const num = x => x instanceof D ? x.v : x;
const COLORS = { red: "#ff3b30", orange: "#ff9500", yellow: "#ffcc00", green: "#34c759", mint: "#00c7be", teal: "#30b0c7", cyan: "#32ade6",
  blue: "#007aff", indigo: "#5856d6", purple: "#af52de", pink: "#ff2d55", brown: "#a2845e", gray: "#8e8e93", black: "#000000", white: "#ffffff",
  clear: "transparent", tint: "#007aff", primary: "#000000", secondary: "rgba(60,60,67,.6)", accentColor: "#007aff" };
const FONTS = { largeTitle: [34, 400], title: [28, 400], title2: [22, 400], title3: [20, 400], headline: [17, 600], subheadline: [15, 400],
  body: [17, 400], callout: [16, 400], footnote: [13, 400], caption: [12, 400], caption2: [11, 400] };
const WEIGHTS = { ultraLight: 100, thin: 200, light: 300, regular: 400, medium: 500, semibold: 600, bold: 700, heavy: 800, black: 900 };
const mkColor = (css, name) => ({ color: css, name: name || css, mods: [] });
const isColor = x => x && typeof x === "object" && "color" in x;
const isView = x => x && typeof x === "object" && (x.view || x.color !== undefined || x.gradient);

function fmt(v, inner) {
  if (v === null || v === undefined) return "nil";
  if (v instanceof D) return Number.isInteger(v.v) && Math.abs(v.v) < 1e16 ? v.v.toFixed(1) : String(v.v);
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (typeof v === "string") return inner ? JSON.stringify(v) : v;
  if (Array.isArray(v)) return "[" + v.map(x => fmt(x, true)).join(", ") + "]";
  if (v.range) return `${fmt(v.lo)}${v.closed ? "..." : "..<"}${fmt(v.hi)}`;
  if (isColor(v)) return v.name;
  if (v.view) return v.view + "(…)";
  return String(v);
}
const typeName = v => v === null ? "nil" : v instanceof D ? "Double" : typeof v === "number" ? "Int" : typeof v === "string" ? "String" : typeof v === "boolean" ? "Bool" : Array.isArray(v) ? "масив" : v && v.view ? v.view : "значення";
function eq(a, b) {
  if (isNum(a) && isNum(b)) return num(a) === num(b);
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => eq(x, b[i]));
  return a === b;
}
const copy = v => Array.isArray(v) ? v.map(copy) : v;

// ---------- середовище ----------
class Env {
  constructor(parent, self) { this.parent = parent; this.self = self !== undefined ? self : parent ? parent.self : null; this.vars = new Map(); }
  def(name, v, mut, line) { this.vars.set(name, { v, mut }); }
  find(name) { for (let e = this; e; e = e.parent) if (e.vars.has(name)) return e.vars.get(name); return null; }
}
class Ret { constructor(v) { this.v = v; } }
class Brk {} class Cnt {}

// ---------- машина ----------
function Machine(prog, hooks) {
  const store = hooks.store;            // @State: шлях екземпляра + назва → значення
  const log = hooks.log || (() => {});
  let steps = 0;
  const tick = line => { if (++steps > 200000) err("Схоже на нескінченний цикл: програма робить забагато кроків", line); };

  const globalsEnv = new Env(null, null);

  // ----- екземпляри власних View -----
  function instance(def, args, path, line) {
    const self = { def, path, props: new Map(), binds: new Map(), state: new Set() };
    const given = new Map(args.map(a => [a.label, a]));
    for (const a of args) {
      if (a.label === null) err(`${def.name}: параметри треба передавати з назвою, наприклад ${def.name}(${(def.props.find(p => !p.body) || { name: "x" }).name}: …)`, line);
      if (!def.props.some(p => p.name === a.label && !p.body)) {
        const s = similar(a.label, def.props.filter(p => !p.body).map(p => p.name));
        err(`У ${def.name} немає властивості ${a.label}${s ? `. Можливо, ${s}?` : ""}`, line);
      }
    }
    for (const p of def.props) {
      if (p.body) continue;
      const isState = p.attrs.includes("State"), isBind = p.attrs.includes("Binding");
      const g = given.get(p.name);
      if (isBind) {
        if (!g) err(`${def.name} потребує параметр ${p.name}: $… (прив'язку до @State)`, line);
        if (!g.v || !g.v.bind) err(`Для @Binding ${p.name} передай прив'язку зі знаком $, наприклад ${p.name}: $${p.name}`, line);
        self.binds.set(p.name, g.v.bind); continue;
      }
      if (isState) {
        const key = path + "#" + p.name;
        self.state.add(p.name);
        if (!store.has(key)) {
          let v;
          if (g) v = g.v; else if (p.init) v = evalE(p.init, new Env(globalsEnv, self)); else err(`@State ${p.name} треба дати початкове значення: @State private var ${p.name} = …`, p.line);
          store.set(key, copy(v));
        }
        continue;
      }
      if (g) self.props.set(p.name, copy(g.v));
      else if (p.init) self.props.set(p.name, evalE(p.init, new Env(globalsEnv, self)));
      else err(`Щоб створити ${def.name}, передай ${p.name}: …  (наприклад ${def.name}(${p.name}: …))`, line);
    }
    return self;
  }
  function selfGet(self, name) {
    if (self.state.has(name)) return store.get(self.path + "#" + name);
    if (self.binds.has(name)) return self.binds.get(name).get();
    if (self.props.has(name)) return self.props.get(name);
    const comp = self.def.props.find(p => p.name === name && p.body);
    if (comp) return runBody(comp.body, new Env(globalsEnv, self), comp.type && /View/.test(comp.type));
    if (self.def.funcs[name]) return { fn: self.def.funcs[name], self, isFunc: true };
    return undefined;
  }
  function selfHas(self, name) { return self.state.has(name) || self.binds.has(name) || self.props.has(name) || self.def.props.some(p => p.name === name) || !!self.def.funcs[name]; }

  // ----- пошук імені -----
  function lookup(name, env, line) {
    const v = env.find(name);
    if (v) return v.v;
    if (env.self && selfHas(env.self, name)) return selfGet(env.self, name);
    if (prog.structs[name]) return { type: name };
    if (BUILTIN_TYPES.has(name)) return { type: name };
    if (FUNCS[name]) return { native: FUNCS[name], name };
    const known = [...allNames(env), ...BUILTIN_TYPES, ...Object.keys(FUNCS), ...Object.keys(prog.structs)];
    const s = similar(name, known);
    if (s) err(`Не знаю, що таке ${name}. Можливо, ${s}? (Swift розрізняє великі й малі літери)`, line);
    if (/^[\p{Lu}]/u.test(name)) err(`Не знаю елемента ${name}. Перевір назву або створи struct ${name}: View`, line);
    err(`Не знаю, що таке ${name}. Якщо це текст — візьми його в лапки: "${name}". Якщо змінна — оголоси її через let чи var`, line);
  }
  function allNames(env) {
    const out = [];
    for (let e = env; e; e = e.parent) out.push(...e.vars.keys());
    if (env.self) out.push(...env.self.def.props.map(p => p.name), ...Object.keys(env.self.def.funcs));
    return out;
  }

  // ----- l-значення: куди записувати -----
  function lvalue(node, env) {
    if (node.k === "id" || (node.k === "member" && node.obj.k === "self")) {
      const name = node.name;
      if (node.k === "id") {
        const v = env.find(name);
        if (v) {
          if (!v.mut) err(`${name} оголошено через let — його не можна змінювати. Заміни let на var`, node.line);
          return { get: () => v.v, set: x => { v.v = x; }, name };
        }
      }
      const self = env.self;
      if (self && selfHas(self, name)) {
        if (self.state.has(name)) { const key = self.path + "#" + name; return { get: () => store.get(key), set: x => { store.set(key, x); hooks.changed(); }, name }; }
        if (self.binds.has(name)) { const b = self.binds.get(name); return { get: b.get, set: x => { b.set(x); }, name }; }
        const p = self.def.props.find(q => q.name === name);
        if (p && p.body) err(`${name} — обчислювана властивість, її не можна змінювати`, node.line);
        err(`${name} не можна змінити: View не пам'ятає звичайні змінні. Додай @State: @State private var ${name} = …`, node.line);
      }
      lookup(name, env, node.line);
      err(`${name} не можна змінювати`, node.line);
    }
    if (node.k === "sub") {
      const base = lvalue(node.obj, env);
      return {
        get: () => { const a = base.get(); return index(a, evalE(node.idx, env), node.line); },
        set: x => { const a = base.get(); if (!Array.isArray(a)) err("Змінювати за індексом можна лише масив", node.line); const i = num(evalE(node.idx, env)); checkIdx(a, i, node.line); const b = a.slice(); b[i] = x; base.set(b); },
        name: base.name,
      };
    }
    err("Ліворуч від = має бути змінна", node.line);
  }
  const checkIdx = (a, i, line) => { if (!Number.isInteger(i) || i < 0 || i >= a.length) err(`Індекс ${i} за межами масиву (у ньому ${a.length} елем.)`, line); };
  function index(a, i, line) {
    if (Array.isArray(a)) { i = num(i); checkIdx(a, i, line); return a[i]; }
    if (typeof a === "string") err("Рядок не можна брати за індексом [ ] — у Swift так не можна", line);
    err("Квадратні дужки [ ] працюють лише з масивом", line);
  }

  // ----- вирази -----
  function evalE(n, env) {
    switch (n.k) {
      case "num": return n.dbl ? new D(n.v) : n.v;
      case "str": return n.parts.map(p => typeof p === "string" ? p : fmt(evalE(p.e, env))).join("");
      case "bool": return n.v;
      case "nil": return null;
      case "array": return n.items.map(x => evalE(x, env));
      case "self": if (!env.self) err("self тут немає", n.line); return { selfRef: env.self };
      case "id": return lookup(n.name, env, n.line);
      case "imember": return { imem: n.name, chain: [], line: n.line };
      case "keypath": return { keypath: n.path };
      case "closure": return { fn: n, env };
      case "binding": {
        const lv = lvalue(n.e, env);
        return { bind: { get: lv.get, set: lv.set, name: lv.name } };
      }
      case "force": { const v = evalE(n.e, env); if (v === null) err("Значення порожнє (nil), а ! вимагає, щоб воно було", n.line); return v; }
      case "un": {
        const v = evalE(n.e, env);
        if (n.op === "!") { if (typeof v !== "boolean") err("! ставиться лише перед true/false", n.line); return !v; }
        if (!isNum(v)) err("Мінус ставиться лише перед числом", n.line);
        return v instanceof D ? new D(-v.v) : -v;
      }
      case "tern": { const c = evalE(n.c, env); if (typeof c !== "boolean") err("Умова в ? : має бути true або false", n.line); return evalE(c ? n.a : n.b, env); }
      case "bin": return binop(n, env);
      case "sub": return index(evalE(n.obj, env), evalE(n.idx, env), n.line);
      case "member": return member(evalE(n.obj, env), n.name, n, env);
      case "call": return call(n, env);
      case "_lit": return n.v;
    }
    err("Не розумію цей вираз", n.line);
  }
  function binop(n, env) {
    const op = n.op;
    if (op === "&&" || op === "||") {
      const a = evalE(n.l, env); if (typeof a !== "boolean") err(`${op} працює лише з true/false`, n.line);
      if (op === "&&" ? !a : a) return a;
      const b = evalE(n.r, env); if (typeof b !== "boolean") err(`${op} працює лише з true/false`, n.line);
      return b;
    }
    const a = evalE(n.l, env);
    if (op === "??") return a === null ? evalE(n.r, env) : a;
    const b = evalE(n.r, env);
    if (op === "..<" || op === "...") { if (!isNum(a) || !isNum(b)) err("Діапазон будується з чисел", n.line); return { range: true, lo: num(a), hi: num(b), closed: op === "..." }; }
    if (op === "==") return eq(a, b);
    if (op === "!=") return !eq(a, b);
    if (["<", ">", "<=", ">="].includes(op)) {
      if (!((isNum(a) && isNum(b)) || (typeof a === "string" && typeof b === "string"))) err(`Порівнювати ${op} можна числа з числами або рядки з рядками`, n.line);
      const x = isNum(a) ? num(a) : a, y = isNum(b) ? num(b) : b;
      return op === "<" ? x < y : op === ">" ? x > y : op === "<=" ? x <= y : x >= y;
    }
    if (op === "+" && (typeof a === "string" || typeof b === "string")) {
      if (typeof a !== "string" || typeof b !== "string") err(`Не можна додати рядок і ${typeName(typeof a === "string" ? b : a)}. Встав число в рядок так: "… \\(x)"`, n.line);
      return a + b;
    }
    if (op === "+" && Array.isArray(a) && Array.isArray(b)) return a.concat(b);
    if (!isNum(a) || !isNum(b)) err(`Оператор ${op} працює з числами, а тут ${typeName(a)} і ${typeName(b)}`, n.line);
    const dbl = a instanceof D || b instanceof D, x = num(a), y = num(b);
    let r;
    if (op === "+") r = x + y; else if (op === "-") r = x - y; else if (op === "*") r = x * y;
    else if (op === "/") { if (!dbl && y === 0) err("Ділення на нуль", n.line); r = dbl ? x / y : Math.trunc(x / y); }
    else if (op === "%") { if (dbl) err("% працює лише з цілими числами (Int)", n.line); if (y === 0) err("Ділення на нуль", n.line); r = x % y; }
    return dbl ? new D(r) : r;
  }

  // ----- члени: властивості й методи -----
  function member(o, name, n, env) {
    if (o && o.selfRef) return selfGet(o.selfRef, name) ?? err(`У ${o.selfRef.def.name} немає ${name}`, n.line);
    if (o && o.imem !== undefined) return { imem: o.imem, chain: o.chain.concat([{ name }]), line: o.line };
    if (o && o.type) return typeMember(o.type, name, n);
    if (isColor(o) && name === "opacity") return { method: "opacity", obj: o };
    if (o && o.font) return { method: name, obj: o };
    if (isView(o)) return { modifier: name, obj: o, line: n.line };
    if (typeof o === "string") {
      if (name === "count") return [...o].length;
      if (name === "isEmpty") return o.length === 0;
      if (["uppercased", "lowercased", "contains", "hasPrefix", "hasSuffix", "reversed"].includes(name)) return { method: name, obj: o };
      err(`У рядка немає ${name}`, n.line);
    }
    if (Array.isArray(o)) {
      if (name === "count") return o.length;
      if (name === "isEmpty") return o.length === 0;
      if (name === "first") return o.length ? o[0] : null;
      if (name === "last") return o.length ? o[o.length - 1] : null;
      if (name === "indices") return { range: true, lo: 0, hi: o.length, closed: false };
      return { method: name, obj: o, node: n.obj };
    }
    if (o && o.range) { if (name === "count") return rangeArr(o).length; return { method: name, obj: rangeArr(o), node: null }; }
    if (isNum(o)) {
      if (name === "description") return fmt(o);
      if (["rounded", "squareRoot"].includes(name)) return { method: name, obj: o };
      if (name === "isMultiple") return { method: name, obj: o };
    }
    if (typeof o === "boolean" && name === "toggle") return { method: "toggle", obj: o, node: n.obj };
    if (o === null) err(`Значення порожнє (nil) — у нього немає ${name}`, n.line);
    err(`У ${typeName(o)} немає ${name}`, n.line);
  }
  function typeMember(t, name, n) {
    if (t === "Color") { if (COLORS[name]) return mkColor(COLORS[name], "." + name); err(`Кольору Color.${name} немає. Є: ${Object.keys(COLORS).slice(0, 14).join(", ")}`, n.line); }
    if (t === "Font") return toFont({ imem: name, chain: [], line: n.line });
    if (t === "Int" || t === "Double" || t === "Bool") return { typeMethod: t + "." + name };
    if (t === "Alignment" || t === "HorizontalAlignment" || t === "VerticalAlignment" || t === "Edge") return { imem: name, chain: [], line: n.line };
    err(`У ${t} немає ${name}`, n.line);
  }
  const rangeArr = r => { const out = []; const hi = r.closed ? r.hi : r.hi - 1; if (hi - r.lo > 10000) err("Завеликий діапазон", 0); for (let i = r.lo; i <= hi; i++) out.push(i); return out; };
  const toArr = (v, line) => Array.isArray(v) ? v : v && v.range ? rangeArr(v) : typeof v === "string" ? [...v] : err("Тут потрібен масив або діапазон", line);

  // ----- виклики -----
  function evalArgs(n, env) {
    return n.args.map(a => ({ label: a.label, v: evalE(a.value, env), node: a.value }))
      .concat(n.trailing.map((t, i) => ({ label: t.label, v: { fn: t.value, env }, trailing: true, first: i === 0 })));
  }
  function call(n, env) {
    // мутувальні методи масивів і Bool: items.append(x), isOn.toggle()
    if (n.fn.k === "member" && MUTATING.includes(n.fn.name)) {
      const target = evalE(n.fn.obj, env);
      if (Array.isArray(target) || (typeof target === "boolean" && n.fn.name === "toggle")) return mutate(n, env, target);
    }
    const f = evalE(n.fn, env);
    const a = evalArgs(n, env);
    return apply(f, a, n, env);
  }
  function apply(f, a, n, env) {
    const line = n.line;
    if (f && f.type) {
      if (prog.structs[f.type]) return { view: "Custom", def: prog.structs[f.type], args: a.map(x => ({ label: x.label, v: x.v })), mods: [], line };
      return construct(f.type, a, line, env);
    }
    if (f && f.native) return f.native(a, line, env);
    if (f && f.typeMethod) return typeMethod(f.typeMethod, a, line);
    if (f && f.fn) return callFn(f, a.map(x => x.v), line, a);
    if (f && f.imem !== undefined) { const c = f.chain.length ? f.chain : null; if (c) { c[c.length - 1].args = a; return { imem: f.imem, chain: f.chain, line: f.line }; } return { imem: f.imem, args: a, chain: [], line: f.line }; }
    if (f && f.modifier) return modify(f.obj, f.modifier, a, line, env);
    if (f && f.method) return method(f, a, line, env);
    if (isColor(f)) err("Колір не можна викликати як функцію", line);
    err("Це не можна викликати з дужками ( )", line);
  }
  function callFn(f, args, line, raw) {
    if (f.isFunc) {
      const fn = f.fn, e = new Env(globalsEnv, f.self);
      const given = raw || args.map(v => ({ label: null, v }));
      fn.params.forEach((p, i) => {
        let g = given.find(x => x.label === p.label && p.label !== "_");
        if (!g && p.label === "_") g = given.filter(x => x.label === null)[0] && given.filter(x => x.label === null).shift();
        if (!g && given[i] && given[i].label === null && p.label === "_") g = given[i];
        if (!g) { if (p.def) { e.def(p.name, evalE(p.def, e), false); return; } err(`Функції ${fn.name} бракує параметра ${p.label === "_" ? p.name : p.label + ":"}`, line); }
        e.def(p.name, copy(g.v), false);
      });
      return runFn(fn.body, e);
    }
    const c = f.fn, e = new Env(f.env);
    if (c.params.length) c.params.forEach((p, i) => e.def(p, args[i], false));
    else args.forEach((v, i) => e.def("$" + i, v, false));
    // замикання з одного виразу повертає його значення
    if (c.body.length === 1 && c.body[0].k === "expr") return evalE(c.body[0].e, e);
    return runFn(c.body, e);
  }

  const MUTATING = ["append", "remove", "removeAll", "removeLast", "removeFirst", "insert", "toggle", "shuffle", "sort", "reverse"];
  function mutate(n, env, cur) {
    const lv = lvalue(n.fn.obj, env), name = n.fn.name, a = evalArgs(n, env);
    if (name === "toggle") { if (typeof cur !== "boolean") err(".toggle() працює лише з Bool", n.line); lv.set(!cur); return; }
    const arr = cur.slice();
    const arg = l => (a.find(x => x.label === l) || {}).v;
    if (name === "append") { if (a[0] && a[0].label === "contentsOf") arr.push(...toArr(a[0].v)); else { if (!a.length) err("append потребує значення: append(x)", n.line); arr.push(copy(a[0].v)); } }
    else if (name === "remove") { const i = num(arg("at")); if (i === undefined) err("Пиши remove(at: індекс)", n.line); checkIdx(arr, i, n.line); lv.set(arr.slice(0, i).concat(arr.slice(i + 1))); return cur[i]; }
    else if (name === "removeAll") arr.length = 0;
    else if (name === "removeLast") { if (!arr.length) err("Масив порожній — нічого видаляти", n.line); arr.pop(); }
    else if (name === "removeFirst") { if (!arr.length) err("Масив порожній — нічого видаляти", n.line); arr.shift(); }
    else if (name === "insert") { const i = num(arg("at")); if (i < 0 || i > arr.length) err(`Індекс ${i} за межами масиву`, n.line); arr.splice(i, 0, copy(a[0].v)); }
    else if (name === "shuffle") arr.sort(() => Math.random() - .5);
    else if (name === "sort") arr.sort((x, y) => (isNum(x) ? num(x) : x) < (isNum(y) ? num(y) : y) ? -1 : 1);
    else if (name === "reverse") arr.reverse();
    lv.set(arr);
  }
  function method(m, a, line, env) {
    const o = m.obj, name = m.method, v0 = a[0] && a[0].v;
    if (isColor(o) && name === "opacity") return mkColor(withAlpha(o.color, num(v0)), o.name + ".opacity(" + fmt(v0) + ")");
    if (o && o.font) return fontMethod(o, name, a, line);
    if (typeof o === "string") {
      if (name === "uppercased") return o.toUpperCase();
      if (name === "lowercased") return o.toLowerCase();
      if (name === "contains") return o.includes(v0);
      if (name === "hasPrefix") return o.startsWith(v0);
      if (name === "hasSuffix") return o.endsWith(v0);
      if (name === "reversed") return [...o].reverse().join("");
    }
    if (isNum(o)) {
      if (name === "rounded") return new D(Math.round(num(o)));
      if (name === "squareRoot") return new D(Math.sqrt(num(o)));
      if (name === "isMultiple") return num(o) % num(v0) === 0;
    }
    if (Array.isArray(o)) {
      const f = () => { if (!v0 || !v0.fn && !v0.native) err(`${name} потребує замикання { … }`, line); return x => apply(v0, [{ label: null, v: x }], { line }, env); };
      switch (name) {
        case "contains": return o.some(x => eq(x, v0));
        case "firstIndex": return (i => i < 0 ? null : i)(o.findIndex(x => eq(x, v0)));
        case "sorted": return o.slice().sort((x, y) => (isNum(x) ? num(x) : x) < (isNum(y) ? num(y) : y) ? -1 : 1);
        case "shuffled": return o.slice().sort(() => Math.random() - .5);
        case "randomElement": return o.length ? o[Math.floor(Math.random() * o.length)] : null;
        case "reversed": return o.slice().reverse();
        case "joined": return o.map(x => fmt(x)).join(a.find(x => x.label === "separator") ? a.find(x => x.label === "separator").v : "");
        case "max": return o.length ? o.reduce((x, y) => num(y) > num(x) ? y : x) : null;
        case "min": return o.length ? o.reduce((x, y) => num(y) < num(x) ? y : x) : null;
        case "filter": { const g = f(); return o.filter(x => g(x) === true); }
        case "map": { const g = f(); return o.map(g); }
        case "enumerated": return o.map((x, i) => [i, x]);
      }
      if (MUTATING.includes(name)) err(`Масив можна змінити, лише якщо він @State або var`, line);
      err(`У масиву немає ${name}`, line);
    }
    err(`Немає методу ${name}`, line);
  }
  function typeMethod(tm, a, line) {
    const r = (a.find(x => x.label === "in") || {}).v;
    if (tm === "Int.random") { if (!r || !r.range) err("Пиши Int.random(in: 1...6)", line); const hi = r.closed ? r.hi : r.hi - 1; if (hi < r.lo) err("Порожній діапазон", line); return r.lo + Math.floor(Math.random() * (hi - r.lo + 1)); }
    if (tm === "Double.random") { if (!r || !r.range) err("Пиши Double.random(in: 0...1)", line); return new D(r.lo + Math.random() * (r.hi - r.lo)); }
    if (tm === "Bool.random") return Math.random() < .5;
    err(`Немає ${tm}`, line);
  }

  // ----- вбудовані функції -----
  const FUNCS = {
    print: (a) => { const sep = (a.find(x => x.label === "separator") || { v: " " }).v; log(a.filter(x => !x.label).map(x => fmt(x.v)).join(sep)); },
    String: (a) => fmt(a[0] ? a[0].v : ""),
    Int: (a, line) => { const v = a[0] && a[0].v; if (typeof v === "string") return /^\s*[-+]?\d+\s*$/.test(v) ? parseInt(v, 10) : null; if (isNum(v)) return Math.trunc(num(v)); err("Int(…) потребує число або рядок", line); },
    Double: (a, line) => { const v = a[0] && a[0].v; if (typeof v === "string") return /^\s*[-+]?\d+(\.\d+)?\s*$/.test(v) ? new D(parseFloat(v)) : null; if (isNum(v)) return new D(num(v)); err("Double(…) потребує число або рядок", line); },
    abs: (a) => { const v = a[0].v; return v instanceof D ? new D(Math.abs(v.v)) : Math.abs(v); },
    min: (a) => a.map(x => x.v).reduce((x, y) => num(y) < num(x) ? y : x),
    max: (a) => a.map(x => x.v).reduce((x, y) => num(y) > num(x) ? y : x),
    sqrt: (a) => new D(Math.sqrt(num(a[0].v))),
    pow: (a) => new D(Math.pow(num(a[0].v), num(a[1].v))),
    round: (a) => new D(Math.round(num(a[0].v))),
    withAnimation: (a, line) => { const f = a.find(x => x.v && x.v.fn); if (f) callFn(f.v, [], line); },
  };
  const BUILTIN_TYPES = new Set(["Text", "Image", "Label", "Button", "VStack", "HStack", "ZStack", "LazyVStack", "LazyHStack", "Group", "ScrollView",
    "Spacer", "Divider", "Rectangle", "Circle", "Capsule", "Ellipse", "RoundedRectangle", "Color", "LinearGradient", "Font", "List", "Section", "ForEach",
    "Toggle", "TextField", "SecureField", "Stepper", "Slider", "ProgressView", "NavigationStack", "NavigationView", "NavigationLink", "Int", "Double", "Bool", "String", "Alignment", "Edge", "Form"]);

  // ----- значення з крапкою: .red, .title, .leading -----
  function imemName(v) { return v && v.imem !== undefined && !v.chain.length && !v.args ? v.imem : null; }
  function toColor(v, line, what) {
    if (isColor(v)) return v;
    const nm = imemName(v);
    if (nm && COLORS[nm]) return mkColor(COLORS[nm], "." + nm);
    if (v && v.imem !== undefined && COLORS[v.imem] && v.chain.length === 1 && v.chain[0].name === "opacity") return mkColor(withAlpha(COLORS[v.imem], num(v.chain[0].args[0].v)), "." + v.imem);
    if (nm) { const s = similar(nm, Object.keys(COLORS)); err(`Кольору .${nm} немає${s ? `. Можливо, .${s}?` : ""}. Є: .red, .orange, .yellow, .green, .mint, .teal, .cyan, .blue, .indigo, .purple, .pink, .brown, .gray, .black, .white`, line); }
    err(`${what || "Тут"} потрібен колір, наприклад .blue`, line);
  }
  function toFont(v, line) {
    if (v && v.font) return v;
    if (!v || v.imem === undefined) err("Для .font потрібен шрифт, наприклад .title", line);
    let f;
    if (v.imem === "system") {
      const sz = v.args && v.args.find(x => x.label === "size");
      if (!sz) err("Пиши .system(size: 24)", line);
      f = { font: "system", size: num(sz.v), weight: 400 };
      const w = v.args.find(x => x.label === "weight"); if (w) f.weight = toWeight(w.v, line);
      const d = v.args.find(x => x.label === "design"); if (d && imemName(d.v) === "rounded") f.rounded = true; if (d && imemName(d.v) === "monospaced") f.mono = true;
    } else {
      if (!FONTS[v.imem]) { const s = similar(v.imem, Object.keys(FONTS)); err(`Шрифту .${v.imem} немає${s ? `. Можливо, .${s}?` : ""}. Є: .largeTitle, .title, .title2, .title3, .headline, .subheadline, .body, .callout, .footnote, .caption`, line); }
      f = { font: v.imem, size: FONTS[v.imem][0], weight: FONTS[v.imem][1] };
      if (v.args) err(`.${v.imem} пишеться без дужок`, line);
    }
    for (const c of v.chain) f = fontMethod(f, c.name, c.args || [], line);
    return f;
  }
  function fontMethod(f, name, a, line) {
    f = Object.assign({}, f);
    if (name === "bold") f.weight = 700; else if (name === "italic") f.italic = true;
    else if (name === "weight") f.weight = toWeight(a[0].v, line);
    else err(`У шрифту немає .${name}`, line);
    return f;
  }
  function toWeight(v, line) { const nm = imemName(v); if (!nm || !WEIGHTS[nm]) err(`Товщини .${nm} немає. Є: .light, .regular, .medium, .semibold, .bold, .heavy, .black`, line); return WEIGHTS[nm]; }
  function withAlpha(css, a) {
    if (css === "transparent") return css;
    if (css.startsWith("#")) { const h = css.slice(1); const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16); return `rgba(${r},${g},${b},${a})`; }
    const m = /rgba?\(([^)]+)\)/.exec(css); if (m) { const p = m[1].split(",").slice(0, 3); return `rgba(${p.join(",")},${a})`; }
    return css;
  }
  const ALIGN = { leading: 1, center: 1, trailing: 1, top: 1, bottom: 1, topLeading: 1, topTrailing: 1, bottomLeading: 1, bottomTrailing: 1, firstTextBaseline: 1, lastTextBaseline: 1 };
  function toAlign(v, line, allowed) {
    const nm = imemName(v);
    if (!nm || !ALIGN[nm] || (allowed && !allowed.includes(nm))) err(`Тут потрібне вирівнювання: ${(allowed || Object.keys(ALIGN)).map(x => "." + x).join(", ")}`, line);
    return nm;
  }

  // ----- конструктори елементів -----
  const arg = (a, label) => a.find(x => x.label === label);
  const unl = a => a.filter(x => x.label === null && !x.trailing);
  const trail = (a, label) => a.find(x => x.trailing && (label === undefined ? x.first || x.label === null : x.label === label));
  function content(a, env, line, who) {
    const c = trail(a) || arg(a, "content");
    if (!c) return [];
    return buildFn(c.v, [], line);
  }
  function buildFn(f, params, line) {
    if (!f || !f.fn) err("Тут очікувався блок { … }", line);
    const e = new Env(f.env);
    f.fn.params.forEach((p, i) => e.def(p, params[i], false));
    if (!f.fn.params.length) params.forEach((v, i) => e.def("$" + i, v, false));
    return runBuilder(f.fn.body, e);
  }
  function needStr(v, line, who) {
    if (typeof v === "string") return v;
    if (isNum(v) || typeof v === "boolean") err(`${who} показує лише текст. Щоб показати число, встав його в рядок: ${who}("\\(${typeof v === "boolean" ? "значення" : "число"})")`, line);
    err(`${who} очікує текст у лапках`, line);
  }
  function construct(t, a, line, env) {
    const V = (view, o) => Object.assign({ view, mods: [], line }, o);
    switch (t) {
      case "Text": { const u = unl(a); if (!u.length) err('Text потребує текст: Text("Привіт")', line); return V("Text", { text: needStr(u[0].v, line, "Text") }); }
      case "Image": {
        const s = arg(a, "systemName");
        if (s) return V("Image", { symbol: needStr(s.v, line, "Image(systemName:)") });
        const u = unl(a); if (u.length) return V("Image", { asset: fmt(u[0].v) });
        err('Пиши Image(systemName: "star")', line);
      }
      case "Label": { const u = unl(a), s = arg(a, "systemImage"); if (!u.length || !s) err('Пиши Label("Текст", systemImage: "star")', line); return V("Label", { text: needStr(u[0].v, line, "Label"), symbol: s.v }); }
      case "Button": {
        const u = unl(a);
        const act = arg(a, "action") || (u.length ? trail(a) : (trail(a, "label") ? trail(a) : null));
        const labelFn = u.length ? null : (trail(a, "label") || (arg(a, "action") ? trail(a) : null));
        if (!act) err('Кнопці потрібна дія: Button("Текст") { … }', line);
        if (!act.v || (!act.v.fn && !act.v.native)) err("Дія кнопки — це блок { … } або назва функції", line);
        let label;
        if (u.length) label = [V("Text", { text: needStr(u[0].v, line, "Button") })];
        else if (labelFn) label = buildFn(labelFn.v, [], line);
        else err('Кнопці потрібен напис: Button("Текст") { … }', line);
        return V("Button", { action: act.v, label });
      }
      case "VStack": case "LazyVStack": case "HStack": case "LazyHStack": case "ZStack": {
        const kind = t.replace("Lazy", "");
        const al = arg(a, "alignment"), sp = arg(a, "spacing");
        const allowed = kind === "VStack" ? ["leading", "center", "trailing"] : kind === "HStack" ? ["top", "center", "bottom", "firstTextBaseline", "lastTextBaseline"] : null;
        return V(kind, { align: al ? toAlign(al.v, line, allowed) : "center", spacing: sp ? num(sp.v) : null, children: content(a, env, line, t) });
      }
      case "Group": return V("Group", { children: content(a, env, line) });
      case "ScrollView": { const ax = unl(a)[0]; return V("ScrollView", { horizontal: ax && imemName(ax.v) === "horizontal", children: content(a, env, line) }); }
      case "Form": return V("List", { children: content(a, env, line) });
      case "Spacer": return V("Spacer", { min: arg(a, "minLength") ? num(arg(a, "minLength").v) : null });
      case "Divider": return V("Divider");
      case "Rectangle": case "Circle": case "Capsule": case "Ellipse": return V("Shape", { shape: t });
      case "RoundedRectangle": { const r = arg(a, "cornerRadius"); if (!r) err("Пиши RoundedRectangle(cornerRadius: 12)", line); return V("Shape", { shape: t, radius: num(r.v) }); }
      case "Color": {
        const r = arg(a, "red"), g = arg(a, "green"), b = arg(a, "blue");
        if (r && g && b) { const c = x => Math.round(Math.max(0, Math.min(1, num(x.v))) * 255); return mkColor(`rgb(${c(r)},${c(g)},${c(b)})`, "Color(red:…)"); }
        const u = unl(a); if (u.length) { if (isColor(u[0].v)) return u[0].v; return mkColor("#c7c7cc", `Color("${fmt(u[0].v)}")`); }
        err("Пиши Color.red або Color(red: 0.5, green: 0.2, blue: 0.9)", line);
      }
      case "LinearGradient": {
        const cs = arg(a, "colors"); if (!cs || !Array.isArray(cs.v)) err("Пиши LinearGradient(colors: [.blue, .purple], startPoint: .top, endPoint: .bottom)", line);
        const sp = arg(a, "startPoint"), ep = arg(a, "endPoint");
        const dirs = { top: "to bottom", bottom: "to top", leading: "to right", trailing: "to left", topLeading: "to bottom right", bottomTrailing: "to top left", topTrailing: "to bottom left", bottomLeading: "to top right" };
        const dir = dirs[imemName(sp && sp.v) || "top"] || "to bottom";
        return { gradient: `linear-gradient(${dir}, ${cs.v.map(c => toColor(c, line).color).join(", ")})`, mods: [], line, view: "Gradient" };
      }
      case "List": {
        const data = unl(a)[0];
        if (data) { const tr = trail(a); if (!tr) err("List(…) потребує блок { елемент in … }", line); return V("List", { children: toArr(data.v, line).flatMap(x => buildFn(tr.v, [x], line)) }); }
        return V("List", { children: content(a, env, line) });
      }
      case "Section": {
        const u = unl(a), h = arg(a, "header");
        let header = null;
        if (u.length) header = needStr(u[0].v, line, "Section");
        else if (h) header = h.v && h.v.view === "Text" ? h.v.text : fmt(h.v);
        const hdr = trail(a, "header"); if (hdr) { const hv = buildFn(hdr.v, [], line); header = hv[0] && hv[0].text || ""; }
        return V("Section", { header, children: content(a, env, line) });
      }
      case "ForEach": {
        const u = unl(a)[0]; const tr = trail(a) || arg(a, "content");
        if (!u || !tr) err("Пиши ForEach(0..<5) { i in … } або ForEach(items, id: \\.self) { item in … }", line);
        const items = toArr(u.v, line);
        if (Array.isArray(u.v) && !arg(a, "id") && items.length && typeof items[0] !== "object") err("Для ForEach з масивом додай id: \\.self — ForEach(items, id: \\.self) { item in … }", line);
        return V("Group", { children: items.flatMap(x => buildFn(tr.v, [x], line)) });
      }
      case "Toggle": {
        const b = arg(a, "isOn"); if (!b || !b.v || !b.v.bind) err("Пиши Toggle(\"Текст\", isOn: $змінна) — зі знаком $", line);
        const u = unl(a); const label = u.length ? [V("Text", { text: needStr(u[0].v, line, "Toggle") })] : content(a, env, line);
        return V("Toggle", { bind: b.v.bind, label });
      }
      case "TextField": case "SecureField": {
        const u = unl(a), b = arg(a, "text");
        if (!b || !b.v || !b.v.bind) err(`Пиши ${t}("Підказка", text: $змінна) — зі знаком $`, line);
        if (typeof b.v.bind.get() !== "string") err(`${t} працює лише з текстовою змінною (String)`, line);
        return V("TextField", { placeholder: u.length ? fmt(u[0].v) : "", bind: b.v.bind, secure: t === "SecureField" });
      }
      case "Stepper": {
        const u = unl(a), b = arg(a, "value"); if (!b || !b.v || !b.v.bind) err("Пиши Stepper(\"Текст\", value: $змінна)", line);
        const r = arg(a, "in"), st = arg(a, "step");
        const label = u.length ? [V("Text", { text: needStr(u[0].v, line, "Stepper") })] : content(a, env, line);
        return V("Stepper", { bind: b.v.bind, range: r ? r.v : null, step: st ? st.v : 1, label });
      }
      case "Slider": {
        const b = arg(a, "value"); if (!b || !b.v || !b.v.bind) err("Пиши Slider(value: $змінна, in: 0...100)", line);
        const r = arg(a, "in"), st = arg(a, "step");
        if (!(b.v.bind.get() instanceof D)) err("Slider працює з дробовим числом (Double): @State private var value = 50.0", line);
        return V("Slider", { bind: b.v.bind, range: r ? r.v : { lo: 0, hi: 1, closed: true }, step: st ? num(st.v) : null });
      }
      case "ProgressView": { const v = arg(a, "value"), tot = arg(a, "total"); return V("Progress", { value: v ? num(v.v) : null, total: tot ? num(tot.v) : 1, label: unl(a).length ? fmt(unl(a)[0].v) : null }); }
      case "NavigationStack": case "NavigationView": return V("Nav", { children: content(a, env, line) });
      case "NavigationLink": {
        const u = unl(a), dst = arg(a, "destination");
        let dest, label;
        if (dst) { dest = dst.v && dst.v.fn ? dst.v : { fn: null, value: dst.v }; label = u.length ? [V("Text", { text: needStr(u[0].v, line, "NavigationLink") })] : content(a, env, line); }
        else if (u.length) { const tr = trail(a); if (!tr) err("Пиши NavigationLink(\"Текст\") { ЕкранКуди() }", line); dest = tr.v; label = [V("Text", { text: needStr(u[0].v, line, "NavigationLink") })]; }
        else { const d = trail(a), l = trail(a, "label"); if (!d || !l) err("Пиши NavigationLink(\"Текст\") { ЕкранКуди() }", line); dest = d.v; label = buildFn(l.v, [], line); }
        return V("Link", { dest, label });
      }
      case "Int": case "Double": case "String": case "Bool": return FUNCS[t] ? FUNCS[t](a, line) : err(`${t}(…) тут не підтримується`, line);
      case "Font": err("Пиши .font(.title)", line);
    }
    err(`${t}(…) у симуляторі поки немає`, line);
  }

  // ----- модифікатори -----
  const MODS = ["font", "bold", "italic", "fontWeight", "underline", "strikethrough", "foregroundColor", "foregroundStyle", "tint", "padding", "frame", "background",
    "overlay", "cornerRadius", "clipShape", "border", "shadow", "opacity", "scaleEffect", "rotationEffect", "offset", "fill", "stroke", "resizable", "scaledToFit",
    "scaledToFill", "aspectRatio", "imageScale", "multilineTextAlignment", "lineLimit", "textCase", "buttonStyle", "controlSize", "disabled", "onTapGesture",
    "navigationTitle", "navigationBarTitleDisplayMode", "listStyle", "listRowBackground", "textFieldStyle", "ignoresSafeArea", "edgesIgnoringSafeArea", "animation",
    "keyboardType", "autocorrectionDisabled", "textInputAutocapitalization", "id", "tag", "onAppear", "kerning", "tracking", "lineSpacing", "fixedSize", "layoutPriority", "symbolRenderingMode", "contentShape", "zIndex", "blur", "grayscale", "toggleStyle", "labelsHidden", "submitLabel", "onSubmit", "minimumScaleFactor", "scrollContentBackground", "transition"];
  function modify(v, name, a, line, env) {
    if (!MODS.includes(name)) {
      const s = similar(name, MODS);
      err(`Модифікатора .${name} немає${s ? `. Можливо, .${s}?` : ""}`, line);
    }
    const A = x => x.v;
    let m = { name, line };
    const u = unl(a);
    switch (name) {
      case "font": if (!a.length) err("Пиши .font(.title)", line); m.font = toFont(A(a[0]), line); break;
      case "fontWeight": m.weight = toWeight(A(a[0]), line); break;
      case "foregroundColor": case "foregroundStyle": case "tint": case "listRowBackground": {
        if (!a.length) err(`Пиши .${name}(.blue)`, line);
        const x = A(a[0]); m.color = x && x.gradient ? { color: x.gradient, gradient: true } : toColor(x, line); break;
      }
      case "padding": {
        m.edges = "all"; m.amount = 16;
        for (const x of a) {
          if (isNum(x.v)) m.amount = num(x.v);
          else if (x.v && x.v.imem !== undefined) { const e = imemName(x.v); if (!["horizontal", "vertical", "top", "bottom", "leading", "trailing", "all"].includes(e)) err("У .padding можна: .horizontal, .vertical, .top, .bottom, .leading, .trailing", line); m.edges = e; }
          else if (Array.isArray(x.v)) m.edges = x.v.map(imemName).join(",");
        }
        break;
      }
      case "frame": {
        for (const x of a) {
          if (!x.label) err("У .frame пиши з назвою: .frame(width: 100, height: 50)", line);
          if (x.label === "alignment") m.alignment = toAlign(x.v, line);
          else if (x.v && x.v.imem === "infinity") m[x.label] = Infinity;
          else if (x.v && x.v.type === "Double" ) m[x.label] = Infinity;
          else if (isNum(x.v)) m[x.label] = num(x.v);
          else if (x.v === null) {}
          else err(`.frame(${x.label}: …) потребує число або .infinity`, line);
          if (!["width", "height", "maxWidth", "maxHeight", "minWidth", "minHeight", "alignment", "idealWidth", "idealHeight"].includes(x.label)) err(`У .frame немає параметра ${x.label}`, line);
        }
        break;
      }
      case "background": case "overlay": {
        const x = a.length ? A(a[0]) : null;
        const inShape = arg(a, "in");
        if (!x && trail(a)) { m.view = buildFn(trail(a).v, [], line); break; }
        if (!x) err(`Пиши .${name}(.yellow) або .${name}(Color.yellow)`, line);
        if (x.view && x.view !== "Gradient") m.view = [x];
        else if (x.gradient) m.fill = x.gradient;
        else m.fill = toColor(x, line).color;
        if (inShape) { const sh = inShape.v; if (!sh || sh.view !== "Shape") err("in: потребує фігуру, наприклад RoundedRectangle(cornerRadius: 12)", line); m.clip = sh; }
        const al = arg(a, "alignment"); if (al) m.alignment = toAlign(al.v, line);
        break;
      }
      case "cornerRadius": m.r = num(A(a[0])); break;
      case "clipShape": { const sh = A(a[0]); if (!sh || sh.view !== "Shape") err(".clipShape потребує фігуру: .clipShape(Circle())", line); m.clip = sh; break; }
      case "border": { m.color = toColor(A(a[0]), line); const w = arg(a, "width"); m.width = w ? num(w.v) : 1; break; }
      case "shadow": { const r = arg(a, "radius"); m.r = r ? num(r.v) : 5; const c = arg(a, "color"); m.color = c ? toColor(c.v, line).color : "rgba(0,0,0,.33)"; m.x = arg(a, "x") ? num(arg(a, "x").v) : 0; m.y = arg(a, "y") ? num(arg(a, "y").v) : 0; break; }
      case "opacity": case "scaleEffect": case "blur": m.v = num(A(a[0])); break;
      case "rotationEffect": { const x = A(a[0]); if (!x || x.imem !== "degrees" || !x.args) err("Пиши .rotationEffect(.degrees(45))", line); m.deg = num(x.args[0].v); break; }
      case "offset": m.x = arg(a, "x") ? num(arg(a, "x").v) : 0; m.y = arg(a, "y") ? num(arg(a, "y").v) : 0; break;
      case "fill": case "stroke": {
        if (v.view !== "Shape") err(`.${name} працює лише з фігурами (Circle, Rectangle…). Для тексту — .foregroundColor`, line);
        const x = A(a[0]); m.paint = x && x.gradient ? x.gradient : toColor(x, line).color; const lw = arg(a, "lineWidth"); m.width = lw ? num(lw.v) : 1; break;
      }
      case "imageScale": m.scale = imemName(A(a[0])); break;
      case "multilineTextAlignment": m.align = toAlign(A(a[0]), line, ["leading", "center", "trailing"]); break;
      case "textCase": m.tc = imemName(A(a[0])); break;
      case "buttonStyle": { const s = imemName(A(a[0])); if (!["borderedProminent", "bordered", "plain", "borderless", "automatic"].includes(s)) err("У .buttonStyle можна: .borderedProminent, .bordered, .plain", line); m.style = s; break; }
      case "controlSize": m.size = imemName(A(a[0])); break;
      case "disabled": m.on = A(a[0]); break;
      case "onTapGesture": { const f = trail(a) || a[a.length - 1]; if (!f || !f.v.fn) err("Пиши .onTapGesture { … }", line); m.action = f.v; break; }
      case "navigationTitle": m.title = fmt(A(a[0])); break;
      case "navigationBarTitleDisplayMode": m.inline = imemName(A(a[0])) === "inline"; break;
      case "textFieldStyle": m.style = imemName(A(a[0])); break;
      case "kerning": case "tracking": case "lineSpacing": m.v = num(A(a[0])); break;
      case "lineLimit": m.v = A(a[0]) === null ? null : num(A(a[0])); break;
      case "aspectRatio": m.fit = imemName((arg(a, "contentMode") || {}).v) || "fit"; break;
    }
    return Object.assign({}, v, { mods: v.mods.concat([m]) });
  }

  // ----- оператори -----
  function runStmts(stmts, env, fnBody) {
    for (const s of stmts) {
      tick(s.line);
      switch (s.k) {
        case "decl": env.def(s.name, s.init ? copy(evalE(s.init, env)) : null, s.kw === "var", s.line); break;
        case "func": env.def(s.f.name, { fn: s.f, self: env.self, isFunc: true }, false); break;
        case "assign": {
          const lv = lvalue(s.target, env);
          let v = evalE(s.value, env);
          if (s.op !== "=") v = binop({ op: s.op[0], l: { k: "_lit", v: lv.get() }, r: { k: "_lit", v }, line: s.line }, env);
          const old = lv.get();
          if (old !== null && old !== undefined && v !== null && typeName(old) !== typeName(v) && !(isNum(old) && isNum(v) && old instanceof D)) {
            if (!(typeof old === "number" && v instanceof D)) err(`${lv.name} має тип ${typeName(old)}, а ти записуєш ${typeName(v)}`, s.line);
            err(`${lv.name} — ціле число (Int), а тут дробове. Оголоси змінну як дробову: = 0.0`, s.line);
          }
          lv.set(old instanceof D && typeof v === "number" ? new D(v) : copy(v));
          break;
        }
        case "if": {
          const branch = cond(s.cond, env);
          if (branch) runStmtsScoped(s.then, branch === true ? env : branch);
          else if (s.els) runStmtsScoped(s.els, env);
          break;
        }
        case "for": {
          const items = toArr(evalE(s.iter, env), s.line);
          for (const x of items) {
            const e = new Env(env); e.def(s.name, x, false);
            try { runStmts(s.body, e); } catch (x2) { if (x2 instanceof Brk) break; if (x2 instanceof Cnt) continue; throw x2; }
          }
          break;
        }
        case "while": {
          while (cond(s.cond, env)) { tick(s.line); try { runStmts(s.body, new Env(env)); } catch (x2) { if (x2 instanceof Brk) break; if (x2 instanceof Cnt) continue; throw x2; } }
          break;
        }
        case "ret": throw new Ret(s.e ? evalE(s.e, env) : undefined);
        case "break": throw new Brk();
        case "continue": throw new Cnt();
        case "expr": {
          const v = evalE(s.e, env);
          if (isView(v) && !fnBody) err("Елементи екрана (Text, Button…) можна писати лише в body чи в стеку, а не в дії кнопки", s.line);
          break;
        }
      }
    }
  }
  function runStmtsScoped(stmts, env) { runStmts(stmts, new Env(env)); }
  function cond(c, env) {
    if (c.k === "iflet") { const v = evalE(c.val, env); if (v === null) return false; const e = new Env(env); e.def(c.name, v, false); return e; }
    const v = evalE(c, env);
    if (typeof v !== "boolean") err("Умова в if має бути true або false", c.line);
    return v;
  }
  // тіло функції чи замикання: return повертає значення
  function runFn(stmts, env) {
    try { runStmts(stmts, env, true); } catch (x) { if (x instanceof Ret) return x.v; if (x instanceof Brk || x instanceof Cnt) err("break/continue можна лише в циклі", 0); throw x; }
    return undefined;
  }

  // ----- body: збираємо елементи екрана -----
  function runBuilder(stmts, env) {
    const out = [];
    for (const s of stmts) {
      tick(s.line);
      if (s.k === "decl") { env.def(s.name, s.init ? copy(evalE(s.init, env)) : null, s.kw === "var"); continue; }
      if (s.k === "if") {
        const b = cond(s.cond, env);
        if (b) out.push(...runBuilder(s.then, b === true ? new Env(env) : b));
        else if (s.els) out.push(...runBuilder(s.els, new Env(env)));
        continue;
      }
      if (s.k === "for") err("У body замість for пиши ForEach: ForEach(0..<5) { i in … }", s.line);
      if (s.k === "assign") err("У body не можна змінювати змінні — це роблять у дії кнопки: Button(\"…\") { x += 1 }", s.line);
      if (s.k === "ret") { if (s.e) out.push(evalE(s.e, env)); return out.filter(isView); }
      if (s.k === "func") { env.def(s.f.name, { fn: s.f, self: env.self, isFunc: true }, false); continue; }
      if (s.k === "expr") {
        const v = evalE(s.e, env);
        if (v === undefined) continue;          // print(…)
        if (isView(v)) { out.push(v); continue; }
        if (v && v.modifier) err(`.${v.modifier} — модифікатор, після нього потрібні дужки: .${v.modifier}()`, s.line);
        if (v && v.type) err(`Після ${v.type} потрібні дужки: ${v.type}(…)`, s.line);
        if (typeof v === "string") err(`Рядок сам по собі не з'явиться на екрані. Загорни його в Text: Text("${v.slice(0, 20)}")`, s.line);
        err(`Тут має бути елемент екрана (Text, Image, Button…), а не ${typeName(v)}`, s.line);
      }
    }
    return out;
  }
  function runBody(stmts, env, isView0) {
    // обчислювана властивість: або «var x: some View { … }», або «var x: Int { return … }»
    if (isView0 !== false) {
      const looksView = stmts.length && stmts.every(s => s.k !== "ret" || true);
      if (isView0) return runBuilder(stmts, env);
      if (looksView && stmts.length === 1 && stmts[0].k === "expr") return evalE(stmts[0].e, env);
    }
    return runFn(stmts, env);
  }

  // тіло власного View
  function bodyOf(self) {
    const b = self.def.props.find(p => p.name === "body");
    if (!b || !b.body) err(`У ${self.def.name} немає var body: some View { … }`, self.def.line);
    const views = runBuilder(b.body, new Env(globalsEnv, self));
    return views;
  }
  // запускаємо глобальні let/var/func
  if (prog.globals.length) runStmts(prog.globals, globalsEnv);

  return { instance, bodyOf, buildFn, callFn, evalE, fmt, err, D };
}

window.SWIFTSIM = { parse, Machine, SwiftErr, fmt, D, COLORS, FONTS };
})();
