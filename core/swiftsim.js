/* Симулятор SwiftUI у браузері: розбирає підмножину Swift і малює екран iPhone.
   Справжнього SwiftUI поза Mac/iPad немає, тож тут — навчальна модель:
   стеки, текст, значки, фігури, модифікатори, кнопки, @State, @Binding, поля вводу, списки, навігація. */
(function () {
"use strict";

// ---------------- помилки ----------------
class SwiftErr extends Error {
  constructor(msg, line) { super(msg); this.line = line || 0; }
}
const err = (msg, line) => { throw new SwiftErr(msg, line); };

// схожі слова для підказок «можливо, ти мала на увазі…»
function lev(a, b) {
  const m = a.length, n = b.length, d = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
function similar(word, list) {
  let best = null, bd = 99;
  for (const w of list) {
    if (w.toLowerCase() === word.toLowerCase()) return w;
    const d = lev(word.toLowerCase(), w.toLowerCase());
    if (d < bd) { bd = d; best = w; }
  }
  return bd <= Math.max(1, Math.floor(word.length / 3)) ? best : null;
}

// ---------------- лексер ----------------
const OPS = ["..<", "...", "==", "!=", "<=", ">=", "&&", "||", "+=", "-=", "*=", "/=", "%=", "->", "??",
  "+", "-", "*", "/", "%", "=", "<", ">", "!", "?", ":", ",", ".", ";", "(", ")", "{", "}", "[", "]", "$", "\\", "&", "@", "#"];
function lex(src, line0) {
  const toks = [];
  let i = 0, line = line0 || 1, nl = true, lineStart = 0, ind = 0;
  const n = src.length;
  // sp — чи був пробіл перед токеном (x?.y і x! пишуться без пробілу, а тернарне ? — з пробілом)
  const push = (t) => { if (nl) ind = i - lineStart; t.line = line; t.nl = nl; t.ind = ind; t.sp = i > 0 && /\s/.test(src[i - 1]); nl = false; toks.push(t); };
  while (i < n) {
    const c = src[i];
    if (c === "\n") { line++; nl = true; i++; lineStart = i; continue; }
    if (c === " " || c === "\t" || c === "\r") { i++; continue; }
    if (c === "/" && src[i + 1] === "/") { while (i < n && src[i] !== "\n") i++; continue; }
    if (c === "/" && src[i + 1] === "*") {
      const start = line; i += 2;
      while (i < n && !(src[i] === "*" && src[i + 1] === "/")) { if (src[i] === "\n") line++; i++; }
      if (i >= n) err("Коментар /* не закрито: допиши */", start);
      i += 2; continue;
    }
    if ("“”„«»".includes(c)) err("Тут «криві» лапки " + c + ". У коді потрібні прямі лапки \" \" — набери їх на англійській розкладці.", line);
    if (c === '"') {
      // рядок з інтерполяцією \( … )
      const multi = src.startsWith('"""', i);
      const startLine = line;
      i += multi ? 3 : 1;
      const parts = []; let buf = "";
      for (;;) {
        if (i >= n) err("Рядок не закрито: бракує \" в кінці", startLine);
        const ch = src[i];
        if (multi ? src.startsWith('"""', i) : ch === '"') { i += multi ? 3 : 1; break; }
        if (ch === "\n" && !multi) err("Рядок не закрито: бракує \" у кінці рядка", startLine);
        if (ch === "\n") line++;
        if (ch === "\\") {
          const e = src[i + 1];
          if (e === "(") {
            // шукаємо парну дужку
            let depth = 1, j = i + 2, inStr = false;
            while (j < n && depth) {
              const cj = src[j];
              if (inStr) { if (cj === "\\") j++; else if (cj === '"') inStr = false; }
              else if (cj === '"') inStr = true;
              else if (cj === "(") depth++;
              else if (cj === ")") depth--;
              else if (cj === "\n") err("Інтерполяцію \\( … ) не закрито", line);
              j++;
            }
            if (depth) err("Інтерполяцію \\( … ) не закрито", line);
            if (buf) parts.push(buf); buf = "";
            parts.push({ src: src.slice(i + 2, j - 1), line });
            i = j; continue;
          }
          buf += { n: "\n", t: "\t", '"': '"', "\\": "\\", "'": "'", "0": "\0" }[e] ?? e;
          i += 2; continue;
        }
        buf += ch; i++;
      }
      if (buf || !parts.length) parts.push(buf);
      if (multi) {
        // прибираємо перший перенос і спільний відступ
        if (typeof parts[0] === "string") parts[0] = parts[0].replace(/^\n/, "");
        const last = parts.length - 1;
        if (typeof parts[last] === "string") parts[last] = parts[last].replace(/\n[ \t]*$/, "");
      }
      push({ t: "str", parts });
      continue;
    }
    if (/[0-9]/.test(c)) {
      let j = i; while (j < n && /[0-9_]/.test(src[j])) j++;
      let dbl = false;
      if (src[j] === "." && /[0-9]/.test(src[j + 1] || "")) { dbl = true; j++; while (j < n && /[0-9_]/.test(src[j])) j++; }
      if (/[eE]/.test(src[j] || "") && /[-+0-9]/.test(src[j + 1] || "")) { dbl = true; j += 2; while (j < n && /[0-9]/.test(src[j])) j++; }
      push({ t: "num", v: Number(src.slice(i, j).replace(/_/g, "")), dbl });
      i = j; continue;
    }
    if (c === "$" && /[0-9]/.test(src[i + 1] || "")) { let j = i + 1; while (/[0-9]/.test(src[j] || "")) j++; push({ t: "id", v: src.slice(i, j) }); i = j; continue; }
    const idm = /^[\p{L}_][\p{L}\p{N}_]*/u.exec(src.slice(i, i + 80));
    if (idm) { push({ t: "id", v: idm[0] }); i += idm[0].length; continue; }
    if (c === "`") { const j = src.indexOf("`", i + 1); if (j < 0) err("Не закрито `", line); push({ t: "id", v: src.slice(i + 1, j) }); i = j + 1; continue; }
    const op = OPS.find(o => src.startsWith(o, i));
    if (op) { push({ t: "op", v: op }); i += op.length; continue; }
    err(`Незрозумілий символ «${c}»`, line);
  }
  toks.push({ t: "eof", line, nl: true });
  return toks;
}

// ---------------- парсер ----------------
const KW = new Set(["struct", "var", "let", "func", "if", "else", "for", "in", "while", "return", "true", "false", "nil", "import", "some", "private", "public", "static", "self", "guard", "switch", "case", "default", "break", "continue", "repeat", "enum", "class", "init", "fileprivate", "internal", "mutating"]);
const PREC = [["??"], ["||"], ["&&"], ["==", "!=", "<", ">", "<=", ">="], ["..<", "..."], ["+", "-"], ["*", "/", "%"]];
// дужки { }: шукаємо незакриту за відступами — так помилка вказує на справжній рядок
function braces(T) {
  const st = [];
  for (const t of T) {
    if (t.t !== "op") continue;
    if (t.v === "{") st.push(t);
    else if (t.v === "}") {
      const o = st.pop();
      if (!o) throw new SwiftErr("Зайва «}» — для неї немає парної «{»", t.line);
      if (t.nl && o.line !== t.line && t.ind < o.ind) throw new SwiftErr(`Блок, відкритий «{» у рядку ${o.line}, не закрито: бракує «}»`, o.line);
    }
  }
  if (st.length) throw new SwiftErr(`Блок, відкритий «{» у рядку ${st[st.length - 1].line}, не закрито: бракує «}»`, st[st.length - 1].line);
}
function parse(src, inner) {
  const T = lex(src);
  if (!inner) braces(T);
  let p = 0;
  const peek = (k = 0) => T[p + k];
  const at = (v, k = 0) => { const t = T[p + k]; return t && (t.t === "op" || t.t === "id") && t.v === v; };
  const next = () => T[p++];
  const lineOf = () => peek().line;
  const show = t => t.t === "eof" ? "кінець коду" : t.t === "str" ? "рядок у лапках" : `«${t.v}»`;
  const expect = (v, why) => {
    if (at(v)) return next();
    const t = peek();
    if (v === "}") err(why || `Не вистачає «}». Перевір, що кожна «{» закрита.`, t.line);
    if (v === ")") err(why || `Очікувала «)», а тут ${show(t)}. Можливо, бракує коми між параметрами або закривної дужки.`, t.line);
    err(why || `Очікувала «${v}», а тут ${show(t)}`, t.line);
  };
  const ident = (what) => {
    const t = peek();
    if (t.t !== "id") err(`Тут має бути ${what || "назва"}, а стоїть ${show(t)}`, t.line);
    p++; return t.v;
  };

  // тип після «:» — запам'ятовуємо як текст і пропускаємо
  function skipType() {
    let s = "";
    if (at("some")) { next(); s += "some "; }
    const one = () => {
      if (at("[")) { next(); s += "["; one(); if (at(":")) { next(); s += ":"; one(); } expect("]"); s += "]"; }
      else if (at("(")) { next(); s += "("; while (!at(")")) { one(); if (at(",")) { next(); s += ","; } else break; } expect(")"); s += ")"; }
      else { s += ident("тип"); while (at(".") && peek(1).t === "id") { next(); s += "." + next().v; }
        if (at("<")) { next(); s += "<"; one(); while (at(",")) { next(); one(); } expect(">"); s += ">"; } }
      while (at("?") || at("!")) s += next().v;
    };
    one();
    return s;
  }

  // ---- програма ----
  const prog = { structs: {}, order: [], preview: null, globals: [] };
  while (peek().t !== "eof") {
    if (at("import")) { next(); ident("модуль"); continue; }
    if (at("#")) {
      next(); const name = ident();
      if (name === "Preview") { if (at("(")) { next(); while (!at(")") && peek().t !== "eof") next(); expect(")"); } prog.preview = block(); continue; }
      err(`Невідомо, що таке #${name}`, lineOf());
    }
    if (at("@")) {
      next(); const a = ident();
      if (a === "main") { // @main struct App — пропускаємо цілком
        while (!at("{") && peek().t !== "eof") next();
        skipBraces(); continue;
      }
      err(`@${a} тут не потрібен`, lineOf());
    }
    if (at("struct")) { const s = struct(); prog.structs[s.name] = s; prog.order.push(s.name); continue; }
    if (at("let") || at("var") || at("func")) { prog.globals.push(statement()); continue; }
    if (at("private") || at("fileprivate")) { next(); continue; }
    err(`Тут очікувала struct, а стоїть ${show(peek())}. Увесь код екрана має бути всередині struct ContentView: View { … }`, lineOf());
  }
  return prog;

  function skipBraces() {
    expect("{"); let d = 1;
    while (d && peek().t !== "eof") { const t = next(); if (t.t === "op" && t.v === "{") d++; else if (t.t === "op" && t.v === "}") d--; }
    if (d) err("Не вистачає «}»", lineOf());
  }

  function struct() {
    const line = next().line;
    const name = ident("назва структури");
    const protos = [];
    if (at(":")) { next(); protos.push(ident("протокол")); while (at(",")) { next(); protos.push(ident("протокол")); } }
    const open = expect("{");
    const s = { name, protos, props: [], funcs: {}, line };
    while (!at("}")) {
      if (peek().t === "eof") err(`Не вистачає «}», щоб закрити struct ${name} (рядок ${open.line})`, lineOf());
      const attrs = [];
      for (;;) {
        if (at("@")) { next(); attrs.push(ident("атрибут")); continue; }
        if (["private", "public", "fileprivate", "internal", "static", "mutating"].some(w => at(w))) { next(); continue; }
        break;
      }
      if (at("var") || at("let")) {
        const kw = next().v, pl = lineOf();
        const pname = ident("назва змінної");
        let type = null, init = null, body = null;
        if (at(":")) { next(); type = skipType(); }
        if (at("=")) { next(); init = expr(); }
        else if (at("{")) { if (kw === "let") err("Обчислювана властивість має бути var, а не let", pl); body = block(); }
        s.props.push({ name: pname, kw, attrs, type, init, body, line: pl });
        continue;
      }
      if (at("func")) { const f = func(); s.funcs[f.name] = f; continue; }
      if (at("init")) err("Власний init у симуляторі не підтримується — Swift сам створює init з властивостей", lineOf());
      if (at("struct")) err("Вкладені struct тут не підтримуються — винеси структуру нижче окремо", lineOf());
      err(`У struct ${name} очікувала var, let або func, а тут ${show(peek())}`, lineOf());
    }
    next();
    return s;
  }

  function func() {
    const line = next().line;
    const name = ident("назва функції");
    expect("(");
    const params = [];
    while (!at(")")) {
      // [зовнішня мітка] ім'я: Тип [= значення]
      let label = ident("параметр"), pname = label;
      if (peek().t === "id") pname = next().v;
      expect(":"); skipType();
      let def = null; if (at("=")) { next(); def = expr(); }
      params.push({ label, name: pname, def });
      if (at(",")) next(); else break;
    }
    expect(")");
    if (at("->")) { next(); skipType(); }
    return { name, params, body: block(), line };
  }

  function block() {
    const open = expect("{");
    const out = [];
    while (!at("}")) {
      if (peek().t === "eof") err(`Не вистачає «}», щоб закрити блок з рядка ${open.line}`, open.line);
      out.push(statement());
      if (at(";")) next();
    }
    next();
    return out;
  }

  function statement() {
    const line = lineOf();
    if (at("let") || at("var")) {
      const kw = next().v;
      const name = ident("назва змінної");
      let type = null; if (at(":")) { next(); type = skipType(); }
      let init = null; if (at("=")) { next(); init = expr(); }
      if (!init && kw === "let") err(`Константі ${name} треба одразу дати значення: let ${name} = …`, line);
      return { k: "decl", kw, name, init, line };
    }
    if (at("func")) { const f = func(); return { k: "func", f, line }; }
    if (at("if")) return ifStmt();
    if (at("for")) {
      next(); const name = at("_") ? (next(), "_") : ident("змінна циклу");
      expect("in"); const iter = expr(true);
      return { k: "for", name, iter, body: block(), line };
    }
    if (at("while")) { next(); const cond = expr(true); return { k: "while", cond, body: block(), line }; }
    if (at("return")) { next(); const e = (at("}") || peek().nl) ? null : expr(); return { k: "ret", e, line }; }
    if (at("break")) { next(); return { k: "break", line }; }
    if (at("continue")) { next(); return { k: "continue", line }; }
    const e = expr();
    for (const op of ["=", "+=", "-=", "*=", "/=", "%="]) if (at(op)) {
      next();
      if (!["id", "member", "sub"].includes(e.k)) err("Ліворуч від " + op + " має бути змінна", line);
      return { k: "assign", op, target: e, value: expr(), line };
    }
    return { k: "expr", e, line };
  }

  function ifStmt() {
    const line = next().line;
    let cond;
    if (at("let") || at("var")) { // if let x = optional
      next(); const name = ident(); expect("="); const val = expr(true);
      cond = { k: "iflet", name, val, line };
    } else cond = expr(true);
    const then = block();
    let els = null;
    if (at("else")) { next(); els = at("if") ? [ifStmt()] : block(); }
    return { k: "if", cond, then, els, line };
  }

  // ---- вирази ----
  function expr(noTrail) { return ternary(noTrail); }
  function ternary(nt) {
    const c = binary(0, nt);
    if (at("?")) {
      const line = next().line; const a = ternary(nt); expect(":", "У тернарному операторі після ? має бути «:»"); const b = ternary(nt);
      return { k: "tern", c, a, b, line };
    }
    return c;
  }
  function binary(lvl, nt) {
    if (lvl >= PREC.length) return unary(nt);
    let l = binary(lvl + 1, nt);
    while (peek().t === "op" && PREC[lvl].includes(peek().v)) {
      // «-» на новому рядку — це не віднімання
      if (peek().nl && (peek().v === "-" || peek().v === "+")) break;
      const t = next();
      const r = binary(lvl + 1, nt);
      l = { k: "bin", op: t.v, l, r, line: t.line };
    }
    return l;
  }
  function unary(nt) {
    if (at("!")) { const line = next().line; return { k: "un", op: "!", e: unary(nt), line }; }
    if (at("-")) { const line = next().line; return { k: "un", op: "-", e: unary(nt), line }; }
    if (at("&")) { next(); return unary(nt); }
    return postfix(primary(nt), nt);
  }
  function args() {
    // ( label: value, value, … )
    const open = expect("(");
    const out = [];
    while (!at(")")) {
      if (peek().t === "eof") err(`Не закрито дужку «(» з рядка ${open.line}`, open.line);
      let label = null;
      if (peek().t === "id" && at(":", 1) && !KW.has(peek().v) || (peek().t === "id" && at(":", 1) && ["in", "for", "default"].includes(peek().v))) { label = next().v; next(); }
      // передати функцію як дію: action: add / action: { … }
      out.push({ label, value: expr() });
      if (at(",")) { next(); continue; }
      if (!at(")")) err(`Очікувала «,» або «)», а тут ${show(peek())}. Можливо, бракує коми між параметрами?`, lineOf());
    }
    next();
    return out;
  }
  function closure() {
    const open = expect("{");
    // { a, b in … } / { (a, b) in … } / { _ in … }
    let params = [];
    let k = p, ok = false; const names = [];
    if (T[k] && T[k].t === "op" && T[k].v === "(") k++;
    while (T[k] && T[k].t === "id" && T[k].v !== "in") { names.push(T[k].v); k++; if (T[k] && T[k].t === "op" && T[k].v === ",") k++; else break; }
    if (T[k] && T[k].t === "op" && T[k].v === ")") k++;
    if (names.length && T[k] && T[k].t === "id" && T[k].v === "in") { ok = true; }
    if (ok) { params = names; p = k + 1; }
    const body = [];
    while (!at("}")) {
      if (peek().t === "eof") err(`Не вистачає «}», щоб закрити блок з рядка ${open.line}`, open.line);
      body.push(statement());
      if (at(";")) next();
    }
    next();
    return { k: "closure", params, body, line: open.line };
  }
  function postfix(e, nt) {
    for (;;) {
      const t = peek();
      if (at("(") && !t.nl) { const a = args(); e = { k: "call", fn: e, args: a, trailing: [], line: t.line }; continue; }
      if (at("[") && !t.nl) { next(); const idx = expr(); expect("]"); e = { k: "sub", obj: e, idx, line: t.line }; continue; }
      if (at(".")) {
        next();
        const nm = peek().t === "num" ? String(next().v) : ident("назва після крапки");
        e = { k: "member", obj: e, name: nm, line: t.line }; continue;
      }
      if (at("!") && !t.sp && !t.nl) { next(); e = { k: "force", e, line: t.line }; continue; }
      if (at("?") && !t.sp && !t.nl) { next(); continue; } // x?.y — спрощено
      if (at("{") && !nt) {
        // кінцеве замикання: VStack { … }, Button("…") { … }
        const c = closure();
        if (e.k !== "call") e = { k: "call", fn: e, args: [], trailing: [], line: t.line };
        e.trailing.push({ label: null, value: c });
        // додаткові: label: { … }
        while (peek().t === "id" && at(":", 1) && at("{", 2)) { const lb = next().v; next(); e.trailing.push({ label: lb, value: closure() }); }
        continue;
      }
      return e;
    }
  }
  function primary(nt) {
    const t = peek();
    if (t.t === "num") { next(); return { k: "num", v: t.v, dbl: t.dbl, line: t.line }; }
    if (t.t === "str") {
      next();
      const parts = t.parts.map(x => typeof x === "string" ? x : { e: parseExprFrom(x.src, x.line), line: x.line });
      return { k: "str", parts, line: t.line };
    }
    if (at("(")) {
      next(); const e = expr();
      if (at(",")) { // кортеж — беремо як масив
        const items = [e]; while (at(",")) { next(); items.push(expr()); } expect(")");
        return { k: "array", items, line: t.line };
      }
      expect(")"); return e;
    }
    if (at("[")) {
      next(); const items = [];
      while (!at("]")) { items.push(expr()); if (at(":")) err("Словники в симуляторі поки не підтримуються", lineOf()); if (at(",")) next(); else break; }
      expect("]", "Не закрито масив: бракує «]»");
      return { k: "array", items, line: t.line };
    }
    if (at(".")) { next(); const name = ident("назва після крапки"); return { k: "imember", name, line: t.line }; }
    if (at("$")) { next(); const name = ident("назва змінної після $"); let e = { k: "id", name, line: t.line }; while (at(".") && peek(1).t === "id" && !at("(", 2)) { next(); e = { k: "member", obj: e, name: next().v, line: t.line }; } return { k: "binding", e, line: t.line }; }
    if (at("\\")) { next(); expect("."); const path = [ident()]; while (at(".")) { next(); path.push(ident()); } return { k: "keypath", path, line: t.line }; }
    if (at("{")) return closure();
    if (t.t === "id") {
      next();
      if (t.v === "true" || t.v === "false") return { k: "bool", v: t.v === "true", line: t.line };
      if (t.v === "nil") return { k: "nil", line: t.line };
      if (t.v === "self") return { k: "self", line: t.line };
      if (t.v === "if" || t.v === "for" || t.v === "while") err(`${t.v} тут не можна використати як значення`, t.line);
      return { k: "id", name: t.v, line: t.line };
    }
    if (t.t === "eof") err("Код обірвався: чогось бракує в кінці (дужки чи значення)", t.line);
    err(`Неочікуване ${show(t)}`, t.line);
  }
}
function parseExprFrom(src, line) {
  // вираз усередині \( … ) у рядку
  const prog = parse("struct __I { var __v = " + src + "\n}", true);
  const e = prog.structs.__I.props[0].init;
  const fix = n => { if (n && typeof n === "object") { if (n.line) n.line = line; for (const k in n) if (k !== "line") fix(n[k]); } };
  fix(e);
  return e;
}

window.SWIFTSIM_PARSE = { lex, parse, SwiftErr, similar };
})();
