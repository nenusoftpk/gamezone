const m = 60000, t = Date.now();
export const ago = (min) => t - min * m;
export const EMP = [
  { id: 1, name: "Hina Qureshi", role: "Cashier", shift: "Morning 10am–6pm", limit: 500, on: true },
  { id: 2, name: "Zain Abbas", role: "Cashier", shift: "Evening 6pm–2am", limit: 500, on: true },
  { id: 3, name: "Maryam Iqbal", role: "Cashier", shift: "Weekend", limit: 300, on: false },
];
export const REF0 = [
  { id: 1, who: "Bilal Ahmed", by: "Zain Abbas", amt: 800, why: "Package unused, customer left early", st: "pending", t: ago(25) },
  { id: 2, who: "Hamza Khan", by: "Hina Qureshi", amt: 250, why: "Console froze during session", st: "pending", t: ago(70) },
  { id: 3, who: "Sara Malik", by: "Hina Qureshi", amt: 150, why: "Wrong game started", st: "approved", t: ago(600) },
  { id: 4, who: "Walk-in", by: "Zain Abbas", amt: 2000, why: "Duplicate top-up", st: "rejected", t: ago(900) },
];
export const AUDIT = [
  ["Top-up", "Hina Qureshi", "Added Rs 1,000 to Ali Raza (Cash)", ago(20)],
  ["Session start", "Hina Qureshi", "PS5-01 · EA FC 26 · Ali Raza", ago(38)],
  ["Refund request", "Zain Abbas", "Rs 800 for Bilal Ahmed", ago(25)],
  ["Rate change", "Ahmed Sheikh", "Peak plan Rs 330 → Rs 360 per hour", ago(240)],
  ["Adjustment", "Ahmed Sheikh", "Wallet −Rs 100 for Usman Tariq. Reason: wrong entry", ago(300)],
  ["Login", "Zain Abbas", "Signed in from counter PC", ago(360)],
  ["Void", "Ahmed Sheikh", "Session S104 voided. Reason: test run", ago(500)],
];
export const GAMES_LIB = [
  { t: "EA FC 26", g: "Sports", r: "E", p: "1–4", n: 6 }, { t: "Tekken 8", g: "Fighting", r: "T", p: "1–2", n: 4 },
  { t: "Spider-Man 2", g: "Action", r: "T", p: "1", n: 3 }, { t: "God of War Ragnarök", g: "Action", r: "M", p: "1", n: 3 },
  { t: "UFC 5", g: "Fighting", r: "T", p: "1–2", n: 3 }, { t: "Gran Turismo 7", g: "Racing", r: "E", p: "1–2", n: 4 },
  { t: "It Takes Two", g: "Co-op", r: "T", p: "2", n: 2 }, { t: "Call of Duty", g: "Shooter", r: "M", p: "1–4", n: 4 },
];
export const EQUIP0 = [
  { n: "PS5 Slim console", c: "Console", total: 4, use: 2, repair: 0 }, { n: "PS5 Pro console", c: "Console", total: 4, use: 1, repair: 1 },
  { n: "DualSense controller", c: "Controller", total: 22, use: 7, repair: 2 }, { n: "Gaming TV 55\"", c: "Display", total: 8, use: 3, repair: 0 },
  { n: "Pulse 3D headset", c: "Audio", total: 10, use: 2, repair: 1 }, { n: "HDMI cable", c: "Cable", total: 14, use: 8, repair: 0 },
];
export const STOCK0 = [
  { n: "Cold drink 345ml", q: 36, min: 20, price: 100 }, { n: "Water bottle", q: 48, min: 24, price: 60 },
  { n: "Chips (medium)", q: 9, min: 15, price: 120 }, { n: "Energy drink", q: 18, min: 12, price: 250 }, { n: "Chocolate bar", q: 5, min: 10, price: 90 },
];
export const PKG0 = [
  { n: "Quick Match", min: 30, price: 140, days: 1, on: true }, { n: "1 Hour Pass", min: 60, price: 270, days: 7, on: true },
  { n: "2 Hour Pass", min: 120, price: 520, days: 14, on: true }, { n: "Night Owl 4h", min: 240, price: 900, days: 30, on: false },
];
export const SUBS = [
  { b: "Gaming Zone Lahore", plan: "Pro", amt: 15000, d: "12 Dec 2026", m: "Bank transfer", st: "Paid" },
  { b: "PlayHub Karachi", plan: "Basic", amt: 8000, d: "03 Nov 2026", m: "Easypaisa", st: "Paid" },
  { b: "Joystick Arena", plan: "Basic", amt: 8000, d: "—", m: "—", st: "Trial" },
  { b: "Level Up Islamabad", plan: "Pro", amt: 15000, d: "—", m: "—", st: "Overdue" },
];
