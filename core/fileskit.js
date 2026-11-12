// ---- Спільне для ігор про файли («Файли і папки», «Тренажери»): розширення, кошики для сортування, файлова система Провідника ----
const G = (gen) => ({ gen });
const rnd = { int: (a, b) => a + Math.floor(Math.random() * (b - a + 1)), pick: arr => arr[Math.floor(Math.random() * arr.length)] };
const shuf = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
// типи файлів: розширення → що це і чим відкрити
const EXT = [
  { e: "docx", what: "текстовий документ Word", app: "Microsoft Word", kind: "документ" },
  { e: "txt", what: "простий текстовий файл", app: "Блокнот", kind: "документ" },
  { e: "pptx", what: "презентація", app: "PowerPoint", kind: "презентація" },
  { e: "xlsx", what: "електронна таблиця", app: "Excel", kind: "таблиця" },
  { e: "pdf", what: "документ PDF", app: "переглядач PDF або браузер", kind: "документ" },
  { e: "jpg", what: "фотографія", app: "переглядач фотографій", kind: "картинка" },
  { e: "png", what: "картинка", app: "переглядач фотографій", kind: "картинка" },
  { e: "mp3", what: "музика (звук)", app: "аудіопрогравач", kind: "звук" },
  { e: "mp4", what: "відео", app: "відеопрогравач", kind: "відео" },
  { e: "exe", what: "програма, яку можна запустити", app: "запускається сама", kind: "програма" },
  { e: "zip", what: "архів (стиснуті файли)", app: "архіватор або Провідник", kind: "архів" },
];
const byKind = { документ: ["вірш", "реферат", "домашка", "розклад"], презентація: ["мій_проєкт", "космос", "домашка"], таблиця: ["розклад", "оцінки", "витрати"],
  картинка: ["котик", "фото_з_моря", "малюнок"], звук: ["пісня", "гімн", "дзвоник"], відео: ["мультик", "відео_з_уроку", "танець"], програма: ["гра", "setup", "paint"], архів: ["фото_з_моря", "проєкт", "уроки"] };
const fileOf = x => rnd.pick(byKind[x.kind]) + "." + x.e;
const BINS = {
  img: { id: "img", label: "Картинки", ext: ["jpg", "png"] },
  snd: { id: "snd", label: "Музика і звук", ext: ["mp3"] },
  vid: { id: "vid", label: "Відео", ext: ["mp4"] },
  doc: { id: "doc", label: "Текстові документи", ext: ["docx", "txt", "pdf"] },
  ppt: { id: "ppt", label: "Презентації", ext: ["pptx"] },
  xls: { id: "xls", label: "Таблиці", ext: ["xlsx"] },
  exe: { id: "exe", label: "Програми", ext: ["exe"] },
  zip: { id: "zip", label: "Архіви", ext: ["zip"] },
};
const KIND2BIN = { документ: "doc", презентація: "ppt", таблиця: "xls", картинка: "img", звук: "snd", відео: "vid", програма: "exe", архів: "zip" };
const S = (q, binIds, per, why) => G(() => {
  const bins = binIds.map(b => BINS[b]);
  const files = [], used = new Set();
  bins.forEach(b => {
    for (let k = 0; k < per; k++) {
      const e = b.ext[k % b.ext.length];
      const x = EXT.find(y => y.e === e);
      let n, guard = 0;
      do { n = rnd.pick(byKind[x.kind]) + "." + e; } while (used.has(n) && guard++ < 20);
      used.add(n); files.push({ name: n, bin: b.id });
    }
  });
  return { t: "sort", q, bins: shuf(bins).map(b => ({ id: b.id, label: b.label })), files: shuf(files), why };
});
// ===================== Провідник (імітація) =====================
const FS = () => [
  { n: "C:", k: "disk", c: [{ n: "Windows", k: "dir", c: [{ n: "System32", k: "dir", c: [] }] }, { n: "Program Files", k: "dir", c: [{ n: "Paint", k: "dir", c: [{ n: "paint.exe", k: "file" }] }] }] },
  { n: "D:", k: "disk", c: [
    { n: "Школа", k: "dir", c: [
      { n: "5 клас", k: "dir", c: [
        { n: "Математика", k: "dir", c: [{ n: "задачі.docx", k: "file" }] },
        { n: "Українська мова", k: "dir", c: [{ n: "вірш.docx", k: "file" }, { n: "диктант.pdf", k: "file" }] },
      ] },
      { n: "домашка.docx", k: "file" },
      { n: "новий документ.txt", k: "file" },
    ] },
    { n: "Фото", k: "dir", c: [{ n: "котик.jpg", k: "file" }, { n: "море.png", k: "file" }, { n: "пісня.mp3", k: "file" }, { n: "танець.mp4", k: "file" }, { n: "ліс.jpg", k: "file" }] },
  ] },
];
const X = (q, goal, why, extra) => Object.assign({ t: "explorer", q, fs: FS(), start: ["D:"], goal, why }, extra || {});
const lc = s => String(s).toLowerCase();
