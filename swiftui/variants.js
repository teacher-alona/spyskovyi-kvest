// ---- Альтернативні варіанти завдань SwiftUI: при повторному проходженні випадає інше питання ----
// ALT(рівень, номер завдання серед не-пояснень, ...варіанти) — додає варіанти до наявного завдання
(function () {
const ALT = (lvId, k, ...alts) => {
  const lv = LEVELS.find(l => l.id === lvId);
  const idx = lv.items.map((it, i) => it.t === "lesson" ? -1 : i).filter(i => i >= 0)[k];
  const cur = lv.items[idx];
  lv.items[idx] = { pick: [...(cur.pick || [cur]), ...alts] };
};
const S = String.raw;
const Q = (q, options, a, why, code) => ({ t: "quiz", q, options, a, why, code });
const O = (q, code, a, why, accept) => ({ t: "output", q, code, a, why, accept });
const B = (q, code, a, why) => ({ t: "bug", q, code, a, why });
const R = (q, code, why) => ({ t: "order", q, code, out: "", why });
const F = (q, code, a, why) => ({ t: "fill", q, code, a, why });
const K = (q, code, options, a, why, screen) => ({ t: "look", q, code, options, a, why, screen });
const { phone, t, s, v, h, z, box, b, C } = window.SW;
const FT = { large: "font-size:21px", title: "font-size:18px", title2: "font-size:16px", headline: "font-size:13px;font-weight:600", sub: "font-size:11.5px", caption: "font-size:10px" };
const BOLD = ";font-weight:700";
const rnd = (a, b2) => a + Math.floor(Math.random() * (b2 - a + 1));

// ---------- 1. Файл ----------
ALT("file", 0,
  Q("Що станеться, якщо видалити рядок `import SwiftUI`?", ["Swift не знатиме `Text`, `VStack` та інші елементи — буде помилка", "Нічого, він необов'язковий", "Застосунок стане швидшим", "Зникне лише Canvas"], 0, "У `import SwiftUI` — уся бібліотека елементів екрана."),
  Q("Який рядок стоїть на самому початку файлу ContentView.swift?", ["`import SwiftUI`", "`#Preview {`", "`var body: some View {`", "`Text(\"Привіт\")`"], 0, "Спершу підключаємо бібліотеку, а вже потім описуємо екран."));
ALT("file", 1,
  Q("Що з'явиться на екрані з цього файлу?", ["Лише те, що всередині `body`", "Усе, що написано у файлі", "Лише назва структури", "Вміст `#Preview` і `import`"], 0, "Екран будується з `body`: решта файлу — це будова, а не вміст.",
    S`struct ContentView: View {
    var body: some View {
        Text("Добрий ранок")
    }
}`),
  Q("Потрібно змінити текст на екрані. Що редагуємо?", ["Вміст фігурних дужок `body`", "Рядок `import SwiftUI`", "Назву `ContentView`", "Блок `#Preview`"], 0, "Для нового вмісту змінюємо лише `body`."));
ALT("file", 2,
  Q("Що всередині блоку `#Preview { … }`?", ["Екран, який треба показати в Canvas: `ContentView()`", "Колір фону", "Назва застосунку", "Код кнопки"], 0, "`#Preview { ContentView() }` — «покажи в Canvas екран ContentView»."),
  Q("Ти змінила текст у `body`. Де одразу побачити результат, не запускаючи iPhone?", ["У Canvas праворуч від коду", "У Finder", "У налаштуваннях Xcode", "Ніде, тільки на телефоні"], 0, "Canvas показує результат одразу, завдяки `#Preview`."));
ALT("file", 3,
  F("Допиши будову екрана.", S`import SwiftUI

struct ___: View {
    var body: some ___ {
        Text("Мій екран")
    }
}`, [["ContentView"], ["View"]], "Структура називається `ContentView`, а тіло має тип `some View`."),
  F("Допиши блок попереднього перегляду.", S`#___ {
    ContentView()
}`, [["Preview"]], "`#Preview` показує екран у Canvas."));
ALT("file", 4,
  F("Допиши ключове слово.", S`struct ContentView: View {
    ___ body: some View {
        Text("Привіт!")
    }
}`, [["var"]], "Тіло екрана оголошують через `var body: some View`."),
  F("Допиши, що повертає body.", S`struct ContentView: View {
    var body: ___ View {
        Text("Привіт!")
    }
}`, [["some"]], "`some View` — «якийсь View»: Swift сам зрозуміє, який саме."));
ALT("file", 5,
  R("Збери екран у правильному порядку.", S`import SwiftUI
struct ContentView: View {
    var body: some View {
        Text("Добрий день")
    }
}
#Preview {
    ContentView()
}`, "Import, потім структура з body, а наприкінці — #Preview."),
  R("Збери файл у правильному порядку.", S`import SwiftUI
struct ContentView: View {
    var body: some View {
        VStack {
            Text("Ранок")
        }
    }
}`, "Стек — усередині body, а текст — усередині стеку."));
ALT("file", 6,
  B("Canvas показує червону помилку. У якому рядку пропущено символ?", S`import SwiftUI

struct ContentView: View {
    var body: some View {
        Text("Добрий ранок)
    }
}`, 4, "Не закрита лапка: має бути `Text(\"Добрий ранок\")`."),
  B("Xcode пише помилку. У якому рядку причина?", S`import SwiftUI

struct ContentView: View {
    var body: some View
        Text("Привіт!")
    }
}`, 3, "Після `some View` бракує відкривальної фігурної дужки `{`."));
ALT("file", 7,
  Q("Canvas не видно взагалі. Як його відкрити?", ["Editor → Canvas", "File → New File", "Видалити #Preview", "Перезапустити Mac"], 0, "Canvas вмикається в меню Editor."),
  Q("Код підсвітився червоним. Що найчастіше винне?", ["Пропущена дужка, лапка чи крапка", "Забагато пробілів", "Темна тема Xcode", "Довга назва файлу"], 0, "Червоний рядок — шукай пропущений символ поруч."));

// ---------- 2. Стеки ----------
const phH = (a, c) => phone(h(t(a) + t(c, "margin-left:6px"))), phV = (a, c) => phone(v(t(a) + t(c, "margin-top:4px"))), phZ = (a, c) => phone(z(t(a, "font-size:30px") + t(c)));
ALT("stacks", 0,
  K("Який вигляд дасть цей код?", S`HStack {
    Text("⭐")
    Text("Улюблене")
}`, [phH("⭐", "Улюблене"), phV("⭐", "Улюблене"), phZ("⭐", "Улюблене"), phone(t("Улюблене"))], 0, "`HStack` — поруч, зліва направо."),
  K("Який вигляд дасть цей код?", S`HStack {
    Text("Кава")
    Text("45 грн")
}`, [phV("Кава", "45 грн"), phH("Кава", "45 грн"), phone(t("45 грн")), phZ("Кава", "45 грн")], 1, "`HStack` ставить елементи в один рядок."));
ALT("stacks", 1,
  K("Який вигляд дасть цей код?", S`VStack {
    Text("🎵")
    Text("Музика")
}`, [phH("🎵", "Музика"), phV("🎵", "Музика"), phZ("🎵", "Музика"), phone(t("🎵"))], 1, "`VStack` — один під одним."),
  K("Який вигляд дасть цей код?", S`ZStack {
    Text("⭕")
    Text("7")
}`, [phH("⭕", "7"), phV("⭕", "7"), phZ("⭕", "7"), phone(t("7"))], 2, "`ZStack` кладе елементи один на одного: число лежить поверх кола."));
ALT("stacks", 2,
  Q("Значок і підпис мають стояти **в одному рядку**. Який стек?", ["HStack", "VStack", "ZStack", "Жоден"], 0, "Поруч, горизонтально — HStack."),
  Q("Заголовок, текст і кнопка мають іти **один під одним**. Який стек?", ["VStack", "HStack", "ZStack", "Жоден"], 0, "Вертикально — VStack."));
ALT("stacks", 3,
  K("Який вигляд дасть цей код?", S`VStack(alignment: .trailing) {
    Text("Разом")
    Text("120 грн")
    Text("Знижка 10%")
}`, [phone(v(t("Разом") + t("120 грн") + t("Знижка 10%"), "align-items:flex-start")), phone(v(t("Разом") + t("120 грн") + t("Знижка 10%"))), phone(v(t("Разом") + t("120 грн") + t("Знижка 10%"), "align-items:flex-end"))], 2, "`.trailing` — правий край."));
ALT("stacks", 4,
  Q("Що означає `.leading` у `VStack(alignment: .leading)`?", ["Вирівняти елементи по лівому краю", "Збільшити шрифт", "Поставити елементи поруч", "Додати відступ зверху"], 0, "`.leading` — передній (лівий) край, `.trailing` — правий."),
  Q("Як зробити відстань 8 точок між елементами в HStack?", ["`HStack(spacing: 8)`", "`HStack(padding: 8)`", "`HStack(size: 8)`", "`HStack(8)`"], 0, "Проміжок між елементами стеку — `spacing`."));
ALT("stacks", 5,
  F("Постав значок над підписом (**один під одним**).", S`___ {
    Image(systemName: "music.note")
    Text("Музика")
}`, [["VStack"]], "Вертикально — `VStack`."),
  F("Поклади число **поверх** кола.", S`___ {
    Circle()
    Text("5")
}`, [["ZStack"]], "Один на одному — `ZStack`."));
ALT("stacks", 6,
  F("Вирівняй текст стеку **по лівому краю**.", S`VStack(alignment: ___) {
    Text("Ім'я")
    Text("Клас")
}`, [[".leading"]], "Лівий край — `.leading`."),
  F("Зроби відстань між елементами 12 точок.", S`VStack(___: 12) {
    Text("Перший")
    Text("Другий")
}`, [["spacing"]], "Проміжок між елементами — `spacing`."));
ALT("stacks", 7,
  B("Цей код не компілюється. Де помилка?", S`HStack {
    Text("Кава")
    text("45 грн")
}`, 2, "`Text` пишеться з великої літери."),
  B("Цей код не компілюється. Де помилка?", S`Vstack {
    Text("Розклад")
    Text("8:30")
}`, 0, "Правильно `VStack`, з великою S."));
ALT("stacks", 8,
  K("Який код дає такий екран?", "", [{ code: S`HStack {
    Text("🍎")
    Text("Яблуко")
}` }, { code: S`VStack {
    Text("🍎")
    Text("Яблуко")
}` }, { code: S`ZStack {
    Text("🍎")
    Text("Яблуко")
}` }], 1, "Значок над підписом — це `VStack`.", phone(v(t("🍎", "font-size:26px") + t("Яблуко", "margin-top:4px")))));

// ---------- 3. Модифікатори ----------
ALT("mods", 0,
  Q("Як зробити фон під текстом жовтим?", ["`.background(.yellow)`", "`.foregroundStyle(.yellow)`", "`.font(.yellow)`", "`.padding(.yellow)`"], 0, "Фон — `background`, колір самого тексту — `foregroundStyle`."),
  Q("Як додати відступ навколо тексту?", ["`.padding()`", "`.spacing()`", "`.background()`", "`.font(.padding)`"], 0, "Відступ навколо елемента — `.padding()`."));
ALT("mods", 1,
  F("Зроби текст дрібним підписом і сірим (другорядним).", S`Text("оновлено щойно")
    .font(___)
    .foregroundStyle(___)`, [[".caption", ".footnote"], [".secondary", ".gray"]], "Дрібний текст — `.caption`, другорядний колір — `.secondary`."),
  F("Зроби фон зеленим і додай відступ.", S`Text("Готово")
    .___()
    .background(___)`, [["padding"], [".green"]], "Спершу відступ, потім фон — так зелений займе і відступ."));
ALT("mods", 2,
  K("Який вигляд дасть цей код?", S`Text("Київ")
    .padding()
    .background(.mint)`, [
    phone(box(box(t("Київ", "font-weight:600"), "background:" + C.mint + ";padding:0 2px"), "padding:16px;outline:1px dashed #bbb")),
    phone(box(t("Київ", "font-weight:600"), "background:" + C.mint + ";padding:16px")),
    phone(t("Київ", "font-weight:600;color:" + C.mint)),
  ], 1, "Відступ, а потім фон: м'ятний займає і текст, і відступ."));
ALT("mods", 3,
  K("Модифікатори в такому порядку. Який вигляд?", S`Text("Київ")
    .background(.mint)
    .padding()`, [
    phone(box(t("Київ", "font-weight:600"), "background:" + C.mint + ";padding:16px")),
    phone(t("Київ", "font-weight:600;color:" + C.mint)),
    phone(box(box(t("Київ", "font-weight:600"), "background:" + C.mint + ";padding:0 2px"), "padding:16px;outline:1px dashed #bbb")),
  ], 2, "Пофарбували тільки текст, а відступ додали потім — він прозорий."));
ALT("mods", 4,
  Q("Який стиль шрифту **найбільший**?", ["`.largeTitle`", "`.title`", "`.headline`", "`.caption`"], 0, "Від найбільшого: largeTitle, title, title2, headline, body, subheadline, caption."),
  Q("Який стиль шрифту **найменший** з цих?", ["`.caption`", "`.body`", "`.title`", "`.headline`"], 0, "`.caption` — дрібний підпис."));
ALT("mods", 5,
  B("Код не компілюється. Де помилка?", S`Text("Привіт")
    .font(.title)
    .foregroundStyle(blue)
    .padding()`, 2, "Перед готовим кольором потрібна крапка: `.blue`."),
  B("Код не компілюється. Де помилка?", S`Text("Привіт")
    .font(.title
    .padding()`, 1, "Не закрита кругла дужка: `.font(.title)`."));
ALT("mods", 6,
  F("Додай відступ **8** точок навколо тексту.", S`Text("Тег")
    .padding(___)`, [["8"]], "Число в `.padding()` — розмір відступу."),
  F("Додай відступ лише **зліва і справа**.", S`Text("Кнопка")
    .padding(.___)`, [["horizontal"]], "`.padding(.horizontal)` — відступ ліворуч і праворуч."));
ALT("mods", 7,
  O("Скільки модифікаторів у цьому коді? Напиши число.", S`Text("Ранок")
    .font(.headline)
    .padding()
    .background(.orange)`, "3", "font, padding, background — три модифікатори."),
  O("Скільки модифікаторів у цьому коді? Напиши число.", S`Text("Вечір")
    .font(.title)
    .bold()
    .foregroundStyle(.white)
    .padding()
    .background(.indigo)`, "5", "font, bold, foregroundStyle, padding, background — п'ять."));

// ---------- 4. Колір і текст ----------
ALT("color", 0,
  Q("Який колір дасть `Color(red: 0, green: 0, blue: 1)`?", ["Синій", "Червоний", "Зелений", "Чорний"], 0, "Максимум лише синього."),
  Q("Який колір дасть `Color(red: 0, green: 1, blue: 0)`?", ["Зелений", "Синій", "Червоний", "Жовтий"], 0, "Максимум лише зеленого."));
ALT("color", 1,
  Q("Який колір дасть `Color(red: 1, green: 1, blue: 1)`?", ["Білий", "Чорний", "Сірий", "Червоний"], 0, "Усі складники на максимумі — білий."),
  Q("Який колір дасть `Color(red: 1, green: 1, blue: 0)`?", ["Жовтий", "Білий", "Фіолетовий", "Блакитний"], 0, "Червоний + зелений світло дають жовтий."));
ALT("color", 2,
  Q("Основний текст, що сам змінюється в темній темі (чорний ↔ білий). Що обрати?", ["`.primary`", "`.black`", "`.white`", "`.gray`"], 0, "`.primary` — системний колір основного тексту."),
  Q("Що означає `.clear`?", ["Прозорий колір", "Білий колір", "Очистити екран", "Видалити текст"], 0, "`.clear` — повністю прозорий."));
ALT("color", 3,
  F("Зроби чорну тінь прозорою на 25%.", S`.shadow(color: .black.___(0.25), radius: 8)`, [["opacity"]], "Прозорість кольору — `.opacity(…)`."),
  F("Зроби фон синім на 50%.", S`Text("Привіт")
    .background(.blue.opacity(___))`, [["0.5", ".5"]], "50% — це 0.5."));
ALT("color", 4,
  O("Скільки рядків займе цей текст на екрані? Напиши число.", S`Text("Раз\nДва\nТри")`, "3", "Два `\\n` — три рядки."),
  O("Скільки рядків займе цей текст на екрані? Напиши число.", S`Text("Привіт, світ!")`, "1", "Перенесення `\\n` немає — один рядок."));
ALT("color", 5,
  K("Який вигляд дасть цей код?", S`Text("Дякуємо!")
    .font(.largeTitle.bold())
    .foregroundStyle(.orange)`, [
    phone(t("Дякуємо!", FT.caption + ";color:" + C.orange)),
    phone(t("Дякуємо!", FT.large + BOLD + ";color:" + C.orange)),
    phone(box(t("Дякуємо!", FT.large + BOLD + ";color:#fff"), "background:" + C.orange + ";padding:8px")),
  ], 1, "Великий жирний помаранчевий текст. Фону немає: `foregroundStyle` фарбує літери."));
ALT("color", 6,
  F("Зроби текст жирним.", S`Text("Важливо")
    .___()`, [["bold"]], "`.bold()` — жирний."),
  F("Розрідь літери на 2 точки.", S`Text("SALE")
    .___(2)`, [["tracking", "kerning"]], "`.tracking(2)` — більша відстань між літерами."));
ALT("color", 7,
  F("Вирівняй рядки довгого тексту по лівому краю.", S`Text("Перший рядок\nдругий")
    .multilineTextAlignment(___)`, [[".leading"]], "Ліворуч — `.leading`."),
  F("Задай шрифт розміру 30 і закруглений дизайн.", S`Text("42")
    .font(.system(size: ___, design: .___))`, [["30"], ["rounded"]], "Закруглений шрифт — `design: .rounded`."));

// ---------- 5. Картка ----------
ALT("card", 0,
  R("Збери кнопку-плашку в порядку рецепта: відступ → фон → форма → тінь.", S`Text("Купити")
    .padding()
    .background(.green)
    .clipShape(Capsule())
    .shadow(radius: 4)`, "Фон кладемо після відступу, обрізаємо пофарбоване, тінь — від уже обрізаної форми."));
ALT("card", 1,
  Q("Як зробити картку квадратом 100 на 100?", ["`.frame(width: 100, height: 100)`", "`.padding(100)`", "`.font(.system(size: 100))`", "`.frame(maxWidth: .infinity)`"], 0, "Точний розмір — `.frame(width:height:)`."),
  Q("Що робить `Spacer()` у HStack?", ["Розштовхує елементи, займаючи вільне місце", "Додає рамку", "Робить фон прозорим", "Збільшує шрифт"], 0, "Spacer — порожнеча, що забирає вільне місце."));
ALT("card", 2,
  F("Обріж картку до кола.", S`Image(systemName: "person.fill")
    .padding()
    .background(.blue)
    .clipShape(___())`, [["Circle"]], "Коло — `Circle()`."),
  F("Додай тінь радіусом 10.", S`VStack { Text("Картка") }
    .background(.white)
    .shadow(radius: ___)`, [["10"]], "Розмитість тіні — `radius`."));
ALT("card", 3,
  Q("Чому `.clipShape` пишуть **після** `.background`?", ["Щоб обрізати вже пофарбований фон", "Так коротше", "Інакше текст зникне", "Порядок не важливий"], 0, "Обрізаємо те, що вже є: якщо фону ще немає, кути лишаться гострими."));
ALT("card", 4,
  Q("У «Візитці» три елементи один під одним. Який стек головний?", ["VStack", "HStack", "ZStack", "Без стеку"], 0, "Значок, ім'я й посада — згори вниз, це VStack."));
ALT("card", 5,
  B("Нотатка мала бути жовтою із заокругленими кутами, але кути гострі. У якому рядку причина?", S`VStack {
    Text("Купити хліб")
}
.padding()
.clipShape(RoundedRectangle(cornerRadius: 16))
.background(.yellow)`, 4, "`clipShape` стоїть до `background`: обрізали ще без фону. Поміняй ці рядки місцями."));

// ---------- 6. SF Symbols ----------
ALT("symbols", 0,
  Q("Чим `star` відрізняється від `star.fill`?", ["`star` — контур, `star.fill` — зафарбована зірка", "`star.fill` — анімована", "Нічим", "`star` — більша"], 0, "`.fill` — суцільна заливка."),
  Q("Як назвати зафарбований кружечок з галочкою?", ["`checkmark.circle.fill`", "`checkmark.circle`", "`circle.check`", "`fill.checkmark`"], 0, "Суфікс `.fill` іде в кінці назви."));
ALT("symbols", 1,
  F("Покажи значок-будиночок.", S`Image(systemName: "___")`, [["house", "house.fill"]], "Будиночок — `house`."),
  F("Покажи зафарбоване серце.", S`Image(systemName: "heart.___")`, [["fill"]], "Зафарбований варіант — з `.fill`."));
ALT("symbols", 2,
  Q("Як зробити значок SF Symbols синім?", ["`.foregroundStyle(.blue)`", "`.background(.blue)`", "`.tint(.blue)` — лише так", "`.color(.blue)`"], 0, "Колір значка, як і тексту, — `foregroundStyle`."),
  Q("Значок завеликий. Як зменшити його до розміру підпису?", ["`.font(.caption)`", "`.padding(-10)`", "`.frame(width: 0)`", "Ніяк"], 0, "Значки масштабуються шрифтом."));
ALT("symbols", 3,
  K("Який вигляд дасть цей код?", S`HStack {
    Image(systemName: "heart.fill")
        .foregroundStyle(.red)
    Text("72 уд/хв")
}`, [
    phone(v(s("❤️", "font-size:16px") + t("72 уд/хв", "margin-top:3px"))),
    phone(h(s("❤️", "font-size:16px") + t("72 уд/хв", "margin-left:5px"))),
    phone(h(s("🤍", "font-size:16px") + t("72 уд/хв", "margin-left:5px;color:" + C.red))),
  ], 1, "Поруч (HStack), червоне серце, текст звичайного кольору."));
ALT("symbols", 4,
  B("Значок не з'являється. У якому рядку помилка?", S`HStack {
    Image(systemName: "Star.fill")
    Text("Улюблене")
}`, 1, "Назви SF Symbols — малими літерами: `star.fill`."),
  B("Код не компілюється. У якому рядку помилка?", S`VStack {
    Image(systemname: "bell")
    Text("Сповіщення")
}`, 1, "Параметр пишеться `systemName` з великою N."));
ALT("symbols", 5,
  Q("Який рядок покаже значок-дзвіночок?", ["`Image(systemName: \"bell\")`", "`Image(\"дзвіночок\")`", "`Text(\"bell\")`", "`Image(systemName: bell)`"], 0, "Назва англійською, у лапках, з параметром `systemName`."));
ALT("symbols", 6,
  F("Зроби значок розміром 48.", S`Image(systemName: "flame")
    .font(.system(size: ___))`, [["48"]], "Розмір значка — через `.font(.system(size:))`."),
  F("Зроби значок жовтим.", S`Image(systemName: "sun.max.fill")
    .foregroundStyle(___)`, [[".yellow"]], "Жовтий — `.yellow`."));

// ---------- 7. Змінні і типи ----------
ALT("vars", 0,
  Q("Значення змінюватиметься: кількість лайків. Що використати?", ["`var`", "`let`", "Байдуже", "`const`"], 0, "Що змінюється — `var`."),
  Q("Що станеться, якщо змінити значення, оголошене через `let`?", ["Swift покаже помилку", "Значення зміниться", "Застосунок стане повільнішим", "Нічого"], 0, "`let` — константа, її не змінюють."));
ALT("vars", 1, Q("Який тип у `var isOn = true`?", ["Bool", "String", "Int", "Double"], 0, "`true`/`false` — Bool."));
ALT("vars", 2, Q("Який тип у `let temperature = -3.5`?", ["Double", "Int", "String", "Bool"], 0, "Дробове число — Double."), Q("Який тип у `var steps = 7500`?", ["Int", "Double", "String", "Bool"], 0, "Ціле число — Int."));
ALT("vars", 3, Q("Який тип у `let score = \"10\"`?", ["String", "Int", "Double", "Bool"], 0, "У лапках — текст."));
ALT("vars", 4, { gen: () => { const n = ["Тарас", "Ніна", "Марко", "Соня", "Даша"][rnd(0, 4)]; return O("Що покаже текст на екрані?", `let name = "${n}"\nText("Мене звати \\(name)")`, `Мене звати ${n}`, "`\\(name)` вставляє значення змінної."); } });
ALT("vars", 5, { gen: () => { const a = rnd(2, 9), k = rnd(2, 5); return O("Що покаже текст на екрані?", `let count = ${a}\nText("Разом: \\(count * ${k})")`, `Разом: ${a * k}`, `${a} · ${k} = ${a * k}.`); } },
  { gen: () => { const a = rnd(10, 30), d = rnd(2, 9); return O("Що покаже текст на екрані?", `let price = ${a}\nText("Ціна: \\(price - ${d}) грн")`, `Ціна: ${a - d} грн`, `${a} − ${d} = ${a - d}.`); } });
ALT("vars", 6,
  B("Swift показує помилку. У якому рядку?", S`let city = "Київ"
city = "Львів"
Text(city)`, 1, "`city` — константа (`let`). Щоб змінювати, потрібно `var`."));
ALT("vars", 7,
  B("Swift показує помилку. У якому рядку?", S`let price = 45.5
Text(price)`, 1, "`Text` не приймає число. Правильно: `Text(\"\\(price)\")`."));
ALT("vars", 8,
  F("Встав значення змінної `score` у текст.", S`var score = 10
Text("Очки: ___")`, [["\\(score)"]], "Вставка значення — `\\(score)`."),
  F("Оголоси змінну, яку потім змінюватимеш.", S`___ likes = 0
likes = likes + 1`, [["var"]], "Змінне значення — `var`."));

// ---------- 8. Власний View ----------
ALT("struct", 0,
  Q("Що таке властивості в `struct LessonCard`?", ["Дані, які передаємо картці: предмет, значок, час", "Кольори Xcode", "Модифікатори", "Файли проєкту"], 0, "Властивості — це те, чим одна картка відрізняється від іншої."));
ALT("struct", 1,
  F("Допиши: свій екран — це теж View.", S`struct LessonCard: ___ {
    let subject: String
    var body: some View { Text(subject) }
}`, [["View"]], "Структура `: View` — означає, що її можна показати."));
ALT("struct", 2,
  F("Створи картку уроку фізики о 9:25 зі значком `atom`.", S`LessonCard(___: "Фізика", icon: "atom", time: "9:25")`, [["subject"]], "Назва предмета — властивість `subject`."),
  F("Створи картку уроку музики о 10:20.", S`LessonCard(subject: "Музика", ___: "music.note", time: "10:20")`, [["icon"]], "Значок — властивість `icon`."));
ALT("struct", 3,
  B("Картка не створюється. У якому рядку помилка?", S`VStack {
    LessonCard(subject: "Хімія", icon: "flask", time: "9:25")
    LessonCard(subject: "Фізика", icon: "atom", time: 10)
}`, 2, "`time` має тип String, тож значення пишемо в лапках: `\"10:20\"`."));
ALT("struct", 4,
  Q("Що з'явиться на місці `Image(systemName: icon)` у `LessonCard(subject: \"Музика\", icon: \"music.note\", time: \"10:20\")`?", ["Значок music.note", "Слово icon", "Слово Музика", "Нічого"], 0, "`icon` — це передане значення `\"music.note\"`."));
ALT("struct", 5,
  R("Збери власний View у правильному порядку.", S`struct Badge: View {
    let title: String
    var body: some View {
        Text(title)
            .padding()
    }
}`, "Структура, властивість, body, а в ньому текст з модифікатором."));

// ---------- 9. Кнопки ----------
ALT("buttons", 0,
  Q("Що в коді `Button(\"Лайк\") { likes += 1 }` — підпис кнопки?", ["`\"Лайк\"`", "`likes += 1`", "`Button`", "Фігурні дужки"], 0, "Текст у круглих дужках — підпис, а у фігурних — дія."),
  Q("Кнопка поки нічого не робить. Як записати дію?", ["Порожні фігурні дужки `{ }`", "Нічого не писати", "`{ nil }`", "`()`"], 0, "Порожня дія — `{ }`."));
ALT("buttons", 1,
  F("Додай до кнопки значок-кошик.", S`Button("Видалити", systemImage: "___") { }`, [["trash", "trash.fill"]], "Кошик — `trash`."));
ALT("buttons", 2,
  K("Який вигляд дасть цей код?", S`Button("Пізніше") { }
    .buttonStyle(.bordered)`, [phone(b("Пізніше", "prom large")), phone(b("Пізніше", "bordered")), phone(b("Пізніше", "prom", "background:" + C.orange))], 1, "`.bordered` — світла заливка."));
ALT("buttons", 3,
  K("Який вигляд дасть цей код?", S`Button("Зберегти") { }
    .buttonStyle(.borderedProminent)
    .tint(.green)`, [phone(b("Зберегти", "prom", "background:" + C.green)), phone(b("Зберегти", "bordered", "color:" + C.green)), phone(b("Зберегти", "prom"))], 0, "Яскрава заливка, пофарбована `.tint(.green)`."));
ALT("buttons", 4,
  Q("Яким стилем позначити головну кнопку «Купити»?", ["`.borderedProminent`", "`.plain`", "`.bordered`", "Без стилю"], 0, "Головну дію виділяють яскравою заливкою."));
ALT("buttons", 5,
  F("Зроби кнопку помаранчевою.", S`Button("Почати") { }
    .buttonStyle(.borderedProminent)
    .___(.orange)`, [["tint"]], "Колір кнопки — `.tint`."),
  F("Зроби кнопку у формі капсули.", S`Button("Почати") { }
    .buttonStyle(.borderedProminent)
    .buttonBorderShape(.___)`, [["capsule"]], "Капсула — `.capsule`."));
ALT("buttons", 6,
  Q("На екрані «Подяка» кнопка «Пізніше» сіра і без заливки. Який код?", ["`Button(\"Пізніше\") { }.foregroundStyle(.secondary)`", "`Button(\"Пізніше\") { }.buttonStyle(.borderedProminent)`", "`Button(\"Пізніше\") { }.tint(.orange)`", "`Text(\"Пізніше\").bold()`"], 0, "Другорядна кнопка — без заливки, сірим кольором."));

// ---------- 10. @State ----------
ALT("state", 0, { gen: () => { const k = rnd(2, 6), st = rnd(0, 5); return O(`Початкове значення ${st}. Кнопку «+1» натиснули **${k} рази**. Що покаже текст?`, `@State private var count = ${st}\n...\nText("\\(count)")\nButton("+1") { count += 1 }`, String(st + k), `${st} + ${k} = ${st + k}.`); } },
  { gen: () => { const k = rnd(2, 4), st = rnd(10, 20); return O(`Кнопку «−2» натиснули **${k} рази**. Що покаже текст?`, `@State private var score = ${st}\n...\nText("\\(score)")\nButton("−2") { score -= 2 }`, String(st - 2 * k), `${st} − 2 · ${k} = ${st - 2 * k}.`); } });
ALT("state", 1,
  B("Xcode пише «Cannot assign to property: 'self' is immutable». У якому рядку причина?", S`struct ContentView: View {
    var liked = false
    var body: some View {
        Button("❤️") { liked.toggle() }
    }
}`, 1, "Змінну, яку змінює кнопка, позначають `@State`: `@State private var liked = false`."));
ALT("state", 2,
  O("`isOn` спершу `true`. Кнопку з `isOn.toggle()` натиснули один раз. Який текст покаже `Text`?", S`Text(isOn ? "Увімкнено" : "Вимкнено")`, "Вимкнено", "Після toggle `isOn` стало false — береться другий варіант."),
  O("`liked` спершу `false`. Кнопку з `liked.toggle()` натиснули **двічі**. Яку назву значка покаже `Image`?", S`Image(systemName: liked ? "heart.fill" : "heart")`, "heart", "Два перемикання повертають false.", ["\"heart\""]));
ALT("state", 3,
  B("Код не компілюється. У якому рядку помилка?", S`@State private var count = 0
Button("+1") {
    count + = 1
}`, 2, "Оператор пишеться разом: `+=`."),
  B("Код не компілюється. У якому рядку помилка?", S`@State var private count = 0
Button("+1") {
    count += 1
}`, 0, "Порядок слів: `@State private var count = 0`."));
ALT("state", 4,
  F("Допиши, щоб кнопка збільшувала лічильник на 1.", S`@State private var count = 0
Button("+1") {
    count ___ 1
}`, [["+="]], "`count += 1` — додати 1."),
  F("Допиши змінну стану.", S`___ private var liked = false`, [["@State"]], "Змінна, що змінює екран, — `@State`."));
ALT("state", 5,
  B("Кубик має давати 1–6, але код не компілюється. Де помилка?", S`@State private var dice = 1
Button("Кинути") {
    dice = Int.random(1...6)
}`, 2, "Потрібен параметр `in:`: `Int.random(in: 1...6)`."));
ALT("state", 6, { gen: () => { const q = rnd(3, 7); return O(`\`quantity\` дорівнює ${q}. Натиснули «−». Яким стане \`quantity\`?`, `Button("−") {\n    quantity = max(1, quantity - 1)\n}`, String(q - 1), `max(1, ${q - 1}) = ${q - 1}: обмеження спрацьовує лише на одиниці.`); } },
  O("Що поверне `max(1, 0)`?", "max(1, 0)", "1", "З двох чисел береться більше."));
ALT("state", 7,
  Q("Що робить SwiftUI, коли змінюється `@State`-змінна?", ["Сам перемальовує екран з новим значенням", "Нічого, треба перезапустити застосунок", "Видаляє змінну", "Показує помилку"], 0, "Змінилось значення → екран оновився."),
  Q("Що робить `liked.toggle()`?", ["Перемикає Bool: true ↔ false", "Видаляє лайк", "Додає 1", "Робить текст червоним"], 0, "`toggle()` змінює значення Bool на протилежне."));

// ---------- 11. Фінал ----------
ALT("boss", 0,
  K("Як зібрано два білі блоки «520 ккал» і «72 уд/хв»?", "", [{ code: S`HStack {
    VStack { Image(systemName: "bolt.fill"); Text("520 ккал") }
    VStack { Image(systemName: "heart.fill"); Text("72 уд/хв") }
}` }, { code: S`VStack {
    HStack { Image(systemName: "bolt.fill"); Text("520 ккал") }
    HStack { Image(systemName: "heart.fill"); Text("72 уд/хв") }
}` }, { code: S`ZStack {
    Text("520 ккал")
    Text("72 уд/хв")
}` }], 0, "Блоки стоять поруч — HStack, а в кожному значок над підписом — VStack.", ACT));
ALT("boss", 1,
  Q("Як поставити два білі блоки поруч?", ["Покласти їх у HStack", "Покласти їх у VStack", "Додати `.padding()`", "Написати їх в одному `Text`"], 0, "Поруч — HStack."));
ALT("boss", 2,
  F("Підпис «СЬОГОДНІ»: дрібний жирний, розріджені літери.", S`Text("СЬОГОДНІ")
    .font(.caption.___())
    .tracking(2)`, [["bold"]], "Жирність до стилю — `.bold()`."));
ALT("boss", 3,
  F("Оформи картку: індиго, заокруглені кути радіусом 24.", S`VStack { Text("7 500 кроків") }
    .background(.___)
    .clipShape(RoundedRectangle(cornerRadius: ___))`, [["indigo"], ["24"]], "Колір — `.indigo`, кути — `cornerRadius: 24`."));
ALT("boss", 4,
  B("Блок мав стати білим із заокругленими кутами, але Xcode показує помилку. У якому рядку?", S`VStack {
    Image(systemName: "bolt.fill").foregroundStyle(.orange)
    Text("520 ккал").font(.Headline)
}
.background(.white)`, 2, "Стилі шрифту — з малої літери: `.headline`."));
ALT("boss", 5, { gen: () => { const st = rnd(1, 9) * 10, k = rnd(2, 4), d = [10, 20, 25][rnd(0, 2)]; const res = st + k * d;
  const opt = n => phone(v(t(`${n} кроків`, FT.title + BOLD) + b(`+${d}`, "bordered", "margin-top:8px")));
  return K(`Що покаже цей код після **${k}** натискань на кнопку?`, `@State private var steps = ${st}\n\nVStack {\n    Text("\\(steps) кроків")\n        .font(.title.bold())\n    Button("+${d}") { steps += ${d} }\n        .buttonStyle(.bordered)\n}`,
    [opt(res), opt(st), opt(st + d), opt(res + d)], 0, `${st} + ${k} · ${d} = ${res}.`); } });
ALT("boss", 6,
  Q("Скільки модифікаторів щонайменше має бути на сторінці власного застосунку?", ["8", "2", "20", "Жодного"], 0, "Вимога — 8+ модифікаторів, а ще 3+ Text, 2+ Image, кнопки й два типи стеків."));
ALT("boss", 7,
  R("Збери кнопку-лайк у правильному порядку.", S`struct ContentView: View {
    @State private var liked = false
    var body: some View {
        Button(liked ? "❤️" : "🤍") {
            liked.toggle()
        }
    }
}`, "Змінна стану — перед body, перемикання — у дії кнопки."));
ALT("boss", 8,
  Q("Ти можеш пояснити не всі рядки свого коду. Що зробити перед показом?", ["Розібратися з кожним рядком або спитати вчительку", "Видалити ці рядки, навіть якщо зламається", "Нічого, головне — щоб працювало", "Скопіювати ще більше коду"], 0, "Важливо розуміти кожен рядок свого застосунку."));
})();
