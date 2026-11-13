// ---- «Тренажери» — розширення файлів і Провідник; усі рівні відкриті одразу ----
window.GAME_INFO = {
  id: "trenazhery", title: "Тренажери", eyebrow: "Цифрова грамотність · 5 клас", plain: true, openAll: true,
  intro: "Розширення файлів, Провідник і гарячі клавіші. Тут можна тренуватися скільки завгодно і в будь-якому порядку: усі рівні відкриті одразу. Щоразу файли й завдання трохи інші.",
  types: { output: "Напиши відповідь" },
};

const L = (title, text) => ({ t: "lesson", title, text });
const Q = (q, options, a, why) => ({ t: "quiz", q, options, a, why });
const T = (q, a, why, accept) => ({ t: "output", q, a, why, code: "", accept: accept || [] });
const opts = (right, pool, n = 4) => [right].concat(shuf(pool.filter(x => x !== right)).slice(0, n - 1));

// питання «якою програмою відкриється» і «яке розширення» — з випадковим файлом
const appQ = list => G(() => { const x = rnd.pick(EXT.filter(e => list.includes(e.e))); return Q(`Що це за файл: \`${fileOf(x)}\`?`, opts(x.what, EXT.map(e => e.what)), 0, `\`${x.e}\` — ${x.what}. Відкривається: ${x.app}.`); });
const extQ = list => G(() => { const x = rnd.pick(EXT.filter(e => list.includes(e.e))); const pic = x.kind === "картинка";
  return T(`Яке розширення в цього файлу: ${x.what}?${pic ? " Напиши одне з двох." : ""}`, x.e, `${x.what[0].toUpperCase() + x.what.slice(1)} — \`${x.e}\`.`, pic ? ["jpg", "png"] : []); });

window.LEVELS = [];

// ===================== розширення =====================
LEVELS.push({
  id: "ext_media", kind: "practice", title: "Розширення: картинки, звук, відео",
  about: "Розкладаємо файли по кошиках: картинки, музика, відео.",
  items: [
    L("Пригадаймо", "**Картинки:** `jpg` (фото), `png` (малюнки, знімки екрана).\n**Музика і звук:** `mp3`.\n**Відео:** `mp4`.\n\n**mp3** — тільки звук, **mp4** — звук разом із картинкою."),
    S("Розклади файли по кошиках.", ["img", "snd"], 3, "`jpg` і `png` — картинки, `mp3` — музика."),
    S("Розклади файли по кошиках.", ["img", "snd", "vid"], 2, "`mp4` — відео, `mp3` — звук, `jpg` і `png` — картинки."),
    appQ(["jpg", "png", "mp3", "mp4"]),
    extQ(["jpg", "mp3", "mp4"]),
    S("Ще раз, швидко!", ["img", "snd", "vid"], 3, "Картинки — `jpg`, `png`; звук — `mp3`; відео — `mp4`."),
  ],
});
LEVELS.push({
  id: "ext_docs", kind: "practice", title: "Розширення: документи, презентації, таблиці",
  about: "Word, PowerPoint, Excel, Блокнот і PDF.",
  items: [
    L("Пригадаймо", "**Текстові документи:** `docx` (Word), `txt` (Блокнот), `pdf` (готовий документ для читання й друку).\n**Презентації:** `pptx` (PowerPoint).\n**Таблиці:** `xlsx` (Excel).\n\nПідказка: **d**ocx — **d**ocument, **p**ptx — **P**owerPoint, **x**lsx — E**x**cel."),
    S("Розклади файли по кошиках.", ["doc", "ppt", "xls"], 2, "`docx`, `txt`, `pdf` — документи; `pptx` — презентації; `xlsx` — таблиці."),
    G(() => { const x = rnd.pick(EXT.filter(e => ["docx", "pptx", "xlsx", "txt", "pdf"].includes(e.e))); return Q(`Якою програмою відкриється \`${fileOf(x)}\`?`, opts(x.app, ["Microsoft Word", "Блокнот", "PowerPoint", "Excel", "переглядач PDF або браузер"]), 0, `\`${x.e}\` — ${x.what}: ${x.app}.`); }),
    extQ(["docx", "pptx", "xlsx", "txt", "pdf"]),
    S("Розклади файли по кошиках.", ["doc", "ppt", "xls"], 3, "Документи — `docx`, `txt`, `pdf`; презентації — `pptx`; таблиці — `xlsx`."),
    appQ(["docx", "pptx", "xlsx", "txt", "pdf"]),
  ],
});
LEVELS.push({
  id: "ext_exe", kind: "practice", title: "Розширення: програми й архіви",
  about: "exe і zip серед інших файлів.",
  items: [
    L("Пригадаймо", "**Програми:** `exe` — такий файл не відкривається, а **запускається**. Запускай лише програми з надійних місць.\n**Архіви:** `zip` — кілька файлів, стиснутих в один."),
    S("Розклади файли по кошиках.", ["exe", "zip", "img"], 2, "`exe` — програма, `zip` — архів."),
    appQ(["exe", "zip"]),
    S("Розклади файли по кошиках.", ["exe", "zip", "doc", "snd"], 2, "`exe` — програма, `zip` — архів, `docx`/`txt`/`pdf` — документи, `mp3` — звук."),
    extQ(["exe", "zip"]),
  ],
});
LEVELS.push({
  id: "ext_all", kind: "boss", title: "Велике прибирання",
  about: "Усі розширення разом.",
  items: [
    S("Розклади все по кошиках.", ["img", "snd", "vid", "doc", "ppt", "xls"], 2, "Молодець!"),
    extQ(EXT.map(e => e.e)),
    appQ(EXT.map(e => e.e)),
    S("А тепер усі вісім кошиків!", ["img", "snd", "vid", "doc", "ppt", "xls", "exe", "zip"], 1, "Ти знаєш усі основні розширення."),
    extQ(EXT.map(e => e.e)),
    appQ(EXT.map(e => e.e)),
  ],
});

// ===================== Провідник =====================
const HOW = "Подвійний клік відкриває папку чи файл. Права кнопка миші відкриває меню. Клавіші: Ctrl + C, Ctrl + X, Ctrl + V, F2, Delete, Enter, Backspace (на рівень вище).";
LEVELS.push({
  id: "xp_nav", kind: "practice", title: "Провідник: ходимо по папках",
  about: "Відкриваємо диски, папки й файли, стежимо за адресою.",
  items: [
    L("Як працювати", "Ліворуч диски й Кошик, угорі адреса: вона показує шлях до папки, де ти зараз.\n\n" + HOW),
    X("Відкрий папку `D:\\Школа\\5 клас\\Математика`.", h => lc(h.cwd()) === lc("D:\\Школа\\5 клас\\Математика"), "Адреса показує шлях: диск, потім усі папки по черзі."),
    X("Відкрий файл `диктант.pdf`. Він лежить у папці Українська мова.", h => lc(h.opened() || "").endsWith("диктант.pdf"), "Шлях до файлу: `D:\\Школа\\5 клас\\Українська мова\\диктант.pdf`."),
    X("Перейди на диск C:.", h => h.cwd() === "C:\\", "Диски — ліворуч, або «Цей ПК» → C:."),
    X("Запусти програму `paint.exe`. Вона в папці `C:\\Program Files\\Paint`.", h => lc(h.opened() || "").endsWith("paint.exe"), "Програми зазвичай лежать у `C:\\Program Files`."),
    X("Відкрий фотографію `котик.jpg`.", h => lc(h.opened() || "").endsWith("котик.jpg"), "Файл лежить у папці `D:\\Фото`."),
  ],
});
LEVELS.push({
  id: "xp_make", kind: "practice", title: "Провідник: створити й перейменувати",
  about: "Нова папка, F2, правильні імена.",
  items: [
    L("Пригадаймо", "**Нова папка:** кнопка «Нова папка» або права кнопка → «Створити → Папку».\n**Перейменувати:** виділи → F2 → нове ім'я → Enter. Розширення (після крапки) не чіпай.\n\nУ іменах не можна використовувати символи `\\ / : * ? \" < > |`."),
    X("Створи на диску D: папку **Проєкти**.", h => h.dir("D:\\Проєкти"), "Відкрий диск D: → «Нова папка» → напиши назву → Enter."),
    X("Створи в папці Фото папку **Малюнки**.", h => h.dir("D:\\Фото\\Малюнки"), "Спершу відкрий папку Фото, потім створи в ній нову."),
    X("Перейменуй файл `ліс.jpg` у папці Фото на `осінь.jpg`.", h => h.file("D:\\Фото\\осінь.jpg") && !h.has("D:\\Фото\\ліс.jpg"), "Виділи файл → F2. Windows сама виділяє тільки ім'я, без `.jpg`."),
    X("Перейменуй папку **Фото** на **Фотографії**.", h => h.dir("D:\\Фотографії") && !h.has("D:\\Фото"), "Папки перейменовують так само, як файли: виділи → F2."),
    X("Перейменуй `новий документ.txt` у папці Школа на `розклад.txt`.", h => h.file("D:\\Школа\\розклад.txt") && !h.has("D:\\Школа\\новий документ.txt"), "Ім'я міняємо, розширення `.txt` лишається."),
  ],
});
LEVELS.push({
  id: "xp_copy", kind: "practice", title: "Провідник: копіювати й переміщати",
  about: "Ctrl + C, Ctrl + X, Ctrl + V.",
  items: [
    L("Пригадаймо", "**Копіювати** (Ctrl + C) → **Вставити** (Ctrl + V): файл буде у двох місцях.\n**Вирізати** (Ctrl + X) → **Вставити** (Ctrl + V): файл переїде, у старому місці його не буде."),
    X("Скопіюй `вірш.docx` з папки Українська мова в папку Школа. Оригінал має лишитися.", h => h.file("D:\\Школа\\вірш.docx") && h.file("D:\\Школа\\5 клас\\Українська мова\\вірш.docx"), "Ctrl + C на файлі → відкрий Школу → Ctrl + V."),
    X("Перемісти `котик.jpg` з папки Фото в папку `D:\\Школа\\5 клас`.", h => h.file("D:\\Школа\\5 клас\\котик.jpg") && !h.has("D:\\Фото\\котик.jpg"), "Переміщення — це вирізати й вставити."),
    X("Скопіюй цілу папку **Математика** на диск D: (разом із файлом усередині).", h => h.file("D:\\Математика\\задачі.docx") && h.file("D:\\Школа\\5 клас\\Математика\\задачі.docx"), "Папку копіюють так само, як файл, і все, що в ній, копіюється теж."),
    X("Створи в папці Фото папку **Природа** і перемісти туди `ліс.jpg` і `море.png`.", h => h.file("D:\\Фото\\Природа\\ліс.jpg") && h.file("D:\\Фото\\Природа\\море.png") && !h.has("D:\\Фото\\ліс.jpg") && !h.has("D:\\Фото\\море.png"), "Спершу створи папку, потім переміщуй файли по одному."),
  ],
});
LEVELS.push({
  id: "xp_bin", kind: "practice", title: "Провідник: Кошик",
  about: "Видалити й відновити.",
  items: [
    L("Пригадаймо", "**Delete** — файл іде в Кошик, його можна повернути.\n**Відновити:** Кошик → виділи файл → «Відновити». Файл повертається туди, звідки його видалили.\n\nShift + Delete видаляє назавжди, без Кошика. Тут ми так не робимо."),
    X("Видали файл `новий документ.txt` з папки Школа.", h => h.inBin("новий документ.txt") && !h.has("D:\\Школа\\новий документ.txt"), "Виділи → Delete."),
    X("Віднови з Кошика `реферат.docx`.", h => h.file("D:\\реферат.docx"), "Кошик → виділи → «Відновити».", { binItems: [{ n: "реферат.docx", k: "file" }] }),
    X("У Кошику два файли. Віднови тільки `малюнок.png`, а `старе.txt` хай лишається в Кошику.", h => h.file("D:\\малюнок.png") && h.inBin("старе.txt"), "Відновлюємо лише потрібний файл.", { binItems: [{ n: "старе.txt", k: "file" }, { n: "малюнок.png", k: "file" }] }),
    X("Видали всю папку **Українська мова**.", h => h.inBin("Українська мова") && !h.has("D:\\Школа\\5 клас\\Українська мова"), "Папка йде в Кошик разом з усім, що в ній."),
  ],
});
LEVELS.push({
  id: "xp_tidy", kind: "boss", title: "Провідник: наведи лад",
  about: "Завдання на кілька кроків.",
  items: [
    L("Наведи лад", "Тут кожне завдання має кілька кроків. Якщо заплутаєшся, натисни «Почати заново».\n\n" + HOW),
    X("Створи на диску D: папки **Музика** і **Відео**. Перемісти туди з Фото `пісня.mp3` і `танець.mp4`.", h => h.file("D:\\Музика\\пісня.mp3") && h.file("D:\\Відео\\танець.mp4") && !h.has("D:\\Фото\\пісня.mp3") && !h.has("D:\\Фото\\танець.mp4"), "`mp3` — музика, `mp4` — відео."),
    X("Створи папку `D:\\Школа\\5 клас\\Інформатика`, перемісти туди `домашка.docx` і перейменуй його на `дз.docx`.", h => h.file("D:\\Школа\\5 клас\\Інформатика\\дз.docx") && !h.has("D:\\Школа\\домашка.docx"), "Створити → перемістити → F2."),
    X("Збери всі картинки (`jpg` і `png`) з папки Фото в нову папку `D:\\Фото\\Картинки`.", h => ["котик.jpg", "море.png", "ліс.jpg"].every(n => h.file("D:\\Фото\\Картинки\\" + n) && !h.has("D:\\Фото\\" + n)), "Картинок три: котик.jpg, море.png, ліс.jpg."),
    X("Віднови з Кошика `проєкт.pptx` і перемісти його в папку Школа.", h => h.file("D:\\Школа\\проєкт.pptx") && !h.inBin("проєкт.pptx"), "Відновлений файл з'явиться на диску D:, звідти його й переміщуй.", { binItems: [{ n: "проєкт.pptx", k: "file" }] }),
  ],
});

// ===================== гарячі клавіші =====================
const KEYS_TIP = "Можна натискати справжні клавіші або клацати їх на екранній клавіатурі. Комбінації з Win, Alt + Tab, Alt + F4 і Ctrl + Shift + N клацай тільки на екрані.";
LEVELS.push({
  id: "k_copy", kind: "practice", title: "Клавіші: копіювати й вставити",
  about: "Ctrl + C, Ctrl + V, Ctrl + X.",
  items: [
    lessonOf("Пригадаймо", ["copy", "paste", "cut"], KEYS_TIP),
    P("copy", true), P("cut", true), P("paste", true),
    mix(["copy", "paste", "cut"], false), mix(["copy", "paste", "cut"], false), mix(["copy", "paste", "cut"], false),
    does("cut"),
  ],
});
LEVELS.push({
  id: "k_text", kind: "practice", title: "Клавіші: текст і документи",
  about: "Ctrl + Z, Ctrl + Y, Ctrl + A, Ctrl + S, Ctrl + P, Ctrl + F.",
  items: [
    lessonOf("Пригадаймо", ["undo", "redo", "all", "save", "print", "find"]),
    P("undo", true), P("all", true), P("save", true),
    mix(["undo", "redo", "all", "save", "print", "find"], false), mix(["undo", "redo", "all", "save", "print", "find"], false), mix(["undo", "redo", "all", "save", "print", "find"], false),
    G(() => which(rnd.pick(["undo", "redo", "all", "save", "print", "find"])).gen()),
  ],
});
LEVELS.push({
  id: "k_files", kind: "practice", title: "Клавіші: файли",
  about: "F2, Delete, Shift + Delete, Enter, Ctrl + Shift + N.",
  items: [
    lessonOf("Пригадаймо", ["rename", "del", "hard", "open", "newdir"], "На ноутбуці F2 інколи треба натискати разом із Fn."),
    P("rename", true), P("hard", true), P("newdir", true),
    mix(["rename", "del", "hard", "open", "newdir"], false), mix(["rename", "del", "hard", "open", "newdir"], false), mix(["rename", "del", "hard", "open", "newdir"], false),
    G(() => does(rnd.pick(["rename", "del", "hard", "open", "newdir"])).gen()),
  ],
});
LEVELS.push({
  id: "k_win", kind: "practice", title: "Клавіші: вікна і Windows",
  about: "Win + E, Win + D, Alt + Tab, Alt + F4, Win + L, Win + Shift + S, Ctrl + Shift + Esc.",
  items: [
    lessonOf("Пригадаймо", ["explorer", "desktop", "switchw", "close", "lock", "shot", "task"], "Ці комбінації клацай на екранній клавіатурі: справжні виведуть тебе з гри."),
    P("explorer", true), P("switchw", true), P("task", true),
    mix(["explorer", "desktop", "switchw", "close", "lock", "shot", "task"], false), mix(["explorer", "desktop", "switchw", "close", "lock", "shot", "task"], false), mix(["explorer", "desktop", "switchw", "close", "lock", "shot", "task"], false),
    G(() => which(rnd.pick(["explorer", "desktop", "switchw", "close", "lock", "shot", "task"])).gen()),
  ],
});
LEVELS.push({
  id: "k_all", kind: "boss", title: "Клавіші впереміш",
  about: "Усі комбінації без підказок.",
  items: [
    mix(ALL, false), mix(ALL, false), mix(ALL, false), mix(ALL, false), mix(ALL, false),
    G(() => does(rnd.pick(ALL)).gen()), G(() => which(rnd.pick(ALL)).gen()),
    mix(ALL, false), mix(ALL, false), mix(ALL, false),
  ],
});
