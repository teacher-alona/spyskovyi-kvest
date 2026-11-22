// ---- «SwiftUI» — гра для 8–10 класів: будова файлу, View, стеки, модифікатори, картки, кнопки, @State ----
window.GAME_INFO = {
  id: "swift", title: "SwiftUI", eyebrow: "Swift · SwiftUI", plain: true, lang: "swift", openAll: true,
  intro: "Повторюємо уроки зі SwiftUI: з чого складається файл, елементи й стеки, модифікатори, кнопки й @State. Усі рівні відкриті: обирай тему, яку зараз проходите на уроці. Спершу коротке пояснення, потім завдання.",
  types: { look: "Який вигляд?", output: "Що покаже?" },
  links: [{ href: "pisochnytsia.html", label: "🧪 SwiftUI-пісочниця", about: "Пиши код і одразу бач екран iPhone — прямо в браузері, Mac не потрібен." },
    { href: "../swiftui-praktyka/", label: "🛠 SwiftUI: практичні", about: "Практичні роботи з автоматичною перевіркою: зроби екран — гра перевірить." }],
};
const S = String.raw;
const L = (title, text, code) => ({ t: "lesson", title, text, code });
const Q = (q, options, a, why, code) => ({ t: "quiz", q, options, a, why, code });
const O = (q, code, a, why, accept) => ({ t: "output", q, code, a, why, accept });
const B = (q, code, a, why) => ({ t: "bug", q, code, a, why });
const R = (q, code, why) => ({ t: "order", q, code, out: "", why });   // лише точний порядок
const F = (q, code, a, why) => ({ t: "fill", q, code, a, why });
const K = (q, code, options, a, why, screen) => ({ t: "look", q, code, options, a, why, screen });
const V = (...pick) => ({ pick });
const { phone, t, s, v, h, z, box, b, C } = window.SW;

// шрифти iPhone у масштабі макета
const FT = { large: "font-size:21px;font-weight:400", title: "font-size:18px", title2: "font-size:16px", headline: "font-size:13px;font-weight:600", body: "font-size:13px", sub: "font-size:11.5px", caption: "font-size:10px" };
const BOLD = ";font-weight:700";

window.LEVELS = [];

// ===================== 1. Файл SwiftUI =====================
LEVELS.push({
  id: "file", kind: "learn", title: "З чого складається файл",
  about: "import SwiftUI, struct ContentView, body, #Preview і Canvas у Xcode.",
  items: [
    L("Проєкт у Xcode", "**SwiftUI** — спосіб будувати інтерфейс застосунків для iPhone, iPad, Mac і Apple Watch. Ми не малюємо кнопки мишкою, а **описуємо кодом**, що має бути на екрані, і Xcode одразу показує результат у **Canvas** праворуч.\n\nНовий проєкт: **File → New → Project → iOS → App**, Interface: **SwiftUI**, Language: **Swift**. Головний файл — **ContentView.swift**.\n\nЯкщо Canvas не видно — **Editor → Canvas**. Якщо він порожній — **Resume** або **Option+Command+P**. Червоний рядок — шукай пропущену крапку чи дужку."),
    L("Будова ContentView.swift", "• `import SwiftUI` — підключаємо бібліотеку з усіма елементами екрана.\n• `struct ContentView: View` — наш екран. Це структура, яка **є View**, тобто її можна показати.\n• `var body: some View { … }` — **тіло** екрана: усе, що в фігурних дужках, з'явиться на екрані.\n• `#Preview { ContentView() }` — що показати в Canvas.\n\nДля нового екрана змінюй тільки вміст `body`, решту файлу не чіпай.",
      S`import SwiftUI

struct ContentView: View {
    var body: some View {
        Text("Привіт, світ!")
    }
}

#Preview {
    ContentView()
}`),
    Q("Що робить рядок `import SwiftUI`?", ["Підключає бібліотеку з елементами інтерфейсу", "Запускає застосунок на iPhone", "Створює новий файл", "Показує Canvas"], 0, "Без `import SwiftUI` Swift не знатиме, що таке `Text`, `Button` чи `VStack`."),
    Q("Куди писати те, що має з'явитися на екрані?", ["У фігурні дужки `var body: some View { }`", "Після `#Preview`", "Перед `import SwiftUI`", "У назву структури"], 0, "Тіло `body` описує вміст екрана."),
    Q("Для чого блок `#Preview`?", ["Показує екран у Canvas праворуч від коду", "Відправляє застосунок в App Store", "Перевіряє орфографію", "Зберігає файл"], 0, "`#Preview` каже Xcode, що намалювати в Canvas, щоб бачити результат одразу."),
    F("Допиши будову екрана.", S`import ___

struct ContentView: ___ {
    var body: some View {
        Text("Мій перший екран")
    }
}`, [["SwiftUI"], ["View"]], "`import SwiftUI` підключає бібліотеку, а `: View` означає, що структура — це екран, який можна показати."),
    F("Допиши рядок з тілом екрана.", S`struct ContentView: View {
    var ___: some View {
        Text("Привіт!")
    }
}`, [["body"]], "Тіло екрана завжди називається `body`."),
    R("Збери файл ContentView.swift у правильному порядку.", S`import SwiftUI
struct ContentView: View {
    var body: some View {
        Text("Привіт, світ!")
    }
}`, "Спершу import, потім структура, всередині неї — body, а в body — елементи екрана."),
    B("Canvas показує червону помилку. У якому рядку пропущено символ?", S`import SwiftUI

struct ContentView: View {
    var body: some View {
        Text("Привіт, світ!"
    }
}`, 4, "Не закрита кругла дужка: має бути `Text(\"Привіт, світ!\")`. Червоний рядок у Xcode найчастіше означає пропущену дужку, лапку чи крапку."),
    Q("Canvas порожній, хоча помилок немає. Що зробити?", ["Натиснути Resume або Option+Command+P", "Видалити `import SwiftUI`", "Перейменувати файл", "Перезавантажити комп'ютер"], 0, "Resume оновлює попередній перегляд."),
  ],
});

// ===================== 2. View і стеки =====================
LEVELS.push({
  id: "stacks", kind: "learn", title: "Елементи і стеки",
  about: "Text, Image, Button, VStack, HStack, ZStack, alignment і spacing.",
  items: [
    L("Що таке View", "**View** — будь-який елемент на екрані:\n• `Text(\"…\")` — текст;\n• `Image(systemName: \"…\")` — значок;\n• `Button(\"…\") { }` — кнопка.\n\nКілька елементів збираємо в **стеки**:\n• `VStack` — один **під одним** (вертикально);\n• `HStack` — **поруч** (горизонтально);\n• `ZStack` — **один на одному**, як шари.",
      S`VStack {
    Text("Математика")
    Text("8:30")
}`),
    K("Який вигляд дасть цей код?", S`HStack {
    Text("☀️")
    Text("Понеділок")
}`, [phone(h(t("☀️") + t("Понеділок", "margin-left:6px"))), phone(v(t("☀️") + t("Понеділок", "margin-top:4px"))), phone(z(t("☀️", "font-size:30px") + t("Понеділок"))), phone(t("Понеділок"))], 0, "`HStack` ставить елементи поруч, зліва направо."),
    K("Який вигляд дасть цей код?", S`VStack {
    Text("☀️")
    Text("Понеділок")
}`, [phone(h(t("☀️") + t("Понеділок", "margin-left:6px"))), phone(v(t("☀️") + t("Понеділок", "margin-top:4px"))), phone(z(t("☀️", "font-size:30px") + t("Понеділок"))), phone(t("☀️"))], 1, "`VStack` ставить елементи один під одним, зверху вниз."),
    Q("Потрібно покласти текст **поверх** кольорового кола. Який стек?", ["ZStack", "VStack", "HStack", "Жоден: так не можна"], 0, "`ZStack` накладає елементи шарами: перший — знизу, наступні — зверху."),
    L("Параметри стеків", "У стеку можна задати **alignment** (вирівнювання) і **spacing** (відстань між елементами в точках):\n• `VStack(alignment: .leading, spacing: 12)` — по лівому краю, проміжок 12;\n• `HStack(alignment: .top, spacing: 8)` — по верхньому краю;\n• `ZStack(alignment: .bottomTrailing)` — у правий нижній кут.\n\nДля VStack: `.leading`, `.center`, `.trailing`. Для HStack: `.top`, `.center`, `.bottom`."),
    K("Який вигляд дасть цей код?", S`VStack(alignment: .leading) {
    Text("Розклад")
    Text("Математика · 8:30")
    Text("Фізика · 9:25")
}`, [phone(v(t("Розклад") + t("Математика · 8:30") + t("Фізика · 9:25"), "align-items:flex-start")), phone(v(t("Розклад") + t("Математика · 8:30") + t("Фізика · 9:25"))), phone(v(t("Розклад") + t("Математика · 8:30") + t("Фізика · 9:25"), "align-items:flex-end")), phone(h(t("Розклад") + t("Математика", "margin-left:4px"), "font-size:11px"))], 0, "`.leading` — це передній, тобто лівий край. Усі рядки вирівнюються ліворуч."),
    Q("Що означає `spacing: 16` у `VStack(spacing: 16)`?", ["Відстань 16 точок між елементами стеку", "Розмір шрифту 16", "16 елементів у стеку", "Відступ 16 від краю екрана"], 0, "`spacing` — проміжок між сусідніми елементами стеку."),
    F("Постав іконку і підпис **поруч**.", S`___ {
    Image(systemName: "book")
    Text("Читання")
}`, [["HStack"]], "Поруч, горизонтально — `HStack`."),
    F("Вирівняй текст стеку **по правому краю**.", S`VStack(alignment: ___) {
    Text("Разом:")
    Text("120 грн")
}`, [[".trailing"]], "У VStack правий край — `.trailing`, лівий — `.leading`."),
    B("Цей код не компілюється. Де помилка?", S`VStack {
    Text("Кафе «Ранок»")
    Text("Меню")
    Hstack {
        Text("Кава")
        Text("45 грн")
    }
}`, 3, "Swift розрізняє великі й малі літери: правильно `HStack`, з великою S."),
    K("Який код дає такий екран?", "", [{ code: S`ZStack {
    Text("🟡")
    Text("5")
}` }, { code: S`HStack {
    Text("🟡")
    Text("5")
}` }, { code: S`VStack {
    Text("🟡")
    Text("5")
}` }], 1, "Кружечок і число стоять поруч — це `HStack`.", phone(h(t("🟡", "font-size:22px") + t("5", "font-size:22px;margin-left:6px")))),
  ],
});

// ===================== 3. Модифікатори =====================
LEVELS.push({
  id: "mods", kind: "learn", title: "Модифікатори",
  about: "font, foregroundStyle, padding, background і чому порядок має значення.",
  items: [
    L("View + модифікатор = змінений елемент", "**Модифікатор** — метод через крапку, що повертає змінену копію елемента. Їх пишуть ланцюжком, кожен з нового рядка:\n\n• `.font(.title)` — розмір і стиль шрифту;\n• `.foregroundStyle(.blue)` — колір тексту чи значка;\n• `.padding()` — відступ навколо;\n• `.background(.yellow)` — фон.\n\nЗначення з крапкою (`.title`, `.blue`) — готові варіанти зі списку.",
      S`Text("Привіт, Київ")
    .font(.title)
    .foregroundStyle(.blue)
    .padding()
    .background(.yellow)`),
    Q("Як зробити текст червоним?", ["`.foregroundStyle(.red)`", "`.background(.red)`", "`.font(.red)`", "`.color = red`"], 0, "`foregroundStyle` фарбує сам текст. `background` фарбує фон під ним."),
    F("Зроби текст великим заголовком і синім.", S`Text("Розклад")
    .font(___)
    .foregroundStyle(___)`, [[".largeTitle", ".title"], [".blue"]], "Для шрифту — готові стилі `.largeTitle`, `.title`, а колір — `.blue`."),
    L("Порядок має значення", "Ланцюжок читається **зверху вниз**: кожен модифікатор змінює те, що вийшло після попереднього.\n\n• `.padding()` потім `.background(.yellow)` — спершу додали відступ, потім пофарбували **все разом з відступом**: велика жовта плашка.\n• `.background(.yellow)` потім `.padding()` — спершу пофарбували **тільки текст**, потім додали порожній відступ: жовте лише під літерами."),
    K("Який вигляд дасть цей код?", S`Text("Swift")
    .padding()
    .background(.yellow)`, [
      phone(box(t("Swift", "font-weight:600"), "background:#ffcc00;padding:16px")),
      phone(box(box(t("Swift", "font-weight:600"), "background:#ffcc00;padding:0 2px"), "padding:16px;outline:1px dashed #bbb")),
      phone(t("Swift", "font-weight:600;color:#ffcc00")),
      phone(box(t("Swift", "font-weight:600"), "background:#ffcc00;padding:0 2px")),
    ], 0, "Спершу відступ, потім фон: жовтий займає текст разом із відступом."),
    K("А тепер модифікатори помінялися місцями. Який вигляд?", S`Text("Swift")
    .background(.yellow)
    .padding()`, [
      phone(box(t("Swift", "font-weight:600"), "background:#ffcc00;padding:16px")),
      phone(box(box(t("Swift", "font-weight:600"), "background:#ffcc00;padding:0 2px"), "padding:16px;outline:1px dashed #bbb")),
      phone(t("Swift", "font-weight:600;color:#ffcc00")),
      phone(box(t("Swift", "font-weight:600;color:#fff"), "background:#ffcc00;padding:16px")),
    ], 1, "Спершу пофарбували лише текст, потім додали прозорий відступ. Пунктир на макеті — це межа відступу, на екрані її не видно."),
    Q("Чим відрізняються `.font(.title)` і `.font(.caption)`?", ["`.title` — великий заголовок, `.caption` — дрібний підпис", "Нічим", "`.caption` робить текст жирним", "`.title` змінює колір"], 0, "Стилі від найбільшого: `.largeTitle`, `.title`, `.title2`, `.headline`, `.body`, `.subheadline`, `.caption`."),
    B("Код не компілюється. Де помилка?", S`Text("Привіт")
    .font(.title)
    foregroundStyle(.blue)
    .padding()`, 2, "Перед модифікатором потрібна крапка: `.foregroundStyle(.blue)`."),
    F("Додай відступ **20** точок навколо тексту.", S`Text("Картка")
    .padding(___)`, [["20"]], "У `.padding()` можна передати число: `.padding(20)`. Без числа SwiftUI бере стандартний відступ."),
    O("Скільки модифікаторів у цьому коді? Напиши число.", S`Text("Привіт, Київ")
    .font(.title)
    .foregroundStyle(.blue)
    .padding()
    .background(.yellow)`, "4", "Модифікатори — це все, що через крапку після `Text(…)`: font, foregroundStyle, padding, background."),
  ],
});

// ===================== 4. Текст і колір =====================
LEVELS.push({
  id: "color", kind: "learn", title: "Текст і колір",
  about: "Готові кольори, RGB, .secondary, прозорість, жирність, вирівнювання рядків.",
  items: [
    L("Кольори", "**Готові назви:** `.red`, `.orange`, `.yellow`, `.green`, `.mint`, `.teal`, `.cyan`, `.blue`, `.indigo`, `.purple`, `.pink`, `.brown`, `.gray`, `.black`, `.white`, `.clear` (прозорий).\n\n**RGB:** `Color(red: 1, green: 0.5, blue: 0)`. Кожне число від **0 до 1**: 0 — немає цього кольору, 1 — максимум.\n\n**Системні стилі:** `.primary` — основний текст, `.secondary` — другорядний (сірий), `.tertiary` — ще світліший. Вони самі змінюються у світлій і темній темі.\n\n**Прозорість:** `.white.opacity(0.8)` — білий на 80%."),
    Q("Який колір дасть `Color(red: 1, green: 0, blue: 0)`?", ["Червоний", "Зелений", "Чорний", "Білий"], 0, "Червоний на максимумі (1), зеленого й синього немає (0)."),
    Q("Який колір дасть `Color(red: 0, green: 0, blue: 0)`?", ["Чорний", "Білий", "Сірий", "Прозорий"], 0, "Усі складники 0 — світла немає, виходить чорний. Усі по 1 — білий."),
    Q("Потрібен сірий текст-пояснення, який гарно виглядає і у світлій, і в темній темі. Що обрати?", ["`.foregroundStyle(.secondary)`", "`.foregroundStyle(.gray)`", "`.background(.gray)`", "`.foregroundStyle(.black)`"], 0, "`.secondary` — системний стиль для другорядного тексту. Він сам підлаштовується під тему, а `.gray` — завжди однаковий сірий."),
    F("Зроби білий текст напівпрозорим: 70% білого.", S`Text("Swift-розробниця")
    .foregroundStyle(.white.___(0.7))`, [["opacity"]], "`.opacity(0.7)` — 70% непрозорості."),
    L("Шрифт і рядки", "• `.font(.title2.bold())` — стиль і жирність одразу;\n• `.bold()` — просто жирний;\n• `.font(.system(size: 34, weight: .bold, design: .rounded))` — точний розмір, вага і закруглений шрифт;\n• `.tracking(3)` — розріджені літери;\n• `.multilineTextAlignment(.center)` — рядки довгого тексту по центру;\n• `\\n` усередині рядка — перенесення на новий рядок.",
      S`Text("Оцініть застосунок,\nце займе хвилину")
    .font(.subheadline)
    .foregroundStyle(.secondary)
    .multilineTextAlignment(.center)`),
    O("Скільки рядків займе цей текст на екрані? Напиши число.", S`Text("Оцініть застосунок,\nце займе хвилину")`, "2", "`\\n` — перенесення рядка, тож текст іде у два рядки."),
    K("Який вигляд дасть цей код?", S`Text("СЬОГОДНІ")
    .font(.caption.bold())
    .tracking(3)
    .foregroundStyle(.indigo)`, [
      phone(t("СЬОГОДНІ", FT.caption + BOLD + ";letter-spacing:3px;color:" + C.indigo)),
      phone(t("СЬОГОДНІ", FT.large + BOLD + ";color:" + C.indigo)),
      phone(box(t("СЬОГОДНІ", FT.caption + BOLD + ";color:#fff"), "background:" + C.indigo + ";padding:6px")),
      phone(t("сьогодні", FT.caption + ";color:" + C.indigo)),
    ], 0, "Дрібний жирний підпис з розрідженими літерами: `.caption.bold()` і `.tracking(3)`. Колір — самого тексту, бо це `foregroundStyle`."),
    F("Зроби заголовок найбільшим стилем і жирним.", S`Text("Дякуємо!")
    .font(.___.bold())`, [["largeTitle"]], "Найбільший стиль — `.largeTitle`."),
    F("Вирівняй рядки довгого тексту по центру.", S`Text("Перший рядок\nдругий рядок")
    .___(.center)`, [["multilineTextAlignment"]], "`multilineTextAlignment` вирівнює рядки тексту між собою."),
  ],
});

// ===================== 5. Картка =====================
const VIZ = phone(box(
  t("👤", "font-size:34px;background:#fff;border-radius:50%;width:44px;height:44px;line-height:44px;margin-bottom:6px") +
  t("Олена Коваль", FT.title2 + BOLD + ";color:#fff") + t("Swift-розробниця", FT.sub + ";color:rgba(255,255,255,.8);margin-top:3px"),
  "background:" + C.blue + ";border-radius:14px;padding:16px 6px;width:100%;box-shadow:0 4px 8px rgba(0,0,0,.3)"));
LEVELS.push({
  id: "card", kind: "learn", title: "Гарна картка",
  about: "frame, clipShape, shadow, «рецепт» картки й повтор екрана за зразком.",
  items: [
    L("Розмір, форма, тінь", "• `.frame(maxWidth: .infinity)` — на всю доступну ширину;\n• `.frame(width: 100, height: 100)` — точний розмір;\n• `.clipShape(RoundedRectangle(cornerRadius: 20))` — обрізати до прямокутника із заокругленими кутами (є ще `Circle()` і `Capsule()`);\n• `.shadow(radius: 8, y: 4)` — тінь, трохи зсунута вниз;\n• `.padding(.horizontal)` — відступ лише ліворуч і праворуч;\n• `Spacer()` — порожнеча, що розштовхує елементи в стеку."),
    L("Рецепт гарного елемента", "Читаємо зверху вниз:\n1. шрифт і колір тексту;\n2. відступ усередині;\n3. розмір рамки;\n4. фон;\n5. форма обрізання;\n6. тінь;\n7. відступ від краю екрана.\n\nОбирай порядок так, щоб кожен крок працював на результат попереднього.",
      S`Text("Моя картка")
    .font(.system(size: 28, weight: .bold, design: .rounded))
    .foregroundStyle(.white)
    .padding(20)
    .frame(maxWidth: .infinity)
    .background(.blue)
    .clipShape(RoundedRectangle(cornerRadius: 20))
    .shadow(color: .black.opacity(0.25), radius: 8, y: 4)
    .padding(.horizontal)`),
    R("Збери картку в порядку рецепта: відступ усередині → розмір → фон → форма → тінь → відступ від краю екрана.", S`Text("Моя картка")
    .padding(20)
    .frame(maxWidth: .infinity)
    .background(.blue)
    .clipShape(RoundedRectangle(cornerRadius: 20))
    .shadow(radius: 8)
    .padding(.horizontal)`, "Фон кладемо після відступу й ширини, щоб синім стала вся картка. Обрізаємо вже пофарбоване, а тінь — від обрізаної форми."),
    Q("Як розтягнути картку на всю ширину екрана?", ["`.frame(maxWidth: .infinity)`", "`.padding(.infinity)`", "`.font(.largeTitle)`", "`.frame(width: 0)`"], 0, "`maxWidth: .infinity` — «займи стільки ширини, скільки можна»."),
    F("Заокругли кути картки радіусом 24.", S`VStack { Text("Картка") }
    .background(.blue)
    .clipShape(RoundedRectangle(cornerRadius: ___))`, [["24"]], "`cornerRadius` — радіус заокруглення кутів."),
    K("Що станеться, якщо `.clipShape` поставити **перед** `.background`?", S`Text("Картка")
    .padding()
    .clipShape(RoundedRectangle(cornerRadius: 20))
    .background(.blue)`, [
      phone(box(t("Картка", "color:#000"), "background:" + C.blue + ";padding:14px")),
      phone(box(t("Картка", "color:#000"), "background:" + C.blue + ";padding:14px;border-radius:16px")),
      phone(box(t("Картка", "color:#000"), "padding:14px;border-radius:16px;outline:2px solid " + C.blue)),
    ], 0, "Обрізали ще непофарбований елемент, а фон додали потім — і він залишився з гострими кутами. Тому `clipShape` пишуть після `background`."),
    L("Як повторити екран за зразком", "1. Назви елементи: що тут Text, що Image, що Button.\n2. Запиши каркас без оформлення: VStack, HStack і самі елементи.\n3. Для кожної відмінності від «голого» вигляду знайди модифікатор.\n4. Підбери значення: розмір, колір, відступ.\n5. Перевір у Canvas. Є різниця — зміни одне значення й подивись ще раз."),
    K("Який код дає цю «Візитку»?", "", [{ code: S`VStack(spacing: 8) {
    Image(systemName: "person.circle.fill")
        .font(.system(size: 64))
    Text("Олена Коваль")
        .font(.title2.bold())
    Text("Swift-розробниця")
        .font(.subheadline)
        .foregroundStyle(.white.opacity(0.8))
}
.foregroundStyle(.white)
.padding(24)
.frame(maxWidth: .infinity)
.background(.blue)
.clipShape(RoundedRectangle(cornerRadius: 24))
.shadow(radius: 10, y: 6)
.padding()` }, { code: S`HStack(spacing: 8) {
    Image(systemName: "person.circle.fill")
    Text("Олена Коваль")
    Text("Swift-розробниця")
}
.background(.blue)
.padding()` }, { code: S`VStack(spacing: 8) {
    Image(systemName: "person.circle.fill")
    Text("Олена Коваль")
    Text("Swift-розробниця")
}
.foregroundStyle(.blue)
.padding()` }], 0, "Три елементи один під одним (VStack), біла піктограма й текст, синя картка із заокругленими кутами, тінню і відступом від країв.", VIZ),
    B("Картка мала бути синьою із заокругленими кутами, але кути гострі. У якому рядку причина?", S`VStack {
    Text("7 500 кроків")
}
.padding()
.clipShape(RoundedRectangle(cornerRadius: 28))
.background(.indigo)
.shadow(radius: 8)`, 4, "`clipShape` стоїть перед `background`: обрізали ще без фону. Поміняй ці два рядки місцями."),
  ],
});

// ===================== 6. Image і SF Symbols =====================
LEVELS.push({
  id: "symbols", kind: "learn", title: "Значки SF Symbols",
  about: "Image(systemName:), розмір значка шрифтом, колір і популярні назви.",
  items: [
    L("SF Symbols", "**SF Symbols** — тисячі готових значків від Apple. Їх показують так:\n`Image(systemName: \"heart.fill\")`\n\nНазви з крапками: `house`, `gear`, `bell`, `cart`, `camera`, `music.note`, `map`, `calendar`, `clock`, `book`, `person.crop.circle`, `paperplane`, `trash`, `flame`, `drop`, `leaf`, `star.fill`, `plus.circle.fill`, `checkmark.circle.fill`.\n\n`.fill` у кінці — **зафарбований** варіант: `heart` — контур, `heart.fill` — суцільне серце.\n\nЗначок поводиться як текст: розмір задають `.font(.system(size: 64))` або `.font(.largeTitle)`, колір — `.foregroundStyle(.red)`.",
      S`Image(systemName: "star.fill")
    .font(.system(size: 80))
    .foregroundStyle(.yellow)`),
    Q("Чим `heart` відрізняється від `heart.fill`?", ["`heart` — контур, `heart.fill` — зафарбоване серце", "`heart.fill` — більше", "Нічим", "`heart.fill` — анімоване"], 0, "Суфікс `.fill` — суцільна заливка."),
    F("Покажи значок-дзвіночок.", S`Image(___: "bell")`, [["systemName"]], "Для SF Symbols потрібен параметр `systemName`. Просто `Image(\"bell\")` шукатиме твою власну картинку з такою назвою."),
    Q("Як зробити значок SF Symbols більшим?", ["`.font(.system(size: 64))`", "`.size(64)`", "`.padding(64)`", "`.frame(64)`"], 0, "Значки — це символи шрифту, тож їхній розмір задає `.font`."),
    K("Який вигляд дасть цей код?", S`HStack {
    Image(systemName: "bolt.fill")
        .foregroundStyle(.orange)
    Text("520 ккал")
        .font(.headline)
}`, [
      phone(h(s("⚡", "font-size:16px;color:" + C.orange) + t("520 ккал", FT.headline + ";margin-left:5px"))),
      phone(v(s("⚡", "font-size:16px;color:" + C.orange) + t("520 ккал", FT.headline + ";margin-top:3px"))),
      phone(h(s("⚡", "font-size:16px") + t("520 ккал", FT.headline + ";margin-left:5px;color:" + C.orange))),
    ], 0, "HStack — поруч; помаранчевим пофарбовано лише значок, бо модифікатор стоїть під `Image`."),
    B("Значок не з'являється, лише порожнє місце. У якому рядку помилка?", S`VStack {
    Image("heart.fill")
        .foregroundStyle(.red)
    Text("72 уд/хв")
}`, 1, "Для системного значка потрібно `Image(systemName: \"heart.fill\")`. Без `systemName:` Xcode шукає власну картинку з такою назвою."),
    Q("Як буде правильно записано назву значка-годинника?", ["`\"clock\"`", "`\"Clock\"`", "`\"годинник\"`", "`clock` без лапок"], 0, "Назва — це рядок у лапках, англійською, малими літерами."),
    F("Зроби галочку зеленою.", S`Image(systemName: "checkmark.circle.fill")
    .___(.green)`, [["foregroundStyle"]], "Колір значка, як і тексту, задає `foregroundStyle`."),
  ],
});

// ===================== 7. Змінні і типи =====================
LEVELS.push({
  id: "vars", kind: "learn", title: "let, var і типи",
  about: "Константи й змінні, String, Int, Bool, Double, вставка значення в текст.",
  items: [
    L("let і var", "• `let` — **константа**: значення задали один раз і більше не змінюємо.\n• `var` — **змінна**: значення можна змінити.\n\nТипи даних:\n• `String` — текст: `\"Оля\"`;\n• `Int` — ціле число: `5`;\n• `Double` — дробове число: `3.5`;\n• `Bool` — так/ні: `true` або `false`.\n\nЗначення вставляють у текст так: `Text(\"Рахунок: \\(score)\")`.",
      S`let name = "Оля"      // String
var score = 0         // Int
let price = 45.5      // Double
var liked = false     // Bool`),
    Q("Значення не зміниться ніколи — наприклад, назва школи. Що краще використати?", ["`let`", "`var`", "`@State`", "Байдуже"], 0, "Для того, що не змінюється, — `let`. Swift навіть підкаже замінити `var` на `let`, якщо змінна ніколи не змінюється."),
    Q("Який тип у `var liked = false`?", ["Bool", "String", "Int", "Double"], 0, "`true` і `false` — значення типу Bool."),
    Q("Який тип у `let price = 45.5`?", ["Double", "Int", "String", "Bool"], 0, "Число з дробовою частиною — Double."),
    Q("Який тип у `let year = \"2026\"`?", ["String", "Int", "Double", "Bool"], 0, "Лапки роблять значення текстом, навіть якщо всередині цифри."),
    O("Що покаже текст на екрані?", S`let name = "Оля"
Text("Привіт, \(name)!")`, "Привіт, Оля!", "`\\(name)` вставляє значення змінної в рядок."),
    O("Що покаже текст на екрані?", S`let count = 3
Text("Лайків: \(count + 1)")`, "Лайків: 4", "Усередині `\\( )` можна навіть рахувати."),
    B("Swift показує помилку. У якому рядку?", S`let score = 0
Text("Рахунок: \(score)")
score = 5`, 2, "`score` оголошено через `let`, а константу змінювати не можна. Потрібно `var score = 0`."),
    B("Swift показує помилку. У якому рядку?", S`let count = 7
Text(count)`, 1, "`Text` приймає текст, а не число. Правильно: `Text(\"\\(count)\")`."),
    F("Встав значення змінної `city` у текст.", S`let city = "Київ"
Text("Я живу в місті ___")`, [["\\(city)"]], "Вставка значення в рядок: `\\(city)`."),
  ],
});

// ===================== 8. Власна структура =====================
LEVELS.push({
  id: "struct", kind: "learn", title: "Власний View",
  about: "Проблема повторів і struct з властивостями, як LessonCard.",
  items: [
    L("Навіщо свій View", "Якщо на екрані три однакові картки уроків, можна тричі скопіювати однаковий код. Але зміниш колір — доведеться міняти в трьох місцях.\n\nКраще створити **власну структуру** — свій View з **властивостями**. Тоді картку описуємо один раз, а використовуємо скільки завгодно, передаючи різні значення.",
      S`struct LessonCard: View {
    let subject: String
    let icon: String
    let time: String

    var body: some View {
        VStack {
            Image(systemName: icon)
                .font(.largeTitle)
            Text(subject)
                .font(.headline)
            Text(time)
                .foregroundStyle(.secondary)
        }
        .padding()
    }
}`),
    L("Як використати", "Створюємо картку, передаючи значення всіх властивостей у тому ж порядку, у якому їх оголошено:",
      S`HStack {
    LessonCard(subject: "Математика", icon: "function", time: "8:30")
    LessonCard(subject: "Фізика", icon: "atom", time: "9:25")
    LessonCard(subject: "Музика", icon: "music.note", time: "10:20")
}`),
    Q("Чому краще створити `LessonCard`, ніж тричі копіювати код картки?", ["Вигляд картки описано один раз: змінив — оновилися всі", "Так застосунок займе більше місця", "Без struct картки не покажуться", "Копіювати код у SwiftUI заборонено"], 0, "Одна структура — одне місце для змін. Це головна ідея повторного використання."),
    F("Допиши оголошення властивостей картки.", S`struct LessonCard: View {
    let subject: ___
    let time: String
    var body: some View {
        Text(subject)
    }
}`, [["String"]], "Назва предмета — текст, тип `String`."),
    F("Створи картку уроку історії о 11:15 зі значком `book`.", S`LessonCard(subject: "Історія", icon: "book", ___: "11:15")`, [["time"]], "Значення передаємо з назвами властивостей: `subject:`, `icon:`, `time:`."),
    B("Картка не створюється. У якому рядку помилка?", S`HStack {
    LessonCard(subject: "Хімія", icon: "flask", time: "9:25")
    LessonCard(subject: "Біологія", time: "10:20")
}`, 2, "Пропущено властивість `icon`. Потрібно передати всі: `subject`, `icon`, `time`."),
    Q("У `LessonCard` властивості `subject`, `icon`, `time`. Що з'явиться на місці `Text(time)` у `LessonCard(subject: \"Фізика\", icon: \"atom\", time: \"9:25\")`?", ["9:25", "time", "Фізика", "atom"], 0, "`time` всередині структури — це значення, яке передали при створенні."),
    R("Збери власний View у правильному порядку.", S`struct LessonCard: View {
    let subject: String
    var body: some View {
        Text(subject)
    }
}`, "Спершу оголошення структури, потім властивості, потім body з елементами."),
  ],
});

// ===================== 9. Кнопки =====================
LEVELS.push({
  id: "buttons", kind: "learn", title: "Кнопки",
  about: "Будова Button, три способи записати, buttonStyle, controlSize, tint.",
  items: [
    L("Будова кнопки", "Кнопка має три частини:\n• **підпис** — що написано на кнопці;\n• **дія** — код у фігурних дужках, що виконується при натисканні;\n• **вигляд** — модифікатори.\n\nПоки дії немає, пишуть порожні дужки: `{ }`.",
      S`// 1. Текст і дія
Button("Оцінити") {
    print("Натиснуто")
}

// 2. Дія окремо, вигляд окремо
Button(action: { print("OK") }) {
    Text("Оцінити")
}

// 3. Кнопка із символом
Button("Лайк", systemImage: "heart.fill") { }`),
    Q("Що в коді `Button(\"Зберегти\") { save() }` виконується при натисканні?", ["`save()`", "`\"Зберегти\"`", "Нічого", "`Button`"], 0, "У фігурних дужках — дія кнопки."),
    F("Додай до кнопки значок-серце.", S`Button("Лайк", ___: "heart.fill") { }`, [["systemImage"]], "Значок кнопки — параметр `systemImage`."),
    L("Стиль кнопки", "• `.buttonStyle(.bordered)` — світла заливка;\n• `.buttonStyle(.borderedProminent)` — яскрава заливка, головна кнопка екрана;\n• `.buttonStyle(.plain)` — без оформлення;\n• `.controlSize(.large)` — більша кнопка;\n• `.tint(.orange)` — колір кнопки;\n• `.buttonBorderShape(.capsule)` — форма капсули."),
    K("Який вигляд дасть цей код?", S`Button("Оцінити") { }
    .buttonStyle(.borderedProminent)
    .controlSize(.large)`, [
      phone(b("Оцінити", "prom large")),
      phone(b("Оцінити", "bordered")),
      phone(b("Оцінити", "plain")),
      phone(b("Оцінити", "prom large", "background:" + C.orange)),
    ], 0, "`.borderedProminent` — яскрава синя заливка, `.controlSize(.large)` — великий розмір."),
    K("Який вигляд дасть цей код?", S`Button("Почати тренування") { }
    .buttonStyle(.borderedProminent)
    .buttonBorderShape(.capsule)
    .tint(.orange)`, [
      phone(b("Почати тренування", "prom", "background:" + C.orange + ";border-radius:99px")),
      phone(b("Почати тренування", "prom", "border-radius:99px")),
      phone(b("Почати тренування", "bordered", "color:" + C.orange)),
      phone(b("Почати тренування", "prom", "background:" + C.orange + ";border-radius:2px")),
    ], 0, "`.tint(.orange)` фарбує кнопку в помаранчевий, `.capsule` — заокруглені краї до півкола."),
    Q("Яка кнопка на екрані «Подяка» має бути головною, з яскравою заливкою?", ["«Оцінити» — `.borderedProminent`", "«Пізніше» — `.borderedProminent`", "Обидві однакові", "Жодна"], 0, "Головну дію виділяють яскравою заливкою, другорядну («Пізніше») — без заливки, сірим кольором."),
    F("Зроби кнопку великою.", S`Button("Купити") { }
    .buttonStyle(.borderedProminent)
    .controlSize(___)`, [[".large"]], "Розмір кнопки — `.controlSize(.large)`."),
    K("Який код дає екран «Подяка»?", "", [{ code: S`VStack(spacing: 16) {
    Image(systemName: "star.fill")
        .font(.system(size: 80))
        .foregroundStyle(.yellow)
    Text("Дякуємо!")
        .font(.largeTitle.bold())
    Text("Оцініть застосунок,\nце займе хвилину")
        .font(.subheadline)
        .foregroundStyle(.secondary)
        .multilineTextAlignment(.center)
    Button("Оцінити") { }
        .buttonStyle(.borderedProminent)
        .controlSize(.large)
    Button("Пізніше") { }
        .foregroundStyle(.secondary)
}` }, { code: S`HStack(spacing: 16) {
    Image(systemName: "star.fill")
    Text("Дякуємо!")
    Button("Оцінити") { }
    Button("Пізніше") { }
}` }, { code: S`VStack(spacing: 16) {
    Image(systemName: "star")
    Text("Дякуємо!")
        .font(.caption)
    Button("Оцінити") { }
    Button("Пізніше") { }
        .buttonStyle(.borderedProminent)
}` }], 0, "Велика жовта зафарбована зірка, найбільший жирний заголовок, сірий текст у два рядки, яскрава кнопка «Оцінити» і сіра «Пізніше» — усе один під одним.",
      phone(v(s("⭐", "font-size:40px") + t("Дякуємо!", FT.large + BOLD + ";margin-top:10px") + t("Оцініть застосунок,<br>це займе хвилину", FT.sub + ";color:" + C.sec + ";margin-top:8px") + b("Оцінити", "prom large", "margin-top:14px;width:120px") + b("Пізніше", "plain", "color:" + C.sec + ";margin-top:6px"), "width:100%"), "#fff")),
  ],
});

// ===================== 10. @State =====================
LEVELS.push({
  id: "state", kind: "learn", title: "Екран, що змінюється",
  about: "Лічильник, лайк із toggle(), кубик, типові помилки.",
  items: [
    L("Навіщо @State", "Звичайну змінну всередині View змінити не можна: Swift скаже **«Cannot assign to property: 'self' is immutable»**.\n\nЩоб значення змінювалося і екран оновлювався, змінну позначають `@State`:\n`@State private var count = 0`\n\nЦикл: натиснули кнопку → змінилося значення → SwiftUI **сам перемалював** екран з новим значенням.",
      S`struct ContentView: View {
    @State private var count = 0

    var body: some View {
        VStack {
            Text("\(count)")
                .font(.largeTitle)
            Button("+1") {
                count += 1
            }
        }
    }
}`),
    O("Кнопку «+1» з прикладу натиснули **три рази**. Що покаже текст?", S`@State private var count = 0
...
Text("\(count)")
Button("+1") { count += 1 }`, "3", "Кожне натискання збільшує `count` на 1, а екран оновлюється сам."),
    B("Xcode пише «Cannot assign to property: 'self' is immutable». У якому рядку причина?", S`struct ContentView: View {
    var count = 0
    var body: some View {
        Button("+1") { count += 1 }
    }
}`, 1, "Бракує `@State`: правильно `@State private var count = 0`."),
    L("Лайк: Bool і toggle()", "`toggle()` перемикає Bool: було `false` — стало `true`, і навпаки.\n\nА щоб показати різне залежно від значення, використовують **тернарний оператор**: `умова ? якщо так : якщо ні`.",
      S`@State private var liked = false

Button {
    liked.toggle()
} label: {
    Image(systemName: liked ? "heart.fill" : "heart")
        .foregroundStyle(liked ? .red : .gray)
}`),
    O("`liked` спершу `false`. Кнопку натиснули один раз. Яку назву значка покаже `Image`? Напиши лише назву.", S`Image(systemName: liked ? "heart.fill" : "heart")`, "heart.fill", "Після `toggle()` `liked` стало `true`, тож береться перший варіант — `heart.fill`.", ["\"heart.fill\""]),
    B("Лайк не перемикається, Xcode показує помилку. У якому рядку?", S`@State private var liked = false
Button("Лайк") {
    liked.toggle
}`, 2, "`toggle` — це функція, її треба викликати з дужками: `liked.toggle()`."),
    F("Допиши, щоб кнопка перемикала лайк.", S`@State private var liked = false
Button("❤️") {
    liked.___()
}`, [["toggle"]], "`toggle()` змінює `true` на `false` і навпаки."),
    L("Кубик і межі", "• `Int.random(in: 1...6)` — випадкове ціле від 1 до 6 **включно**. Три крапки! З двома крапками (`1..6`) — помилка.\n• `max(1, quantity - 1)` — не дає числу опуститися нижче 1: з двох чисел береться більше.",
      S`@State private var dice = 1
Button("Кинути") {
    dice = Int.random(in: 1...6)
}`),
    B("Кубик не компілюється. Де помилка?", S`@State private var dice = 1
Button("Кинути") {
    dice = Int.random(in: 1..6)
}`, 2, "Діапазон з обома краями пишуть трьома крапками: `1...6`."),
    O("`quantity` дорівнює 1. Натиснули «−». Яким стане `quantity`?", S`Button("−") {
    quantity = max(1, quantity - 1)
}`, "1", "`max(1, 0)` — це 1. Так кількість ніколи не стане меншою за 1."),
    Q("Що з цього правильно оголошує змінну стану для лічильника?", ["`@State private var count = 0`", "`let count = 0`", "`@State let count = 0`", "`var @State count = 0`"], 0, "`@State` пишуть перед `var`. З `let` значення змінювати не можна."),
  ],
});

// ===================== 11. Фінал =====================
const ACT = phone(box(
  t("СЬОГОДНІ", FT.caption + BOLD + ";letter-spacing:2px;color:rgba(255,255,255,.7)") +
  t("7 500 кроків", "font-size:19px;font-weight:700;color:#fff;margin:6px 0 10px;font-family:ui-rounded,system-ui") +
  h(box(s("⚡", "font-size:16px") + t("520 ккал", FT.caption + BOLD), "background:#fff;border-radius:9px;padding:8px 4px;flex:1;margin-right:5px") +
    box(s("❤️", "font-size:16px") + t("72 уд/хв", FT.caption + BOLD), "background:#fff;border-radius:9px;padding:8px 4px;flex:1"), "width:100%") +
  b("Почати тренування", "prom", "background:" + C.orange + ";border-radius:99px;margin-top:12px;font-size:11px"),
  "background:" + C.indigo + ";border-radius:18px;padding:14px 8px;width:100%"));
LEVELS.push({
  id: "boss", kind: "boss", title: "Повтори екран",
  about: "Усе разом: стеки, модифікатори, кнопки, @State.",
  items: [
    K("Який каркас у «Картки активності»?", "", [{ code: S`VStack {
    Text("СЬОГОДНІ")
    Text("7 500 кроків")
    HStack {
        VStack { Image(systemName: "bolt.fill"); Text("520 ккал") }
        VStack { Image(systemName: "heart.fill"); Text("72 уд/хв") }
    }
    Button("Почати тренування") { }
}` }, { code: S`HStack {
    Text("СЬОГОДНІ")
    Text("7 500 кроків")
    VStack {
        HStack { Image(systemName: "bolt.fill"); Text("520 ккал") }
        HStack { Image(systemName: "heart.fill"); Text("72 уд/хв") }
    }
    Button("Почати тренування") { }
}` }, { code: S`ZStack {
    Text("СЬОГОДНІ")
    Text("7 500 кроків")
    Button("Почати тренування") { }
}` }], 0, "Усе йде згори вниз (VStack). Два білі блоки поруч — HStack, а в кожному значок над підписом — VStack.", ACT),
    Q("Як зробити два білі блоки **однакової ширини**?", ["Кожному дати `.frame(maxWidth: .infinity)`", "Кожному дати `.padding()`", "Написати однаковий текст", "Покласти їх у ZStack"], 0, "Обидва блоки просять максимум ширини, тож ділять її порівну."),
    F("Великий текст «7 500 кроків»: розмір 34, жирний, закруглений шрифт.", S`Text("7 500 кроків")
    .font(.system(size: 34, weight: .bold, design: ___))`, [[".rounded"]], "Закруглений шрифт — `design: .rounded`."),
    F("Оформи кнопку: яскрава заливка, форма капсули, помаранчевий колір.", S`Button("Почати тренування") { }
    .buttonStyle(.___)
    .buttonBorderShape(.___)
    .tint(.orange)`, [["borderedProminent"], ["capsule"]], "Яскрава заливка — `.borderedProminent`, форма капсули — `.capsule`."),
    B("Блоки мали стати білими з заокругленими кутами, але Xcode показує помилку. У якому рядку?", S`VStack {
    Image(systemName: "heart.fill").foregroundStyle(.red)
    Text("72 уд/хв").font(.headline)
}
.frame(maxWidth: .infinity).padding()
.background(.White).cornerRadius(16)`, 5, "Кольори пишуться з малої літери: `.white`."),
    K("Що покаже цей код після **двох** натискань на кнопку?", S`@State private var steps = 20

VStack {
    Text("\(steps) кроків")
        .font(.title.bold())
    Button("+50") { steps += 50 }
        .buttonStyle(.bordered)
}`, [
      phone(v(t("120 кроків", FT.title + BOLD) + b("+50", "bordered", "margin-top:8px"))),
      phone(v(t("20 кроків", FT.title + BOLD) + b("+50", "bordered", "margin-top:8px"))),
      phone(v(t("70 кроків", FT.title + BOLD) + b("+50", "bordered", "margin-top:8px"))),
      phone(v(t("steps кроків", FT.title + BOLD) + b("+50", "bordered", "margin-top:8px"))),
    ], 0, "20 + 50 + 50 = 120. Завдяки `@State` текст оновлюється після кожного натискання."),
    Q("Яка з вимог до сторінки власного застосунку **не** обов'язкова?", ["Анімація переходу між екранами", "3+ різні Text", "2+ Image", "8+ модифікаторів"], 0, "Обов'язково: 3+ Text, 2+ Image, 1–2 Button з різним стилем, 8+ модифікаторів, 2 типи стеків і колір фону."),
    R("Збери лічильник у правильному порядку.", S`struct ContentView: View {
    @State private var count = 0
    var body: some View {
        Button("Натиснуто: \(count)") {
            count += 1
        }
    }
}`, "Змінна стану оголошується в структурі перед `body`, а змінюється в дії кнопки."),
    Q("Перед показом сторінки що варто перевірити першим?", ["Що вона запускається і Canvas без червоних помилок", "Що код якомога довший", "Що всі кольори червоні", "Що в коді немає жодного стеку"], 0, "Спершу — що все працює. Потім: усі елементи з вимог, 8+ модифікаторів, охайні відступи, і ти можеш пояснити кожен рядок."),
  ],
});
