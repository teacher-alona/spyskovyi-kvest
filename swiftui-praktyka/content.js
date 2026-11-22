// ---- SwiftUI: практичні роботи в браузері (симулятор core/swiftsim*.js, перевірки core/swiftlab.js) ----
window.GAME_INFO = { id: "swiftlab", title: "SwiftUI: практичні", eyebrow: "Swift · практичні в браузері", plain: true, lang: "swift", openAll: true,
  intro: "Практичні роботи без Mac: пиши код SwiftUI — поруч одразу видно екран iPhone. Вкладка «🎯 Як має бути» показує, що треба отримати. Рівні можна проходити в будь-якому порядку.",
  types: { swlab: "Практична" },
  links: [{ href: "../swiftui/pisochnytsia.html", label: "🧪 SwiftUI-пісочниця", about: "Вільний редактор із живим екраном iPhone: пиши що завгодно, без оцінок." }] };

const L = (title, text, code) => ({ t: "lesson", title, text, code });
const V = (...pick) => ({ pick });
// файл з ContentView: тіло body і, за потреби, властивості та інші struct
const file = (body, props, extra) => `import SwiftUI

struct ContentView: View {
${props ? props.replace(/^/gm, "    ") + "\n\n" : ""}    var body: some View {
${body.replace(/^/gm, "        ")}
    }
}
${extra ? "\n" + extra + "\n" : ""}
#Preview {
    ContentView()
}
`;
const START = file(`Text("Привіт!")`);
const LAB = (o) => Object.assign({ t: "swlab", starter: START }, o);
// перевірки
const T = (text, more) => Object.assign({ type: "Text", text }, more || {});
const has = (sel, msg) => ({ has: sel, msg });
const order = (a, b, msg, axis) => ({ order: [a, b], axis, msg });
const code = (re, msg) => ({ code: re, msg });
const act = (steps, then, msg) => ({ act: steps, then, msg });
// де елемент на екрані: частка висоти безпечної зони (0 — верх, 1 — низ)
const yPos = (screen, sel) => { const e = SWLAB.findAll(screen, sel)[0]; if (!e) return null; const s = screen.getBoundingClientRect(), r = e.getBoundingClientRect(); return (r.top + r.height / 2 - s.top) / s.height; };
const xPos = (screen, sel) => { const e = SWLAB.findAll(screen, sel)[0]; if (!e) return null; const s = screen.getBoundingClientRect(), r = e.getBoundingClientRect(); return (r.left + r.width / 2 - s.left) / s.width; };

window.LEVELS = [];

// ===================== 1. Текст і стеки =====================
const twoLines = (a, b) => LAB({
  q: `Зроби екран із двох рядків тексту, один під одним: зверху «${a}», під ним «${b}».`,
  solution: file(`VStack {\n    Text("${a}")\n    Text("${b}")\n}`),
  checks: [has(T(a), `Є текст «${a}»`), has(T(b), `Є текст «${b}»`), order(T(a), T(b), `«${a}» стоїть над «${b}»`)],
  hint: "Елементи один під одним — це `VStack { … }`. Кожен рядок — окремий `Text(\"…\")`.",
});
const threeRow = (xs) => LAB({
  q: `Постав три тексти **в один рядок** зліва направо: ${xs.map(x => `«${x}»`).join(", ")}.`,
  solution: file(`HStack {\n${xs.map(x => `    Text("${x}")`).join("\n")}\n}`),
  checks: [...xs.map(x => has(T(x), `Є «${x}»`)), order(T(xs[0]), T(xs[1]), `«${xs[0]}» ліворуч від «${xs[1]}»`, "h"), order(T(xs[1]), T(xs[2]), `«${xs[1]}» ліворуч від «${xs[2]}»`, "h")],
  hint: "Елементи в рядок — це `HStack { … }`.",
});
const zOver = (shape, color, text) => LAB({
  q: `Зроби ${shape === "Circle" ? "коло" : "прямокутник"} кольору **.${color}** розміром 150 × 150, а **поверх** нього — текст «${text}» білого кольору.`,
  solution: file(`ZStack {\n    ${shape}()\n        .fill(.${color})\n        .frame(width: 150, height: 150)\n    Text("${text}")\n        .foregroundColor(.white)\n}`),
  checks: [has({ type: shape, fill: color, w: 150, h: 150 }, `${shape}() кольору .${color} розміром 150 × 150`), has(T(text, { color: "white" }), `Білий текст «${text}»`), has(T(text, { inside: "ZStack" }), "Текст і фігура лежать у ZStack — одне поверх іншого")],
  hint: "Шари один на одному — `ZStack { … }`. Що написано нижче в коді, те лежить зверху. Колір фігури — `.fill(.колір)`, розмір — `.frame(width: 150, height: 150)`.",
});
LEVELS.push({
  id: "stacks", kind: "learn", title: "Текст і стеки",
  about: "VStack, HStack, ZStack і Spacer.",
  items: [
    L("Як влаштований екран", "Кожен екран SwiftUI — це `struct ContentView: View`, а все, що видно, описано в `var body`.\n\n• `VStack` — елементи **один під одним**\n• `HStack` — елементи **в рядок**\n• `ZStack` — елементи **один поверх одного**\n• `Spacer()` — порожнеча, яка розштовхує елементи\n\nПраворуч — живий екран: він оновлюється, щойно ти щось змінюєш у коді.", file(`VStack {\n    Text("Зверху")\n    HStack {\n        Text("Ліворуч")\n        Text("Праворуч")\n    }\n}`)),
    V(twoLines("Мій перший застосунок", "Я вчу SwiftUI"), twoLines("Улюблена гра", "Minecraft"), twoLines("Привіт, світе!", "Це мій iPhone")),
    V(threeRow(["🍎", "🍌", "🍇"]), threeRow(["Раз", "Два", "Три"]), threeRow(["⭐", "🌙", "☀️"])),
    V(zOver("Circle", "blue", "OK"), zOver("Rectangle", "orange", "СТОП"), zOver("Circle", "green", "GO")),
    V(
      LAB({ q: "Притисни текст «Вгорі» до **верху** екрана, а «Внизу» — до **низу**. Підказка: між ними потрібен `Spacer()`.",
        solution: file(`VStack {\n    Text("Вгорі")\n    Spacer()\n    Text("Внизу")\n}`),
        checks: [has(T("Вгорі"), "Є «Вгорі»"), has(T("Внизу"), "Є «Внизу»"), { fn: s => yPos(s, T("Вгорі")) < 0.12, msg: "«Вгорі» біля верхнього краю" }, { fn: s => yPos(s, T("Внизу")) > 0.88, msg: "«Внизу» біля нижнього краю" }],
        hint: "`Spacer()` у `VStack` забирає все вільне місце по висоті й розштовхує елементи до країв." }),
      LAB({ q: "Притисни текст «Ліво» до **лівого** краю, а «Право» — до **правого**, в одному рядку.",
        solution: file(`HStack {\n    Text("Ліво")\n    Spacer()\n    Text("Право")\n}\n.padding()`),
        checks: [has(T("Ліво"), "Є «Ліво»"), has(T("Право"), "Є «Право»"), { fn: s => xPos(s, T("Ліво")) < 0.2, msg: "«Ліво» біля лівого краю" }, { fn: s => xPos(s, T("Право")) > 0.8, msg: "«Право» біля правого краю" }],
        hint: "`HStack { Text(\"Ліво\"); Spacer(); Text(\"Право\") }` — `Spacer()` розштовхує по ширині." }),
    ),
  ],
});

// ===================== 2. Модифікатори тексту =====================
const titleSub = (title, sub) => LAB({
  q: `Зроби заголовок «${title}» шрифтом **.largeTitle** і жирним, а під ним сірий підпис «${sub}».`,
  solution: file(`VStack {\n    Text("${title}")\n        .font(.largeTitle)\n        .bold()\n    Text("${sub}")\n        .foregroundColor(.gray)\n}`),
  checks: [has(T(title, { font: "largeTitle" }), `«${title}» шрифтом .largeTitle`), has(T(title, { bold: true }), `«${title}» жирний (.bold())`), has(T(sub, { color: "gray" }), `«${sub}» сірий (.foregroundColor(.gray))`), order(T(title), T(sub), "Підпис під заголовком")],
  hint: "Модифікатори пишуть після елемента через крапку: `Text(\"…\").font(.largeTitle).bold()`. Колір тексту — `.foregroundColor(.gray)`.",
});
const pill = (text, bg) => LAB({
  q: `Зроби «кнопку» з тексту: «${text}» білим кольором, з відступами всередині (\`.padding()\`), на тлі **.${bg}** і з заокругленими кутами (12).`,
  solution: file(`Text("${text}")\n    .foregroundColor(.white)\n    .padding()\n    .background(.${bg})\n    .cornerRadius(12)`),
  checks: [has(T(text, { color: "white" }), `Білий текст «${text}»`), has(T(text, { bg }), `Тло .${bg}`), has(T(text, { rounded: true }), "Кути заокруглені (.cornerRadius)"),
    { fn: s => { const t = SWLAB.findAll(s, T(text))[0]; if (!t) return false; let e = t.parentElement; while (e && e !== s && !e.dataset.bg) e = e.parentElement; return e && e !== s && e.getBoundingClientRect().width > t.getBoundingClientRect().width + 8; }, msg: "Тло ширше за текст — є відступ .padding() перед .background" }],
  hint: "Порядок важливий: спершу `.padding()`, потім `.background(…)` — тоді тло займе і відступи. Потім `.cornerRadius(12)`.",
});
LEVELS.push({
  id: "mods", kind: "learn", title: "Модифікатори",
  about: ".font, .bold, .foregroundColor, .padding, .background, .cornerRadius.",
  items: [
    L("Модифікатори", "Модифікатор змінює вигляд елемента. Пишемо його після елемента через крапку, можна кілька поспіль:\n\n• `.font(.largeTitle)` — розмір: `.largeTitle`, `.title`, `.title2`, `.headline`, `.body`, `.caption`\n• `.bold()` — жирний\n• `.foregroundColor(.red)` — колір тексту\n• `.padding()` — відступ навколо\n• `.background(.yellow)` — тло\n• `.cornerRadius(12)` — заокруглені кути\n\n**Порядок має значення:** `.padding().background(.yellow)` — тло разом із відступом, а `.background(.yellow).padding()` — тло лише під текстом.", file(`Text("Увага!")\n    .font(.title)\n    .bold()\n    .foregroundColor(.red)\n    .padding()\n    .background(.yellow)\n    .cornerRadius(12)`)),
    V(titleSub("Котики", "Усе про моїх улюбленців"), titleSub("Космос", "Планети Сонячної системи"), titleSub("Мій клас", "7-А, 2026 рік")),
    V(pill("Почати", "blue"), pill("Грати", "green"), pill("Далі", "purple")),
    V(
      LAB({ q: "Зроби три рядки різним шрифтом, один під одним: «Великий» — `.largeTitle`, «Середній» — `.title2`, «Маленький» — `.caption`.",
        solution: file(`VStack {\n    Text("Великий")\n        .font(.largeTitle)\n    Text("Середній")\n        .font(.title2)\n    Text("Маленький")\n        .font(.caption)\n}`),
        checks: [has(T("Великий", { font: "largeTitle" }), "«Великий» — .largeTitle"), has(T("Середній", { font: "title2" }), "«Середній» — .title2"), has(T("Маленький", { font: "caption" }), "«Маленький» — .caption"), order(T("Великий"), T("Маленький"), "Від великого до маленького згори вниз")],
        hint: "До кожного `Text` — свій `.font(…)`." }),
      LAB({ q: "Зроби три слова кольорами веселки в один рядок: «Червоний» — `.red`, «Зелений» — `.green`, «Синій» — `.blue`. Усі три — шрифтом `.title`.",
        solution: file(`HStack {\n    Text("Червоний")\n        .foregroundColor(.red)\n    Text("Зелений")\n        .foregroundColor(.green)\n    Text("Синій")\n        .foregroundColor(.blue)\n}\n.font(.title)`),
        checks: [has(T("Червоний", { color: "red" }), "«Червоний» червоний"), has(T("Зелений", { color: "green" }), "«Зелений» зелений"), has(T("Синій", { color: "blue" }), "«Синій» синій"), has(T("Синій", { font: "title" }), "Шрифт .title"), order(T("Червоний"), T("Синій"), "Усе в одному рядку", "h")],
        hint: "Модифікатор, поставлений на `HStack`, діє на всіх усередині: `HStack { … }.font(.title)`." }),
    ),
  ],
});

// ===================== 3. Значки SF Symbols =====================
const weather = (sym, color, temp) => LAB({
  q: `Зроби віджет погоди: значок **${sym}** кольору .${color} розміром 80 (\`.font(.system(size: 80))\`), а під ним — температура «${temp}» шрифтом \`.largeTitle\`.`,
  solution: file(`VStack {\n    Image(systemName: "${sym}")\n        .font(.system(size: 80))\n        .foregroundColor(.${color})\n    Text("${temp}")\n        .font(.largeTitle)\n}`),
  checks: [has({ type: "Image", symbol: sym }, `Є значок ${sym}`), has({ type: "Image", symbol: sym, color }, `Значок кольору .${color}`), has({ type: "Image", symbol: sym, size: 80 }, "Розмір значка 80"), has(T(temp, { font: "largeTitle" }), `«${temp}» шрифтом .largeTitle`), order({ type: "Image", symbol: sym }, T(temp), "Температура під значком")],
  hint: "Значок — `Image(systemName: \"назва\")`. Розмір значка задають шрифтом: `.font(.system(size: 80))`.",
});
const iconRow = (items) => LAB({
  q: `Постав в один рядок три значки: ${items.map(([s, c]) => `**${s}** (.${c})`).join(", ")}. Усі — шрифтом \`.largeTitle\`.`,
  solution: file(`HStack {\n${items.map(([s, c]) => `    Image(systemName: "${s}")\n        .foregroundColor(.${c})`).join("\n")}\n}\n.font(.largeTitle)`),
  checks: [...items.map(([s, c]) => has({ type: "Image", symbol: s, color: c }, `${s} кольору .${c}`)), order({ type: "Image", symbol: items[0][0] }, { type: "Image", symbol: items[2][0] }, "Значки в один рядок", "h"), has({ type: "Image", symbol: items[0][0], font: "largeTitle" }, "Шрифт .largeTitle")],
  hint: "`HStack { Image(systemName: \"…\").foregroundColor(.…) … }.font(.largeTitle)`.",
});
const labels = (rows) => LAB({
  q: `Зроби меню з трьох пунктів один під одним через \`Label\`: ${rows.map(([t, s]) => `«${t}» зі значком **${s}**`).join(", ")}. Вирівняй їх по лівому краю.`,
  solution: file(`VStack(alignment: .leading, spacing: 16) {\n${rows.map(([t, s]) => `    Label("${t}", systemImage: "${s}")`).join("\n")}\n}`),
  checks: [...rows.map(([t, s]) => has({ type: "Label", text: t, fn: e => e.querySelector(`[data-symbol="${s}"]`) }, `Label «${t}» зі значком ${s}`)), code(/alignment:\s*\.leading/, "VStack(alignment: .leading)"), order({ type: "Label", text: rows[0][0] }, { type: "Label", text: rows[2][0] }, "Пункти один під одним")],
  hint: "`Label(\"Текст\", systemImage: \"назва\")` — значок і текст разом. По лівому краю — `VStack(alignment: .leading) { … }`.",
});
LEVELS.push({
  id: "symbols", kind: "learn", title: "Значки SF Symbols",
  about: "Image(systemName:), розмір і колір значків, Label.",
  items: [
    L("Значки", "В Apple є тисячі готових значків — **SF Symbols**. Показати значок: `Image(systemName: \"star.fill\")`.\n\n• `.fill` у назві — зафарбований варіант: `heart` і `heart.fill`\n• розмір — як у тексту: `.font(.largeTitle)` або `.font(.system(size: 60))`\n• колір — `.foregroundColor(.red)`\n• `Label(\"Текст\", systemImage: \"star\")` — значок із підписом\n\nУ симуляторі значки намальовані схожими — на справжньому iPhone вони виглядатимуть трохи інакше.", file(`HStack {\n    Image(systemName: "heart.fill")\n        .foregroundColor(.red)\n    Image(systemName: "star.fill")\n        .foregroundColor(.yellow)\n}\n.font(.system(size: 50))`)),
    V(weather("sun.max.fill", "yellow", "+25°"), weather("cloud.rain.fill", "blue", "+12°"), weather("snowflake", "cyan", "−3°")),
    V(iconRow([["heart.fill", "red"], ["star.fill", "yellow"], ["bolt.fill", "orange"]]), iconRow([["leaf.fill", "green"], ["drop.fill", "blue"], ["flame.fill", "red"]])),
    V(labels([["Головна", "house"], ["Пошук", "magnifyingglass"], ["Налаштування", "gear"]]), labels([["Музика", "music.note"], ["Фото", "photo"], ["Пошта", "envelope"]])),
  ],
});

// ===================== 4. Фігури і колір =====================
LEVELS.push({
  id: "shapes", kind: "learn", title: "Фігури і колір",
  about: "Circle, Rectangle, RoundedRectangle, Capsule, .fill, .frame, Color, градієнт.",
  items: [
    L("Фігури", "Фігури: `Circle()`, `Rectangle()`, `RoundedRectangle(cornerRadius: 20)`, `Capsule()`.\n\n• `.fill(.red)` — колір фігури\n• `.stroke(.red, lineWidth: 4)` — лише контур\n• `.frame(width: 100, height: 100)` — розмір. Без нього фігура займе все вільне місце!\n• `Color.blue` — теж можна ставити як елемент: це прямокутник кольору\n• `LinearGradient(colors: [.blue, .purple], startPoint: .top, endPoint: .bottom)` — плавний перехід кольорів", file(`VStack {\n    Circle()\n        .fill(.orange)\n        .frame(width: 100, height: 100)\n    Capsule()\n        .stroke(.blue, lineWidth: 4)\n        .frame(width: 160, height: 50)\n}`)),
    V(
      LAB({ q: "Намалюй **світлофор**: три кола 80 × 80 одне під одним — червоне (.red), жовте (.yellow), зелене (.green).",
        solution: file(`VStack {\n    Circle()\n        .fill(.red)\n        .frame(width: 80, height: 80)\n    Circle()\n        .fill(.yellow)\n        .frame(width: 80, height: 80)\n    Circle()\n        .fill(.green)\n        .frame(width: 80, height: 80)\n}`),
        checks: [has({ type: "Circle", fill: "red", w: 80, h: 80 }, "Червоне коло 80 × 80"), has({ type: "Circle", fill: "yellow", w: 80, h: 80 }, "Жовте коло 80 × 80"), has({ type: "Circle", fill: "green", w: 80, h: 80 }, "Зелене коло 80 × 80"),
          order({ type: "Circle", fill: "red" }, { type: "Circle", fill: "yellow" }, "Червоне над жовтим"), order({ type: "Circle", fill: "yellow" }, { type: "Circle", fill: "green" }, "Жовте над зеленим")],
        hint: "`Circle().fill(.red).frame(width: 80, height: 80)` — і так тричі у `VStack`." }),
      LAB({ q: "Намалюй **прапор України**: два прямокутники 300 × 100 один під одним — синій (.blue) зверху, жовтий (.yellow) знизу, без проміжку між ними (`VStack(spacing: 0)`).",
        solution: file(`VStack(spacing: 0) {\n    Rectangle()\n        .fill(.blue)\n        .frame(width: 300, height: 100)\n    Rectangle()\n        .fill(.yellow)\n        .frame(width: 300, height: 100)\n}`),
        checks: [has({ type: "Rectangle", fill: "blue", w: 300, h: 100 }, "Синій прямокутник 300 × 100"), has({ type: "Rectangle", fill: "yellow", w: 300, h: 100 }, "Жовтий прямокутник 300 × 100"), order({ type: "Rectangle", fill: "blue" }, { type: "Rectangle", fill: "yellow" }, "Синій над жовтим"), code(/spacing:\s*0/, "Без проміжку: VStack(spacing: 0)")],
        hint: "`Rectangle().fill(.blue).frame(width: 300, height: 100)`." }),
    ),
    V(
      LAB({ q: "Зроби **аватар-ініціали**: коло .purple 120 × 120, а поверх нього білі літери «ОК» шрифтом `.largeTitle`.",
        solution: file(`ZStack {\n    Circle()\n        .fill(.purple)\n        .frame(width: 120, height: 120)\n    Text("ОК")\n        .font(.largeTitle)\n        .foregroundColor(.white)\n}`),
        checks: [has({ type: "Circle", fill: "purple", w: 120, h: 120 }, "Фіолетове коло 120 × 120"), has(T("ОК", { color: "white", font: "largeTitle" }), "Білі літери «ОК» шрифтом .largeTitle"), has(T("ОК", { inside: "ZStack" }), "Літери поверх кола (ZStack)")],
        hint: "`ZStack { Circle()… ; Text(\"ОК\")… }`." }),
      LAB({ q: "Зроби **бейдж**: капсула .orange 160 × 50, а поверх неї білий текст «НОВИНКА» жирним.",
        solution: file(`ZStack {\n    Capsule()\n        .fill(.orange)\n        .frame(width: 160, height: 50)\n    Text("НОВИНКА")\n        .bold()\n        .foregroundColor(.white)\n}`),
        checks: [has({ type: "Capsule", fill: "orange", w: 160, h: 50 }, "Помаранчева капсула 160 × 50"), has(T("НОВИНКА", { color: "white", bold: true }), "Білий жирний «НОВИНКА»"), has(T("НОВИНКА", { inside: "ZStack" }), "Текст поверх капсули (ZStack)")],
        hint: "`Capsule().fill(.orange).frame(width: 160, height: 50)`." }),
    ),
    V(
      LAB({ q: "Зроби **заставку**: на весь екран градієнт згори вниз від `.blue` до `.purple`, а посередині білий текст «Space» шрифтом `.largeTitle`.",
        solution: file(`ZStack {\n    LinearGradient(colors: [.blue, .purple], startPoint: .top, endPoint: .bottom)\n    Text("Space")\n        .font(.largeTitle)\n        .foregroundColor(.white)\n}`),
        checks: [code(/LinearGradient\s*\(\s*colors:\s*\[\s*\.blue\s*,\s*\.purple\s*\]/, "Градієнт LinearGradient(colors: [.blue, .purple] …)"), has(T("Space", { color: "white", font: "largeTitle" }), "Білий «Space» шрифтом .largeTitle"), { fn: s => { const g = s.querySelector(".sx-color"); return g && g.getBoundingClientRect().height > s.getBoundingClientRect().height * 0.9; }, msg: "Градієнт займає весь екран" }],
        hint: "`ZStack { LinearGradient(colors: [.blue, .purple], startPoint: .top, endPoint: .bottom); Text(\"Space\")… }`." }),
      LAB({ q: "Зроби екран із **жовтим тлом** на весь екран (`Color.yellow`) і чорним текстом «Сонячно» шрифтом `.largeTitle` посередині.",
        solution: file(`ZStack {\n    Color.yellow\n    Text("Сонячно")\n        .font(.largeTitle)\n        .foregroundColor(.black)\n}`),
        checks: [has({ type: "Color", fn: e => e.getBoundingClientRect().height > 200 }, "Жовтий колір на весь екран"), has(T("Сонячно", { font: "largeTitle", bg: "yellow" }), "«Сонячно» шрифтом .largeTitle на жовтому")],
        hint: "`Color.yellow` у `ZStack` — це тло на весь екран." }),
    ),
  ],
});

// ===================== 5. Картка =====================
const card = (icon, color, title, text) => LAB({
  q: `Зроби **картку**: ліворуч значок **${icon}** кольору .${color} шрифтом \`.largeTitle\`, праворуч — заголовок «${title}» (\`.headline\`) і під ним текст «${text}». Картка має відступи (\`.padding()\`), біле тло, заокруглення 16 і тінь (\`.shadow(radius: 5)\`). Довкола картки — ще один \`.padding()\`.`,
  solution: file(`HStack {\n    Image(systemName: "${icon}")\n        .font(.largeTitle)\n        .foregroundColor(.${color})\n    VStack(alignment: .leading) {\n        Text("${title}")\n            .font(.headline)\n        Text("${text}")\n    }\n}\n.padding()\n.background(.white)\n.cornerRadius(16)\n.shadow(radius: 5)\n.padding()`),
  checks: [has({ type: "Image", symbol: icon, color }, `Значок ${icon} кольору .${color}`), has(T(title, { font: "headline" }), `«${title}» шрифтом .headline`), has(T(text), `Текст «${text}»`), order({ type: "Image", symbol: icon }, T(title), "Значок ліворуч від тексту", "h"), order(T(title), T(text), "Текст під заголовком"),
    has(T(title, { rounded: true }), "Заокруглені кути (.cornerRadius(16))"), has(T(title, { shadow: true }), "Тінь (.shadow)")],
  hint: "Значок і стовпчик тексту — у `HStack`, а заголовок із текстом — у `VStack(alignment: .leading)`. Потім до `HStack`: `.padding().background(.white).cornerRadius(16).shadow(radius: 5).padding()`.",
});
LEVELS.push({
  id: "card", kind: "learn", title: "Картка",
  about: "Збираємо гарну картку: стеки + відступи + тло + кути + тінь.",
  items: [
    L("Картка", "Картка — це кілька модифікаторів поспіль на стеку:\n\n`.padding()` → `.background(.white)` → `.cornerRadius(16)` → `.shadow(radius: 5)`\n\nСпершу відступи всередині, потім тло, потім заокруглення і тінь. А ще один `.padding()` в кінці — це відступ картки від країв екрана.", file(`VStack(alignment: .leading) {\n    Text("Котик Кекс")\n        .font(.headline)\n    Text("Любить спати на клавіатурі")\n}\n.padding()\n.background(.white)\n.cornerRadius(16)\n.shadow(radius: 5)`)),
    V(card("pawprint.fill", "orange", "Кекс", "Кіт, 3 роки"), card("book.fill", "blue", "Читання", "20 сторінок на день"), card("gamecontroller.fill", "purple", "Ігри", "Не більше години")),
    V(
      LAB({ q: "Зроби **профіль**: велике коло-аватар .teal 100 × 100 зі значком **person.fill** (білий, \`.font(.system(size: 50))\`) усередині, під ним ім'я «Тарас» (\`.title\`, жирне) і підпис «iOS-розробник» сірим.",
        solution: file(`VStack {\n    ZStack {\n        Circle()\n            .fill(.teal)\n            .frame(width: 100, height: 100)\n        Image(systemName: "person.fill")\n            .font(.system(size: 50))\n            .foregroundColor(.white)\n    }\n    Text("Тарас")\n        .font(.title)\n        .bold()\n    Text("iOS-розробник")\n        .foregroundColor(.gray)\n}`),
        checks: [has({ type: "Circle", fill: "teal", w: 100, h: 100 }, "Коло .teal 100 × 100"), has({ type: "Image", symbol: "person.fill", color: "white", inside: "ZStack" }, "Білий значок person.fill поверх кола"), has(T("Тарас", { font: "title", bold: true }), "«Тарас» шрифтом .title, жирне"), has(T("iOS-розробник", { color: "gray" }), "Сірий підпис"), order(T("Тарас"), T("iOS-розробник"), "Підпис під ім'ям")],
        hint: "Аватар — `ZStack` з `Circle()` і `Image(…)`; усе разом — у `VStack`." }),
      LAB({ q: "Зроби **картку-нагадування**: текст «Купити хліб» і праворуч, притиснутий до краю, значок **cart** кольору .green. Картка: відступи, тло \`.yellow.opacity(0.3)\`, заокруглення 12, і ще \`.padding()\` довкола.",
        solution: file(`HStack {\n    Text("Купити хліб")\n    Spacer()\n    Image(systemName: "cart")\n        .foregroundColor(.green)\n}\n.padding()\n.background(.yellow.opacity(0.3))\n.cornerRadius(12)\n.padding()`),
        checks: [has(T("Купити хліб"), "Є «Купити хліб»"), has({ type: "Image", symbol: "cart", color: "green" }, "Зелений значок cart"), { fn: s => xPos(s, { type: "Image", symbol: "cart" }) > 0.8, msg: "Значок притиснутий праворуч (Spacer)" }, has(T("Купити хліб", { bg: "yellow", rounded: true }), "Жовте тло із заокругленням")],
        hint: "`HStack { Text(…); Spacer(); Image(…) }` і модифікатори картки після `HStack`." }),
    ),
  ],
});

// ===================== 6. Власні View =====================
LEVELS.push({
  id: "views", kind: "learn", title: "Власні View",
  about: "struct … : View з параметрами — щоб не повторювати код.",
  items: [
    L("Власний View", "Якщо кілька однакових елементів відрізняються лише текстом чи кольором — зроби власний View:\n\n```\nstruct Badge: View {\n    let text: String\n    let color: Color\n\n    var body: some View {\n        Text(text)\n            .padding()\n            .background(color)\n    }\n}\n```\n\nА в `ContentView` використовуй його, передаючи параметри з назвами: `Badge(text: \"Swift\", color: .orange)`.", file(`VStack {\n    Badge(text: "Swift", color: .orange)\n    Badge(text: "UI", color: .blue)\n}`, null, `struct Badge: View {\n    let text: String\n    let color: Color\n\n    var body: some View {\n        Text(text)\n            .foregroundColor(.white)\n            .padding()\n            .background(color)\n            .cornerRadius(10)\n    }\n}`)),
    V(
      LAB({ q: "Створи власний View **`Tag`** з параметрами `text: String` і `color: Color`: білий текст на тлі кольору `color` з відступами й заокругленням 8. У `ContentView` покажи в рядок три теги: «Swift» (.orange), «iOS» (.blue), «Xcode» (.green).",
        solution: file(`HStack {\n    Tag(text: "Swift", color: .orange)\n    Tag(text: "iOS", color: .blue)\n    Tag(text: "Xcode", color: .green)\n}`, null, `struct Tag: View {\n    let text: String\n    let color: Color\n\n    var body: some View {\n        Text(text)\n            .foregroundColor(.white)\n            .padding()\n            .background(color)\n            .cornerRadius(8)\n    }\n}`),
        checks: [code(/struct\s+Tag\s*:\s*View/, "Є struct Tag: View"), code(/let\s+text\s*:\s*String/, "У Tag є властивість text: String"), code(/(let|var)\s+color\s*:\s*Color/, "У Tag є властивість color: Color"), has(T("Swift", { bg: "orange", color: "white" }), "Тег «Swift» помаранчевий"), has(T("iOS", { bg: "blue" }), "Тег «iOS» синій"), has(T("Xcode", { bg: "green" }), "Тег «Xcode» зелений"), order(T("Swift"), T("Xcode"), "Теги в один рядок", "h")],
        hint: "Спершу напиши `struct Tag: View { … }` під `ContentView`, а потім у `HStack` — тричі `Tag(text: …, color: …)`." }),
      LAB({ q: "Створи власний View **`Row`** з параметрами `icon: String` і `title: String`: значок `Image(systemName: icon)` і текст `title` в одному рядку. У `ContentView` покажи три рядки один під одним: («star», «Обране»), («clock», «Історія»), («trash», «Кошик»).",
        solution: file(`VStack(alignment: .leading, spacing: 20) {\n    Row(icon: "star", title: "Обране")\n    Row(icon: "clock", title: "Історія")\n    Row(icon: "trash", title: "Кошик")\n}`, null, `struct Row: View {\n    let icon: String\n    let title: String\n\n    var body: some View {\n        HStack {\n            Image(systemName: icon)\n            Text(title)\n        }\n    }\n}`),
        checks: [code(/struct\s+Row\s*:\s*View/, "Є struct Row: View"), code(/let\s+icon\s*:\s*String/, "У Row є icon: String"), code(/let\s+title\s*:\s*String/, "У Row є title: String"), has({ type: "Image", symbol: "star" }, "Значок star"), has({ type: "Image", symbol: "trash" }, "Значок trash"), order(T("Обране"), T("Кошик"), "Рядки один під одним"), order({ type: "Image", symbol: "clock" }, T("Історія"), "Значок ліворуч від тексту", "h")],
        hint: "У `body` структури `Row`: `HStack { Image(systemName: icon); Text(title) }`." }),
    ),
    V(
      LAB({ q: "Створи View **`Planet`** з параметрами `name: String`, `color: Color` і `size: Double`: коло кольору `color` розміром `size` × `size`, а під ним назва. Покажи в рядок три планети: «Марс» (.red, 40), «Земля» (.blue, 60), «Юпітер» (.orange, 90).",
        solution: file(`HStack(alignment: .bottom, spacing: 20) {\n    Planet(name: "Марс", color: .red, size: 40)\n    Planet(name: "Земля", color: .blue, size: 60)\n    Planet(name: "Юпітер", color: .orange, size: 90)\n}`, null, `struct Planet: View {\n    let name: String\n    let color: Color\n    let size: Double\n\n    var body: some View {\n        VStack {\n            Circle()\n                .fill(color)\n                .frame(width: size, height: size)\n            Text(name)\n        }\n    }\n}`),
        checks: [code(/struct\s+Planet\s*:\s*View/, "Є struct Planet: View"), has({ type: "Circle", fill: "red", w: 40, h: 40 }, "Марс — червоне коло 40"), has({ type: "Circle", fill: "blue", w: 60, h: 60 }, "Земля — синє коло 60"), has({ type: "Circle", fill: "orange", w: 90, h: 90 }, "Юпітер — помаранчеве коло 90"), order(T("Марс"), T("Юпітер"), "Планети в рядок", "h")],
        hint: "`Circle().fill(color).frame(width: size, height: size)` усередині `VStack` разом із `Text(name)`." }),
      LAB({ q: "Створи View **`Score`** з параметрами `team: String` і `points: Int`: назва команди, а праворуч, притиснуті до краю, очки жирним. Покажи два рядки: «Тигри» — 12, «Леви» — 9.",
        solution: file(`VStack {\n    Score(team: "Тигри", points: 12)\n    Score(team: "Леви", points: 9)\n}\n.padding()`, null, `struct Score: View {\n    let team: String\n    let points: Int\n\n    var body: some View {\n        HStack {\n            Text(team)\n            Spacer()\n            Text("\\(points)")\n                .bold()\n        }\n    }\n}`),
        checks: [code(/struct\s+Score\s*:\s*View/, "Є struct Score: View"), code(/let\s+points\s*:\s*Int/, "У Score є points: Int"), has(T("12", { bold: true }), "Очки «12» жирним"), has(T("9", { bold: true }), "Очки «9» жирним"), { fn: s => xPos(s, T("12")) > 0.8, msg: "Очки притиснуті праворуч" }, order(T("Тигри"), T("Леви"), "Команди одна під одною")],
        hint: "Число в Text вставляють так: `Text(\"\\(points)\")`." }),
    ),
  ],
});

// ===================== 7. Кнопки і @State =====================
const counter = (label, step, name) => LAB({
  q: `Зроби **лічильник ${name}**: великий текст із числом (\`.font(.largeTitle)\`, на початку 0) і кнопку «${label}», яка щоразу додає ${step}.`,
  solution: file(`VStack(spacing: 20) {\n    Text("\\(count)")\n        .font(.largeTitle)\n    Button("${label}") {\n        count += ${step}\n    }\n    .buttonStyle(.borderedProminent)\n}`, `@State private var count = 0`),
  checks: [code(/@State/, "Число зберігається в змінній @State"), has(T("0", { font: "largeTitle" }), "Спершу на екрані 0 (.largeTitle)"), has({ type: "Button", text: label }, `Кнопка «${label}»`),
    act([["tap", label]], [has(T(String(step)), `Після одного натискання — ${step}`)], `Одне натискання → ${step}`), act([["tap", label], ["tap", label], ["tap", label]], [has(T(String(step * 3)), `Після трьох — ${step * 3}`)], `Три натискання → ${step * 3}`)],
  hint: "`@State private var count = 0` над `body`, а в кнопці: `Button(\"…\") { count += 1 }`. Показати число: `Text(\"\\(count)\")`.",
});
LEVELS.push({
  id: "state", kind: "learn", title: "Кнопки і @State",
  about: "Button, @State і екран, що змінюється.",
  items: [
    L("@State", "Звичайну змінну View змінити не може. Щоб екран **запам'ятовував** значення і перемальовувався, коли воно змінюється, пиши `@State`:\n\n`@State private var count = 0`\n\nКнопка: `Button(\"Текст\") { дія }`. У дії змінюємо стан — і екран оновлюється сам.\n\n`.toggle()` перемикає `true` ↔ `false`.", file(`VStack {\n    Text("Натиснуто: \\(count)")\n    Button("Натисни") {\n        count += 1\n    }\n}`, `@State private var count = 0`)),
    V(counter("+1", 1, "кроків"), counter("+5", 5, "балів"), counter("+10", 10, "монет")),
    V(
      LAB({ q: "Зроби **лампу**: значок **lightbulb** і кнопку «Увімкнути». Натискання кнопки перемикає лампу: увімкнена — значок **lightbulb.fill** жовтий (.yellow), вимкнена — **lightbulb** сірий (.gray). Розмір значка — 100.",
        solution: file(`VStack(spacing: 30) {\n    Image(systemName: isOn ? "lightbulb.fill" : "lightbulb")\n        .font(.system(size: 100))\n        .foregroundColor(isOn ? .yellow : .gray)\n    Button("Увімкнути") {\n        isOn.toggle()\n    }\n}`, `@State private var isOn = false`),
        checks: [code(/@State/, "Стан лампи — у @State"), has({ type: "Image", symbol: "lightbulb", color: "gray" }, "Спершу лампа сіра, lightbulb"),
          act([["tap", "Увімкнути"]], [has({ type: "Image", symbol: "lightbulb.fill", color: "yellow" }, "")], "Після натискання — жовта lightbulb.fill"), act([["tap", "Увімкнути"], ["tap", "Увімкнути"]], [has({ type: "Image", symbol: "lightbulb", color: "gray" }, "")], "Ще одне натискання — знову сіра")],
        hint: "`@State private var isOn = false`; у кнопці `isOn.toggle()`; у значку — тернарний оператор: `isOn ? \"lightbulb.fill\" : \"lightbulb\"`." }),
      LAB({ q: "Зроби **лайк**: значок **heart** (червоний, \`.largeTitle\`) і поруч текст із кількістю лайків (на початку 0). Натискання на кнопку-серце додає лайк і робить серце зафарбованим (**heart.fill**).",
        solution: file(`HStack {\n    Button {\n        likes += 1\n    } label: {\n        Image(systemName: likes > 0 ? "heart.fill" : "heart")\n            .font(.largeTitle)\n            .foregroundColor(.red)\n    }\n    Text("\\(likes)")\n}`, `@State private var likes = 0`),
        checks: [code(/@State/, "Кількість лайків — у @State"), has({ type: "Image", symbol: "heart", color: "red" }, "Спершу порожнє червоне серце"), has(T("0"), "Спершу 0"),
          act([["tap", "favorite"]], [has({ type: "Image", symbol: "heart.fill" }, ""), has(T("1"), "")], "Після натискання — heart.fill і 1"), act([["tap", "favorite"], ["tap", "favorite"]], [has(T("2"), "")], "Два натискання — 2")],
        hint: "Кнопка зі значком: `Button { likes += 1 } label: { Image(systemName: …) }`." }),
    ),
    V(
      LAB({ q: "Зроби **кубик**: текст «🎲» і під ним число (на початку 1, шрифт `.largeTitle`) та кнопку «Кинути», яка ставить випадкове число від 1 до 6 (`Int.random(in: 1...6)`).",
        solution: file(`VStack(spacing: 20) {\n    Text("🎲")\n    Text("\\(value)")\n        .font(.largeTitle)\n    Button("Кинути") {\n        value = Int.random(in: 1...6)\n    }\n}`, `@State private var value = 1`),
        checks: [code(/Int\.random\s*\(\s*in:\s*1\s*\.\.\.\s*6\s*\)/, "Випадкове число: Int.random(in: 1...6)"), has(T("1", { font: "largeTitle" }), "Спершу 1 (.largeTitle)"),
          act([["tap", "Кинути"], ["tap", "Кинути"], ["tap", "Кинути"]], [{ fn: s => SWLAB.findAll(s, { type: "Text", text: /^[1-6]$/ }).length > 0, msg: "" }], "Після кидка на екрані число від 1 до 6")],
        hint: "`value = Int.random(in: 1...6)` у дії кнопки." }),
      LAB({ q: "Зроби **світлофор-перемикач**: текст із кольором («Червоний» на початку) і кнопку «Далі». Кнопка змінює колір по колу: Червоний → Жовтий → Зелений → Червоний…",
        solution: file(`VStack(spacing: 20) {\n    Text(light)\n        .font(.largeTitle)\n    Button("Далі") {\n        if light == "Червоний" {\n            light = "Жовтий"\n        } else if light == "Жовтий" {\n            light = "Зелений"\n        } else {\n            light = "Червоний"\n        }\n    }\n}`, `@State private var light = "Червоний"`),
        checks: [has(T("Червоний"), "Спершу «Червоний»"), act([["tap", "Далі"]], [has(T("Жовтий"), "")], "Далі → «Жовтий»"), act([["tap", "Далі"], ["tap", "Далі"]], [has(T("Зелений"), "")], "Ще раз → «Зелений»"), act([["tap", "Далі"], ["tap", "Далі"], ["tap", "Далі"]], [has(T("Червоний"), "")], "І знову «Червоний»")],
        hint: "Тримай назву кольору в `@State private var light = \"Червоний\"` і в кнопці перевіряй `if light == …`." }),
    ),
  ],
});

// ===================== 8. TextField, Toggle, Stepper =====================
LEVELS.push({
  id: "input", kind: "learn", title: "Поля і перемикачі",
  about: "TextField, Toggle, Stepper і знак $.",
  items: [
    L("Поля і перемикачі", "Елементи, які змінюють `@State`, отримують його **зі знаком $** — це прив'язка:\n\n• `TextField(\"Підказка\", text: $name)` — поле для тексту\n• `Toggle(\"Текст\", isOn: $flag)` — перемикач\n• `Stepper(\"Кількість: \\(n)\", value: $n, in: 1...10)` — кнопки − і +\n\nКоли користувач щось змінює, змінна оновлюється, а з нею — і екран.", file(`VStack {\n    TextField("Ім'я", text: $name)\n        .textFieldStyle(.roundedBorder)\n    Text("Привіт, \\(name)!")\n}\n.padding()`, `@State private var name = ""`)),
    V(
      LAB({ q: "Зроби **привітання**: поле вводу з підказкою «Твоє ім'я» (стиль `.roundedBorder`) і під ним текст «Привіт, <ім'я>!», який змінюється, коли пишеш.",
        solution: file(`VStack {\n    TextField("Твоє ім'я", text: $name)\n        .textFieldStyle(.roundedBorder)\n    Text("Привіт, \\(name)!")\n}\n.padding()`, `@State private var name = ""`),
        checks: [has({ type: "TextField", text: "Твоє ім'я" }, "Поле з підказкою «Твоє ім'я»"), code(/text:\s*\$\w+/, "Поле прив'язане до @State через $"), act([["type", "Твоє ім'я", "Оля"]], [has(T("Привіт, Оля!"), "")], "Після введення «Оля» — «Привіт, Оля!»")],
        hint: "`@State private var name = \"\"`, `TextField(\"Твоє ім'я\", text: $name)`, `Text(\"Привіт, \\(name)!\")`." }),
      LAB({ q: "Зроби **гучномовець**: поле з підказкою «Слово» і під ним те саме слово ВЕЛИКИМИ літерами шрифтом `.largeTitle` (`.uppercased()`).",
        solution: file(`VStack {\n    TextField("Слово", text: $word)\n        .textFieldStyle(.roundedBorder)\n    Text(word.uppercased())\n        .font(.largeTitle)\n}\n.padding()`, `@State private var word = ""`),
        checks: [has({ type: "TextField", text: "Слово" }, "Поле з підказкою «Слово»"), act([["type", "Слово", "кіт"]], [has(T("КІТ", { font: "largeTitle" }), "")], "Після введення «кіт» — «КІТ» шрифтом .largeTitle")],
        hint: "`Text(word.uppercased())`." }),
    ),
    V(
      LAB({ q: "Зроби **нічний режим**: перемикач «Темна тема». Коли він увімкнений — тло екрана чорне (`Color.black`), а текст «Добраніч» білий; коли вимкнений — тло біле, текст чорний.",
        solution: file(`ZStack {\n    Color(dark ? .black : .white)\n    VStack {\n        Toggle("Темна тема", isOn: $dark)\n        Text("Добраніч")\n            .font(.largeTitle)\n            .foregroundColor(dark ? .white : .black)\n    }\n    .padding()\n}`, `@State private var dark = false`).replace("Color(dark ? .black : .white)", "(dark ? Color.black : Color.white)"),
        checks: [has({ type: "Toggle", text: "Темна тема" }, "Перемикач «Темна тема»"), code(/isOn:\s*\$\w+/, "Перемикач прив'язаний через $"), has(T("Добраніч", { color: "black" }), "Спершу текст чорний"),
          act([["toggle", "Темна тема"]], [has(T("Добраніч", { color: "white" }), ""), has(T("Добраніч", { bg: "black" }), "")], "Увімкнули — білий текст на чорному")],
        hint: "`@State private var dark = false`; тло: `(dark ? Color.black : Color.white)` у `ZStack`; колір тексту: `.foregroundColor(dark ? .white : .black)`." }),
      LAB({ q: "Зроби **секрет**: перемикач «Показати пароль». Коли вимкнений — текст «••••», коли увімкнений — «swift123».",
        solution: file(`VStack {\n    Toggle("Показати пароль", isOn: $show)\n    Text(show ? "swift123" : "••••")\n        .font(.title)\n}\n.padding()`, `@State private var show = false`),
        checks: [has({ type: "Toggle", text: "Показати пароль" }, "Перемикач «Показати пароль»"), has(T("••••"), "Спершу «••••»"), act([["toggle", "Показати"]], [has(T("swift123"), "")], "Увімкнули — «swift123»")],
        hint: "`Text(show ? \"swift123\" : \"••••\")`." }),
    ),
    V(
      LAB({ q: "Зроби **замовлення піци**: `Stepper` з текстом «Піц: N» від 1 до 10 (на початку 1), а під ним — сума «До сплати: X грн», де одна піца коштує 150 грн.",
        solution: file(`VStack {\n    Stepper("Піц: \\(count)", value: $count, in: 1...10)\n    Text("До сплати: \\(count * 150) грн")\n        .font(.title2)\n}\n.padding()`, `@State private var count = 1`),
        checks: [has({ type: "Stepper", text: "Піц: 1" }, "Stepper «Піц: 1»"), has(T("До сплати: 150 грн"), "Спершу «До сплати: 150 грн»"), act([["step", "Піц", "+"], ["step", "Піц", "+"]], [has(T("До сплати: 450 грн"), "")], "Двічі + → «До сплати: 450 грн»"), code(/in:\s*1\s*\.\.\.\s*10/, "Межі 1...10")],
        hint: "`Stepper(\"Піц: \\(count)\", value: $count, in: 1...10)` і `Text(\"До сплати: \\(count * 150) грн\")`." }),
      LAB({ q: "Зроби **таймер-налаштування**: `Stepper` «Хвилин: N» від 5 до 60 з кроком 5 (на початку 25), а під ним «Секунд: …» — скільки це секунд.",
        solution: file(`VStack {\n    Stepper("Хвилин: \\(minutes)", value: $minutes, in: 5...60, step: 5)\n    Text("Секунд: \\(minutes * 60)")\n}\n.padding()`, `@State private var minutes = 25`),
        checks: [has({ type: "Stepper", text: "Хвилин: 25" }, "Stepper «Хвилин: 25»"), has(T("Секунд: 1500"), "Спершу «Секунд: 1500»"), act([["step", "Хвилин", "+"]], [has(T("Секунд: 1800"), "")], "+ → 30 хвилин, «Секунд: 1800»"), code(/step:\s*5/, "Крок 5")],
        hint: "`Stepper(\"Хвилин: \\(minutes)\", value: $minutes, in: 5...60, step: 5)`." }),
    ),
  ],
});

// ===================== 9. List і ForEach =====================
LEVELS.push({
  id: "lists", kind: "learn", title: "List і ForEach",
  about: "Списки з масиву, ForEach і додавання елементів.",
  items: [
    L("Списки", "`ForEach` повторює елементи для кожного значення:\n\n• з масиву: `ForEach(fruits, id: \\.self) { fruit in Text(fruit) }`\n• з чисел: `ForEach(1...5, id: \\.self) { n in Text(\"\\(n)\") }`\n\n`List { … }` — список у стилі iPhone, з рядками й розділювачами. `Section(\"Назва\") { … }` — розділ списку.\n\nЩоб додати елемент, масив має бути `@State`: `items.append(\"…\")`.", file(`List {\n    ForEach(fruits, id: \\.self) { fruit in\n        Text(fruit)\n    }\n}`, `let fruits = ["Яблуко", "Банан", "Груша"]`)),
    V(
      LAB({ q: "Є масив `let animals = [\"Кіт\", \"Пес\", \"Папуга\", \"Рибка\"]`. Покажи його як `List` через `ForEach`, а в кожному рядку перед назвою — значок **pawprint**.",
        starter: file(`Text("Привіт!")`, `let animals = ["Кіт", "Пес", "Папуга", "Рибка"]`),
        solution: file(`List {\n    ForEach(animals, id: \\.self) { animal in\n        HStack {\n            Image(systemName: "pawprint")\n            Text(animal)\n        }\n    }\n}`, `let animals = ["Кіт", "Пес", "Папуга", "Рибка"]`),
        checks: [code(/ForEach\s*\(\s*animals/, "ForEach по масиву animals"), has(T("Кіт", { inside: "List" }), "«Кіт» у списку List"), has(T("Рибка", { inside: "List" }), "«Рибка» у списку"), { count: [{ type: "Image", symbol: "pawprint" }, 4], msg: "Чотири значки pawprint — по одному в рядку" }],
        hint: "`List { ForEach(animals, id: \\.self) { animal in HStack { Image(…); Text(animal) } } }`." }),
      LAB({ q: "Є масив `let cities = [\"Київ\", \"Львів\", \"Одеса\"]`. Покажи `List` з розділом `Section(\"Міста\")`, у якому кожне місто — `Label` зі значком **mappin**.",
        starter: file(`Text("Привіт!")`, `let cities = ["Київ", "Львів", "Одеса"]`),
        solution: file(`List {\n    Section("Міста") {\n        ForEach(cities, id: \\.self) { city in\n            Label(city, systemImage: "mappin")\n        }\n    }\n}`, `let cities = ["Київ", "Львів", "Одеса"]`),
        checks: [code(/ForEach\s*\(\s*cities/, "ForEach по масиву cities"), code(/Section\s*\(\s*"Міста"/, "Розділ Section(\"Міста\")"), has({ type: "Label", text: "Львів", fn: e => e.querySelector('[data-symbol="mappin"]') }, "Label «Львів» зі значком mappin"), { count: [{ type: "Label" }, 3], msg: "Три міста" }],
        hint: "`Label(city, systemImage: \"mappin\")` усередині `ForEach`." }),
    ),
    V(
      LAB({ q: "Зроби **таблицю квадратів**: для чисел від 1 до 5 через `ForEach(1...5, id: \\.self)` покажи рядки «1 × 1 = 1», «2 × 2 = 4» … «5 × 5 = 25».",
        solution: file(`VStack(spacing: 10) {\n    ForEach(1...5, id: \\.self) { n in\n        Text("\\(n) × \\(n) = \\(n * n)")\n    }\n}`),
        checks: [code(/ForEach/, "Використано ForEach"), has(T("1 × 1 = 1"), "«1 × 1 = 1»"), has(T("3 × 3 = 9"), "«3 × 3 = 9»"), has(T("5 × 5 = 25"), "«5 × 5 = 25»"), { count: [{ type: "Text", text: /×/ }, 5], msg: "Рівно п'ять рядків" }],
        hint: "`Text(\"\\(n) × \\(n) = \\(n * n)\")` у `ForEach`." }),
      LAB({ q: "Зроби **зірковий рейтинг**: через `ForEach(1...5, id: \\.self)` покажи в рядок 5 значків **star.fill** кольору .yellow.",
        solution: file(`HStack {\n    ForEach(1...5, id: \\.self) { _ in\n        Image(systemName: "star.fill")\n            .foregroundColor(.yellow)\n    }\n}\n.font(.largeTitle)`),
        checks: [code(/ForEach/, "Використано ForEach"), { count: [{ type: "Image", symbol: "star.fill", color: "yellow" }, 5], msg: "Рівно 5 жовтих зірок" }, { fn: s => { const st = SWLAB.findAll(s, { type: "Image", symbol: "star.fill" }); return st.length > 1 && Math.abs(st[0].getBoundingClientRect().top - st[1].getBoundingClientRect().top) < 2; }, msg: "Зірки в один рядок" }],
        hint: "`HStack { ForEach(1...5, id: \\.self) { _ in Image(…) } }`." }),
    ),
    V(
      LAB({ q: "Зроби **список справ**: масив `@State private var tasks = [\"Уроки\"]`, поле з підказкою «Нова справа» і кнопка «Додати», яка додає текст із поля до списку (`append`) і очищує поле. Під ними — `ForEach` зі справами.",
        solution: file(`VStack {\n    TextField("Нова справа", text: $newTask)\n        .textFieldStyle(.roundedBorder)\n    Button("Додати") {\n        tasks.append(newTask)\n        newTask = ""\n    }\n    ForEach(tasks, id: \\.self) { task in\n        Text(task)\n    }\n}\n.padding()`, `@State private var tasks = ["Уроки"]\n@State private var newTask = ""`),
        checks: [code(/\.append\s*\(/, "Додавання через append"), has(T("Уроки"), "Спершу у списку «Уроки»"), act([["type", "Нова справа", "Спорт"], ["tap", "Додати"]], [has(T("Спорт"), ""), has(T("Уроки"), "")], "Після «Додати» у списку з'являється «Спорт»"),
          act([["type", "Нова справа", "Спорт"], ["tap", "Додати"]], [{ fn: s => { const f = s.querySelector("input.sx-field"); return f && f.value === ""; }, msg: "" }], "Поле очищується після додавання")],
        hint: "У кнопці: `tasks.append(newTask)` і `newTask = \"\"`." }),
      LAB({ q: "Зроби **список покупок** з кнопками: масив `@State private var items: [String] = []`, кнопки «🍎» і «🥛» додають у список «Яблука» та «Молоко», а текст зверху показує «Покупок: N».",
        solution: file(`VStack {\n    Text("Покупок: \\(items.count)")\n        .font(.title)\n    HStack {\n        Button("🍎") { items.append("Яблука") }\n        Button("🥛") { items.append("Молоко") }\n    }\n    ForEach(items, id: \\.self) { item in\n        Text(item)\n    }\n}`, `@State private var items: [String] = []`),
        checks: [has(T("Покупок: 0"), "Спершу «Покупок: 0»"), act([["tap", "🍎"]], [has(T("Яблука"), ""), has(T("Покупок: 1"), "")], "«🍎» → «Яблука», «Покупок: 1»"), act([["tap", "🍎"], ["tap", "🥛"]], [has(T("Молоко"), ""), has(T("Покупок: 2"), "")], "«🍎», «🥛» → «Покупок: 2»")],
        hint: "Кількість елементів — `items.count`. Увага: якщо додати «Яблука» двічі, `ForEach` з `id: \\.self` розгубиться — для задачі цього досить." }),
    ),
  ],
});

// ===================== 10. Навігація =====================
LEVELS.push({
  id: "nav", kind: "learn", title: "Навігація",
  about: "NavigationStack, navigationTitle і NavigationLink.",
  items: [
    L("Кілька екранів", "`NavigationStack { … }` — контейнер для екранів, між якими можна переходити.\n\n• `.navigationTitle(\"Назва\")` — великий заголовок (пишемо **всередині** NavigationStack, на вміст)\n• `NavigationLink(\"Текст\") { ІншийЕкран() }` — кнопка-перехід. Кнопка «Назад» з'явиться сама\n\nКожен екран — окремий `struct … : View`.", file(`NavigationStack {\n    List {\n        NavigationLink("Про мене") {\n            Text("Я вчу SwiftUI!")\n        }\n    }\n    .navigationTitle("Меню")\n}`)),
    V(
      LAB({ q: "Зроби **меню**: `NavigationStack` із заголовком «Меню» і в `List` два переходи: «Правила» відкриває екран з текстом «Будь чемним», а «Автор» — екран з текстом «Зробив учень 7-А».",
        solution: file(`NavigationStack {\n    List {\n        NavigationLink("Правила") {\n            Text("Будь чемним")\n        }\n        NavigationLink("Автор") {\n            Text("Зробив учень 7-А")\n        }\n    }\n    .navigationTitle("Меню")\n}`),
        checks: [{ nav: "Меню", msg: "Заголовок «Меню» (.navigationTitle)" }, has({ type: "NavigationLink", text: "Правила" }, "Перехід «Правила»"), has({ type: "NavigationLink", text: "Автор" }, "Перехід «Автор»"),
          act([["tap", "Правила"]], [has(T("Будь чемним"), "")], "«Правила» відкриває «Будь чемним»"), act([["tap", "Автор"]], [has(T("Зробив учень 7-А"), "")], "«Автор» відкриває «Зробив учень 7-А»")],
        hint: "`NavigationStack { List { NavigationLink(\"Правила\") { Text(\"…\") } … }.navigationTitle(\"Меню\") }`." }),
      LAB({ q: "Зроби **розклад**: `NavigationStack` із заголовком «Тиждень», у `List` переходи «Понеділок» і «Вівторок». Понеділок відкриває текст «Математика, Swift», вівторок — «Англійська, Фізкультура».",
        solution: file(`NavigationStack {\n    List {\n        NavigationLink("Понеділок") {\n            Text("Математика, Swift")\n        }\n        NavigationLink("Вівторок") {\n            Text("Англійська, Фізкультура")\n        }\n    }\n    .navigationTitle("Тиждень")\n}`),
        checks: [{ nav: "Тиждень", msg: "Заголовок «Тиждень»" }, act([["tap", "Понеділок"]], [has(T("Математика, Swift"), "")], "«Понеділок» → «Математика, Swift»"), act([["tap", "Вівторок"]], [has(T("Англійська, Фізкультура"), "")], "«Вівторок» → «Англійська, Фізкультура»")],
        hint: "Два `NavigationLink` у `List`, а `.navigationTitle(\"Тиждень\")` — після `List`." }),
    ),
    V(
      LAB({ q: "Зроби **каталог планет**: масив `let planets = [\"Меркурій\", \"Марс\", \"Сатурн\"]`, `NavigationStack` з заголовком «Планети», у `List` — переходи для кожної планети через `ForEach`. Перехід відкриває власний View **`PlanetDetail(name:)`**, який показує назву шрифтом `.largeTitle` і значок **globe** під нею.",
        starter: file(`Text("Привіт!")`, `let planets = ["Меркурій", "Марс", "Сатурн"]`),
        solution: file(`NavigationStack {\n    List {\n        ForEach(planets, id: \\.self) { planet in\n            NavigationLink(planet) {\n                PlanetDetail(name: planet)\n            }\n        }\n    }\n    .navigationTitle("Планети")\n}`, `let planets = ["Меркурій", "Марс", "Сатурн"]`, `struct PlanetDetail: View {\n    let name: String\n\n    var body: some View {\n        VStack {\n            Text(name)\n                .font(.largeTitle)\n            Image(systemName: "globe")\n                .font(.system(size: 80))\n        }\n    }\n}`),
        checks: [{ nav: "Планети", msg: "Заголовок «Планети»" }, code(/struct\s+PlanetDetail\s*:\s*View/, "Є struct PlanetDetail: View"), { count: [{ type: "NavigationLink" }, 3], msg: "Три переходи — по одному на планету" },
          act([["tap", "Марс"]], [has(T("Марс", { font: "largeTitle" }), ""), has({ type: "Image", symbol: "globe" }, "")], "«Марс» відкриває екран із назвою .largeTitle і значком globe")],
        hint: "`ForEach(planets, id: \\.self) { planet in NavigationLink(planet) { PlanetDetail(name: planet) } }`." }),
      LAB({ q: "Зроби **книгу рецептів**: масив `let dishes = [\"Борщ\", \"Вареники\", \"Сирники\"]`, `NavigationStack` з заголовком «Рецепти», переходи через `ForEach`. Кожен відкриває власний View **`Dish(name:)`**: назва `.largeTitle` і значок **fork.knife**.",
        starter: file(`Text("Привіт!")`, `let dishes = ["Борщ", "Вареники", "Сирники"]`),
        solution: file(`NavigationStack {\n    List {\n        ForEach(dishes, id: \\.self) { dish in\n            NavigationLink(dish) {\n                Dish(name: dish)\n            }\n        }\n    }\n    .navigationTitle("Рецепти")\n}`, `let dishes = ["Борщ", "Вареники", "Сирники"]`, `struct Dish: View {\n    let name: String\n\n    var body: some View {\n        VStack {\n            Text(name)\n                .font(.largeTitle)\n            Image(systemName: "fork.knife")\n                .font(.system(size: 60))\n        }\n    }\n}`),
        checks: [{ nav: "Рецепти", msg: "Заголовок «Рецепти»" }, code(/struct\s+Dish\s*:\s*View/, "Є struct Dish: View"), { count: [{ type: "NavigationLink" }, 3], msg: "Три переходи" }, act([["tap", "Сирники"]], [has(T("Сирники", { font: "largeTitle" }), ""), has({ type: "Image", symbol: "fork.knife" }, "")], "«Сирники» відкриває екран із назвою і значком fork.knife")],
        hint: "Як у прикладі: `NavigationLink(dish) { Dish(name: dish) }`." }),
    ),
  ],
});

// ===================== 11. Мініпроєкт =====================
LEVELS.push({
  id: "project", kind: "boss", title: "Мініпроєкт",
  about: "Невеликі застосунки на все разом.",
  items: [
    V(
      LAB({ q: "**Вікторина**: питання «Столиця Франції?» (`.title2`) і три кнопки-відповіді: «Лондон», «Париж», «Рим». Після натискання під кнопками з'являється «✅ Правильно!» (для Парижа) або «❌ Ні, спробуй ще» (для інших).",
        solution: file(`VStack(spacing: 16) {\n    Text("Столиця Франції?")\n        .font(.title2)\n    Button("Лондон") { result = "❌ Ні, спробуй ще" }\n    Button("Париж") { result = "✅ Правильно!" }\n    Button("Рим") { result = "❌ Ні, спробуй ще" }\n    Text(result)\n}`, `@State private var result = ""`),
        checks: [has(T("Столиця Франції?", { font: "title2" }), "Питання шрифтом .title2"), has({ type: "Button", text: "Париж" }, "Кнопка «Париж»"), act([["tap", "Париж"]], [has(T("✅ Правильно!"), "")], "«Париж» → «✅ Правильно!»"), act([["tap", "Рим"]], [has(T("❌ Ні, спробуй ще"), "")], "«Рим» → «❌ Ні, спробуй ще»"), act([["tap", "Лондон"]], [has(T("❌ Ні, спробуй ще"), "")], "«Лондон» → «❌ Ні, спробуй ще»")],
        hint: "Тримай текст результату в `@State private var result = \"\"`, а кожна кнопка записує в нього своє." }),
      LAB({ q: "**Пульт гучності**: великий значок **speaker.wave.2** (.font(.system(size: 60))), під ним «Гучність: N» (на початку 5) і дві кнопки «−» та «+», що змінюють гучність на 1, але не нижче 0 і не вище 10.",
        solution: file(`VStack(spacing: 20) {\n    Image(systemName: "speaker.wave.2")\n        .font(.system(size: 60))\n    Text("Гучність: \\(volume)")\n    HStack {\n        Button("−") {\n            if volume > 0 { volume -= 1 }\n        }\n        Button("+") {\n            if volume < 10 { volume += 1 }\n        }\n    }\n    .font(.largeTitle)\n}`, `@State private var volume = 5`),
        checks: [has({ type: "Image", symbol: "speaker.wave.2" }, "Значок speaker.wave.2"), has(T("Гучність: 5"), "Спершу «Гучність: 5»"), act([["tap", "+"], ["tap", "+"]], [has(T("Гучність: 7"), "")], "+ + → 7"),
          act(Array(8).fill(["tap", "+"]), [has(T("Гучність: 10"), "")], "Не більше 10"), act(Array(7).fill(["tap", "−"]), [has(T("Гучність: 0"), "")], "Не менше 0")],
        hint: "У кнопці перевіряй межу: `if volume < 10 { volume += 1 }`." }),
    ),
    V(
      LAB({ q: "**Анкета**: поле «Ім'я», перемикач «Я люблю котів» і кнопка «Готово». Після «Готово» внизу з'являється текст: «<Ім'я> любить котів 🐱» або «<Ім'я> не любить котів», залежно від перемикача.",
        solution: file(`VStack(spacing: 16) {\n    TextField("Ім'я", text: $name)\n        .textFieldStyle(.roundedBorder)\n    Toggle("Я люблю котів", isOn: $cats)\n    Button("Готово") {\n        result = cats ? "\\(name) любить котів 🐱" : "\\(name) не любить котів"\n    }\n    Text(result)\n}\n.padding()`, `@State private var name = ""\n@State private var cats = false\n@State private var result = ""`),
        checks: [has({ type: "TextField", text: "Ім'я" }, "Поле «Ім'я»"), has({ type: "Toggle", text: "Я люблю котів" }, "Перемикач «Я люблю котів»"),
          act([["type", "Ім'я", "Оля"], ["toggle", "котів"], ["tap", "Готово"]], [has(T("Оля любить котів 🐱"), "")], "Оля + перемикач → «Оля любить котів 🐱»"), act([["type", "Ім'я", "Тарас"], ["tap", "Готово"]], [has(T("Тарас не любить котів"), "")], "Без перемикача → «Тарас не любить котів»")],
        hint: "Три `@State`: ім'я, перемикач і результат. У кнопці: `result = cats ? \"…\" : \"…\"`." }),
      LAB({ q: "**Калькулятор чайових**: `Stepper` «Сума: N грн» від 100 до 2000 з кроком 100 (на початку 500), перемикач «Щедрі чайові», і текст «Чайові: X грн» — 10% від суми, або 20%, якщо перемикач увімкнений.",
        solution: file(`VStack(spacing: 16) {\n    Stepper("Сума: \\(sum) грн", value: $sum, in: 100...2000, step: 100)\n    Toggle("Щедрі чайові", isOn: $generous)\n    Text("Чайові: \\(generous ? sum / 5 : sum / 10) грн")\n        .font(.title2)\n}\n.padding()`, `@State private var sum = 500\n@State private var generous = false`),
        checks: [has({ type: "Stepper", text: "Сума: 500 грн" }, "Stepper «Сума: 500 грн»"), has(T("Чайові: 50 грн"), "Спершу «Чайові: 50 грн»"), act([["toggle", "Щедрі"]], [has(T("Чайові: 100 грн"), "")], "Щедрі → «Чайові: 100 грн»"), act([["step", "Сума", "+"]], [has(T("Чайові: 60 грн"), "")], "+100 → «Чайові: 60 грн»")],
        hint: "10% — це `sum / 10`, а 20% — `sum / 5`." }),
    ),
  ],
});
