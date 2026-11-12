
// ---- Контент гри. Типи: lesson, quiz, output, bug, order, fill, code ----
// V(...) — кілька готових варіантів, гра бере один випадковий.
// G(() => item) — шаблон: щоразу нові дані. Якщо в output немає відповіді (a: null)
// або в order немає out (null), гра рахує їх сама, запускаючи код.
const L = (title, text, code) => ({ t: "lesson", title, text, code });
const Q = (q, options, a, why, code) => ({ t: "quiz", q, options, a, why, code });
const O = (code, a, why, q) => ({ t: "output", code, a, why, q });
const B = (q, code, a, why, err) => ({ t: "bug", q, code, a, why, err: !!err });
const R = (q, code, out, why) => ({ t: "order", q, code, out, why });
const F = (q, code, a, why) => ({ t: "fill", q, code, a, why });
const C = (o) => Object.assign({ t: "code" }, o);
const W = (item) => Object.assign(item, { warm: true });
const V = (...pick) => ({ pick });
const G = (gen) => ({ gen });

// ---- випадковість ----
const rnd = {
  int: (a, b) => a + Math.floor(Math.random() * (b - a + 1)),
  pick: arr => arr[Math.floor(Math.random() * arr.length)],
  shuffle: arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  sample: (arr, n) => rnd.shuffle(arr).slice(0, n),
  ints: (n, a, b) => { const s = new Set(); while (s.size < n) s.add(rnd.int(a, b)); return rnd.shuffle([...s]); },
  rints: (n, a, b) => Array.from({ length: n }, () => rnd.int(a, b)),
};
// Python-літерал для коду: рядки в подвійних лапках
const py = v => Array.isArray(v) ? "[" + v.map(py).join(", ") + "]" : typeof v === "string" ? '"' + v + '"' : typeof v === "boolean" ? (v ? "True" : "False") : String(v);
// як Python друкує значення (repr): рядки в одинарних лапках
const pr = v => Array.isArray(v) ? "[" + v.map(pr).join(", ") + "]" : typeof v === "string" ? "'" + v + "'" : typeof v === "boolean" ? (v ? "True" : "False") : v === null ? "None" : String(v);
const andList = a => a.length === 1 ? String(a[0]) : a.slice(0, -1).join(", ") + " і " + a[a.length - 1];
const range = (a, b) => Array.from({ length: b - a }, (_, i) => a + i);
// зробити 4 різні варіанти відповіді, правильний першим
const opts = (right, ...wrong) => { const out = [String(right)]; for (const w of wrong) { const s = String(w); if (!out.includes(s)) out.push(s); } return out.slice(0, 4); };

const TH = [
  { v: ["pets", "zoo", "animals"], w: ["кіт", "пес", "сова", "лисиця", "їжак", "папуга", "панда", "черепаха"] },
  { v: ["fruits", "basket"], w: ["яблуко", "груша", "слива", "вишня", "банан", "ківі", "манго", "диня"] },
  { v: ["cities", "route"], w: ["Київ", "Львів", "Одеса", "Харків", "Дніпро", "Чернігів", "Ужгород", "Полтава"] },
  { v: ["lessons", "subjects"], w: ["алгебра", "фізика", "історія", "біологія", "хімія", "географія", "музика", "мистецтво"] },
  { v: ["colors", "paints"], w: ["червоний", "зелений", "синій", "жовтий", "білий", "чорний", "рожевий"] },
];
const theme = n => { const t = rnd.pick(TH); return { name: rnd.pick(t.v), items: rnd.sample(t.w, n) }; };
const NUMV = ["nums", "marks", "temps", "prices", "scores", "data"];
const numName = () => rnd.pick(NUMV);
window.LEVELS = [];
// ===================== 0. Індекси і довжина =====================
LEVELS.push({
  id: "index", kind: "practice", title: "Індекси і довжина",
  about: "Як звертатися до елементів списку за номером і як дізнатися, скільки їх.",
  items: [
    W(V(
      Q("Який індекс у першого елемента списку?", ["0", "1", "-1", "Залежить від списку"], 0,
        "У Python рахунок іде з нуля: перший елемент — `lst[0]`, другий — `lst[1]`."),
      Q("Список `a = [7, 8, 9]`. Що таке `a[0]`?", ["7", "8", "0", "Помилка"], 0,
        "Індекс 0 — це перший елемент, тобто 7."),
      Q("Як отримати перший елемент списку `lst`?", ["`lst[0]`", "`lst[1]`", "`lst(0)`", "`lst.first()`"], 0,
        "Елементи дістаємо квадратними дужками, а рахунок починається з нуля."),
    )),
    W(G(() => {
      const n = rnd.int(4, 9);
      return Q(`У списку ${n} елементів. Який індекс у останнього?`, opts(n - 1, n, n + 1, -n), 0,
        `Індекси йдуть від 0 до ${n - 1}. Останній елемент ще можна отримати як \`lst[-1]\`.`);
    })),
    W(V(
      Q("Що повертає `len(lst)`?", ["Кількість елементів", "Індекс останнього елемента", "Найбільший елемент", "Суму елементів"], 0,
        "`len` — від англійського length, довжина."),
      Q("Що поверне `len([3, 3, 3])`?", ["3", "1", "9", "[3]"], 0,
        "`len` рахує елементи, а не їхні значення. Елементів три."),
      Q("Що поверне `len([\"кіт\"])`?", ["1", "3", "0", "Помилку"], 0,
        "У списку один елемент — рядок «кіт». Довжина рядка тут не важлива."),
    )),
    W(V(
      Q("Як створити список?", ["`nums = [1, 2, 3]`", "`nums = (1, 2, 3)`", "`nums = {1, 2, 3}`", "`nums = <1, 2, 3>`"], 0,
        "Список записується у квадратних дужках, елементи — через кому."),
      Q("Як створити порожній список?", ["`a = []`", "`a = ()`", "`a = {}`", "`a = list[]`"], 0,
        "Порожні квадратні дужки — порожній список. `[]` можна також отримати через `list()`."),
      Q("Що з цього — список?", ["`[1, \"два\", 3.0]`", "`\"1, 2, 3\"`", "`(1, 2, 3)`", "`{1: 2}`"], 0,
        "У списку можуть бути дані різних типів. Головне — квадратні дужки."),
    )),
    G(() => {
      const t = theme(5), i = rnd.int(0, 4), j = rnd.int(1, 5);
      return O(`${t.name} = ${py(t.items)}
print(${t.name}[${i}])
print(${t.name}[-${j}])
print(${t.name}[len(${t.name}) - 1])
print(len(${t.name}))`, null,
        `\`${t.name}[${i}]\` — «${t.items[i]}». \`-${j}\` — ${j === 1 ? "останній" : j + "-й з кінця"} елемент, «${t.items[5 - j]}». \`len(${t.name}) - 1\` = 4, тобто останній елемент. Елементів 5.`);
    }),
    G(() => {
      const a = rnd.rints(4, 1, 9), p = rnd.int(0, 3), q = rnd.int(1, 4), s = rnd.int(0, 3);
      return O(`a = ${py(a)}
print(a[${p}] * a[-${q}] + a[${s}])`, null,
        `\`a[${p}]\` = ${a[p]}, \`a[-${q}]\` = ${a[4 - q]}, \`a[${s}]\` = ${a[s]}. Отже ${a[p]} × ${a[4 - q]} + ${a[s]} = ${a[p] * a[4 - q] + a[s]}.`);
    }),
    G(() => {
      const t = theme(rnd.int(3, 5)), n = t.items.length, form = rnd.int(0, 2);
      if (form === 0) return B("Хотіли вивести останній елемент, а програма падає. Клацни на рядок з помилкою.",
        `${t.name} = ${py(t.items)}
last = ${t.name}[len(${t.name})]
print(last)`, 1, `\`len(${t.name})\` = ${n}, а індекси лише від 0 до ${n - 1}. Правильно \`${t.name}[len(${t.name}) - 1]\` або \`${t.name}[-1]\`.`, true);
      if (form === 1) return B("Програма падає з помилкою. Клацни на рядок, у якому вона виникає.",
        `${t.name} = ${py(t.items)}
print(${t.name}[0])
print(${t.name}[${n}])`, 2, `Елементів ${n}, тому індекси від 0 до ${n - 1}. Індексу ${n} немає — буде \`IndexError\`.`, true);
      return B("Хотіли вивести всі елементи, а наприкінці програма падає. Де помилка?",
        `${t.name} = ${py(t.items)}
for i in range(len(${t.name}) + 1):
    print(${t.name}[i])`, 1, `\`range(len(${t.name}) + 1)\` дає числа до ${n} включно, а останній індекс — ${n - 1}. Треба просто \`range(len(${t.name}))\`.`, true);
    }),
    G(() => {
      const n = rnd.int(4, 6), name = numName(), vals = rnd.rints(n, 10, 99), v = rnd.int(100, 500);
      const forms = [["останній", [String(n - 1), "-1"]], ["перший", ["0", String(-n)]], ["третій", ["2", String(2 - n)]], ["передостанній", [String(n - 2), "-2"]]];
      const [word, ans] = rnd.pick(forms);
      return F(`Заміни ${word} елемент списку на ${v}.`,
        `${name} = ${py(vals)}
${name}[___] = ${v}
print(${name})`, [ans], `Рахуємо з нуля: ${word} елемент має індекс ${ans[0]}, або ${ans[1]}, якщо рахувати з кінця.`);
    }),
    G(() => {
      const pool = rnd.shuffle([['"7"', "str"], ["7", "int"], ["7.0", "float"], ["True", "bool"], ["[7]", "list"]]).slice(0, 4);
      const k = rnd.int(0, 3);
      const options = [pool[k][1], ...pool.filter((_, i) => i !== k).map(p => p[1])].map(c => `\`<class '${c}'>\``);
      const names = { str: "рядок", int: "ціле число", float: "дробове число", bool: "логічне значення", list: "список" };
      return Q("Що виведе програма?", options, 0, `\`a[${k}]\` — це \`${pool[k][0]}\`, тобто ${names[pool[k][1]]}.`,
        `a = [${pool.map(p => p[0]).join(", ")}]
print(type(a[${k}]))`);
    }),
    G(() => {
      const n = rnd.int(3, 4), a = rnd.ints(n, 1, 9).map(x => x * 10);
      const [i, j] = rnd.pick([[0, n - 1], [0, 1], [1, n - 1]]);
      const res = a.slice(); [res[i], res[j]] = [res[j], res[i]];
      return R(`Збери програму, яка міняє місцями елементи з індексами ${i} і ${j} й виводить \`${pr(res)}\`.`,
        `a = ${py(a)}
tmp = a[${i}]
a[${i}] = a[${j}]
a[${j}] = tmp
print(a)`, null, `Спочатку запам'ятовуємо \`a[${i}]\` у \`tmp\`, бо інакше значення загубиться, коли ми запишемо туди \`a[${j}]\`.`);
    }),
    V(
      C({ q: "Користувач вводить номер дня тижня від 1 до 7. Виведи назву дня зі списку `days`. Якщо такого номера немає, виведи «Такого дня немає». Обережно з нулем!",
        starter: `days = ["понеділок", "вівторок", "середа", "четвер", "п'ятниця", "субота", "неділя"]
n = int(input())
`,
        tests: [{ input: ["1"], expect: "понеділок" }, { input: ["7"], expect: "неділя" }, { input: ["0"], expect: "Такого дня немає" }, { input: ["8"], expect: "Такого дня немає" }],
        hint: "Номер дня на 1 більший за індекс: день `n` — це `days[n - 1]`. Перевір, що `1 <= n <= len(days)`.",
        solution: `days = ["понеділок", "вівторок", "середа", "четвер", "п'ятниця", "субота", "неділя"]
n = int(input())
if 1 <= n <= len(days):
    print(days[n - 1])
else:
    print("Такого дня немає")` }),
      C({ q: "Користувач вводить номер місяця від 1 до 12. Виведи назву місяця зі списку `months`. Якщо такого номера немає, виведи «Такого місяця немає».",
        starter: `months = ["січень", "лютий", "березень", "квітень", "травень", "червень",
          "липень", "серпень", "вересень", "жовтень", "листопад", "грудень"]
n = int(input())
`,
        tests: [{ input: ["1"], expect: "січень" }, { input: ["12"], expect: "грудень" }, { input: ["0"], expect: "Такого місяця немає" }, { input: ["13"], expect: "Такого місяця немає" }],
        hint: "Місяць `n` має індекс `n - 1`. Не забудь перевірити, що `1 <= n <= 12`.",
        solution: `months = ["січень", "лютий", "березень", "квітень", "травень", "червень",
          "липень", "серпень", "вересень", "жовтень", "листопад", "грудень"]
n = int(input())
if 1 <= n <= len(months):
    print(months[n - 1])
else:
    print("Такого місяця немає")` }),
      C({ q: "У журналі учні записані по порядку. Користувач вводить номер учня (від 1). Виведи ім'я зі списку `names`, а якщо такого номера немає — «Немає такого учня».",
        starter: `names = ["Оля", "Тарас", "Ніна", "Ян"]
n = int(input())
`,
        tests: [{ input: ["1"], expect: "Оля" }, { input: ["4"], expect: "Ян" }, { input: ["0"], expect: "Немає такого учня" }, { input: ["5"], expect: "Немає такого учня" }],
        hint: "Учень з номером `n` має індекс `n - 1`. Номер 0 — пастка: `names[-1]` дав би останнього учня.",
        solution: `names = ["Оля", "Тарас", "Ніна", "Ян"]
n = int(input())
if 1 <= n <= len(names):
    print(names[n - 1])
else:
    print("Немає такого учня")` }),
    ),
  ]
});

// ===================== 1. Зрізи =====================
LEVELS.push({
  id: "slices", kind: "practice", title: "Зрізи",
  about: "Як вирізати зі списку шматок, кожен другий елемент або розвернути список.",
  items: [
    W(G(() => {
      const a = rnd.int(0, 2), b = a + rnd.int(2, 3);
      const right = range(a, b), more = range(a, b + 1), shift = range(a + 1, b + 1);
      return Q(`Що поверне \`lst[${a}:${b}]\`?`, opts(`Елементи з індексами ${andList(right)}`, `Елементи з індексами ${andList(more)}`, `Елементи з індексами ${andList(shift)}`, `Тільки елементи з індексами ${a} і ${b}`), 0,
        `Зріз бере початок, але не включає кінець: \`[${a}:${b}]\` — це індекси ${andList(right)}.`);
    })),
    W(V(
      Q("Що робить зріз `lst[::-1]`?", ["Повертає список задом наперед", "Видаляє останній елемент", "Повертає останній елемент", "Видає помилку"], 0,
        "Крок −1 означає «йти з кінця до початку»."),
      Q("Що поверне `[1, 2, 3][::-1]`?", ["`[3, 2, 1]`", "`[1, 2, 3]`", "`[3]`", "Помилку"], 0,
        "Крок −1 розвертає список."),
      Q("Який зріз розвертає список?", ["`lst[::-1]`", "`lst[-1]`", "`lst[:-1]`", "`lst[1::]`"], 0,
        "`lst[-1]` — останній елемент, `lst[:-1]` — усе без останнього. Розвертає лише крок −1."),
    )),
    W(V(
      Q("Чи змінює зріз початковий список?", ["Ні, зріз створює новий список", "Так, завжди", "Тільки якщо є крок", "Тільки з від'ємними індексами"], 0,
        "Зріз — це копія частини списку. Сам список лишається без змін."),
      Q("Після `b = a[1:]` у `b` щось змінили. Що буде з `a`?", ["Нічого, `b` — окремий новий список", "`a` теж зміниться", "`a` стане порожнім", "Буде помилка"], 0,
        "Зріз створює новий список, тож зміни в `b` не стосуються `a`."),
      Q("Що поверне `lst[:]`?", ["Копію всього списку", "Порожній список", "Перший елемент", "Помилку"], 0,
        "Без початку й кінця зріз бере все — виходить копія списку."),
    )),
    G(() => {
      const s = rnd.ints(8, 1, 60), name = numName();
      const a = rnd.int(0, 3), b = a + rnd.int(2, 4), c = rnd.int(2, 6), d = rnd.int(0, 2), k = rnd.int(2, 3);
      return O(`${name} = ${py(s)}
print(${name}[${a}:${b}])
print(${name}[${c}:])
print(${name}[${d}::${k}])`, null,
        `\`[${a}:${b}]\` — індекси ${andList(range(a, b))}. \`[${c}:]\` — від індексу ${c} до кінця. \`[${d}::${k}]\` — з індексу ${d} з кроком ${k}.`);
    }),
    G(() => {
      const s = rnd.ints(7, 1, 40), a = rnd.int(3, 5), b = rnd.int(1, a - 2), k = rnd.int(1, 3);
      return O(`s = ${py(s)}
print(s[-${a}:-${b}])
print(s[::-${k}])`, null,
        `\`[-${a}:-${b}]\` — від ${a}-го з кінця до ${b}-го з кінця, не включно. \`[::-${k}]\` — з кінця з кроком ${k}.`);
    }),
    G(() => {
      const t = theme(7), m = rnd.int(2, 4), n = rnd.int(m + 1, 6);
      return F(`Виріж зі списку елементи з ${m}-го по ${n}-й включно.`,
        `${t.name} = ${py(t.items)}
part = ${t.name}[___:___]
print(part)`, [[String(m - 1)], [String(n)]],
        `${m}-й елемент має індекс ${m - 1}, ${n}-й — ${n - 1}. Кінець зрізу не включається, тому пишемо ${n}.`);
    }),
    G(() => {
      const k = rnd.int(2, 4);
      return Q(`Який зріз дасть ${k} останні елементи?`, [`\`lst[-${k}:]\``, `\`lst[-${k}]\``, `\`lst[:-${k}]\``, `\`lst[${k}:]\``], 0,
        `\`lst[-${k}]\` — це один елемент, а не список. \`lst[:-${k}]\` — усе, крім ${k} останніх.`);
    }),
    G(() => {
      const t = theme(5), form = rnd.int(0, 2), k = rnd.int(2, 3);
      if (form === 0) return B("Хотіли розвернути список, а останній елемент просто зник. Де помилка?",
        `${t.name} = ${py(t.items)}
rev = ${t.name}[:-1]
print(rev)`, 1, `\`[:-1]\` — це все, крім останнього. Щоб розвернути, потрібен крок: \`${t.name}[::-1]\`.`);
      if (form === 1) return B(`Хотіли отримати перші ${k} елементи, а вийшло на один менше. Де помилка?`,
        `${t.name} = ${py(t.items)}
first = ${t.name}[0:${k - 1}]
print(first)`, 1, `Кінець зрізу не включається. Перші ${k} елементи — це \`${t.name}[0:${k}]\` або \`${t.name}[:${k}]\`.`);
      return B("Хотіли отримати список із двох останніх елементів, а вийшов один елемент без дужок. Де помилка?",
        `${t.name} = ${py(t.items)}
last_two = ${t.name}[-2]
print(last_two)`, 1, `\`${t.name}[-2]\` — це один елемент. Список із двох останніх — це зріз \`${t.name}[-2:]\`.`);
    }),
    V(
      C({ q: "Напиши функцію `ends(lst)`, яка повертає новий список із двох перших і двох останніх елементів. Наприклад, `ends([1, 2, 3, 4, 5, 6])` → `[1, 2, 5, 6]`.",
        starter: `def ends(lst):
    `,
        tests: [{ call: "ends([1, 2, 3, 4, 5, 6])", expect: "[1, 2, 5, 6]" }, { call: "ends(['а', 'б', 'в', 'г', 'ґ'])", expect: "['а', 'б', 'г', 'ґ']" }, { call: "ends([7, 8, 9, 10])", expect: "[7, 8, 9, 10]" }],
        hint: "Склей два зрізи через `+`: перші два і останні два.",
        solution: `def ends(lst):
    return lst[:2] + lst[-2:]` }),
      C({ q: "Напиши функцію `middle3(lst)`, яка повертає три середні елементи списку з непарною кількістю елементів. Наприклад, `middle3([1, 2, 3, 4, 5])` → `[2, 3, 4]`.",
        starter: `def middle3(lst):
    `,
        tests: [{ call: "middle3([1, 2, 3, 4, 5])", expect: "[2, 3, 4]" }, { call: "middle3([1, 2, 3, 4, 5, 6, 7])", expect: "[3, 4, 5]" }, { call: "middle3(['a', 'b', 'c'])", expect: "['a', 'b', 'c']" }],
        hint: "Середина має індекс `len(lst) // 2`. Візьми зріз від середини − 1 до середини + 2.",
        solution: `def middle3(lst):
    m = len(lst) // 2
    return lst[m - 1:m + 2]` }),
      C({ q: "Напиши функцію `odd_back(lst)`, яка повертає елементи з непарними індексами (1, 3, 5…) у зворотному порядку. Наприклад, `odd_back([0, 1, 2, 3, 4, 5])` → `[5, 3, 1]`.",
        starter: `def odd_back(lst):
    `,
        tests: [{ call: "odd_back([0, 1, 2, 3, 4, 5])", expect: "[5, 3, 1]" }, { call: "odd_back(['а', 'б', 'в'])", expect: "['б']" }, { call: "odd_back([7])", expect: "[]" }],
        hint: "Спершу зріз з кроком 2, починаючи з індексу 1, а потім розверни його ще одним зрізом.",
        solution: `def odd_back(lst):
    return lst[1::2][::-1]` }),
    ),
    V(
      C({ q: "Напиши функцію `swap_halves(lst)`, яка міняє місцями першу і другу половини списку. Якщо елементів непарна кількість, середній лишається на місці: `[1, 2, 3, 4]` → `[3, 4, 1, 2]`, а `[1, 2, 3, 4, 5]` → `[4, 5, 3, 1, 2]`.",
        stars: 3,
        starter: `def swap_halves(lst):
    `,
        tests: [{ call: "swap_halves([1, 2, 3, 4])", expect: "[3, 4, 1, 2]" }, { call: "swap_halves([1, 2, 3, 4, 5])", expect: "[4, 5, 3, 1, 2]" }, { call: "swap_halves(['x'])", expect: "['x']" }],
        hint: "Нехай `h = len(lst) // 2`. Тоді потрібні три шматки: останні `h` елементів, середина і перші `h` елементів.",
        solution: `def swap_halves(lst):
    h = len(lst) // 2
    n = len(lst)
    return lst[n - h:] + lst[h:n - h] + lst[:h]` }),
      C({ q: "Напиши функцію `zigzag(lst)`, яка повертає спершу елементи з парними індексами, а потім елементи з непарними індексами у зворотному порядку: `[1, 2, 3, 4, 5, 6]` → `[1, 3, 5, 6, 4, 2]`.",
        stars: 3,
        starter: `def zigzag(lst):
    `,
        tests: [{ call: "zigzag([1, 2, 3, 4, 5, 6])", expect: "[1, 3, 5, 6, 4, 2]" }, { call: "zigzag(['a', 'b', 'c'])", expect: "['a', 'c', 'b']" }, { call: "zigzag([9])", expect: "[9]" }],
        hint: "Два зрізи з кроком 2 (з індексу 0 і з індексу 1), другий ще й розвернутий.",
        solution: `def zigzag(lst):
    return lst[::2] + lst[1::2][::-1]` }),
      C({ q: "Напиши функцію `trim(lst, k)`, яка обрізає по `k` елементів з обох кінців списку. Якщо елементів на це не вистачає, поверни порожній список: `trim([1, 2, 3, 4, 5], 1)` → `[2, 3, 4]`.",
        stars: 3,
        starter: `def trim(lst, k):
    `,
        tests: [{ call: "trim([1, 2, 3, 4, 5], 1)", expect: "[2, 3, 4]" }, { call: "trim([1, 2, 3, 4], 2)", expect: "[]" }, { call: "trim([1, 2, 3], 0)", expect: "[1, 2, 3]" }, { call: "trim([1, 2], 5)", expect: "[]" }],
        hint: "Пастка з `k = 0`: `lst[0:-0]` порожній. Безпечніше рахувати кінець як `len(lst) - k`.",
        solution: `def trim(lst, k):
    return lst[k:len(lst) - k]` }),
    ),
  ]
});

// ===================== 2. Методи списків =====================
LEVELS.push({
  id: "methods", kind: "practice", title: "Методи списків",
  about: "append, insert, pop, remove, index, count, del та перевірка in.",
  items: [
    W(V(
      Q("Що робить `lst.append(x)`?", ["Додає x у кінець списку", "Додає x на початок", "Замінює останній елемент на x", "Повертає новий список з x"], 0,
        "append — «дописати в кінець». Сам список змінюється."),
      Q("Що виведе `a = [1]; a.append(5); print(a)`?", ["`[1, 5]`", "`[5, 1]`", "`[6]`", "`None`"], 0,
        "`append` дописує 5 у кінець списку."),
      Q("Який метод додає елемент у кінець списку?", ["`append`", "`insert`", "`add`", "`push`"], 0,
        "`insert` вставляє на вказане місце, а `add` і `push` у списків немає."),
    )),
    W(V(
      Q("Чим `pop()` відрізняється від `remove(x)`?", ["pop видаляє за індексом і повертає елемент, remove — за значенням", "remove видаляє за індексом, pop — за значенням", "Нічим", "pop видаляє всі елементи"], 0,
        "`pop(1)` видаляє елемент з індексом 1. `remove(1)` видаляє перше число 1, де б воно не було."),
      Q("Що поверне `[4, 9, 6].pop()`?", ["6", "4", "9", "`None`"], 0,
        "`pop()` без аргументу видаляє і повертає останній елемент."),
      Q("Що буде після `a = [5, 6, 7]; a.remove(6)`?", ["`a` = `[5, 7]`", "`a` = `[5, 6]`", "`a` = `[6, 7]`", "Помилка"], 0,
        "`remove(6)` шукає значення 6 і видаляє його."),
    )),
    W(G(() => {
      const x = rnd.int(2, 9), others = rnd.ints(2, 10, 30), pos = rnd.sample([0, 1, 2, 3], 2).sort((a, b) => a - b);
      const lst = []; let o = 0; for (let i = 0; i < 4; i++) lst.push(pos.includes(i) ? x : others[o++]);
      return Q(`Що поверне \`${py(lst)}.index(${x})\`?`, opts(pos[0], pos[1], `[${pos[0]}, ${pos[1]}]`, x === pos[0] || x === pos[1] ? 5 : x), 0,
        "`index` шукає перше входження і повертає його індекс.");
    })),
    W(V(
      Q("Що робить `del lst[1]`?", ["Видаляє елемент з індексом 1", "Видаляє всі одиниці", "Видаляє весь список", "Очищає список"], 0,
        "`del` працює з індексом, як і `pop`, але нічого не повертає."),
      Q("Що виведе `a = [3, 4, 5]; del a[-1]; print(a)`?", ["`[3, 4]`", "`[4, 5]`", "`[3, 4, 5]`", "Помилку"], 0,
        "`a[-1]` — останній елемент, його і видаляємо."),
      Q("Що робить `del a[0]`?", ["Видаляє перший елемент", "Видаляє всі нулі", "Видаляє останній елемент", "Обнуляє перший елемент"], 0,
        "`del` видаляє елемент з вказаним індексом. Індекс 0 — перший елемент."),
    )),
    G(() => {
      const b = rnd.ints(3, 2, 9), v = rnd.int(10, 20), i = rnd.int(0, 3), j = rnd.int(0, 3), x = rnd.pick(b);
      return O(`b = ${py(b)}
b.insert(${i}, ${v})
b.append(b.pop(${j}))
print(b)
print(b.index(${x}), len(b))`, null,
        `Після \`insert(${i}, ${v})\` у списку 4 елементи. \`pop(${j})\` забирає елемент з індексом ${j}, і \`append\` одразу ставить його в кінець. Потім шукаємо, де стоїть ${x}.`);
    }),
    G(() => {
      const a = rnd.ints(3, 1, 9).map(x => x * 10), k = rnd.int(0, 2);
      const rest = a.filter((_, i) => i !== k), v = rnd.pick(rest);
      return O(`a = ${py(a)}
del a[${k}]
a.remove(${v})
print(a)`, null, `\`del a[${k}]\` видаляє елемент з індексом ${k} (${a[k]}), а \`remove(${v})\` — значення ${v}.`);
    }),
    G(() => {
      const t = theme(3), miss = rnd.pick(["оранжевий", "сірий", "дракон", "Рим", "астрономія", "ананас"]), form = rnd.int(0, 2);
      if (form === 0) return B("Програма падає з помилкою. Клацни на рядок, у якому вона виникає.",
        `${t.name} = ${py(t.items)}
${t.name}.remove("${miss}")
print(${t.name})`, 1, `\`remove\` видаляє лише те, що є у списку. «${miss}» немає, тому буде \`ValueError\`. Можна спершу перевірити: \`if "${miss}" in ${t.name}:\`.`, true);
      if (form === 1) return B("Програма падає з помилкою. Клацни на рядок, у якому вона виникає.",
        `${t.name} = ${py(t.items)}
print(len(${t.name}))
print(${t.name}.index("${miss}"))`, 2, `\`index\` шукає елемент, а «${miss}» у списку немає — буде \`ValueError\`.`, true);
      return B("Програма падає з помилкою. Клацни на рядок, у якому вона виникає.",
        `${t.name} = ${py(t.items)}
${t.name}.pop(len(${t.name}))
print(${t.name})`, 1, `\`len(${t.name})\` = 3, а останній індекс — 2. \`pop(3)\` дає \`IndexError\`. Останній елемент видаляє просто \`pop()\`.`, true);
    }),
    G(() => {
      const t = theme(3), v = rnd.pick(t.items), nw = rnd.pick(["щось нове", "сюрприз", "бонус"]);
      const form = rnd.int(0, 3);
      if (form === 0) return F(`Перевір, чи є «${v}» у списку.`, `${t.name} = ${py(t.items)}
if "${v}" ___ ${t.name}:
    print("Є!")`, [["in"]], "Оператор `in` перевіряє, чи є елемент у списку.");
      if (form === 1) return F(`Порахуй, скільки разів у списку трапляється «${v}».`, `${t.name} = ${py(t.items.concat([v]))}
print(${t.name}.___("${v}"))`, [["count"]], "`count(x)` рахує, скільки разів x трапляється у списку.");
      if (form === 2) return F(`Допиши «${nw}» у кінець списку.`, `${t.name} = ${py(t.items)}
${t.name}.___("${nw}")
print(${t.name})`, [["append"]], "Додати в кінець — `append`.");
      return F(`Встав «${nw}» на самий початок списку.`, `${t.name} = ${py(t.items)}
${t.name}.___(0, "${nw}")
print(${t.name})`, [["insert"]], "`insert(i, x)` вставляє x на позицію i. Позиція 0 — початок.");
    }),
    G(() => {
      const [A, Bv, Cv, D] = rnd.sample(["A", "B", "C", "D", "E", "F", "G"], 4), name = rnd.pick(["songs", "queue", "tasks"]);
      const ops = rnd.shuffle([`${name}.insert(0, "${Cv}")`, `${name}.append("${D}")`]);
      return R(`Збери програму, яка змінює список і виводить результат.`,
        `${name} = ["${A}", "${Bv}"]
${ops[0]}
${ops[1]}
${name}.remove("${A}")
print(${name})`, null, `«${Cv}» стає на початок, «${D}» — у кінець, «${A}» прибираємо.`);
    }),
    V(
      C({ q: "Напиши функцію `replace_all(lst, old, new)`, яка замінює у списку всі елементи `old` на `new` і повертає список.",
        starter: `def replace_all(lst, old, new):
    `,
        tests: [{ call: "replace_all([1, 0, 1, 2], 1, 9)", expect: "[9, 0, 9, 2]" }, { call: "replace_all(['так', 'ні'], 'ні', 'так')", expect: "['так', 'так']" }, { call: "replace_all([5], 2, 3)", expect: "[5]" }],
        hint: "Пройди за індексами `for i in range(len(lst))` і, якщо `lst[i] == old`, запиши туди `new`.",
        solution: `def replace_all(lst, old, new):
    for i in range(len(lst)):
        if lst[i] == old:
            lst[i] = new
    return lst` }),
      C({ q: "Напиши функцію `move_to_end(lst, x)`, яка переносить перше входження `x` у кінець списку і повертає список. Якщо `x` немає, список не змінюється.",
        starter: `def move_to_end(lst, x):
    `,
        tests: [{ call: "move_to_end([1, 2, 3], 1)", expect: "[2, 3, 1]" }, { call: "move_to_end(['а', 'б', 'а'], 'а')", expect: "['б', 'а', 'а']" }, { call: "move_to_end([4, 5], 9)", expect: "[4, 5]" }],
        hint: "Перевір `x in lst`, потім `remove(x)` і `append(x)`.",
        solution: `def move_to_end(lst, x):
    if x in lst:
        lst.remove(x)
        lst.append(x)
    return lst` }),
      C({ q: "Напиши функцію `insert_after(lst, target, new)`, яка вставляє `new` одразу після першого `target`. Якщо `target` немає, допиши `new` у кінець. Поверни список.",
        starter: `def insert_after(lst, target, new):
    `,
        tests: [{ call: "insert_after([1, 2, 3], 2, 9)", expect: "[1, 2, 9, 3]" }, { call: "insert_after(['a', 'b'], 'b', 'c')", expect: "['a', 'b', 'c']" }, { call: "insert_after([5], 7, 8)", expect: "[5, 8]" }],
        hint: "Знайди місце через `lst.index(target)` і зроби `insert` на наступну позицію.",
        solution: `def insert_after(lst, target, new):
    if target in lst:
        lst.insert(lst.index(target) + 1, new)
    else:
        lst.append(new)
    return lst` }),
    ),
    V(
      C({ q: "Користувач вводить оцінки по одній, доки не введе 0. Збережи оцінки у список (без нуля). Виведи в першому рядку кількість оцінок, у другому — скільки серед них дванадцяток.",
        starter: `marks = []
`,
        tests: [{ input: ["12", "9", "12", "0"], expect: "3\n2" }, { input: ["5", "0"], expect: "1\n0" }],
        hint: "Цикл `while True`, всередині `int(input())`. Якщо 0 — `break`, інакше `append`. Дванадцятки порахує `count`.",
        solution: `marks = []
while True:
    m = int(input())
    if m == 0:
        break
    marks.append(m)
print(len(marks))
print(marks.count(12))` }),
      C({ q: "Користувач вводить слова по одному, доки не введе «кінець». Збережи слова у список (без «кінець»). Виведи в першому рядку кількість слів, у другому — останнє введене слово.",
        starter: `words = []
`,
        tests: [{ input: ["сир", "хліб", "кінець"], expect: "2\nхліб" }, { input: ["я", "ти", "ми", "кінець"], expect: "3\nми" }],
        hint: "Останнє слово в списку — `words[-1]`.",
        solution: `words = []
while True:
    w = input()
    if w == "кінець":
        break
    words.append(w)
print(len(words))
print(words[-1])` }),
      C({ q: "Користувач вводить числа по одному, доки не введе -1. Збережи числа у список (без -1). Виведи, скільки разів у списку трапляється найперше введене число.",
        starter: `nums = []
`,
        tests: [{ input: ["5", "3", "5", "5", "-1"], expect: "3" }, { input: ["7", "8", "-1"], expect: "1" }],
        hint: "Перше число — `nums[0]`, а порахує його `nums.count(...)`.",
        solution: `nums = []
while True:
    x = int(input())
    if x == -1:
        break
    nums.append(x)
print(nums.count(nums[0]))` }),
    ),
  ]
});
// ===================== 3. Перебір у циклі =====================
LEVELS.push({
  id: "loops", kind: "practice", title: "Перебір у циклі",
  about: "for по елементах і for по індексах: коли який потрібен.",
  items: [
    W(G(() => {
      const a = rnd.ints(rnd.int(3, 5), 1, 20), n = a.length, s = a.reduce((x, y) => x + y, 0);
      return Q(`Скільки разів виконається тіло циклу \`for x in ${py(a)}\`?`, opts(n, n + 1, s, n - 1), 0,
        `Цикл проходить по кожному елементу один раз. Елементів ${n}.`);
    })),
    W(V(
      Q("Чим відрізняються `for x in lst` і `for i in range(len(lst))`?", ["Перший дає елементи, другий — індекси", "Нічим", "Перший дає індекси, другий — елементи", "Другий бере лише парні елементи"], 0,
        "`range(len(lst))` — це числа 0, 1, 2… до останнього індексу."),
      Q("Які числа дає `range(len(lst))` для списку з 4 елементів?", ["0, 1, 2, 3", "1, 2, 3, 4", "0, 1, 2, 3, 4", "Самі елементи списку"], 0,
        "`range(4)` — від 0 до 3 включно, тобто рівно всі індекси."),
      Q("Який цикл дає змогу дістати й номер, і сам елемент?", ["`for i in range(len(lst)):` і `lst[i]`", "`for x in lst:`", "`for lst in x:`", "`while lst:`"], 0,
        "Маючи індекс `i`, елемент отримаємо як `lst[i]`."),
    )),
    W(V(
      Q("Треба змінити кожен елемент самого списку. Який цикл підходить?", ["`for i in range(len(lst)):` і `lst[i] = ...`", "`for x in lst:` і `x = ...`", "Обидва", "Жоден"], 0,
        "Змінна `x` — лише копія значення. Щоб змінити список, записуй через індекс."),
      Q("Що виведе програма?", ["`[2, 3]`", "`[1, 2]`", "`[1, 3]`", "Помилку"], 0,
        "Через індекс ми змінюємо сам список: кожен елемент збільшився на 1.",
        `nums = [1, 2]
for i in range(len(nums)):
    nums[i] += 1
print(nums)`),
      Q("Чому `for x in lst: x = 0` не обнуляє список?", ["`x` — окрема змінна з копією значення", "Треба писати `x == 0`", "Цикл не виконується", "Списки не можна змінювати"], 0,
        "Присвоєння `x = 0` змінює лише змінну `x`. Щоб змінити список, пиши `lst[i] = 0`."),
    )),
    G(() => {
      const w = rnd.sample(["а", "б", "в", "г", "ok", "ха", "ну"], 3), form = rnd.int(0, 1);
      if (form === 0) return O(`lst = ${py(w)}
for i in range(len(lst)):
    print(lst[i] * (i + 1))`, null, "Рядок, помножений на число, повторюється. `i + 1` дає 1, 2, 3.");
      return O(`lst = ${py(w)}
for i in range(len(lst)):
    print(i, lst[len(lst) - 1 - i])`, null, "`len(lst) - 1 - i` іде від останнього індексу до нуля, тож елементи виводяться з кінця.");
    }),
    G(() => {
      const a = rnd.ints(3, 1, 9), name = numName(), op = rnd.pick(["x = x * 10", "x = x + 5", "x = 0"]);
      return O(`${name} = ${py(a)}
for x in ${name}:
    ${op}
print(${name})`, null,
        `\`x\` — окрема змінна. Ми змінюємо її, а не елементи списку, тому \`${name}\` лишився \`${pr(a)}\`. Щоб змінити список, треба писати через індекс: \`${name}[i] = ...\`.`);
    }),
    G(() => {
      const form = rnd.int(0, 2), name = numName(), a = rnd.rints(3, 10, 90);
      if (form === 0) return F("Підніми всі значення на 10.", `${name} = ${py(a)}
for i in range(___(${name})):
    ${name}[i] = ${name}[i] + 10
print(${name})`, [["len"]], `Щоб пройти по індексах, потрібна кількість елементів: \`range(len(${name}))\`.`);
      if (form === 1) return F("Подвой усі значення.", `${name} = ${py(a)}
for i in ___(len(${name})):
    ${name}[i] = ${name}[i] * 2
print(${name})`, [["range"]], "Числа від 0 до останнього індексу дає `range(len(...))`.");
      return F("Обнули всі значення.", `${name} = ${py(a)}
for ___ in range(len(${name})):
    ${name}[i] = 0
print(${name})`, [["i"]], "У тілі циклу використовується змінна `i`, тож і в заголовку має бути `i`.");
    }),
    G(() => {
      const form = rnd.int(0, 2);
      if (form === 0) { const t = theme(4), k = rnd.int(4, 5);
        return R(`Збери програму, яка відбирає слова, довші за ${k} літери.`, `${t.name} = ${py(t.items)}
long = []
for w in ${t.name}:
    if len(w) > ${k}:
        long.append(w)
print(long)`, null, "Порожній список створюємо до циклу, а `print` пишемо після нього, без відступу."); }
      if (form === 1) { const a = rnd.ints(5, 1, 30), k = rnd.int(10, 20);
        return R(`Збери програму, яка відбирає числа, більші за ${k}.`, `nums = ${py(a)}
big = []
for x in nums:
    if x > ${k}:
        big.append(x)
print(big)`, null, "Порожній список створюємо до циклу, а `print` пишемо після нього, без відступу."); }
      const a = rnd.ints(5, 1, 30);
      return R("Збери програму, яка відбирає парні числа.", `nums = ${py(a)}
even = []
for x in nums:
    if x % 2 == 0:
        even.append(x)
print(even)`, null, "Порожній список створюємо до циклу, а `print` пишемо після нього, без відступу.");
    }),
    G(() => {
      const v = rnd.int(2, 9), others = rnd.ints(2, 10, 40), form = rnd.int(0, 1);
      const lst = form === 0 ? [others[0], v, v, others[1]] : [v, v, others[0], others[1]];
      return O(`nums = ${py(lst)}
for x in nums:
    if x == ${v}:
        nums.remove(x)
print(nums)`, null,
        `Пастка! Коли видаляємо перше ${v}, усі елементи зсуваються вліво, і цикл «перестрибує» наступне ${v}. Не видаляй елементи зі списку, по якому йде цикл: краще збирай потрібні в новий список.`);
    }),
    V(
      C({ q: "Напиши функцію `signs(nums)`, яка повертає список знаків: «+» для додатних чисел, «-» для від'ємних і «0» для нуля.",
        starter: `def signs(nums):
    `,
        tests: [{ call: "signs([5, -2, 0, 7])", expect: "['+', '-', '0', '+']" }, { call: "signs([-1])", expect: "['-']" }, { call: "signs([])", expect: "[]" }],
        hint: "Створи порожній список, у циклі визнач знак через if/elif/else і додавай його через `append`.",
        solution: `def signs(nums):
    result = []
    for x in nums:
        if x > 0:
            result.append("+")
        elif x < 0:
            result.append("-")
        else:
            result.append("0")
    return result` }),
      C({ q: "Напиши функцію `parity(nums)`, яка повертає список слів «парне» або «непарне» для кожного числа.",
        starter: `def parity(nums):
    `,
        tests: [{ call: "parity([2, 7, 0])", expect: "['парне', 'непарне', 'парне']" }, { call: "parity([-3])", expect: "['непарне']" }, { call: "parity([])", expect: "[]" }],
        hint: "Парність перевіряє `x % 2 == 0`.",
        solution: `def parity(nums):
    result = []
    for x in nums:
        if x % 2 == 0:
            result.append("парне")
        else:
            result.append("непарне")
    return result` }),
      C({ q: "Напиши функцію `clamp(nums, lo, hi)`, яка повертає новий список, де числа менші за `lo` замінені на `lo`, а більші за `hi` — на `hi`.",
        starter: `def clamp(nums, lo, hi):
    `,
        tests: [{ call: "clamp([1, 5, 12], 2, 10)", expect: "[2, 5, 10]" }, { call: "clamp([-4, 0], 0, 3)", expect: "[0, 0]" }, { call: "clamp([], 1, 2)", expect: "[]" }],
        hint: "Для кожного числа три випадки: менше за `lo`, більше за `hi` або нормальне.",
        solution: `def clamp(nums, lo, hi):
    result = []
    for x in nums:
        if x < lo:
            result.append(lo)
        elif x > hi:
            result.append(hi)
        else:
            result.append(x)
    return result` }),
    ),
    V(
      C({ q: "Напиши функцію `positions(lst, x)`, яка повертає список усіх індексів, де у списку стоїть `x`.",
        starter: `def positions(lst, x):
    `,
        tests: [{ call: "positions([3, 1, 3, 3], 3)", expect: "[0, 2, 3]" }, { call: "positions(['а', 'б'], 'б')", expect: "[1]" }, { call: "positions([1, 2], 5)", expect: "[]" }],
        hint: "Тут потрібні індекси: `for i in range(len(lst))`. Якщо `lst[i] == x`, додай `i`.",
        solution: `def positions(lst, x):
    result = []
    for i in range(len(lst)):
        if lst[i] == x:
            result.append(i)
    return result` }),
      C({ q: "Напиши функцію `first_over(lst, x)`, яка повертає індекс першого елемента, більшого за `x`. Якщо такого немає, поверни -1.",
        starter: `def first_over(lst, x):
    `,
        tests: [{ call: "first_over([3, 8, 10], 5)", expect: "1" }, { call: "first_over([1, 2], 5)", expect: "-1" }, { call: "first_over([9, 1], 0)", expect: "0" }],
        hint: "Пройди за індексами й одразу `return i`, щойно знайдеш. Після циклу — `return -1`.",
        solution: `def first_over(lst, x):
    for i in range(len(lst)):
        if lst[i] > x:
            return i
    return -1` }),
      C({ q: "Напиши функцію `twins(lst)`, яка повертає список індексів `i`, де елемент дорівнює наступному: `lst[i] == lst[i + 1]`.",
        starter: `def twins(lst):
    `,
        tests: [{ call: "twins([1, 1, 2, 2, 2])", expect: "[0, 2, 3]" }, { call: "twins(['а', 'б'])", expect: "[]" }, { call: "twins([5])", expect: "[]" }],
        hint: "Цикл має йти до `len(lst) - 1`, щоб `lst[i + 1]` не вийшов за межі.",
        solution: `def twins(lst):
    result = []
    for i in range(len(lst) - 1):
        if lst[i] == lst[i + 1]:
            result.append(i)
    return result` }),
    ),
  ]
});

// ===================== 4. Пошук, сума, мінімум =====================
LEVELS.push({
  id: "search", kind: "practice", title: "Пошук, сума, мінімум",
  about: "sum, min, max, середнє і пошук потрібного елемента своїми руками.",
  items: [
    W(G(() => {
      const a = rnd.ints(3, 1, 9), s = a[0] + a[1] + a[2];
      return Q(`Що поверне \`sum(${py(a)})\`?`, opts(s, a.join(""), py(a), a[0]), 0, "`sum` складає всі елементи.");
    })),
    W(V(
      Q("Як знайти середнє арифметичне списку `lst`?", ["`sum(lst) / len(lst)`", "`max(lst) / len(lst)`", "`sum(lst) / max(lst)`", "`len(lst) / sum(lst)`"], 0,
        "Сума всіх елементів, поділена на їхню кількість."),
      Q("Що поверне `sum([2, 4]) / len([2, 4])`?", ["3.0", "3", "6", "2"], 0,
        "Сума 6, поділена на 2. Ділення через `/` завжди дає дробове число."),
      Q("Чому `sum(lst) / len(lst)` впаде для порожнього списку?", ["Буде ділення на нуль", "`sum` не працює з порожнім списком", "`len` поверне `None`", "Не впаде"], 0,
        "`len([])` = 0, а на нуль ділити не можна."),
    )),
    W(G(() => {
      const a = rnd.ints(3, 1, 9), has = rnd.int(0, 1), x = has ? rnd.pick(a) : rnd.pick([10, 11, 12, 0]);
      return Q(`Що поверне \`${x} in ${py(a)}\`?`, has ? opts("True", "False", x, "1") : opts("False", "True", x, "0"), 0,
        "Оператор `in` відповідає на питання «чи є такий елемент?» — так або ні.");
    })),
    G(() => {
      const name = rnd.pick(["prices", "marks", "scores"]), a = rnd.ints(4, 10, 150);
      return O(`${name} = ${py(a)}
print(max(${name}) - min(${name}))
print(sum(${name}), len(${name}))`, null, "Різниця між найбільшим і найменшим, потім сума й кількість.");
    }),
    G(() => {
      const isMin = rnd.int(0, 1), a = rnd.ints(4, 5, 99), name = rnd.pick(["prices", "temps", "scores"]), v = isMin ? "low" : "best";
      return F(isMin ? "Знайди найменше значення без функції `min`." : "Знайди найбільше значення без функції `max`.",
        `${name} = ${py(a)}
${v} = ${name}[0]
for x in ${name}:
    if x ___ ${v}:
        ${v} = x
print(${v})`, [isMin ? ["<", "<="] : [">", ">="]],
        isMin ? "Якщо поточне число менше за найменше, яке ми бачили, запам'ятовуємо його." : "Якщо поточне число більше за найбільше, яке ми бачили, запам'ятовуємо його.");
    }),
    G(() => {
      const form = rnd.int(0, 2), a = rnd.ints(3, 5, 12);
      if (form === 0) return B("Хотіли порахувати середній бал, а вийшло щось дивне. Клацни на рядок з помилкою.",
        `marks = ${py(a)}
total = 0
for m in marks:
    total = m
print(total / len(marks))`, 3, "Тут `total` щоразу перезаписується останньою оцінкою. Треба накопичувати: `total = total + m`.");
      if (form === 1) return B("Хотіли порахувати парні числа, а лічильник завжди 1 або 0. Де помилка?",
        `nums = ${py(rnd.ints(5, 1, 20))}
count = 0
for x in nums:
    if x % 2 == 0:
        count = 1
print(count)`, 4, "`count = 1` просто записує одиницю. Треба збільшувати: `count += 1`.");
      return B("Хотіли знайти найбільшу температуру взимку, а вийшов 0. Де помилка?",
        `temps = ${py(rnd.ints(4, 2, 15).map(x => -x))}
best = 0
for t in temps:
    if t > best:
        best = t
print(best)`, 1, "Усі температури від'ємні, тож жодна не більша за 0. Починати треба з першого елемента: `best = temps[0]`.");
    }),
    G(() => {
      const form = rnd.int(0, 1);
      const a = form === 0 ? (() => { const x = rnd.ints(5, 1, 9); x[rnd.int(1, 3)] = -rnd.int(1, 9); return x; })() : rnd.ints(5, 1, 40);
      const k = form === 1 ? rnd.pick(a.slice(1)) - 1 : 0;
      const cond = form === 0 ? "temps[i] < 0" : `temps[i] > ${k}`;
      return R(form === 0 ? "Збери програму, яка знаходить номер першого морозного дня." : `Збери програму, яка знаходить номер першого дня, коли було більше ${k} градусів.`,
        `temps = ${py(a)}
day = -1
for i in range(len(temps)):
    if ${cond}:
        day = i + 1
        break
print("День", day)`, null, "Як тільки знайшли потрібний день, запам'ятовуємо номер і виходимо з циклу через `break`.");
    }),
    V(
      C({ q: "Напиши функцію `count_between(lst, a, b)`, яка повертає, скільки чисел у списку лежать від `a` до `b` включно.",
        starter: `def count_between(lst, a, b):
    `,
        tests: [{ call: "count_between([1, 5, 10, 15], 5, 10)", expect: "2" }, { call: "count_between([7, 7, 7], 1, 6)", expect: "0" }, { call: "count_between([-3, 0, 3], -3, 3)", expect: "3" }],
        hint: "Лічильник плюс цикл. Умова: `a <= x <= b`.",
        solution: `def count_between(lst, a, b):
    count = 0
    for x in lst:
        if a <= x <= b:
            count += 1
    return count` }),
      C({ q: "Напиши функцію `spread(lst)`, яка повертає різницю між найбільшим і найменшим числом. Функції `max` і `min` використовувати не можна!",
        forbid: ["max", "min"],
        starter: `def spread(lst):
    `,
        tests: [{ call: "spread([4, 9, 2])", expect: "7" }, { call: "spread([5])", expect: "0" }, { call: "spread([-3, 3])", expect: "6" }],
        hint: "Дві змінні, `hi` і `lo`, обидві починаються з `lst[0]`. В одному циклі онови обидві.",
        solution: `def spread(lst):
    hi = lst[0]
    lo = lst[0]
    for x in lst:
        if x > hi:
            hi = x
        if x < lo:
            lo = x
    return hi - lo` }),
      C({ q: "Напиши функцію `count_max(lst)`, яка повертає, скільки разів у списку трапляється найбільше число.",
        starter: `def count_max(lst):
    `,
        tests: [{ call: "count_max([3, 9, 9, 1])", expect: "2" }, { call: "count_max([5])", expect: "1" }, { call: "count_max([2, 2, 2])", expect: "3" }],
        hint: "`lst.count(max(lst))`.",
        solution: `def count_max(lst):
    return lst.count(max(lst))` }),
    ),
    V(
      C({ q: "Напиши функцію `closest(lst, target)`, яка повертає число зі списку, найближче до `target`. Якщо таких кілька, поверни те, що стоїть раніше.",
        starter: `def closest(lst, target):
    `,
        tests: [{ call: "closest([1, 8, 15], 10)", expect: "8" }, { call: "closest([3, 7], 5)", expect: "3" }, { call: "closest([-4, 2], -2)", expect: "-4" }],
        hint: "Відстань між числами — `abs(x - target)`. Шукай елемент з найменшою відстанню, як шукаєш мінімум.",
        solution: `def closest(lst, target):
    best = lst[0]
    for x in lst:
        if abs(x - target) < abs(best - target):
            best = x
    return best` }),
      C({ q: "Напиши функцію `min_index(lst)`, яка повертає індекс найменшого числа (якщо їх кілька — першого).",
        starter: `def min_index(lst):
    `,
        tests: [{ call: "min_index([5, 2, 8, 2])", expect: "1" }, { call: "min_index([7])", expect: "0" }, { call: "min_index([3, 4, -1])", expect: "2" }],
        hint: "Запам'ятовуй не саме число, а його індекс. Порівнюй `lst[i] < lst[best]`.",
        solution: `def min_index(lst):
    best = 0
    for i in range(len(lst)):
        if lst[i] < lst[best]:
            best = i
    return best` }),
      C({ q: "Напиши функцію `second_min(lst)`, яка повертає друге найменше **різне** число. Для `[4, 1, 7, 1, 3]` відповідь 3.",
        starter: `def second_min(lst):
    `,
        tests: [{ call: "second_min([4, 1, 7, 1, 3])", expect: "3" }, { call: "second_min([2, 1])", expect: "2" }, { call: "second_min([5, 5, 9])", expect: "9" }],
        hint: "Знайди мінімум, а потім найменше серед чисел, більших за нього.",
        solution: `def second_min(lst):
    m = min(lst)
    best = None
    for x in lst:
        if x > m and (best is None or x < best):
            best = x
    return best` }),
    ),
    V(
      C({ q: "Напиши функцію `max_rise(temps)`, яка повертає найбільше потепління між двома сусідніми днями. Для `[3, 5, 4, 10]` відповідь 6 (з 4 до 10). Якщо температура ні разу не росла, поверни 0.",
        stars: 3,
        starter: `def max_rise(temps):
    `,
        tests: [{ call: "max_rise([3, 5, 4, 10])", expect: "6" }, { call: "max_rise([5, 4, 3])", expect: "0" }, { call: "max_rise([-2, 1, 1, 2])", expect: "3" }],
        hint: "Порівнюй сусідів: `temps[i + 1] - temps[i]`. Цикл до `len(temps) - 1`, щоб не вийти за межі.",
        solution: `def max_rise(temps):
    best = 0
    for i in range(len(temps) - 1):
        d = temps[i + 1] - temps[i]
        if d > best:
            best = d
    return best` }),
      C({ q: "Напиши функцію `longest_up(lst)`, яка повертає довжину найдовшої ділянки, де числа строго зростають поспіль. Для `[1, 2, 5, 3, 4]` відповідь 3 (1, 2, 5).",
        stars: 3,
        starter: `def longest_up(lst):
    `,
        tests: [{ call: "longest_up([1, 2, 5, 3, 4])", expect: "3" }, { call: "longest_up([5, 4, 3])", expect: "1" }, { call: "longest_up([1, 2, 3, 4])", expect: "4" }, { call: "longest_up([])", expect: "0" }],
        hint: "Поточна довжина і найкраща. Якщо `lst[i] > lst[i - 1]`, поточна росте, інакше знову 1.",
        solution: `def longest_up(lst):
    if not lst:
        return 0
    cur = 1
    best = 1
    for i in range(1, len(lst)):
        if lst[i] > lst[i - 1]:
            cur += 1
        else:
            cur = 1
        if cur > best:
            best = cur
    return best` }),
      C({ q: "Напиши функцію `best_pair(lst)`, яка повертає найбільшу суму двох сусідніх чисел. Для `[1, 7, 3, 6]` відповідь 10 (7 + 3).",
        stars: 3,
        starter: `def best_pair(lst):
    `,
        tests: [{ call: "best_pair([1, 7, 3, 6])", expect: "10" }, { call: "best_pair([-5, -1, -8])", expect: "-6" }, { call: "best_pair([2, 2])", expect: "4" }],
        hint: "Починай з `lst[0] + lst[1]`, а не з нуля — числа можуть бути від'ємні.",
        solution: `def best_pair(lst):
    best = lst[0] + lst[1]
    for i in range(1, len(lst) - 1):
        s = lst[i] + lst[i + 1]
        if s > best:
            best = s
    return best` }),
    ),
  ]
});

// ===================== 5. Списки і рядки =====================
LEVELS.push({
  id: "strings", kind: "practice", title: "Списки і рядки",
  about: "split, join, map і перетворення рядка на список літер.",
  items: [
    W(G(() => {
      const w = rnd.sample(["я", "люблю", "код", "ми", "пишемо", "Python", "кіт", "спить", "тут"], 3), s = w.join(" ");
      return Q(`Що поверне \`"${s}".split()\`?`, [`\`${pr(w)}\``, `\`['${s}']\``, `\`${w.map(x => "'" + x + "'").join(", ")}\``, `\`['${w[0]}', ' ', '${w[1]}', ' ', '${w[2]}']\``], 0,
        "`split()` без аргументів ріже рядок за пробілами і повертає список слів.");
    })),
    W(V(
      Q("Як правильно склеїти список слів через пробіл?", ["`\" \".join(words)`", "`words.join(\" \")`", "`join(words, \" \")`", "`words + \" \"`"], 0,
        "`join` — метод рядка-роздільника: спочатку пишемо, чим склеювати, потім що."),
      Q("Що поверне `\"-\".join([\"a\", \"b\", \"c\"])`?", ["`'a-b-c'`", "`'abc'`", "`'a - b - c'`", "`['a-b-c']`"], 0,
        "Роздільник «-» ставиться між елементами."),
      Q("Що поверне `\"\".join([\"к\", \"і\", \"т\"])`?", ["`'кіт'`", "`'к і т'`", "`['кіт']`", "Помилку"], 0,
        "Порожній роздільник склеює елементи впритул."),
    )),
    W(V(
      Q("Навіщо `map(int, ...)` у `list(map(int, input().split()))`?", ["Перетворює кожен шматок рядка на ціле число", "Сортує числа", "Рахує кількість чисел", "Видаляє пробіли"], 0,
        "`split` дає список рядків `['4', '8']`. `map(int, ...)` застосовує `int` до кожного з них."),
      Q("Що поверне `list(map(int, [\"1\", \"2\"]))`?", ["`[1, 2]`", "`['1', '2']`", "`3`", "Помилку"], 0,
        "`map(int, ...)` перетворює кожен рядок на число."),
      Q("Що поверне `\"4 8\".split()`?", ["`['4', '8']`", "`[4, 8]`", "`[48]`", "`12`"], 0,
        "`split` завжди повертає рядки. Щоб вийшли числа, потрібен `int` або `map(int, ...)`."),
    )),
    W(G(() => {
      const w = rnd.pick(["кіт", "сир", "дім", "код", "ліс", "мак"]);
      const ch = [...w];
      return Q(`Що поверне \`list("${w}")\`?`, [`\`${pr(ch)}\``, `\`['${w}']\``, `\`'${ch.join(" ")}'\``, "Помилку"], 0,
        "`list` від рядка розбиває його на окремі символи.");
    })),
    G(() => {
      const form = rnd.int(0, 1);
      if (form === 0) { const h = rnd.int(8, 21), m = rnd.int(10, 59), s = rnd.int(10, 59);
        return O(`t = "${h}:${m}:${s}"
parts = t.split(":")
print(parts[0])
print(int(parts[1]) + int(parts[2]))`, null, `Після \`split\` маємо \`['${h}', '${m}', '${s}']\`. Щоб скласти, перетворюємо рядки на числа: ${m} + ${s} = ${m + s}.`); }
      const t = theme(3);
      return O(`line = "${t.items.join(",")}"
parts = line.split(",")
print(len(parts))
print(parts[1].upper())`, null, "Ріжемо за комою — отримуємо три слова. Друге слово виводимо великими літерами.");
    }),
    G(() => {
      const w = rnd.sample(["раз", "два", "три", "сонце", "море", "гора", "кава", "чай"], rnd.int(3, 4)), form = rnd.int(0, 1);
      if (form === 0) return O(`words = "${w.join(" ")}".split()
print(len(words), words[-1].upper())`, null, `${w.length} слова, останнє — «${w[w.length - 1]}», великими літерами.`);
      return O(`words = "${w.join(" ")}".split()
print(words[0][::-1], len(words[1]))`, null, `Перше слово задом наперед, потім довжина другого слова «${w[1]}».`);
    }),
    V(
      Q("Чому ця програма падає з помилкою?", ["У списку рядки, а не числа, і `sum` не може їх скласти", "`split` не працює з числами", "Треба писати `sum[nums]`", "У рядку немає пробілів"], 0,
        "`split` повертає `['4', '8', '15']` — це рядки. Треба `list(map(int, line.split()))`.",
        `line = "4 8 15"
nums = line.split()
print(sum(nums))`),
      Q("Що виведе програма?", ["`12`", "`3`", "`'1''2'`", "Помилку"], 0,
        "`input`, `split` і рядки в лапках дають текст. Текст «1» + «2» склеюється в «12».",
        `a = "1"
b = "2"
print(a + b)`),
      Q("Що треба змінити, щоб програма вивела 9?", ["`nums = list(map(int, line.split()))`", "`nums = line.split(\"\")`", "`print(sum(line))`", "`nums = int(line)`"], 0,
        "Числа з рядка дістаємо так: розбити через `split`, а кожен шматок перетворити на `int`.",
        `line = "2 3 4"
nums = line.split()
print(sum(nums))`),
    ),
    G(() => {
      const form = rnd.int(0, 1);
      if (form === 0) { const w = rnd.pick(["код", "сир", "кіт", "мак"]);
        return F("Склей літери в одне слово без пробілів.", `letters = ${py([...w])}
word = ___.join(letters)
print(word)`, [['""', "''"]], "Роздільник — порожній рядок `\"\"`, тобто літери склеюються впритул."); }
      const sep = rnd.pick(["-", "+", "*", "/", "_"]), w = rnd.sample(["Python", "це", "цікаво", "і", "легко", "круто"], 3);
      return F(`Склей слова так, щоб вийшло \`${w.join(sep)}\`.`, `words = ${py(w)}
print("___".join(words))`, [[sep]], "Роздільник пишемо в лапках перед `.join`.");
    }),
    V(
      C({ q: "Користувач вводить числа в одному рядку через пробіл. Виведи, скільки з них більші за 10.",
        starter: ``,
        tests: [{ input: ["4 15 8 23"], expect: "2" }, { input: ["10 11"], expect: "1" }, { input: ["1"], expect: "0" }],
        hint: "`nums = list(map(int, input().split()))`, а далі лічильник у циклі.",
        solution: `nums = list(map(int, input().split()))
count = 0
for x in nums:
    if x > 10:
        count += 1
print(count)` }),
      C({ q: "Користувач вводить числа в одному рядку через пробіл. Виведи найменше число і кількість чисел через пробіл. Для `7 3 9` відповідь `3 3`.",
        starter: ``,
        tests: [{ input: ["7 3 9"], expect: "3 3" }, { input: ["5"], expect: "5 1" }, { input: ["-2 -8 4 0"], expect: "-8 4" }],
        hint: "`nums = list(map(int, input().split()))`, а далі `min` і `len`.",
        solution: `nums = list(map(int, input().split()))
print(min(nums), len(nums))` }),
      C({ q: "Користувач вводить числа в одному рядку через пробіл. Виведи суму лише парних чисел.",
        starter: ``,
        tests: [{ input: ["1 2 3 4"], expect: "6" }, { input: ["5 7"], expect: "0" }, { input: ["10 -4"], expect: "6" }],
        hint: "Перетвори рядок на список чисел і додавай до суми лише ті, де `x % 2 == 0`.",
        solution: `nums = list(map(int, input().split()))
total = 0
for x in nums:
    if x % 2 == 0:
        total += x
print(total)` }),
    ),
    V(
      C({ q: "Користувач вводить речення. Виведи в першому рядку перше й останнє слово через пробіл, у другому — скільки слів мають більше 4 літер.",
        starter: ``,
        tests: [{ input: ["Київ найкраще місто України"], expect: "Київ України\n3" }, { input: ["я люблю програмувати"], expect: "я програмувати\n2" }],
        hint: "`words = input().split()`. Перше слово — `words[0]`, останнє — `words[-1]`.",
        solution: `words = input().split()
print(words[0], words[-1])
count = 0
for w in words:
    if len(w) > 4:
        count += 1
print(count)` }),
      C({ q: "Користувач вводить речення. Виведи те саме речення, але кожне слово з великої літери: «ми любимо код» → «Ми Любимо Код».",
        starter: ``,
        tests: [{ input: ["ми любимо код"], expect: "Ми Любимо Код" }, { input: ["київ"], expect: "Київ" }],
        hint: "Для кожного слова: `w[0].upper() + w[1:]`. Потім склей через `\" \".join(...)`.",
        solution: `words = input().split()
result = []
for w in words:
    result.append(w[0].upper() + w[1:])
print(" ".join(result))` }),
      C({ q: "Користувач вводить речення. Виведи в першому рядку кількість слів, у другому — найкоротше слово (якщо таких кілька — перше з них).",
        starter: ``,
        tests: [{ input: ["я люблю програмувати"], expect: "3\nя" }, { input: ["кіт спить на дивані"], expect: "4\nна" }],
        hint: "Найкоротше шукай як мінімум: порівнюй `len(w) < len(shortest)`.",
        solution: `words = input().split()
shortest = words[0]
for w in words:
    if len(w) < len(shortest):
        shortest = w
print(len(words))
print(shortest)` }),
    ),
    V(
      C({ q: "Ініціали. Користувач вводить кілька слів. Виведи перші літери кожного слова великими, кожну з крапкою: «тарас григорович шевченко» → «Т.Г.Ш.».",
        stars: 3,
        starter: ``,
        tests: [{ input: ["тарас григорович шевченко"], expect: "Т.Г.Ш." }, { input: ["лісова пісня"], expect: "Л.П." }],
        hint: "Збери перші літери `w[0].upper()` у список, склей через `\".\".join(...)` і допиши крапку в кінці.",
        solution: `words = input().split()
letters = []
for w in words:
    letters.append(w[0].upper())
print(".".join(letters) + ".")` }),
      C({ q: "Користувач вводить слова через пробіл. Виведи ці слова без повторів, у порядку першої появи, через пробіл: «так ні так так ок» → «так ні ок».",
        stars: 3,
        starter: ``,
        tests: [{ input: ["так ні так так ок"], expect: "так ні ок" }, { input: ["a a a"], expect: "a" }, { input: ["раз два"], expect: "раз два" }],
        hint: "Новий порожній список. Додавай слово, лише якщо його там ще немає (`not in`).",
        solution: `words = input().split()
result = []
for w in words:
    if w not in result:
        result.append(w)
print(" ".join(result))` }),
      C({ q: "Користувач вводить оцінки через кому без пробілів, наприклад `10,8,12`. Виведи найвищу оцінку і середній бал, округлений до цілого через `round`, через пробіл.",
        stars: 3,
        starter: ``,
        tests: [{ input: ["10,8,12"], expect: "12 10" }, { input: ["7,9,9,3"], expect: "9 7" }, { input: ["5"], expect: "5 5" }],
        hint: "`marks = list(map(int, input().split(\",\")))`.",
        solution: `marks = list(map(int, input().split(",")))
print(max(marks), round(sum(marks) / len(marks)))` }),
    ),
  ]
});
// ===================== 6. extend, enumerate, zip =====================
LEVELS.push({
  id: "tools", kind: "learn", title: "extend, enumerate, zip",
  about: "Три нові інструменти: додати цілий список, отримати номер разом з елементом, пройти два списки паралельно.",
  items: [
    W(V(
      Q("Пригадай: що робить `append`?", ["Додає один елемент у кінець", "Додає кілька елементів", "Сортує список", "Видаляє останній елемент"], 0, "Саме так. А тепер подивимось, що буде, якщо додати через нього цілий список."),
      Q("Пригадай: що виведе `a = [1]; a.append(2); print(len(a))`?", ["2", "1", "3", "Помилку"], 0, "Після `append` у списку два елементи. А що буде, якщо додати цілий список? Зараз розберемося."),
      Q("Пригадай: як пройти по списку й отримати індекси?", ["`for i in range(len(lst))`", "`for i in lst`", "`for i in len(lst)`", "`while lst`"], 0, "Так. Сьогодні дізнаємося зручніший спосіб — `enumerate`."),
    )),
    L("extend — додати всі елементи іншого списку",
      "`append` завжди додає **один** елемент. Якщо передати йому список, він стане одним елементом усередині. Метод `extend` додає кожен елемент іншого списку окремо.",
      `a = [1, 2]
a.append([3, 4])
print(a)    # [1, 2, [3, 4]]

b = [1, 2]
b.extend([3, 4])
print(b)    # [1, 2, 3, 4]`),
    G(() => {
      const t = theme(3), [p, q, r] = t.items;
      return O(`x = ["${p}"]
y = ["${p}"]
x.append(["${q}", "${r}"])
y.extend(["${q}", "${r}"])
print(len(x), len(y))
print(x[-1], y[-1])`, null, `У \`x\` два елементи, і останній з них — цілий список. У \`y\` три окремі елементи.`);
    }),
    G(() => {
      const n = rnd.int(1, 3), m = rnd.int(2, 3), a = rnd.ints(n, 1, 9), b = rnd.ints(m, 10, 20);
      return Q(`У списку \`x = ${py(a)}\`. Яка довжина після \`x.extend(${py(b)})\`?`, opts(n + m, n + 1, m, n), 0, `Додалися ${m} окремі елементи, тож разом ${n + m}.`);
    }),
    L("enumerate — номер і елемент одразу",
      "Часто потрібен і номер елемента, і сам елемент. Замість `for i in range(len(lst))` можна написати `for i, x in enumerate(lst)`. Щоб рахувати з 1, а не з 0, пиши `enumerate(lst, 1)`.",
      `pets = ["кіт", "пес", "папуга"]
for i, pet in enumerate(pets, 1):
    print(i, pet)
# 1 кіт
# 2 пес
# 3 папуга`),
    V(
      Q("Що дає `enumerate` на кожному кроці циклу?", ["Пару: номер і елемент", "Тільки номер", "Тільки елемент", "Весь список"], 0, "Тому в циклі дві змінні: `for i, x in enumerate(...)`."),
      Q("З якого числа рахує `enumerate(lst)` без другого аргументу?", ["З 0", "З 1", "З останнього індексу", "З першого елемента списку"], 0, "Як і індекси, `enumerate` рахує з нуля. Інший початок задає другий аргумент: `enumerate(lst, 1)`."),
      Q("Як пронумерувати елементи з 1?", ["`enumerate(lst, 1)`", "`enumerate(lst + 1)`", "`enumerate(1, lst)`", "`enumerate(lst)[1:]`"], 0, "Другий аргумент `enumerate` — це число, з якого починається рахунок."),
    ),
    G(() => {
      const t = theme(3), s = rnd.pick([0, 1, 1, 5, 10]);
      return O(`for n, w in enumerate(${py(t.items)}${s ? ", " + s : ""}):
    print(n, w)`, null, s ? `Рахунок починається з ${s}, бо так задано другим аргументом.` : "Без другого аргументу рахунок починається з 0.");
    }),
    L("zip — два списки паралельно",
      "Якщо є два списки однакової довжини, `zip` бере з них елементи парами: перший з першим, другий з другим. Якщо списки різної довжини, `zip` зупиняється на коротшому.",
      `cities = ["Київ", "Львів", "Одеса"]
temps = [5, 3, 9]
for city, t in zip(cities, temps):
    print(city, t)
# Київ 5
# Львів 3
# Одеса 9`),
    G(() => {
      const n = rnd.int(2, 3), m = rnd.int(n + 1, 4), a = range(1, m + 1), b = rnd.sample(["a", "b", "c", "x", "y", "z"], n);
      const pairs = "[" + b.map((v, i) => `(${a[i]}, '${v}')`).join(", ") + "]";
      const padded = "[" + a.map((v, i) => `(${v}, ${i < n ? "'" + b[i] + "'" : "None"})`).join(", ") + "]";
      const flat = "[" + b.map((v, i) => `${a[i]}, '${v}'`).join(", ") + "]";
      return Q("Що виведе програма?", [`\`${pairs}\``, `\`${padded}\``, `\`${flat}\``, "Помилку"], 0,
        "`zip` зупиняється на коротшому списку. Пари в круглих дужках називаються кортежами.",
        `print(list(zip(${py(a)}, ${py(b)})))`);
    }),
    G(() => {
      const form = rnd.int(0, 1);
      if (form === 0) return F("Виведи пари «місто температура».", `cities = ${py(rnd.sample(TH[2].w, 2))}
temps = ${py(rnd.rints(2, -5, 20))}
for city, t in ___(cities, temps):
    print(city, t)`, [["zip"]], "Паралельний перебір двох списків — це `zip`.");
      return F("Виведи нумерований список з 1.", `shop = ${py(rnd.sample(TH[1].w, 3))}
for i, item in ___(shop, 1):
    print(i, item)`, [["enumerate"]], "Номер разом з елементом дає `enumerate`.");
    }),
    G(() => {
      const t = theme(3);
      return R("Збери програму, яка доповнює список і виводить його з нумерацією від 1.", `${t.name} = ["${t.items[0]}"]
${t.name}.extend(["${t.items[1]}", "${t.items[2]}"])
for i, item in enumerate(${t.name}, 1):
    print(i, item)`, null, "Спершу доповнюємо список, потім нумеруємо з 1.");
    }),
    V(
      C({ q: "Напиши функцію `pair_sums(a, b)`, яка повертає список сум відповідних елементів двох списків. Використай `zip`.",
        starter: `def pair_sums(a, b):
    `,
        tests: [{ call: "pair_sums([1, 2, 3], [10, 20, 30])", expect: "[11, 22, 33]" }, { call: "pair_sums([5], [1, 2])", expect: "[6]" }],
        hint: "`for x, y in zip(a, b):` і додавай `x + y` у новий список.",
        solution: `def pair_sums(a, b):
    result = []
    for x, y in zip(a, b):
        result.append(x + y)
    return result` }),
      C({ q: "Напиши функцію `pair_max(a, b)`, яка для кожної пари елементів з двох списків бере більший. Використай `zip`.",
        starter: `def pair_max(a, b):
    `,
        tests: [{ call: "pair_max([1, 9, 3], [4, 2, 3])", expect: "[4, 9, 3]" }, { call: "pair_max([5, 6], [7])", expect: "[7]" }],
        hint: "`for x, y in zip(a, b):` і додавай `max(x, y)`.",
        solution: `def pair_max(a, b):
    result = []
    for x, y in zip(a, b):
        result.append(max(x, y))
    return result` }),
      C({ q: "Напиши функцію `numbered(words)`, яка повертає список рядків з номерами від 1: `['кіт', 'пес']` → `['1. кіт', '2. пес']`. Використай `enumerate`.",
        starter: `def numbered(words):
    `,
        tests: [{ call: "numbered(['кіт', 'пес'])", expect: "['1. кіт', '2. пес']" }, { call: "numbered([])", expect: "[]" }],
        hint: "`for i, w in enumerate(words, 1):` і додавай `str(i) + \". \" + w`.",
        solution: `def numbered(words):
    result = []
    for i, w in enumerate(words, 1):
        result.append(str(i) + ". " + w)
    return result` }),
    ),
  ]
});

// ===================== 7. Сортування =====================
LEVELS.push({
  id: "sorting", kind: "learn", title: "Сортування",
  about: "sort і sorted, сортування за спаданням і за довжиною, розворот списку.",
  items: [
    W(G(() => {
      let a; do { a = rnd.ints(3, 1, 9); } while (pr(a) === pr(a.slice().sort((x, y) => x - y)) || pr(a) === pr(a.slice().sort((x, y) => y - x)));
      const rev = a.slice().reverse(), srt = a.slice().sort((x, y) => x - y);
      return Q(`Пригадай: що виведе \`print(${py(a)}[::-1])\`?`, opts(pr(rev), pr(srt), pr(srt.slice().reverse()), pr(a)).map(x => "`" + x + "`"), 0,
        "Зріз з кроком −1 просто розвертає порядок. Це ще не сортування — зараз розберемося, як упорядкувати за зростанням.");
    })),
    L("sort() і sorted()",
      "Є два способи відсортувати список. Метод `lst.sort()` змінює сам список і повертає `None`. Функція `sorted(lst)` нічого не змінює, а повертає **новий** відсортований список.",
      `a = [3, 1, 2]
b = sorted(a)
print(a, b)   # [3, 1, 2] [1, 2, 3]

a.sort()
print(a)      # [1, 2, 3]`),
    V(
      Q("Що змінює сам список?", ["`lst.sort()`", "`sorted(lst)`", "Обидва", "Жоден"], 0, "`sorted` створює копію, а `sort` переставляє елементи в самому списку."),
      Q("Що повертає `lst.sort()`?", ["`None`", "Відсортований список", "Початковий список", "Кількість елементів"], 0, "`sort` змінює список на місці й нічого не повертає."),
      Q("Як отримати відсортовану копію, не змінюючи `a`?", ["`b = sorted(a)`", "`b = a.sort()`", "`b = a`", "`b = a.reverse()`"], 0, "`sorted` повертає новий список, а `a` лишається як був."),
    ),
    G(() => {
      const a = rnd.ints(3, 1, 9);
      return O(`a = ${py(a)}
print(sorted(a), a)
print(a.sort())
print(a)`, null, "`sorted` не чіпає `a`. `a.sort()` змінює список, але сам повертає `None` — саме його і надрукував другий `print`.");
    }),
    L("За спаданням і за довжиною",
      "`reverse=True` сортує від більшого до меншого. `key=len` каже Python порівнювати не самі елементи, а їхню довжину. А `lst.reverse()` просто розвертає список задом наперед, без сортування.",
      `nums = [5, 2, 9]
print(sorted(nums, reverse=True))   # [9, 5, 2]

words = ["кавун", "їж", "сир"]
print(sorted(words, key=len))       # ['їж', 'сир', 'кавун']`),
    G(() => {
      const groups = [["їж", "ми", "ок"], ["кіт", "сир", "дім", "лис"], ["кавун", "слива", "школа"], ["яблуко", "собака", "машина"]];
      const w = rnd.shuffle(rnd.sample(groups, 3).map(g => rnd.pick(g)));
      const desc = rnd.int(0, 1);
      const right = w.slice().sort((x, y) => desc ? y.length - x.length : x.length - y.length);
      const wrong1 = right.slice().reverse(), wrong2 = w.slice(), wrong3 = w.slice().reverse();
      return Q(`Що поверне \`sorted(${py(w)}, key=len${desc ? ", reverse=True" : ""})\`?`, opts(pr(right), pr(wrong1), pr(wrong2), pr(wrong3), pr(right.slice(1).concat(right[0]))).map(x => "`" + x + "`"), 0,
        desc ? "Сортуємо за довжиною, від найдовшого." : "Сортуємо за довжиною, від найкоротшого.");
    }),
    G(() => {
      const w = rnd.sample(["яблуко", "груша", "аґрус", "слива", "вишня", "диня", "банан"], 3);
      const k = rnd.int(0, 2); w[k] = w[k][0].toUpperCase() + w[k].slice(1);
      return O(`print(sorted(${py(w)}))`, null, "Python порівнює коди символів. Усі великі літери мають менші коди, ніж малі, тому слово з великої літери опиняється першим.");
    }),
    G(() => {
      const form = rnd.int(0, 1);
      if (form === 0) return F("Відсортуй слова від найкоротшого до найдовшого.", `words = ${py(rnd.shuffle(["черепаха", "кіт", "собака"]))}
print(sorted(words, key=___))`, [["len"]], "Порівнюємо довжини, тому `key=len`.");
      return F("Виведи три найкращі результати, від найбільшого.", `scores = ${py(rnd.ints(5, 1, 20))}
print(sorted(scores, reverse=___)[:3])`, [["True"]], "Сортуємо за спаданням і беремо перші три.");
    }),
    V(
      C({ q: "Напиши функцію `median(lst)`, яка повертає середній за величиною елемент списку з непарною кількістю чисел. Початковий список змінюватися не повинен.",
        starter: `def median(lst):
    `,
        tests: [{ call: "median([5, 1, 3])", expect: "3" }, { call: "median([9, 2, 7, 4, 1])", expect: "4" }, { call: "(lambda s: (median(s), s))([8, 6, 7])", expect: "(7, [8, 6, 7])", label: "Після виклику список не змінився" }],
        hint: "Відсортуй копію через `sorted` і візьми елемент з індексом `len(lst) // 2`.",
        solution: `def median(lst):
    s = sorted(lst)
    return s[len(s) // 2]` }),
      C({ q: "Напиши функцію `top_k(lst, k)`, яка повертає `k` найбільших чисел від більшого до меншого. Початковий список змінюватися не повинен.",
        starter: `def top_k(lst, k):
    `,
        tests: [{ call: "top_k([4, 9, 1, 7], 2)", expect: "[9, 7]" }, { call: "top_k([3], 1)", expect: "[3]" }, { call: "(lambda s: (top_k(s, 1), s))([2, 8, 5])", expect: "([8], [2, 8, 5])", label: "Після виклику список не змінився" }],
        hint: "`sorted(lst, reverse=True)[:k]`.",
        solution: `def top_k(lst, k):
    return sorted(lst, reverse=True)[:k]` }),
      C({ q: "Напиши функцію `extremes(lst)`, яка повертає список із двох чисел: найменшого і найбільшого. Використай `sorted`.",
        starter: `def extremes(lst):
    `,
        tests: [{ call: "extremes([4, 9, 1, 7])", expect: "[1, 9]" }, { call: "extremes([5])", expect: "[5, 5]" }],
        hint: "Відсортуй і візьми перший та останній елементи.",
        solution: `def extremes(lst):
    s = sorted(lst)
    return [s[0], s[-1]]` }),
    ),
    V(
      C({ q: "Напиши функцію `insert_sorted(lst, x)`, яка вставляє `x` у вже відсортований список так, щоб він лишився відсортованим, і повертає список. Використовувати `sort` і `sorted` не можна!",
        stars: 3, forbid: ["sort", "sorted"],
        starter: `def insert_sorted(lst, x):
    `,
        tests: [{ call: "insert_sorted([1, 3, 5], 4)", expect: "[1, 3, 4, 5]" }, { call: "insert_sorted([2, 3], 1)", expect: "[1, 2, 3]" }, { call: "insert_sorted([1, 2], 9)", expect: "[1, 2, 9]" }, { call: "insert_sorted([], 2)", expect: "[2]" }],
        hint: "Знайди перший індекс, де елемент більший за `x`, і зроби `insert` туди. Якщо такого немає, `x` іде в кінець.",
        solution: `def insert_sorted(lst, x):
    for i in range(len(lst)):
        if lst[i] > x:
            lst.insert(i, x)
            return lst
    lst.append(x)
    return lst` }),
      C({ q: "Напиши функцію `is_sorted(lst)`, яка повертає `True`, якщо кожен елемент не менший за попередній. Використовувати `sort` і `sorted` не можна!",
        stars: 3, forbid: ["sort", "sorted"],
        starter: `def is_sorted(lst):
    `,
        tests: [{ call: "is_sorted([1, 2, 2, 5])", expect: "True" }, { call: "is_sorted([3, 1])", expect: "False" }, { call: "is_sorted([])", expect: "True" }, { call: "is_sorted([4, 5, 3])", expect: "False" }],
        hint: "Порівнюй сусідів: якщо `lst[i] > lst[i + 1]`, одразу `return False`.",
        solution: `def is_sorted(lst):
    for i in range(len(lst) - 1):
        if lst[i] > lst[i + 1]:
            return False
    return True` }),
      C({ q: "Напиши функцію `sort_desc(lst)`, яка сортує список від більшого до меншого й повертає його. Використовувати `sort` і `sorted` не можна!",
        stars: 3, forbid: ["sort", "sorted"],
        starter: `def sort_desc(lst):
    `,
        tests: [{ call: "sort_desc([3, 9, 1])", expect: "[9, 3, 1]" }, { call: "sort_desc([2, 2, 5])", expect: "[5, 2, 2]" }, { call: "sort_desc([])", expect: "[]" }],
        hint: "Можна по черзі шукати найбільший елемент, переносити його в новий список і видаляти зі старого.",
        solution: `def sort_desc(lst):
    result = []
    while lst:
        m = max(lst)
        result.append(m)
        lst.remove(m)
    return result` }),
    ),
  ]
});

// ===================== 8. Генератори списків =====================
LEVELS.push({
  id: "comprehension", kind: "learn", title: "Генератори списків",
  about: "Як створити новий список одним рядком: [вираз for x in список if умова].",
  items: [
    W(G(() => {
      const a = rnd.ints(3, 1, 5), k = rnd.int(2, 3), r = a.map(x => x * k);
      return Q("Пригадай: що виведе цей код?", opts(pr(r), pr(a), pr([r[0]]), r.reduce((x, y) => x + y, 0)).map((x, i) => i < 3 ? "`" + x + "`" : "`" + x + "`"), 0,
        "Звичайний цикл з `append`. Зараз навчимося писати те саме в один рядок.",
        `result = []
for x in ${py(a)}:
    result.append(x * ${k})
print(result)`);
    })),
    L("Цикл в один рядок",
      "Генератор списку — це короткий запис циклу, який збирає новий список. Читай його так: «`x * x` для кожного `x` з `range(1, 6)`».",
      `squares = []
for x in range(1, 6):
    squares.append(x * x)

squares = [x * x for x in range(1, 6)]
# обидва варіанти дають [1, 4, 9, 16, 25]`),
    G(() => {
      const a = rnd.ints(3, 1, 9), k = rnd.int(1, 5), r = a.map(x => x + k);
      return Q(`Що поверне \`[x + ${k} for x in ${py(a)}]\`?`, [`\`${pr(r)}\``, `\`${pr(a)}\``, `\`[x + ${k}, x + ${k}, x + ${k}]\``, `\`${r.reduce((x, y) => x + y, 0)}\``], 0, `До кожного елемента додаємо ${k}.`);
    }),
    L("Фільтр через if",
      "Якщо в кінці дописати `if умова`, у новий список потраплять лише ті елементи, для яких умова виконується.",
      `nums = [5, -2, 8, -1, 3]
positive = [x for x in nums if x > 0]
print(positive)   # [5, 8, 3]`),
    G(() => {
      const a = rnd.ints(4, 2, 30), m = rnd.int(2, 4), t = rnd.int(5, 15);
      return O(`nums = ${py(a)}
print([x // 2 for x in nums])
print([x for x in nums if x % ${m} == 0])
print([str(x) for x in nums if x > ${t}])`, null,
        `Перший рядок ділить кожне число націло на 2. Другий відбирає кратні ${m}. Третій відбирає числа більші за ${t} і робить з них рядки, тому вони в лапках.`);
    }),
    G(() => {
      const form = rnd.int(0, 2);
      if (form === 0) return F("Збери список довжин усіх слів.", `words = ${py(theme(3).items)}
lengths = [___(w) for w in words]
print(lengths)`, [["len"]], "Для кожного слова беремо його довжину.");
      if (form === 1) { const k = rnd.int(10, 40);
        return F(`Збери всі парні числа від 0 до ${k}.`, `even = [x for x in range(0, ${k + 1}) ___ x % 2 == 0]
print(even)`, [["if"]], "Фільтр пишеться в кінці через `if`."); }
      return F("Збери квадрати чисел від 1 до 5.", `squares = [x * x ___ x in range(1, 6)]
print(squares)`, [["for"]], "Після виразу йде `for x in ...`.");
    }),
    V(
      Q("Який генератор замінить усі від'ємні числа на 0, а решту залишить?", ["`[x if x > 0 else 0 for x in nums]`", "`[x for x in nums if x > 0]`", "`[0 for x in nums if x < 0]`", "`[x for x in nums else 0]`"], 0,
        "Якщо треба **замінити** значення, `if ... else` стоїть на початку. Якщо треба **відкинути** елементи, `if` стоїть у кінці."),
      Q("Який генератор залишить лише непарні числа?", ["`[x for x in nums if x % 2 == 1]`", "`[x % 2 for x in nums]`", "`[x if x % 2 for x in nums]`", "`[x for x in nums % 2]`"], 0,
        "Щоб відкинути зайві елементи, `if` пишемо в кінці."),
      Q("Який генератор піднесе кожне число до квадрата?", ["`[x * x for x in nums]`", "`[nums * nums for x in nums]`", "`[x for x * x in nums]`", "`[x in nums for x * x]`"], 0,
        "Спершу вираз, який стане елементом нового списку, потім `for`."),
    ),
    V(
      C({ q: "Напиши функцію `with_vat(prices)`, яка одним генератором додає до кожної ціни 20% і округлює до цілого через `round`.",
        starter: `def with_vat(prices):
    return `,
        tests: [{ call: "with_vat([100, 50])", expect: "[120, 60]" }, { call: "with_vat([9])", expect: "[11]" }],
        hint: "Ціна з 20% — це `p * 1.2`. Отже `[round(p * 1.2) for p in prices]`.",
        solution: `def with_vat(prices):
    return [round(p * 1.2) for p in prices]` }),
      C({ q: "Напиши функцію `initials(names)`, яка генератором повертає перші літери імен великими: `['оля', 'тарас']` → `['О', 'Т']`.",
        starter: `def initials(names):
    return `,
        tests: [{ call: "initials(['оля', 'тарас'])", expect: "['О', 'Т']" }, { call: "initials([])", expect: "[]" }],
        hint: "`[n[0].upper() for n in names]`.",
        solution: `def initials(names):
    return [n[0].upper() for n in names]` }),
      C({ q: "Напиши функцію `halve(nums)`, яка генератором повертає половини чисел, поділивши націло: `[10, 7]` → `[5, 3]`.",
        starter: `def halve(nums):
    return `,
        tests: [{ call: "halve([10, 7])", expect: "[5, 3]" }, { call: "halve([1])", expect: "[0]" }],
        hint: "Ділення націло — `//`.",
        solution: `def halve(nums):
    return [x // 2 for x in nums]` }),
    ),
    V(
      C({ q: "Напиши функцію `capitalize_all(words)`, яка генератором повертає слова з великої літери: `['київ', 'львів']` → `['Київ', 'Львів']`.",
        starter: `def capitalize_all(words):
    return `,
        tests: [{ call: "capitalize_all(['київ', 'львів'])", expect: "['Київ', 'Львів']" }, { call: "capitalize_all(['а'])", expect: "['А']" }],
        hint: "Перша літера великою — `w[0].upper()`, решта слова — `w[1:]`.",
        solution: `def capitalize_all(words):
    return [w[0].upper() + w[1:] for w in words]` }),
      C({ q: "Напиши функцію `only_long(words, n)`, яка генератором повертає лише слова, довші за `n` літер.",
        starter: `def only_long(words, n):
    return `,
        tests: [{ call: "only_long(['кіт', 'собака', 'їж'], 2)", expect: "['кіт', 'собака']" }, { call: "only_long(['а'], 5)", expect: "[]" }],
        hint: "Фільтр у кінці: `if len(w) > n`.",
        solution: `def only_long(words, n):
    return [w for w in words if len(w) > n]` }),
      C({ q: "Напиши функцію `pos_squares(nums)`, яка генератором повертає квадрати лише додатних чисел: `[3, -2, 0, 4]` → `[9, 16]`.",
        starter: `def pos_squares(nums):
    return `,
        tests: [{ call: "pos_squares([3, -2, 0, 4])", expect: "[9, 16]" }, { call: "pos_squares([-1])", expect: "[]" }],
        hint: "Вираз `x * x`, а фільтр `if x > 0`.",
        solution: `def pos_squares(nums):
    return [x * x for x in nums if x > 0]` }),
    ),
  ]
});
// ===================== 9. Вкладені списки =====================
LEVELS.push({
  id: "nested", kind: "learn", title: "Вкладені списки",
  about: "Таблиці зі списків: рядки, стовпці, перебір і морський бій.",
  items: [
    W(V(
      Q("Пригадай: чи можна покласти список усередину іншого списку?", ["Так, елементом списку може бути будь-що", "Ні, буде помилка", "Тільки якщо списки однакової довжини", "Тільки рядки"], 0, "Так. Саме так і будують таблиці."),
      Q("Пригадай: яка довжина списку `[1, [2, 3], 4]`?", ["3", "4", "2", "5"], 0, "Елементів три: 1, список `[2, 3]` і 4. Внутрішній список рахується як один елемент."),
      Q("Пригадай: що поверне `[[1, 2], [3]][0]`?", ["`[1, 2]`", "`1`", "`[3]`", "Помилку"], 0, "Елемент з індексом 0 — це весь перший внутрішній список."),
    )),
    L("Таблиця — це список рядків",
      "Кожен рядок таблиці — окремий список, а вся таблиця — список цих рядків. Щоб дістати елемент, пишемо два індекси: спершу номер рядка, потім номер стовпця.",
      `m = [[1, 2, 3],
     [4, 5, 6]]
print(m[0])      # [1, 2, 3] — перший рядок
print(m[1][2])   # 6 — рядок 1, стовпець 2
print(len(m))    # 2 — кількість рядків`),
    G(() => {
      const m = [rnd.ints(3, 1, 9), rnd.ints(3, 10, 30)], r = rnd.int(0, 1), c = rnd.int(0, 2);
      return Q(`Що поверне \`m[${r}][${c}]\`?`, opts(m[r][c], m[c % 2][r], m[1 - r][c], m[r][(c + 1) % 3]), 0,
        `Рядок з індексом ${r} — це \`${pr(m[r])}\`, а в ньому елемент з індексом ${c} — це ${m[r][c]}.`,
        `m = [${py(m[0])},
     ${py(m[1])}]`);
    }),
    G(() => {
      const t = [rnd.ints(2, 1, 9), rnd.ints(2, 10, 19), rnd.ints(2, 20, 29)], i = rnd.int(0, 2), [a, b, c, d] = [rnd.int(0, 2), rnd.int(0, 1), rnd.int(0, 2), rnd.int(0, 1)];
      return O(`t = ${py(t)}
print(t[${i}])
print(t[${a}][${b}] + t[${c}][${d}])
print(len(t), len(t[-1]))`, null, `\`t[${i}]\` — рядок з індексом ${i}. Далі складаємо \`t[${a}][${b}]\` = ${t[a][b]} і \`t[${c}][${d}]\` = ${t[c][d]}. Рядків 3, у кожному по 2 числа.`);
    }),
    L("Перебір таблиці",
      "Щоб пройти всі елементи, потрібен цикл у циклі: зовнішній іде по рядках, внутрішній — по елементах рядка.",
      `m = [[1, 2], [3, 4]]
for row in m:
    for x in row:
        print(x, end=" ")
    print()
# 1 2
# 3 4`),
    G(() => {
      const f = [rnd.shuffle(["X", "O", "."]).slice(0, 2), rnd.shuffle(["X", "O", "."]).slice(0, 2), rnd.shuffle(["X", "O", "."]).slice(0, 2)];
      return O(`field = ${py(f)}
for row in field:
    print("".join(row))`, null, "Кожен рядок склеюємо в один рядок тексту без роздільника.");
    }),
    G(() => {
      const form = rnd.int(0, 2), m = [rnd.ints(3, 1, 9), rnd.ints(3, 1, 9), rnd.ints(3, 1, 9)];
      if (form === 0) return F("Виведи суму кожного рядка таблиці.", `m = ${py(m.slice(0, 2))}
for row in m:
    print(sum(___))`, [["row"]], "Кожен рядок — звичайний список, тож `sum(row)` дає його суму.");
      if (form === 1) return F("Порахуй суму головної діагоналі (там, де номер рядка дорівнює номеру стовпця).", `m = ${py(m)}
total = 0
for i in range(len(m)):
    total += m[i][___]
print(total)`, [["i"]], "На діагоналі рядок і стовпець однакові: `m[0][0]`, `m[1][1]`, `m[2][2]`.");
      return F("Виведи перший елемент кожного рядка.", `m = ${py(m)}
for row in m:
    print(row[___])`, [["0"]], "Перший елемент рядка має індекс 0.");
    }),
    V(
      C({ q: "Напиши функцію `column(m, j)`, яка повертає стовпець з номером `j` у вигляді списку.",
        starter: `def column(m, j):
    `,
        tests: [{ call: "column([[1, 2], [3, 4], [5, 6]], 1)", expect: "[2, 4, 6]" }, { call: "column([['а', 'б', 'в']], 0)", expect: "['а']" }],
        hint: "Пройди по рядках і з кожного візьми `row[j]`.",
        solution: `def column(m, j):
    result = []
    for row in m:
        result.append(row[j])
    return result` }),
      C({ q: "Напиши функцію `row_sums(m)`, яка повертає список сум кожного рядка таблиці.",
        starter: `def row_sums(m):
    `,
        tests: [{ call: "row_sums([[1, 2], [3, 4]])", expect: "[3, 7]" }, { call: "row_sums([[5, 5, 5]])", expect: "[15]" }],
        hint: "Для кожного рядка `sum(row)`.",
        solution: `def row_sums(m):
    result = []
    for row in m:
        result.append(sum(row))
    return result` }),
      C({ q: "Напиши функцію `find(m, x)`, яка повертає `[рядок, стовпець]` першого входження `x` у таблиці, або `[-1, -1]`, якщо його немає.",
        starter: `def find(m, x):
    `,
        tests: [{ call: "find([[1, 2], [3, 4]], 3)", expect: "[1, 0]" }, { call: "find([['a', 'b']], 'b')", expect: "[0, 1]" }, { call: "find([[1]], 9)", expect: "[-1, -1]" }],
        hint: "Два вкладені цикли за індексами: `for r in range(len(m))` і `for c in range(len(m[r]))`.",
        solution: `def find(m, x):
    for r in range(len(m)):
        for c in range(len(m[r])):
            if m[r][c] == x:
                return [r, c]
    return [-1, -1]` }),
    ),
    V(
      C({ q: "Морський бій. На полі `#` — це корабель, `.` — вода. Постріли — список пар `[рядок, стовпець]`. Напиши функцію `hits(field, shots)`, яка повертає кількість влучань.",
        stars: 3,
        starter: `def hits(field, shots):
    `,
        tests: [
          { call: "hits([['#', '.'], ['.', '#']], [[0, 0], [0, 1], [1, 1]])", expect: "2" },
          { call: "hits([['.', '.', '#']], [[0, 0]])", expect: "0" },
          { call: "hits([['#', '#', '#']], [[0, 2], [0, 0]])", expect: "2" }],
        hint: "Для кожного пострілу `r = shot[0]`, `c = shot[1]`. Влучання — якщо `field[r][c] == \"#\"`.",
        solution: `def hits(field, shots):
    count = 0
    for shot in shots:
        r = shot[0]
        c = shot[1]
        if field[r][c] == "#":
            count += 1
    return count` }),
      C({ q: "Напиши функцію `max_row(m)`, яка повертає індекс рядка з найбільшою сумою (якщо таких кілька — першого).",
        stars: 3,
        starter: `def max_row(m):
    `,
        tests: [{ call: "max_row([[1, 2], [5, 0], [3, 3]])", expect: "2" }, { call: "max_row([[4]])", expect: "0" }, { call: "max_row([[-1, -1], [-5, 0]])", expect: "0" }],
        hint: "Шукай як мінімум/максимум, але порівнюй `sum(m[i])`.",
        solution: `def max_row(m):
    best = 0
    for i in range(len(m)):
        if sum(m[i]) > sum(m[best]):
            best = i
    return best` }),
      C({ q: "Напиши функцію `border_sum(m)`, яка повертає суму чисел по краю квадратної таблиці (перший і останній рядки, перший і останній стовпці, кожне число рахується один раз).",
        stars: 3,
        starter: `def border_sum(m):
    `,
        tests: [{ call: "border_sum([[1, 2, 3], [4, 5, 6], [7, 8, 9]])", expect: "40" }, { call: "border_sum([[1, 1], [1, 1]])", expect: "4" }, { call: "border_sum([[7]])", expect: "7" }],
        hint: "Пройди всі клітинки й додавай ті, де `r == 0`, `r == n - 1`, `c == 0` або `c == n - 1`.",
        solution: `def border_sum(m):
    n = len(m)
    total = 0
    for r in range(n):
        for c in range(n):
            if r == 0 or r == n - 1 or c == 0 or c == n - 1:
                total += m[r][c]
    return total` }),
    ),
  ]
});

// ===================== 10. Копії та пастки =====================
LEVELS.push({
  id: "copy", kind: "learn", title: "Копії та пастки",
  about: "Чому b = a — не копія і як не потрапити в пастку зі змінюваними списками.",
  items: [
    W(G(() => {
      const n = rnd.int(2, 9), k = rnd.int(2, 4);
      return Q(`Пригадай: що виведе \`n = ${n}; m = n; m = m * ${k}; print(n)\`?`, opts(n, n * k, n + k, "Помилку"), 0, "З числами все просто: `m` змінилась, `n` ні. А от зі списками буде цікавіше.");
    })),
    L("b = a — це не копія",
      "Список — змінюваний об'єкт. Коли пишемо `b = a`, нового списку не з'являється: просто в того самого списку тепер два імені. Змінимо через `b` — зміниться і `a`. Щоб отримати окрему копію, пиши `a.copy()`, `a[:]` або `list(a)`.",
      `a = [1, 2, 3]
b = a          # те саме, друге ім'я
b.append(4)
print(a)       # [1, 2, 3, 4]

c = a.copy()   # окрема копія
c.append(5)
print(a)       # [1, 2, 3, 4]`),
    V(
      Q("Який рядок **не** створює окрему копію списку `a`?", ["`b = a`", "`b = a.copy()`", "`b = a[:]`", "`b = list(a)`"], 0, "`b = a` дає списку друге ім'я, а не копію."),
      Q("Після `b = a` і `b.append(1)` що станеться з `a`?", ["У `a` теж з'явиться 1", "`a` не зміниться", "`a` стане порожнім", "Буде помилка"], 0, "`a` і `b` — один і той самий список."),
      Q("Як зробити окрему копію списку `a`?", ["`b = a.copy()`", "`b = a`", "`b == a`", "`b = copy a`"], 0, "`a.copy()`, `a[:]` і `list(a)` створюють новий список."),
    ),
    G(() => {
      const t = theme(2), form = rnd.int(0, 1);
      if (form === 0) return O(`a = ["${t.items[0]}"]
b = a
b[0] = "${t.items[1]}"
print(a)`, null, "`a` і `b` — один і той самий список, тож заміна через `b` видна і в `a`.");
      return O(`a = ["${t.items[0]}"]
b = a
b.append("${t.items[1]}")
print(a, len(a))`, null, "`a` і `b` — один і той самий список, тож новий елемент з'явився і в `a`.");
    }),
    G(() => {
      const a = rnd.ints(2, 1, 9), form = rnd.int(0, 2), v = rnd.int(10, 20);
      const body = [`lst[0] = 0`, `lst.append(${v})`, `lst.pop()`][form];
      return O(`def change(lst):
    ${body}

nums = ${py(a)}
change(nums)
print(nums)`, null, "Функція отримує той самий список, а не копію, тому змінює його.");
    }),
    L("Пастка з множенням",
      "`[0] * 3` дає `[0, 0, 0]` — тут усе добре. Але `[[\".\"] * 3] * 3` створює список з трьох посилань на **один і той самий** рядок. Змінимо один — зміняться всі. Правильне поле 3×3 створюють генератором.",
      `bad = [["."] * 3] * 3            # пастка!
good = [["."] * 3 for _ in range(3)]
good[0][0] = "X"
print(good)
# [['X', '.', '.'], ['.', '.', '.'], ['.', '.', '.']]`),
    G(() => {
      const w = rnd.int(2, 3), h = rnd.int(2, 3), r = rnd.int(0, h - 1), c = rnd.int(0, w - 1), v = rnd.int(1, 9);
      return O(`grid = [[0] * ${w}] * ${h}
grid[${r}][${c}] = ${v}
print(grid)`, null, "Усі рядки — це той самий список, тому значення з'явилося в кожному.");
    }),
    G(() => {
      const [x, y, z, w] = rnd.ints(4, 1, 9), how = rnd.pick(["a[:]", "a.copy()", "list(a)"]);
      return O(`a = [[${x}], [${y}]]
b = ${how}
b[1].append(${z})
b[0] = [${w}]
print(a)
print(b)`, null, "Копія створює лише новий зовнішній список. Внутрішні списки спільні, тому зміна `b[1]` видна і в `a`. А заміна `b[0]` на новий список стосується тільки `b`. Повну копію робить `copy.deepcopy(a)`.");
    }),
    V(
      C({ q: "Напиши функцію `without_first(lst)`, яка повертає новий список без першого елемента. Початковий список має лишитися без змін.",
        starter: `def without_first(lst):
    `,
        tests: [{ call: "without_first([1, 2, 3])", expect: "[2, 3]" }, { call: "(lambda a: (without_first(a), a))([7, 8, 9])", expect: "([8, 9], [7, 8, 9])", label: "Після виклику список не змінився" }],
        hint: "Зріз `lst[1:]` створює новий список і нічого не ламає. А от `pop(0)` змінив би оригінал.",
        solution: `def without_first(lst):
    return lst[1:]` }),
      C({ q: "Напиши функцію `with_added(lst, x)`, яка повертає **новий** список з `x` у кінці. Початковий список має лишитися без змін.",
        starter: `def with_added(lst, x):
    `,
        tests: [{ call: "with_added([1, 2], 3)", expect: "[1, 2, 3]" }, { call: "(lambda a: (with_added(a, 0), a))([5])", expect: "([5, 0], [5])", label: "Після виклику список не змінився" }],
        hint: "Зроби копію через `lst.copy()` і додавай уже в неї. Або просто `lst + [x]`.",
        solution: `def with_added(lst, x):
    new = lst.copy()
    new.append(x)
    return new` }),
      C({ q: "Напиши функцію `reversed_copy(lst)`, яка повертає новий розвернутий список. Початковий список має лишитися без змін.",
        starter: `def reversed_copy(lst):
    `,
        tests: [{ call: "reversed_copy([1, 2, 3])", expect: "[3, 2, 1]" }, { call: "(lambda a: (reversed_copy(a), a))(['а', 'б'])", expect: "(['б', 'а'], ['а', 'б'])", label: "Після виклику список не змінився" }],
        hint: "`lst.reverse()` змінив би оригінал. Зріз `lst[::-1]` — ні.",
        solution: `def reversed_copy(lst):
    return lst[::-1]` }),
    ),
  ]
});

// ===================== 11. Фінал =====================
LEVELS.push({
  id: "boss", kind: "boss", title: "Фінал",
  about: "Задачі на все одразу. Згадаєш усе, що було на попередніх рівнях.",
  items: [
    W(G(() => {
      const a = rnd.ints(4, 1, 9), k = rnd.int(0, 3), rest = a.filter((_, i) => i !== k), r = rest.filter((_, i) => i % 2 === 0);
      return Q("Що виведе програма?", opts(pr(r), pr(rest), pr(rest.filter((_, i) => i % 2 === 1)), "Помилку").map(x => x === "Помилку" ? x : "`" + x + "`"), 0,
        `\`pop(${k})\` видаляє ${a[k]}, а зріз \`[::2]\` бере елементи з парними індексами.`,
        `a = ${py(a)}
a.pop(${k})
print(a[::2])`);
    })),
    W(G(() => {
      const w = rnd.sample(["так", "ні", "сонце", "ліс", "кіт", "Python"], 2), s = w.join(" ");
      return Q(`Що поверне \`[len(w) for w in "${s}".split()]\`?`, opts(pr(w.map(x => x.length)), pr([s.length]), pr([w[0].length]), pr(w)).map(x => "`" + x + "`"), 0, "Розбиваємо на слова і рахуємо довжину кожного.");
    })),
    W(V(
      Q("Яке поле 3×3 правильне?", ["`[[0] * 3 for _ in range(3)]`", "`[[0] * 3] * 3`", "Обидва", "Жодне"], 0, "Другий варіант — пастка: три посилання на один рядок."),
      Q("Що з цього змінює сам список `a`?", ["`a.sort()`", "`sorted(a)`", "`a[::-1]`", "`a + [1]`"], 0, "`sort` працює на місці. Решта повертає новий список."),
      Q("Що поверне `list(zip([1, 2], ['a', 'b']))[1]`?", ["`(2, 'b')`", "`(1, 'a')`", "`[2, 'b']`", "`'b'`"], 0, "`zip` дає пари, а індекс 1 — друга пара."),
    )),
    V(
      C({ q: "Напиши функцію `duplicates(lst)`, яка повертає елементи, що трапляються більше одного разу, кожен по разу, у порядку першої появи: `[1, 2, 1, 3, 2, 1]` → `[1, 2]`.",
        starter: `def duplicates(lst):
    `,
        tests: [{ call: "duplicates([1, 2, 1, 3, 2, 1])", expect: "[1, 2]" }, { call: "duplicates(['а', 'б'])", expect: "[]" }, { call: "duplicates([4, 4, 4])", expect: "[4]" }],
        hint: "Для кожного елемента перевір `lst.count(x) > 1` і що його ще немає в результаті (`not in`).",
        solution: `def duplicates(lst):
    result = []
    for x in lst:
        if lst.count(x) > 1 and x not in result:
            result.append(x)
    return result` }),
      C({ q: "Напиши функцію `singles(lst)`, яка повертає елементи, що трапляються рівно один раз, у порядку появи: `[1, 2, 1, 3]` → `[2, 3]`.",
        starter: `def singles(lst):
    `,
        tests: [{ call: "singles([1, 2, 1, 3])", expect: "[2, 3]" }, { call: "singles(['а', 'а'])", expect: "[]" }, { call: "singles([5])", expect: "[5]" }],
        hint: "Умова: `lst.count(x) == 1`.",
        solution: `def singles(lst):
    result = []
    for x in lst:
        if lst.count(x) == 1:
            result.append(x)
    return result` }),
      C({ q: "Напиши функцію `most_common(lst)`, яка повертає елемент, що трапляється найчастіше (якщо таких кілька — той, що раніше в списку).",
        starter: `def most_common(lst):
    `,
        tests: [{ call: "most_common([3, 1, 3, 2])", expect: "3" }, { call: "most_common(['а', 'б', 'б', 'а'])", expect: "'а'" }, { call: "most_common([7])", expect: "7" }],
        hint: "Порівнюй `lst.count(x)` з `lst.count(best)`.",
        solution: `def most_common(lst):
    best = lst[0]
    for x in lst:
        if lst.count(x) > lst.count(best):
            best = x
    return best` }),
    ),
    V(
      C({ q: "Обмін у грі. Напиши функцію `trade(inv, give, get)`: якщо предмет `give` є в інвентарі, заміни його на `get` на тому самому місці й поверни `True`. Якщо немає — поверни `False` і нічого не змінюй.",
        starter: `def trade(inv, give, get):
    `,
        tests: [{ call: "(lambda inv: (trade(inv, 'меч', 'лук'), inv))(['щит', 'меч', 'зілля'])", expect: "(True, ['щит', 'лук', 'зілля'])", label: "Обмін відбувся" }, { call: "(lambda inv: (trade(inv, 'меч', 'лук'), inv))(['щит'])", expect: "(False, ['щит'])", label: "Предмета немає" }],
        hint: "Перевір `give in inv`, знайди місце через `inv.index(give)` і запиши туди `get`.",
        solution: `def trade(inv, give, get):
    if give in inv:
        inv[inv.index(give)] = get
        return True
    return False` }),
      C({ q: "Напиши функцію `drop(inv, item)`: якщо предмет є в інвентарі, викинь його (одне входження) і поверни `True`. Якщо немає — поверни `False`.",
        starter: `def drop(inv, item):
    `,
        tests: [{ call: "(lambda inv: (drop(inv, 'камінь'), inv))(['камінь', 'меч', 'камінь'])", expect: "(True, ['меч', 'камінь'])", label: "Викинули один камінь" }, { call: "(lambda inv: (drop(inv, 'лук'), inv))(['меч'])", expect: "(False, ['меч'])", label: "Предмета немає" }],
        hint: "`if item in inv:` → `inv.remove(item)`.",
        solution: `def drop(inv, item):
    if item in inv:
        inv.remove(item)
        return True
    return False` }),
      C({ q: "Крафт. Напиши функцію `craft(inv, a, b, result)`: якщо в інвентарі є і `a`, і `b`, прибери їх і додай `result`, поверни `True`. Інакше поверни `False` і нічого не змінюй.",
        starter: `def craft(inv, a, b, result):
    `,
        tests: [{ call: "(lambda inv: (craft(inv, 'палка', 'камінь', 'сокира'), inv))(['палка', 'камінь', 'хліб'])", expect: "(True, ['хліб', 'сокира'])", label: "Скрафтили" }, { call: "(lambda inv: (craft(inv, 'палка', 'камінь', 'сокира'), inv))(['палка'])", expect: "(False, ['палка'])", label: "Не вистачає" }],
        hint: "Спершу перевір обидва `in`, тільки потім видаляй.",
        solution: `def craft(inv, a, b, result):
    if a in inv and b in inv:
        inv.remove(a)
        inv.remove(b)
        inv.append(result)
        return True
    return False` }),
    ),
    V(
      C({ q: "Кубики. Напиши функцію `roll_dice(n)`, яка повертає список з `n` випадкових чисел від 1 до 6. Підключи модуль `random`.",
        starter: `import random

def roll_dice(n):
    `,
        tests: [{ call: "(lambda r: (len(r), min(r) >= 1, max(r) <= 6))(roll_dice(60))", expect: "(60, True, True)", label: "60 кидків, усі від 1 до 6" }, { call: "len(set(roll_dice(200))) == 6", expect: "True", label: "Випадають усі шість граней" }],
        hint: "Порожній список і цикл `for i in range(n)`, у ньому `append(random.randint(1, 6))`.",
        solution: `import random

def roll_dice(n):
    result = []
    for i in range(n):
        result.append(random.randint(1, 6))
    return result` }),
      C({ q: "Монетка. Напиши функцію `flips(n)`, яка повертає список з `n` випадкових значень «орел» або «решка». Використай `random.choice`.",
        starter: `import random

def flips(n):
    `,
        tests: [{ call: "(lambda r: (len(r), all(x in ['орел', 'решка'] for x in r)))(flips(50))", expect: "(50, True)", label: "50 кидків, лише орел або решка" }, { call: "len(set(flips(100))) == 2", expect: "True", label: "Випадає і те, і те" }],
        hint: "`random.choice([\"орел\", \"решка\"])`.",
        solution: `import random

def flips(n):
    result = []
    for i in range(n):
        result.append(random.choice(["орел", "решка"]))
    return result` }),
      C({ q: "Жеребкування. Напиши функцію `pick_team(names, k)`, яка повертає `k` різних випадкових імен зі списку. Підійде `random.shuffle` або `random.sample`.",
        starter: `import random

def pick_team(names, k):
    `,
        tests: [{ call: "(lambda t: (len(t), len(set(t)), all(x in ['А', 'Б', 'В', 'Г', 'Ґ'] for x in t)))(pick_team(['А', 'Б', 'В', 'Г', 'Ґ'], 3))", expect: "(3, 3, True)", label: "3 різні імена зі списку" }, { call: "len(set(tuple(sorted(pick_team(list('абвгдеє'), 2))) for i in range(40))) > 1", expect: "True", label: "Склад щоразу різний" }],
        hint: "`random.sample(names, k)` одразу дає `k` різних елементів.",
        solution: `import random

def pick_team(names, k):
    return random.sample(names, k)` }),
    ),
    V(
      C({ q: "Стиснення. Напиши функцію `compress(lst)`, яка рахує однакові елементи, що стоять поспіль: `['a', 'a', 'b', 'a']` → `[['a', 2], ['b', 1], ['a', 1]]`.",
        stars: 3,
        starter: `def compress(lst):
    `,
        tests: [{ call: "compress(['a', 'a', 'b', 'a'])", expect: "[['a', 2], ['b', 1], ['a', 1]]" }, { call: "compress([1, 1, 1])", expect: "[[1, 3]]" }, { call: "compress([])", expect: "[]" }],
        hint: "Ідеш по списку. Якщо елемент такий самий, як в останній парі результату (`result[-1][0]`), збільшуй лічильник. Інакше додавай нову пару `[x, 1]`.",
        solution: `def compress(lst):
    result = []
    for x in lst:
        if result and result[-1][0] == x:
            result[-1][1] += 1
        else:
            result.append([x, 1])
    return result` }),
      C({ q: "Розпаковка. Напиши функцію `expand(pairs)`, яка робить навпаки до стиснення: `[['a', 2], ['b', 1]]` → `['a', 'a', 'b']`.",
        stars: 3,
        starter: `def expand(pairs):
    `,
        tests: [{ call: "expand([['a', 2], ['b', 1]])", expect: "['a', 'a', 'b']" }, { call: "expand([[0, 3]])", expect: "[0, 0, 0]" }, { call: "expand([])", expect: "[]" }],
        hint: "Для кожної пари `[x, n]` додай `x` рівно `n` разів, наприклад через `extend([x] * n)`.",
        solution: `def expand(pairs):
    result = []
    for p in pairs:
        result.extend([p[0]] * p[1])
    return result` }),
      C({ q: "Шматки. Напиши функцію `chunks(lst, k)`, яка ділить список на шматки по `k` елементів (останній може бути коротшим): `chunks([1, 2, 3, 4, 5], 2)` → `[[1, 2], [3, 4], [5]]`.",
        stars: 3,
        starter: `def chunks(lst, k):
    `,
        tests: [{ call: "chunks([1, 2, 3, 4, 5], 2)", expect: "[[1, 2], [3, 4], [5]]" }, { call: "chunks(['a', 'b', 'c'], 3)", expect: "[['a', 'b', 'c']]" }, { call: "chunks([], 2)", expect: "[]" }],
        hint: "Цикл `for i in range(0, len(lst), k)` і зріз `lst[i:i + k]`.",
        solution: `def chunks(lst, k):
    result = []
    for i in range(0, len(lst), k):
        result.append(lst[i:i + k])
    return result` }),
    ),
  ]
});

