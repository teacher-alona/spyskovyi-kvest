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

// сцени для тренажера
const FILES = ["вірш.docx", "котик.jpg", "пісня.mp3", "реферат.pdf", "космос.pptx"];
const fileScene = () => { const n = rnd.pick(FILES); return { kind: "file", name: n, files: shuf(FILES).slice(0, 3).concat([n]).filter((x, i, a) => a.indexOf(x) === i), path: "D:\\Школа" }; };
const TEXTS = [["Котик сидить ", "на вікні", " і дивиться на дощ."], ["Сьогодні ми ", "вивчаємо", " гарячі клавіші."], ["Україна — ", "моя", " Батьківщина."]];
const textScene = (all) => { const t = rnd.pick(TEXTS); return all ? { kind: "text", sel: t.join("") } : { kind: "text", before: t[0], sel: t[1], after: t[2] }; };
const winScene = () => ({ kind: "windows", wins: shuf(["Браузер", "Word — вірш", "Провідник", "Paint"]) });

// усі комбінації: keys, що робить, завдання, сцена, чи можна натискати по-справжньому
const K = {
  copy:   { keys: ["Ctrl", "C"], does: "копіювати виділене", task: "Скопіюй виділений файл.", scene: fileScene, mem: "C — copy (копіювати)" },
  paste:  { keys: ["Ctrl", "V"], does: "вставити скопійоване або вирізане", task: "Ти вже скопіювала файл і відкрила іншу папку. Встав файл.", scene: () => ({ kind: "file", name: "", files: ["Інформатика", "Математика"], path: "D:\\Школа\\5 клас" }), mem: "V стоїть поруч з C на клавіатурі" },
  cut:    { keys: ["Ctrl", "X"], does: "вирізати виділене, щоб перемістити", task: "Виріж виділений файл, щоб потім перемістити його в іншу папку.", scene: fileScene, mem: "X схожа на розкриті ножиці" },
  undo:   { keys: ["Ctrl", "Z"], does: "скасувати останню дію", task: "Ти випадково стерла слово в тексті. Скасуй останню дію.", scene: () => ({ kind: "text", before: "Котик сидить ", sel: "", after: " і дивиться на дощ." }), mem: "Z — перша в нижньому ряду, повертає назад" },
  redo:   { keys: ["Ctrl", "Y"], does: "повторити скасовану дію", task: "Ти скасувала дію, але передумала. Поверни її (повтори).", scene: () => textScene(false), mem: "Y — від «yes», так, повернути" },
  all:    { keys: ["Ctrl", "A"], does: "виділити все", task: "Виділи весь текст у документі.", scene: () => textScene(true), mem: "A — all (усе)" },
  save:   { keys: ["Ctrl", "S"], does: "зберегти файл", task: "Збережи документ, з яким працюєш.", scene: () => ({ kind: "text", title: "вірш.docx — Word", sel: "", before: "Весна прийшла, і сонце сяє…" }), mem: "S — save (зберегти)" },
  print:  { keys: ["Ctrl", "P"], does: "надрукувати", task: "Надрукуй документ.", scene: () => ({ kind: "text", title: "реферат.docx — Word", sel: "", before: "Реферат на тему «Космос»" }), mem: "P — print (друк)" },
  find:   { keys: ["Ctrl", "F"], does: "знайти слово в тексті або на сторінці", task: "Знайди на сторінці слово «дракон».", scene: () => ({ kind: "text", title: "Казка — браузер", sel: "", before: "Жив собі в горах великий дракон…" }), mem: "F — find (знайти)" },
  rename: { keys: ["F2"], does: "перейменувати виділений файл чи папку", task: "Перейменуй виділений файл.", scene: fileScene, mem: "F2 — друга функціональна клавіша, на ноутбуці інколи разом з Fn" },
  del:    { keys: ["Delete"], does: "видалити виділене в Кошик", task: "Видали виділений файл у Кошик.", scene: fileScene, mem: "Delete — видалити" },
  hard:   { keys: ["Shift", "Delete"], does: "видалити назавжди, повз Кошик", task: "Видали виділений файл назавжди, не в Кошик.", scene: fileScene, mem: "Shift додає «силу»: повз Кошик" },
  open:   { keys: ["Enter"], does: "відкрити виділений файл чи папку", task: "Відкрий виділений файл клавішею.", scene: fileScene, mem: "Enter — підтвердити, відкрити" },
  newdir: { keys: ["Ctrl", "Shift", "N"], does: "створити нову папку в Провіднику", task: "Створи нову папку в Провіднику.", scene: () => ({ kind: "file", name: "", files: ["Інформатика", "вірш.docx"], path: "D:\\Школа" }), phys: false, mem: "N — new (нова)" },
  explorer: { keys: ["Win", "E"], does: "відкрити Провідник", task: "Відкрий Провідник.", scene: winScene, phys: false, mem: "E — Explorer, так Провідник називається англійською" },
  desktop: { keys: ["Win", "D"], does: "згорнути всі вікна й показати робочий стіл", task: "Згорни всі вікна, щоб побачити робочий стіл.", scene: winScene, phys: false, mem: "D — desktop (робочий стіл)" },
  switchw: { keys: ["Alt", "Tab"], does: "перемкнутися між відкритими вікнами", task: "Перемкнись на інше відкрите вікно.", scene: winScene, phys: false, mem: "Tab — «перейти далі»" },
  close:  { keys: ["Alt", "F4"], does: "закрити вікно чи програму", task: "Закрий активне вікно.", scene: winScene, phys: false, mem: "F4 — четверта функціональна, з Alt закриває" },
  lock:   { keys: ["Win", "L"], does: "заблокувати комп'ютер", task: "Ти відходиш від комп'ютера. Заблокуй його.", scene: winScene, phys: false, mem: "L — lock (замок)" },
  shot:   { keys: ["Win", "Shift", "S"], does: "зробити знімок частини екрана", task: "Зроби знімок частини екрана.", scene: winScene, phys: false, mem: "S — screenshot (знімок)" },
  task:   { keys: ["Ctrl", "Shift", "Esc"], does: "відкрити Диспетчер завдань, якщо програма зависла", task: "Програма зависла. Відкрий Диспетчер завдань.", scene: winScene, phys: false, mem: "Esc — «втекти» від зависання" },
};
const kb = k => K[k].keys.join(" + ");
const P = (k, hint) => G(() => ({ t: "keys", q: K[k].task, keys: K[k].keys, hint, phys: K[k].phys !== false, scene: K[k].scene(), why: `${kb(k)} — ${K[k].does}. ${K[k].mem}.` }));
const lessonOf = (title, ids, extra) => L(title, ids.map(k => `**${kb(k)}** — ${K[k].does}. _${K[k].mem}._`).join("\n").replace(/_([^_]+)_/g, "$1") + (extra ? "\n\n" + extra : ""));
const does = k => G(() => {
  const others = shuf(Object.keys(K).filter(x => x !== k)).slice(0, 3);
  return Q(`Що робить **${kb(k)}**?`, [K[k].does].concat(others.map(o => K[o].does)).map(s => s[0].toUpperCase() + s.slice(1)), 0, `${kb(k)} — ${K[k].does}.`);
});
const which = k => G(() => {
  const others = shuf(Object.keys(K).filter(x => x !== k && K[x].keys.length > 1 === K[k].keys.length > 1)).slice(0, 3);
  return Q(`Якими клавішами ${K[k].does}?`, [kb(k)].concat(others.map(kb)), 0, `${kb(k)} — ${K[k].does}.`);
});
const mix = (ids, hint) => G(() => P(rnd.pick(ids), hint).gen());

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

const ALL = Object.keys(K);
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
