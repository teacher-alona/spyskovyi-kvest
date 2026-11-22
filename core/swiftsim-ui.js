/* Симулятор SwiftUI — малюємо екран iPhone з дерева елементів */
(function () {
"use strict";
const { parse, Machine, SwiftErr, fmt, D } = window.SWIFTSIM;

// SF Symbols → значки Material Symbols (схожі за змістом)
const SYM = {
  star: "star", heart: "favorite", house: "home", person: "person", "person.2": "group", "person.3": "groups", gear: "settings", gearshape: "settings", globe: "public",
  bell: "notifications", cart: "shopping_cart", bag: "shopping_bag", magnifyingglass: "search", trash: "delete", plus: "add", minus: "remove", checkmark: "check",
  xmark: "close", pencil: "edit", "square.and.pencil": "edit_square", "cloud.sun": "partly_cloudy_day", "sun.max": "light_mode", sun: "light_mode", "moon": "dark_mode", "moon.stars": "bedtime",
  cloud: "cloud", "cloud.rain": "rainy", "cloud.snow": "weather_snowy", "cloud.bolt": "thunderstorm", snowflake: "ac_unit", bolt: "bolt", flame: "local_fire_department", drop: "water_drop",
  leaf: "eco", tree: "park", pawprint: "pets", cat: "pets", dog: "pets", hare: "cruelty_free", tortoise: "cruelty_free", bird: "flutter_dash", fish: "set_meal", ant: "bug_report", ladybug: "bug_report",
  book: "menu_book", "books.vertical": "library_books", "music.note": "music_note", "music.note.list": "queue_music", camera: "photo_camera", photo: "image", "photo.on.rectangle": "photo_library",
  envelope: "mail", phone: "call", message: "chat", bubble: "chat_bubble", "bubble.left": "chat_bubble", location: "near_me", "location.circle": "my_location", mappin: "location_on", map: "map", clock: "schedule", alarm: "alarm",
  calendar: "calendar_month", gamecontroller: "sports_esports", car: "directions_car", bus: "directions_bus", tram: "tram", airplane: "flight", bicycle: "pedal_bike", "figure.walk": "directions_walk",
  "figure.run": "directions_run", "cup.and.saucer": "coffee", "fork.knife": "restaurant", "birthday.cake": "cake", carrot: "nutrition", gift: "redeem", bookmark: "bookmark", flag: "flag", lock: "lock",
  "lock.open": "lock_open", key: "key", lightbulb: "lightbulb", trophy: "emoji_events", medal: "military_tech", crown: "crown", play: "play_arrow", pause: "pause", stop: "stop",
  "forward": "fast_forward", "backward": "fast_rewind", shuffle: "shuffle", repeat: "repeat", "chevron.right": "chevron_right", "chevron.left": "chevron_left", "chevron.up": "expand_less",
  "chevron.down": "expand_more", "arrow.right": "arrow_forward", "arrow.left": "arrow_back", "arrow.up": "arrow_upward", "arrow.down": "arrow_downward", "arrow.clockwise": "refresh",
  "arrow.counterclockwise": "undo", "arrow.uturn.backward": "undo", info: "info", "info.circle": "info", questionmark: "question_mark", "questionmark.circle": "help", "exclamationmark.triangle": "warning",
  exclamationmark: "priority_high", "hand.thumbsup": "thumb_up", "hand.thumbsdown": "thumb_down", "hand.wave": "waving_hand", "face.smiling": "sentiment_satisfied", "square.and.arrow.up": "ios_share",
  "list.bullet": "list", "checklist": "checklist", paperplane: "send", laptopcomputer: "laptop", desktopcomputer: "desktop_windows", iphone: "smartphone", ipad: "tablet", applewatch: "watch",
  wifi: "wifi", "battery.100": "battery_full", "battery.25": "battery_2_bar", "speaker.wave.2": "volume_up", "speaker.slash": "volume_off", mic: "mic", headphones: "headphones", tv: "tv",
  keyboard: "keyboard", graduationcap: "school", paintbrush: "brush", paintpalette: "palette", scissors: "content_cut", hammer: "construction", wrench: "build", "wrench.and.screwdriver": "handyman",
  sparkles: "auto_awesome", "wand.and.stars": "auto_fix_high", eye: "visibility", "eye.slash": "visibility_off", "person.crop.circle": "account_circle", "house.circle": "home",
  square: "square", circle: "circle", triangle: "change_history", "hexagon": "hexagon", "rectangle": "rectangle", "dollarsign": "attach_money", "creditcard": "credit_card", "basket": "shopping_basket",
  "film": "movie", "theatermasks": "theater_comedy", "puzzlepiece": "extension", "brain": "psychology", "atom": "science", "flask": "science", "globe.europe.africa": "public",
  "figure.soccer": "sports_soccer", "soccerball": "sports_soccer", "basketball": "sports_basketball", "tennisball": "sports_tennis", "dumbbell": "fitness_center", "bed.double": "bed",
  "tshirt": "apparel", "umbrella": "umbrella", "thermometer": "thermostat", "wind": "air", "tornado": "cyclone", "rainbow": "looks", "mountain.2": "landscape", "sailboat": "sailing", "ferry": "directions_boat",
  "folder": "folder", "doc": "description", "doc.text": "description", "paperclip": "attach_file", "link": "link", "printer": "print", "externaldrive": "hard_drive", "cpu": "memory",
  "number": "tag", "textformat": "text_fields", "quote.bubble": "format_quote", "hand.raised": "pan_tool", "figure.wave": "emoji_people", "teddybear": "toys", "balloon": "celebration", "party.popper": "celebration",
};
function symbolOf(name) {
  let n = name, fill = false;
  if (n.endsWith(".fill")) { fill = true; n = n.slice(0, -5); }
  let circ = false;
  if (n.endsWith(".circle") && !SYM[n]) { circ = true; n = n.slice(0, -7); if (n.endsWith(".fill")) { fill = true; n = n.slice(0, -5); } }
  const base = SYM[n];
  if (!base) return null;
  const circled = { add: "add_circle", remove: "do_not_disturb_on", check: "check_circle", close: "cancel", person: "account_circle", play_arrow: "play_circle", pause: "pause_circle", info: "info", help: "help", star: "stars", favorite: "favorite" };
  return { icon: circ ? (circled[base] || base) : base, fill };
}

const h = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };

function mount(host, opts) {
  opts = opts || {};
  host.classList.add("sx-host");
  host.innerHTML = `<div class="sx-scale"><div class="sx-phone"><div class="sx-screen">
    <div class="sx-status"><span>9:41</span><span class="sx-isl"></span><span class="sx-stat-r"><i class="sx-sym" aria-hidden="true">signal_cellular_alt</i><i class="sx-sym" aria-hidden="true">wifi</i><i class="sx-sym sx-bat" aria-hidden="true">battery_full</i></span></div>
    <div class="sx-safe"></div><div class="sx-home"></div><div class="sx-errbox" hidden></div></div></div></div>`;
  const scaleBox = host.querySelector(".sx-scale"), phone = host.querySelector(".sx-phone"), safe = host.querySelector(".sx-safe"), errbox = host.querySelector(".sx-errbox");
  const W = 390, H = 844;
  const fit = () => {
    const w = host.clientWidth || W;
    const k = Math.min(1, w / (W + 24), opts.maxHeight ? opts.maxHeight / (H + 24) : 1);
    phone.style.transform = `scale(${k})`;
    scaleBox.style.width = (W + 24) * k + "px"; scaleBox.style.height = (H + 24) * k + "px";
  };
  fit();
  if (window.ResizeObserver) new ResizeObserver(fit).observe(host);

  let prog = null, store = new Map(), machine = null, lastErr = null, logs = [];
  const log = s => { logs.push(s); opts.onLog && opts.onLog(s); };

  function setSource(src) {
    lastErr = null;
    try { prog = parse(src); }
    catch (e) { return fail(e); }
    // новий код — як у Xcode Preview: усе починається спочатку
    store = new Map(); logs = []; opts.onReset && opts.onReset();
    return render();
  }
  function reset() { store = new Map(); logs = []; return render(); }
  function fail(e) {
    if (!(e instanceof SwiftErr)) { console.error(e); e = new SwiftErr("Симулятор не зміг виконати цей код: " + e.message, 0); }
    lastErr = e;
    errbox.hidden = false;
    errbox.innerHTML = `<b>Помилка${e.line ? " у рядку " + e.line : ""}</b>${escapeHtml(e.message)}`;
    opts.onError && opts.onError(e);
    return { ok: false, error: e };
  }
  function rootDef() {
    if (prog.structs.ContentView) return prog.structs.ContentView;
    // #Preview { ІншийView() }
    if (prog.preview) { const s = prog.preview[0]; const nm = s && s.e && s.e.fn && s.e.fn.name; if (nm && prog.structs[nm]) return prog.structs[nm]; }
    const v = prog.order.map(n => prog.structs[n]).find(s => s.protos.includes("View"));
    if (!v) throw new SwiftErr("Немає жодного екрана: створи struct ContentView: View { var body: some View { … } }", 1);
    return v;
  }
  let rendering = false, dirty = false;
  function render() {
    if (!prog) return { ok: false };
    const focus = document.activeElement && safe.contains(document.activeElement) ? { key: document.activeElement.dataset.key, s: document.activeElement.selectionStart, e: document.activeElement.selectionEnd } : null;
    rendering = true;
    try {
      machine = Machine(prog, { store, log, changed: () => { dirty = true; } });
      const def = rootDef();
      const inst = machine.instance(def, [], "root", def.line);
      const views = machine.bodyOf(inst);
      const ctx = { path: "root", axis: "cell", nav: null };
      const res = views.length === 1 ? node(views[0], ctx) : node({ view: "VStack", align: "center", spacing: null, children: views, mods: [] }, ctx);
      safe.innerHTML = "";
      place(res, "cell");
      safe.appendChild(res.el);
      errbox.hidden = true;
      opts.onRender && opts.onRender();
    } catch (e) {
      rendering = false;
      return fail(e);
    }
    rendering = false;
    if (focus && focus.key) { const f = safe.querySelector(`[data-key="${CSS.escape(focus.key)}"]`); if (f) { f.focus(); try { f.setSelectionRange(focus.s, focus.e); } catch (_) {} } }
    return { ok: true };
  }
  // дія користувача: виконати й перемалювати
  function act(fn) {
    try { fn(); } catch (e) { fail(e); return; }
    render();
  }

  // ---------- вузли ----------
  function flatten(views, ctx) {
    const out = [];
    for (const v of views) {
      if (v.view === "Group") {
        const kids = flatten(v.children, ctx);
        out.push(...kids.map(k => v.mods.length ? Object.assign({}, k, { mods: k.mods.concat(v.mods) }) : k));
      } else out.push(v);
    }
    return out;
  }
  function children(list, ctx, axis) {
    const out = [];
    flatten(list, ctx).forEach((v, i) => {
      if (v.view === "Custom") {
        // власний View: розгортаємо в його body; кілька елементів — як група
        const path = ctx.path + "/" + i + ":" + v.def.name;
        const inst = machine.instance(v.def, v.args, path, v.line);
        let body = machine.bodyOf(inst);
        body = flatten(body, ctx);
        if (body.length === 1) { out.push(node(Object.assign({}, body[0], { mods: body[0].mods.concat(v.mods) }), Object.assign({}, ctx, { path }))); return; }
        body.forEach((b, j) => out.push(node(Object.assign({}, b, { mods: b.mods.concat(v.mods) }), Object.assign({}, ctx, { path: path + "." + j }))));
        return;
      }
      out.push(node(v, Object.assign({}, ctx, { path: ctx.path + "/" + i })));
    });
    out.forEach(r => place(r, axis));
    return out;
  }
  function single(v, ctx) { const r = children([v], ctx, "cell"); return r.length === 1 ? r[0] : stack("VStack", r, "center", null); }

  function node(v, ctx) {
    let r;
    if (v.color !== undefined && !v.view) { const el = h("div", "sx-color"); el.style.background = v.color; el.dataset.sx = "Color"; el.dataset.color = v.color; r = { el, gh: true, gv: true }; return mods(r, v.mods || [], ctx, v); }
    switch (v.view) {
      case "Custom": return single(v, ctx);
      case "Gradient": { const el = h("div", "sx-color"); el.style.background = v.gradient; r = { el, gh: true, gv: true }; break; }
      case "Text": { const el = h("div", "sx-text", v.text); el.dataset.sx = "Text"; r = { el }; break; }
      case "Image": {
        if (v.asset !== undefined) { const el = h("div", "sx-asset"); el.innerHTML = `<i class="sx-sym">image</i><span>${escapeHtml(v.asset)}</span>`; el.dataset.sx = "Image"; el.dataset.asset = v.asset; r = { el }; break; }
        r = { el: icon(v.symbol), sym: true }; break;
      }
      case "Label": { const el = h("div", "sx-label"); el.append(icon(v.symbol), h("span", "sx-text", v.text)); el.dataset.sx = "Label"; el.dataset.text = v.text; r = { el }; break; }
      case "Button": {
        const el = h("button", "sx-btn"); el.type = "button"; el.dataset.sx = "Button";
        const kids = children(v.label, Object.assign({}, ctx, { path: ctx.path + "/l" }), "h");
        kids.forEach(k => el.appendChild(k.el));
        el.dataset.label = el.textContent.trim();
        const m0 = machine;
        el.onclick = () => act(() => m0.callFn(v.action, [], v.line));
        r = { el, gh: kids.some(k => k.gh), gv: kids.some(k => k.gv) };
        break;
      }
      case "VStack": case "HStack": case "ZStack": {
        const axis = v.view === "VStack" ? "v" : v.view === "HStack" ? "h" : "z";
        const kids = children(v.children, ctx, axis);
        r = stack(v.view, kids, v.align, v.spacing);
        break;
      }
      case "ScrollView": {
        const el = h("div", "sx-scroll" + (v.horizontal ? " hz" : "")); const inner = h("div", "sx-vstack" + (v.horizontal ? " sx-hrow" : ""));
        const kids = children(v.children, ctx, v.horizontal ? "h" : "v"); kids.forEach(k => inner.appendChild(k.el));
        inner.style.gap = "8px"; el.appendChild(inner); el.dataset.sx = "ScrollView";
        r = { el, gh: true, gv: true }; break;
      }
      case "Spacer": { const el = h("div", "sx-spacer"); r = { el, spacer: true, min: v.min }; break; }
      case "Divider": { const el = h("div", "sx-divider"); r = { el, divider: true }; break; }
      case "Shape": {
        const el = h("div", "sx-shape sx-" + v.shape.toLowerCase()); el.dataset.sx = v.shape;
        if (v.shape === "RoundedRectangle") el.style.borderRadius = v.radius + "px";
        r = { el, gh: true, gv: true, shape: v.shape }; break;
      }
      case "List": r = list(v, ctx); break;
      case "Section": r = list({ view: "List", children: [v], mods: [] }, ctx); break;
      case "Toggle": {
        const el = h("div", "sx-toggle"); el.dataset.sx = "Toggle";
        const lab = h("div", "sx-tlabel"); children(v.label, Object.assign({}, ctx, { path: ctx.path + "/l" }), "h").forEach(k => lab.appendChild(k.el));
        const on = v.bind.get() === true;
        const sw = h("button", "sx-switch" + (on ? " on" : "")); sw.type = "button"; sw.setAttribute("aria-pressed", on); sw.innerHTML = "<span></span>";
        sw.onclick = () => act(() => v.bind.set(!on));
        el.append(lab, sw); el.dataset.label = lab.textContent.trim(); el.dataset.on = on;
        r = { el, gh: true }; break;
      }
      case "TextField": {
        const el = h("input", "sx-field"); el.type = v.secure ? "password" : "text"; el.placeholder = v.placeholder; el.value = v.bind.get(); el.dataset.sx = "TextField"; el.dataset.key = ctx.path; el.dataset.placeholder = v.placeholder;
        el.autocomplete = "off"; el.spellcheck = false;
        el.oninput = () => act(() => v.bind.set(el.value));
        r = { el, gh: true }; break;
      }
      case "Stepper": {
        const el = h("div", "sx-stepper"); el.dataset.sx = "Stepper";
        const lab = h("div", "sx-tlabel"); children(v.label, Object.assign({}, ctx, { path: ctx.path + "/l" }), "h").forEach(k => lab.appendChild(k.el));
        const ctl = h("div", "sx-stepctl"); const minus = h("button", null, "−"), plus = h("button", null, "+"); minus.type = plus.type = "button";
        const cur = v.bind.get(), step = v.step, isD = cur instanceof D, val = isD ? cur.v : cur, st = step instanceof D ? step.v : step;
        const lo = v.range ? v.range.lo : -Infinity, hi = v.range ? (v.range.closed ? v.range.hi : v.range.hi - 1) : Infinity;
        const set = x => v.bind.set(isD ? new D(x) : x);
        minus.disabled = val - st < lo; plus.disabled = val + st > hi;
        minus.onclick = () => act(() => set(val - st)); plus.onclick = () => act(() => set(val + st));
        minus.dataset.step = "-"; plus.dataset.step = "+";
        ctl.append(minus, h("i"), plus); el.append(lab, ctl); el.dataset.label = lab.textContent.trim();
        r = { el, gh: true }; break;
      }
      case "Slider": {
        const el = h("input", "sx-slider"); el.type = "range"; el.dataset.sx = "Slider"; el.dataset.key = ctx.path;
        el.min = v.range.lo; el.max = v.range.hi; el.step = v.step || "any"; el.value = v.bind.get().v;
        el.oninput = () => act(() => v.bind.set(new D(Number(el.value))));
        r = { el, gh: true }; break;
      }
      case "Progress": {
        const el = h("div", "sx-progress"); el.dataset.sx = "ProgressView";
        if (v.value === null) el.classList.add("spin");
        else { const b = h("div"); b.style.width = Math.max(0, Math.min(1, v.value / v.total)) * 100 + "%"; el.appendChild(b); }
        r = { el, gh: v.value !== null }; break;
      }
      case "Nav": r = nav(v, ctx); break;
      case "Link": {
        const el = h("button", "sx-btn sx-link"); el.type = "button"; el.dataset.sx = "NavigationLink";
        children(v.label, Object.assign({}, ctx, { path: ctx.path + "/l" }), "h").forEach(k => el.appendChild(k.el));
        el.dataset.label = el.textContent.trim();
        const navc = ctx.nav;
        el.onclick = () => act(() => { if (!navc) throw new SwiftErr("NavigationLink працює лише всередині NavigationStack { … }", v.line); navc.push({ dest: v.dest, line: v.line }); });
        r = { el, link: true }; break;
      }
      default: throw new SwiftErr(`${v.view} не вдалося показати`, v.line);
    }
    return mods(r, v.mods || [], ctx, v);
  }
  function icon(name) {
    const el = h("i", "sx-sym");
    el.dataset.sx = "Image"; el.dataset.symbol = name;
    const die = /^die\.face\.([1-6])(\.fill)?$/.exec(name);
    if (die) { el.className = "sx-die"; el.textContent = "⚀⚁⚂⚃⚄⚅"[die[1] - 1]; return el; }
    const s = symbolOf(name);
    if (!s) { el.classList.add("sx-nosym"); el.textContent = "question_mark"; el.title = `Значка «${name}» у симуляторі немає`; log(`⚠️ Значка «${name}» у симуляторі немає — на iPhone він може бути. Перевір назву в SF Symbols.`); return el; }
    el.textContent = s.icon;
    if (s.fill) el.classList.add("fill");
    return el;
  }
  function stack(kind, kids, align, spacing) {
    const el = h("div", "sx-" + kind.toLowerCase()); el.dataset.sx = kind;
    el.dataset.align = align || "center";
    if (spacing !== null && spacing !== undefined) el.style.gap = spacing + "px";
    kids.forEach(k => el.appendChild(k.el));
    if (kind === "VStack") return { el, gh: kids.some(k => k.gh || k.divider), gv: kids.some(k => k.gv || k.spacer) };
    if (kind === "HStack") return { el, gh: kids.some(k => k.gh || k.spacer), gv: kids.some(k => k.gv || k.divider) };
    return { el, gh: kids.some(k => k.gh), gv: kids.some(k => k.gv) };
  }
  // як дитина займає місце в батьківському контейнері
  function place(r, axis) {
    const s = r.el.style;
    if (axis === "v") {
      if (r.spacer) { s.flex = "1 1 0"; s.minHeight = (r.min ?? 8) + "px"; }
      else if (r.divider) { s.alignSelf = "stretch"; s.height = "1px"; }
      else { if (r.gv) { s.flex = "1 1 0"; s.minHeight = "0"; } else s.flex = "0 0 auto"; if (r.gh) s.alignSelf = "stretch"; }
    } else if (axis === "h") {
      if (r.spacer) { s.flex = "1 1 0"; s.minWidth = (r.min ?? 8) + "px"; }
      else if (r.divider) { s.alignSelf = "stretch"; s.width = "1px"; }
      else { if (r.gh) { s.flex = "1 1 0"; s.minWidth = "0"; } else s.flex = "0 1 auto"; if (r.gv) s.alignSelf = "stretch"; }
    } else {
      if (r.gh) s.justifySelf = "stretch"; if (r.gv) s.alignSelf = "stretch";
      if (r.divider) { s.justifySelf = "stretch"; s.height = "1px"; }
    }
  }
  function wrap(r, cls) {
    const w = h("div", "sx-w" + (cls ? " " + cls : ""));
    w.appendChild(r.el);
    const s = r.el.style; s.flex = ""; s.alignSelf = ""; s.justifySelf = ""; s.minWidth = ""; s.minHeight = "";
    place(Object.assign({}, r, { spacer: false }), "cell");
    return Object.assign({}, r, { el: w, spacer: false, divider: false });
  }

  // ---------- список ----------
  function list(v, ctx) {
    const el = h("div", "sx-list"); el.dataset.sx = "List";
    const items = flatten(v.children, ctx);
    let group = null;
    const newGroup = (header) => { if (header) el.appendChild(h("div", "sx-lhead", header)); group = h("div", "sx-lgroup"); el.appendChild(group); };
    items.forEach((it, i) => {
      if (it.view === "Section") {
        newGroup(it.header);
        flatten(it.children, ctx).forEach((c, j) => row(c, Object.assign({}, ctx, { path: ctx.path + "/" + i + "." + j })));
        group = null; return;
      }
      if (!group) newGroup(null);
      row(it, Object.assign({}, ctx, { path: ctx.path + "/" + i }));
    });
    function row(c, rctx) {
      const rw = h("div", "sx-row");
      const kids = children([c], rctx, "h");
      kids.forEach(k => rw.appendChild(k.el));
      const bg = (c.mods || []).find(m => m.name === "listRowBackground"); if (bg) rw.style.background = bg.color.color;
      const link = kids.find(k => k.link);
      if (link) { rw.classList.add("sx-lrow"); link.el.classList.add("in-list"); link.el.style.flex = "1 1 0"; link.el.appendChild(h("i", "sx-sym sx-chev", "chevron_right")); }
      group.appendChild(rw);
    }
    return { el, gh: true, gv: true };
  }

  // ---------- навігація ----------
  function nav(v, ctx) {
    const key = "nav:" + ctx.path;
    const stackArr = store.get(key) || [];
    const el = h("div", "sx-nav"); el.dataset.sx = "NavigationStack";
    const navc = { title: null, inline: false, push: e => { store.set(key, (store.get(key) || []).concat([e])); } };
    let views;
    const top = stackArr[stackArr.length - 1];
    if (top) views = top.dest.fn ? machine.buildFn(top.dest, [], top.line) : [top.dest.value];
    else views = v.children;
    const inner = h("div", "sx-navbody");
    const kids = children(views, Object.assign({}, ctx, { nav: navc, path: ctx.path + "/n" + stackArr.length }), "v");
    kids.forEach(k => inner.appendChild(k.el));
    // вміст навігації починається згори
    if (!kids.some(k => k.gv)) inner.classList.add("top");
    const bar = h("div", "sx-navbar");
    if (top) {
      const back = h("button", "sx-back"); back.type = "button"; back.innerHTML = `<i class="sx-sym">chevron_left</i>Назад`; back.dataset.sx = "Back";
      back.onclick = () => act(() => store.set(key, stackArr.slice(0, -1)));
      bar.appendChild(back);
      if (navc.title) bar.appendChild(h("div", "sx-navinline", navc.title));
      el.append(bar, inner);
    } else {
      if (navc.title && navc.inline) { bar.appendChild(h("div", "sx-navinline", navc.title)); el.append(bar, inner); }
      else { el.appendChild(bar); if (navc.title) { const t = h("div", "sx-largetitle", navc.title); t.dataset.sx = "NavigationTitle"; el.appendChild(t); } el.appendChild(inner); }
    }
    if (navc.title) el.dataset.title = navc.title;
    return { el, gh: true, gv: true };
  }

  // ---------- модифікатори ----------
  const FW = { 100: 100, 200: 200, 300: 300, 400: 400, 500: 500, 600: 600, 700: 700, 800: 800, 900: 900 };
  function mods(r, list0, ctx, v) {
    for (const m of list0) {
      const s = r.el.style;
      switch (m.name) {
        case "font": { const f = m.font; s.fontSize = f.size + "px"; s.fontWeight = FW[f.weight] || 400; if (f.italic) s.fontStyle = "italic"; if (f.rounded) s.fontFamily = "ui-rounded, 'SF Pro Rounded', Nunito, system-ui, sans-serif"; if (f.mono) s.fontFamily = "ui-monospace, 'JetBrains Mono', monospace"; r.el.dataset.font = f.font; break; }
        case "bold": s.fontWeight = 700; r.el.dataset.bold = 1; break;
        case "italic": s.fontStyle = "italic"; break;
        case "fontWeight": s.fontWeight = m.weight; break;
        case "underline": s.textDecoration = "underline"; break;
        case "strikethrough": s.textDecoration = "line-through"; break;
        case "foregroundColor": case "foregroundStyle":
          if (m.color.gradient) { s.backgroundImage = m.color.color; s.webkitBackgroundClip = "text"; s.backgroundClip = "text"; s.color = "transparent"; if (r.shape) { s.background = m.color.color; } }
          else { s.color = m.color.color; if (r.sym) r.el.dataset.color = m.color.color; }
          r.el.dataset.fg = m.color.color; break;
        case "tint": s.setProperty("--accent", m.color.color); r.el.dataset.tint = m.color.color; break;
        case "padding": {
          r = wrap(r, "sx-pad");
          const a = m.amount + "px", e = m.edges;
          const ps = { top: 0, bottom: 0, left: 0, right: 0 };
          for (const part of String(e).split(",")) {
            if (part === "all") ps.top = ps.bottom = ps.left = ps.right = a;
            if (part === "horizontal") ps.left = ps.right = a;
            if (part === "vertical") ps.top = ps.bottom = a;
            if (part === "top") ps.top = a; if (part === "bottom") ps.bottom = a; if (part === "leading") ps.left = a; if (part === "trailing") ps.right = a;
          }
          r.el.style.padding = `${ps.top || 0} ${ps.right || 0} ${ps.bottom || 0} ${ps.left || 0}`;
          break;
        }
        case "frame": {
          const resizable = r.resizable;
          r = wrap(r, "sx-frame");
          const fs = r.el.style;
          if (m.width !== undefined && m.width !== Infinity) { fs.width = m.width + "px"; r.gh = false; }
          if (m.height !== undefined && m.height !== Infinity) { fs.height = m.height + "px"; r.gv = false; }
          if (m.maxWidth === Infinity) r.gh = true; else if (m.maxWidth !== undefined) { fs.maxWidth = m.maxWidth + "px"; }
          if (m.maxHeight === Infinity) r.gv = true; else if (m.maxHeight !== undefined) fs.maxHeight = m.maxHeight + "px";
          if (m.minWidth !== undefined) fs.minWidth = m.minWidth + "px";
          if (m.minHeight !== undefined) fs.minHeight = m.minHeight + "px";
          const al = m.alignment || "center";
          const jx = /eading/.test(al) ? "start" : /railing/.test(al) ? "end" : "center", jy = /^top/.test(al) ? "start" : /^bottom/.test(al) ? "end" : "center";
          fs.justifyItems = jx; fs.alignItems = jy;
          const inner = r.el.firstChild;
          if (al !== "center" && inner && inner.classList.contains("sx-text")) inner.style.textAlign = jx === "start" ? "left" : jx === "end" ? "right" : "center";
          if (resizable) { const w = m.width !== undefined && m.width !== Infinity ? m.width : null, hh = m.height !== undefined && m.height !== Infinity ? m.height : null; const sz = Math.min(w || hh || 100, hh || w || 100); inner.style.fontSize = sz + "px"; inner.style.justifySelf = "center"; inner.style.alignSelf = "center"; }
          r.el.dataset.frame = [m.width, m.height].join("x");
          break;
        }
        case "background": case "overlay": {
          if (m.view) {
            if (!r.el.classList.contains("sx-w")) r = wrap(r, "");
            const layer = h("div", "sx-layer " + (m.name === "background" ? "bg" : "ov"));
            const al = m.alignment || "center";
            layer.style.justifyItems = /eading/.test(al) ? "start" : /railing/.test(al) ? "end" : "center";
            layer.style.alignItems = /^top/.test(al) ? "start" : /^bottom/.test(al) ? "end" : "center";
            const kids = children(m.view, Object.assign({}, ctx, { path: ctx.path + "/" + m.name }), "cell");
            kids.forEach(k => layer.appendChild(k.el));
            if (m.name === "background") r.el.insertBefore(layer, r.el.firstChild); else r.el.appendChild(layer);
            r.el.style.position = "relative";
            const colorKid = m.view[0] && (m.view[0].color || (m.view[0].mods.find(x => x.name === "fill") || {}).paint);
            if (m.name === "background" && colorKid) r.el.dataset.bg = typeof colorKid === "string" ? colorKid : "";
            break;
          }
          if (m.name === "overlay") break;
          if (r.el.dataset.bg || r.el.classList.contains("sx-text") || r.el.tagName === "BUTTON" || r.el.tagName === "INPUT") r = wrap(r, "");
          r.el.style.background = m.fill;
          r.el.dataset.bg = m.fill;
          if (m.clip) clip(r, m.clip);
          break;
        }
        case "cornerRadius": s.borderRadius = m.r + "px"; s.overflow = "hidden"; r.el.dataset.radius = m.r; break;
        case "clipShape": clip(r, m.clip); break;
        case "border": { if (!r.el.classList.contains("sx-w")) r = wrap(r, ""); const b = h("div", "sx-border"); b.style.border = `${m.width}px solid ${m.color.color}`; r.el.style.position = "relative"; r.el.appendChild(b); r.el.dataset.border = m.color.color; break; }
        case "shadow": s.filter = (s.filter || "") + ` drop-shadow(${m.x}px ${m.y}px ${Math.max(0, m.r) / 2}px ${m.color})`; r.el.dataset.shadow = 1; break;
        case "opacity": if (s.opacity) r = wrap(r, ""); r.el.style.opacity = m.v; break;
        case "blur": s.filter = (s.filter || "") + ` blur(${m.v / 2}px)`; break;
        case "grayscale": s.filter = (s.filter || "") + " grayscale(1)"; break;
        case "scaleEffect": s.transform = (s.transform || "") + ` scale(${m.v})`; break;
        case "rotationEffect": s.transform = (s.transform || "") + ` rotate(${m.deg}deg)`; break;
        case "offset": s.transform = (s.transform || "") + ` translate(${m.x}px, ${m.y}px)`; break;
        case "fill": if (/gradient/.test(m.paint)) s.background = m.paint; else s.background = m.paint; r.el.dataset.fill = m.paint; break;
        case "stroke": s.background = "transparent"; s.border = `${m.width}px solid ${m.paint}`; s.boxSizing = "border-box"; r.el.dataset.stroke = m.paint; break;
        case "resizable": r.resizable = true; r.el.style.fontSize = "120px"; break;
        case "scaledToFit": case "scaledToFill": case "aspectRatio": break;
        case "imageScale": { const k = { small: .75, medium: 1, large: 1.4 }[m.scale] || 1; s.fontSize = 1.15 * k + "em"; break; }
        case "multilineTextAlignment": s.textAlign = { leading: "left", center: "center", trailing: "right" }[m.align]; r.el.dataset.talign = m.align; break;
        case "lineLimit": if (m.v) { s.display = "-webkit-box"; s.webkitLineClamp = m.v; s.webkitBoxOrient = "vertical"; s.overflow = "hidden"; } break;
        case "textCase": s.textTransform = m.tc === "uppercase" ? "uppercase" : m.tc === "lowercase" ? "lowercase" : ""; break;
        case "kerning": case "tracking": s.letterSpacing = m.v + "px"; break;
        case "lineSpacing": s.lineHeight = `calc(1.25em + ${m.v}px)`; break;
        case "buttonStyle": r.el.classList.add("bs-" + m.style); break;
        case "controlSize": r.el.classList.add("cs-" + m.size); break;
        case "disabled": if (m.on === true) r.el.classList.add("sx-disabled"); break;
        case "onTapGesture": { const m0 = machine; r.el.classList.add("sx-tap"); r.el.dataset.tap = 1; r.el.onclick = (e) => { e.stopPropagation(); act(() => m0.callFn(m.action, [], m.line)); }; break; }
        case "navigationTitle": if (ctx.nav && !ctx.nav.title) ctx.nav.title = m.title; break;
        case "navigationBarTitleDisplayMode": if (ctx.nav) ctx.nav.inline = m.inline; break;
        case "textFieldStyle": if (m.style === "roundedBorder") r.el.classList.add("tf-rounded"); break;
      }
      r.el.dataset.mods = (r.el.dataset.mods ? r.el.dataset.mods + "," : "") + m.name;
    }
    return r;
  }
  function clip(r, sh) {
    const s = r.el.style;
    s.overflow = "hidden";
    if (sh.shape === "Circle" || sh.shape === "Ellipse") s.borderRadius = "50%";
    else if (sh.shape === "Capsule") s.borderRadius = "9999px";
    else if (sh.shape === "RoundedRectangle") s.borderRadius = sh.radius + "px";
    r.el.dataset.clip = sh.shape;
  }

  // ---------- для перевірок ----------
  const api = {
    setSource, render, reset,
    get error() { return lastErr; },
    get logs() { return logs.slice(); },
    get screen() { return safe; },
    store: () => store,
    tap(text) {
      const els = [...safe.querySelectorAll("button.sx-btn, .sx-tap, .sx-back")];
      const el = els.find(e => (e.dataset.label || e.textContent).trim() === text) || els.find(e => (e.dataset.label || e.textContent).includes(text));
      if (!el) return false; el.click(); return true;
    },
    type(placeholder, text) {
      const el = [...safe.querySelectorAll("input.sx-field")].find(e => e.placeholder === placeholder) || safe.querySelector("input.sx-field");
      if (!el) return false; el.value = text; el.dispatchEvent(new Event("input")); return true;
    },
    toggle(label) {
      const t = [...safe.querySelectorAll(".sx-toggle")].find(e => !label || e.dataset.label.includes(label));
      if (!t) return false; t.querySelector(".sx-switch").click(); return true;
    },
    step(label, dir) {
      const t = [...safe.querySelectorAll(".sx-stepper")].find(e => !label || e.dataset.label.includes(label));
      if (!t) return false; t.querySelector(`[data-step="${dir === "-" ? "-" : "+"}"]`).click(); return true;
    },
  };
  return api;
}
function escapeHtml(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

window.SWIFTSIM.mount = mount;
window.SWIFTSIM.symbolOf = symbolOf;
})();
