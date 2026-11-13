// ---- «Гарячі клавіші» — тренажер для 5 класу (Windows) ----
window.GAME_INFO = {
  id: "klavishi", title: "Гарячі клавіші", eyebrow: "Цифрова грамотність · 5 клас", plain: true,
  intro: "Спершу тренуєшся з підказками, потім те саме без підказок, а наприкінці тест. Наступний рівень відкривається, коли пройдено попередній.",
};

const L = (title, text, code) => ({ t: "lesson", title, text, code });
const Q = (q, options, a, why) => ({ t: "quiz", q, options, a, why });
const V = (...pick) => ({ pick });
const G = (gen) => ({ gen });
const rnd = { pick: arr => arr[Math.floor(Math.random() * arr.length)] };
const shuf = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

window.LEVELS = [];

LEVELS.push({
  id: "copy", kind: "learn", title: "Копіювати й вставити",
  about: "Ctrl + C, Ctrl + V, Ctrl + X — головна трійка.",
  items: [
    L("Що таке гарячі клавіші", "**Гарячі клавіші** — це поєднання клавіш, які швидко виконують дію замість кількох кліків мишею. Їх натискають так: **затисни** першу клавішу (наприклад Ctrl) і, не відпускаючи, натисни другу.\n\nУ цьому тренажері можна натискати справжні клавіші або клацати їх на екранній клавіатурі."),
    lessonOf("Головна трійка", ["copy", "paste", "cut"], "Копіювати + вставити = копія. Вирізати + вставити = переміщення."),
    P("copy", true), P("paste", true), P("cut", true),
    P("copy", false), P("cut", false), P("paste", false),
    does("cut"),
  ],
});

LEVELS.push({
  id: "edit", kind: "learn", title: "Скасувати, виділити, зберегти",
  about: "Ctrl + Z, Ctrl + Y, Ctrl + A, Ctrl + S, Ctrl + P, Ctrl + F.",
  items: [
    lessonOf("Для роботи з текстом", ["undo", "redo", "all", "save", "print", "find"]),
    P("undo", true), P("all", true), P("save", true),
    P("redo", true), P("find", true), P("print", true),
    P("undo", false), P("save", false), P("all", false),
    which("find"),
  ],
});

LEVELS.push({
  id: "files", kind: "learn", title: "Клавіші для файлів",
  about: "F2, Delete, Shift + Delete, Enter, Ctrl + Shift + N.",
  items: [
    lessonOf("У Провіднику", ["rename", "del", "hard", "open", "newdir"], "На ноутбуці F2 інколи треба натискати разом із клавішею Fn.\nCtrl + Shift + N у браузері відкриває приватне вікно, тому тут її клацай на екранній клавіатурі."),
    P("rename", true), P("del", true), P("hard", true), P("open", true), P("newdir", true),
    P("rename", false), P("del", false), P("newdir", false),
    Q("Чим Delete відрізняється від Shift + Delete?", ["Delete кладе файл у Кошик, Shift + Delete видаляє назавжди", "Нічим", "Delete видаляє назавжди, а Shift + Delete — у Кошик", "Shift + Delete перейменовує файл"], 0, "З Кошика файл можна відновити, а після Shift + Delete — ні."),
  ],
});

LEVELS.push({
  id: "windows", kind: "learn", title: "Вікна і Windows",
  about: "Win + E, Win + D, Alt + Tab, Alt + F4, Win + L, Win + Shift + S, Ctrl + Shift + Esc.",
  items: [
    lessonOf("Керуємо вікнами", ["explorer", "desktop", "switchw", "close", "lock", "shot", "task"], "**Win** — клавіша з логотипом Windows, між Ctrl і Alt.\n\nУвага: ці комбінації на справжній клавіатурі під час гри **не натискай**, бо вийдеш з гри і змійка втратить сегмент. Клацай їх на екранній клавіатурі."),
    P("explorer", true), P("desktop", true), P("switchw", true), P("close", true),
    P("lock", true), P("shot", true), P("task", true),
    P("switchw", false), P("explorer", false), P("close", false),
  ],
});

LEVELS.push({
  id: "train", kind: "practice", title: "Тренування без підказок",
  about: "Усі комбінації впереміш. Підказок уже немає.",
  items: [
    mix(["copy", "paste", "cut"], false), mix(["undo", "redo", "all"], false), mix(["save", "print", "find"], false),
    mix(["rename", "del", "hard", "open", "newdir"], false), mix(["explorer", "desktop", "switchw"], false), mix(["close", "lock", "shot", "task"], false),
    does("undo"), does("desktop"), which("save"), which("switchw"),
    mix(ALL, false), mix(ALL, false),
  ],
});

LEVELS.push({
  id: "test", kind: "boss", title: "Тест",
  about: "Перевір себе: натисни потрібні клавіші й дай відповіді без підказок.",
  items: [
    mix(["copy", "cut", "paste"], false), mix(["undo", "all", "save"], false), mix(["rename", "del"], false),
    mix(["explorer", "desktop", "switchw", "close"], false), mix(["lock", "shot", "task", "newdir"], false),
    G(() => does(rnd.pick(ALL)).gen()), G(() => does(rnd.pick(ALL)).gen()), G(() => which(rnd.pick(ALL)).gen()), G(() => which(rnd.pick(ALL)).gen()),
    Q("Як перемістити файл в іншу папку клавішами?", ["Ctrl + X, відкрити папку, Ctrl + V", "Ctrl + C, відкрити папку, Ctrl + V", "F2, потім Enter", "Ctrl + Z"], 0, "Вирізати + вставити = перемістити."),
    mix(ALL, false), mix(ALL, false),
  ],
});
