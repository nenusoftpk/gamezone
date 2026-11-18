"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AUDIT, EMP, EQUIP0, GAMES_LIB, REF0, STOCK0 } from "@/lib/data";
import { getDemoVideoSource, isSecureWebUrl } from "@/lib/resources";

export const RATES = { Standard: 300, Peak: 360, "VIP room": 450 }; // Rs per hour
export const GAMES = ["EA FC 26", "Tekken 8", "Spider-Man 2", "God of War Ragnarök", "UFC 5", "Gran Turismo 7", "It Takes Two", "Call of Duty"];
export const MIN = 60000, DAY = 86400000;
export const money = (n) => "Rs " + Math.round(n).toLocaleString("en-PK");
export const stationRates = (station) => {
  const perHour = station.ratePerHour ?? RATES[station.plan] ?? 0;
  return {
    perMinute: station.ratePerMinute ?? perHour / 60,
    per30Minutes: station.ratePer30Minutes ?? perHour / 2,
    perHour,
  };
};
const STAFF_ROLES = ["admin", "employee"];
export const clock = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((v) => String(v).padStart(2, "0")).join(":");
};
export const elapsed = (a, now) => (a.pausedAt || now) - a.t0 - a.pausedMs;
export const cost = (a, now) => {
  const duration = elapsed(a, now);
  if (duration <= 0) return 0;
  const perMinute = a.ratePerMinute ?? a.rate / 60;
  const per30Minutes = a.ratePer30Minutes ?? a.rate / 2;
  const perHour = a.ratePerHour ?? a.rate;
  if (a.rateUnit === "half_hour") return Math.ceil(duration / (35 * MIN)) * per30Minutes;
  if (a.rateUnit === "hour") {
    const firstHourWithGrace = 70 * MIN;
    return duration <= firstHourWithGrace
      ? perHour
      : perHour + Math.ceil((duration - firstHourWithGrace) / (35 * MIN)) * per30Minutes;
  }
  return (duration / MIN) * perMinute;
};
export const timeStr = (t) => new Date(t).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" });
export const dateStr = (t) => new Date(t).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
export const HOME = { employee: "/board", admin: "/dashboard", superadmin: "/platform" };

const seed = () => {
  const t = Date.now();
  const mk = (id, name, room, model, plan, active = null, status = "ok") => ({ id, name, room, model, plan, active, status });
  const act = (customerId, game, players, rate, mins, paused = 0) => ({
    customerId, game, players, rate, by: "Hina Qureshi", t0: t - mins * MIN, pausedMs: paused ? 6 * MIN : 0, pausedAt: paused ? t - paused * MIN : 0,
  });
  const hist = [[0, "EA FC 26", "PS5-04", 45, 225, 40], [2, "Spider-Man 2", "PS5-07", 90, 675, 95], [1, "UFC 5", "PS5-02", 30, 150, 150], [4, "Tekken 8", "PS5-05", 60, 300, 210], [3, "God of War Ragnarök", "PS5-03", 75, 375, 260], [2, "Gran Turismo 7", "PS5-08", 120, 900, 330]]
    .map(([c, g, s, d, amt, agoM], i) => ({ id: "S" + (100 + i), customerId: c, game: g, station: s, minutes: d, amount: amt, by: i % 2 ? "Zain Abbas" : "Hina Qureshi", t: t - agoM * MIN }));
  const tp = (n, agoM, c, amount, method, by = "Hina Qureshi") => ({ id: "L" + n, no: "R-100" + n, t: t - agoM * MIN, customerId: c, type: "topup", amount, method, ref: "", by });
  const ids = { "Bilal Ahmed": 3, "Hamza Khan": 1, "Sara Malik": 2 };
  return {
    user: null,
    customers: [
      { id: 0, name: "Ali Raza", phone: "0300-1234567", balance: 1200 },
      { id: 1, name: "Hamza Khan", phone: "0321-7654321", balance: 240 },
      { id: 2, name: "Sara Malik", phone: "0333-4455667", balance: 2500 },
      { id: 3, name: "Bilal Ahmed", phone: "0345-9988776", balance: 80 },
      { id: 4, name: "Usman Tariq", phone: "0312-5550199", balance: 600 },
    ],
    stations: [
      mk(1, "PS5-01", "Main hall", "PS5 Slim", "Standard", act(0, "EA FC 26", 2, 300, 38)),
      mk(2, "PS5-02", "Main hall", "PS5 Slim", "Standard"),
      mk(3, "PS5-03", "Main hall", "PS5 Slim", "Standard", act(1, "Tekken 8", 2, 300, 17)),
      mk(4, "PS5-04", "Main hall", "PS5 Slim", "Standard"),
      mk(5, "PS5-05", "Lounge", "PS5 Pro", "Peak"),
      mk(6, "PS5-06", "Lounge", "PS5 Pro", "Peak", act(2, "God of War Ragnarök", 1, 360, 52, 2)),
      mk(7, "PS5-07", "VIP room", "PS5 Pro", "VIP room"),
      mk(8, "PS5-08", "VIP room", "PS5 Pro", "VIP room", null, "maintenance"),
    ],
    sessions: hist,
    ledger: [tp(1, 20, 0, 1000, "Cash"), tp(2, 95, 2, 2000, "Easypaisa"), tp(3, 210, 4, 1000, "JazzCash"), tp(4, 300, 3, 500, "Cash", "Zain Abbas")],
    equipment: EQUIP0.map((item) => ({ ...item })),
    gamesLibrary: GAMES_LIB.map((game) => ({ ...game })),
    cafeStock: STOCK0.map((item) => ({ ...item })),
    cafeOrders: [],
    refunds: REF0.map((r) => ({ id: r.id, customerId: ids[r.who] ?? null, amt: r.amt, why: r.why, by: r.by, st: r.st, t: r.t })),
    shifts: [{ id: 1, by: "Zain Abbas", t: t - 14 * 3600000, expected: 5400, counted: 5400 }, { id: 2, by: "Hina Qureshi", t: t - 26 * 3600000, expected: 4200, counted: 4150 }],
    audit: AUDIT.map(([a, u, d, at]) => [a, u, d, at]),
    plans: { Basic: { price: 8000, stations: 8, employees: 5 }, Pro: { price: 15000, stations: 30, employees: 20 } },
    tenants: [
      { id: 1, name: "Gaming Zone Lahore", owner: "Ahmed Sheikh", plan: "Pro", status: "Active", renewsAt: t + 60 * DAY, on: true },
      { id: 2, name: "PlayHub Karachi", owner: "Raheel Khan", plan: "Basic", status: "Active", renewsAt: t + 20 * DAY, on: true },
      { id: 3, name: "Joystick Arena", owner: "Fahad Mir", plan: "Basic", status: "Trial", renewsAt: t + 4 * DAY, on: true },
      { id: 4, name: "Level Up Islamabad", owner: "Saad Butt", plan: "Pro", status: "Suspended", renewsAt: t - 9 * DAY, on: false },
    ],
    payments: [
      { id: 1, tenantId: 1, amt: 15000, t: t - 3 * DAY, method: "Bank transfer", ref: "TRX-88231" },
      { id: 2, tenantId: 2, amt: 8000, t: t - 10 * DAY, method: "Easypaisa", ref: "EP-120045" },
    ],
    resources: { mobileUrl: "", desktopUrl: "", videos: [] },
    platformAudit: [["Branch suspended", "Platform Team", "Level Up Islamabad: payment overdue 9 days", t - 9 * DAY], ["Payment recorded", "Platform Team", "PlayHub Karachi · Rs 8,000", t - 10 * DAY]],
  };
};

const initialAccounts = (tenants) => [
  { id: "superadmin", username: "super", password: "super123", role: "superadmin", name: "Platform Team", active: true },
  ...tenants.map((tenant, i) => ({
    id: `branch-admin-${tenant.id}`,
    username: ["admin", "playhub", "joystick", "levelup"][i] || `admin${tenant.id}`,
    password: "admin123",
    role: "admin",
    name: tenant.owner,
    tenantId: tenant.id,
    active: true,
  })),
  ...EMP.map((employee, i) => ({
    id: `employee-${employee.id}`,
    username: ["hina", "zain", "maryam"][i] || `employee${employee.id}`,
    password: ["hina123", "zain1234", "maryam123"][i] || "employee123",
    role: "employee",
    name: employee.name,
    tenantId: tenants[0]?.id,
    employeeId: employee.id,
    active: employee.on,
  })),
];

const hydrate = (stored) => {
  const d = stored || seed();
  if (!d.resources) d.resources = { mobileUrl: "", desktopUrl: "", videos: [] };
  if (!Array.isArray(d.resources.videos)) d.resources.videos = [];
  if (typeof d.resources.mobileUrl !== "string") d.resources.mobileUrl = "";
  if (typeof d.resources.desktopUrl !== "string") d.resources.desktopUrl = "";
  if (!d.expenses) d.expenses = [];
  if (!d.customerCredits) d.customerCredits = [];
  if (!d.equipment) d.equipment = EQUIP0.map((item) => ({ ...item }));
  if (!d.gamesLibrary) d.gamesLibrary = GAMES_LIB.map((game) => ({ ...game }));
  if (!d.cafeStock) d.cafeStock = STOCK0.map((item) => ({ ...item }));
  if (!d.cafeOrders) d.cafeOrders = [];
  d.sessions.forEach((session) => {
    if (session.paid === undefined) session.paid = session.amount;
    if (session.due === undefined) session.due = 0;
    if (!session.payments) session.payments = [];
    if (!session.billingMode) session.billingMode = "wallet";
    if (!session.rateUnit) session.rateUnit = "minute";
  });
  d.stations.forEach((station) => {
    const rates = stationRates(station);
    if (station.ratePerMinute === undefined) station.ratePerMinute = rates.perMinute;
    if (station.ratePer30Minutes === undefined) station.ratePer30Minutes = rates.per30Minutes;
    if (station.ratePerHour === undefined) station.ratePerHour = rates.perHour;
    if (station.active) {
      if (!station.active.billingMode) station.active.billingMode = "wallet";
      if (station.active.ratePerMinute === undefined) station.active.ratePerMinute = rates.perMinute;
      if (station.active.ratePer30Minutes === undefined) station.active.ratePer30Minutes = rates.per30Minutes;
      if (station.active.ratePerHour === undefined) station.active.ratePerHour = station.active.rate ?? rates.perHour;
      if (!station.active.rateUnit) station.active.rateUnit = "minute";
    }
  });
  if (!d.accounts) d.accounts = initialAccounts(d.tenants || []);
  if (!d.employees) d.employees = EMP.map((employee) => ({ ...employee, tenantId: d.tenants?.[0]?.id }));
  if (d.user && !d.user.id) {
    const account = d.accounts.find((x) => x.role === d.user.role && (x.role !== "admin" || x.tenantId === d.tenants?.[0]?.id));
    if (account) d.user = { id: account.id, role: account.role, name: account.name, tenantId: account.tenantId };
  }
  return d;
};

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);
export function useNow() {
  const [n, setN] = useState(() => Date.now());
  useEffect(() => { const i = setInterval(() => setN(Date.now()), 1000); return () => clearInterval(i); }, []);
  return n;
}

export function StoreProvider({ children }) {
  const [db, setDb] = useState(null);
  const [toast, setToast] = useState("");
  useEffect(() => {
    try { setDb(hydrate(JSON.parse(localStorage.getItem("gz-demo-v2")))); } catch { setDb(hydrate(null)); }
  }, []);
  useEffect(() => { if (db) localStorage.setItem("gz-demo-v2", JSON.stringify(db)); }, [db]);
  const say = useCallback((m) => { setToast(m); setTimeout(() => setToast(""), 2400); }, []);
  const up = (fn) => setDb((d) => fn(structuredClone(d)));
  const who = (d) => d.user?.name || "—";
  const log = (d, a, x) => d.audit.unshift([a, who(d), x, Date.now()]);
  const plog = (d, a, x) => d.platformAudit.unshift([a, who(d), x, Date.now()]);
  const cust = (d, id) => d.customers.find((c) => c.id === id);
  const nextNo = () => "R-" + (1001 + (db?.ledger.length || 0));
  const authenticate = (username, password) => {
    const account = db?.accounts.find((x) => x.username.toLowerCase() === username.trim().toLowerCase() && x.password === password && x.active);
    if (!account) return null;
    if (account.role === "admin" && !db.tenants.find((x) => x.id === account.tenantId && x.on)) return null;
    if (account.role === "employee" && !db.employees.find((x) => x.id === account.employeeId && x.on)) return null;
    return account;
  };
  const changeOwnPassword = (current, next) => {
    const account = db?.accounts.find((x) => x.id === db.user?.id);
    if (!account || account.password !== current) return "Current password is incorrect.";
    up((d) => {
      d.accounts.find((x) => x.id === account.id).password = next;
      if (account.role === "superadmin") plog(d, "Password changed", "Platform account");
      else log(d, "Password changed", "Own account");
      return d;
    });
    return null;
  };
  const setAccountPassword = (accountId, next) => {
    const actor = db?.user, target = db?.accounts.find((x) => x.id === accountId);
    const allowed = actor?.role === "superadmin"
      ? target?.role === "admin"
      : actor?.role === "admin" && target?.role === "employee" && target.tenantId === actor.tenantId;
    if (!allowed) return "You do not have permission to change this password.";
    up((d) => {
      d.accounts.find((x) => x.id === accountId).password = next;
      if (target.role === "admin") plog(d, "Branch admin password changed", target.name);
      else log(d, "Employee password reset", target.name);
      return d;
    });
    return null;
  };

  const api = {
    db, say, nextNo, authenticate, changeOwnPassword, setAccountPassword,
    login: (account) => up((d) => { d.user = { id: account.id, role: account.role, name: account.name, tenantId: account.tenantId }; return d; }),
    logout: () => up((d) => { d.user = null; return d; }),
    topUp: (customerId, amount, method, ref, no) => up((d) => {
      cust(d, customerId).balance += amount;
      d.ledger.unshift({ id: "L" + Date.now(), no, t: Date.now(), customerId, type: "topup", amount, method, ref, by: who(d) });
      log(d, "Top-up", `Added Rs ${amount.toLocaleString()} to ${cust(d, customerId).name} (${method})`); return d;
    }),
    sellPackage: (customerId, pkg, method, no) => up((d) => {
      const credit = Math.round((pkg.min / 60) * RATES.Standard);
      cust(d, customerId).balance += credit;
      d.ledger.unshift({ id: "L" + Date.now(), no, t: Date.now(), customerId, type: "package", amount: credit, paid: pkg.price, method, ref: pkg.n, by: who(d) });
      log(d, "Package sale", `${pkg.n} sold to ${cust(d, customerId).name} for Rs ${pkg.price}`); return d;
    }),
    addCustomer: (name, phone) => up((d) => { d.customers.push({ id: Date.now(), name, phone: phone || "—", balance: 0 }); log(d, "New customer", name); return d; }),
    addExpense: (category, description, amount) => {
      if (!STAFF_ROLES.includes(db?.user?.role) || !description.trim() || !Number.isFinite(amount) || amount <= 0) return false;
      up((d) => {
        const expense = { id: Date.now(), category, description, amount, t: Date.now(), by: who(d) };
        d.expenses.unshift(expense);
        log(d, "Expense recorded", `${category} · Rs ${amount} · ${description}`);
        return d;
      });
      return true;
    },
    addCustomerCredit: (customerId, description, amount) => {
      if (!STAFF_ROLES.includes(db?.user?.role) || !db.customers.some((c) => c.id === customerId) || !description.trim() || !Number.isFinite(amount) || amount <= 0) return false;
      up((d) => {
        const credit = { id: Date.now(), customerId, description, amount, paid: 0, t: Date.now(), by: who(d), payments: [] };
        d.customerCredits.unshift(credit);
        log(d, "Customer credit recorded", `${cust(d, customerId).name} · Rs ${amount} · ${description}`);
        return d;
      });
      return true;
    },
    repayCustomerCredit: (id, amount, method, ref = "") => {
      const credit = db?.customerCredits.find((x) => x.id === id);
      const reference = typeof ref === "string" ? ref.trim() : "";
      if (!STAFF_ROLES.includes(db?.user?.role) || !credit || !Number.isFinite(amount) || amount <= 0 || amount > credit.amount - credit.paid
        || !["Cash", "Easypaisa", "JazzCash", "Bank transfer"].includes(method)
        || (method !== "Cash" && !reference)) return false;
      up((d) => {
        const entry = d.customerCredits.find((x) => x.id === id);
        const now = Date.now(), customer = cust(d, entry.customerId);
        entry.paid += amount;
        entry.payments.push({ amount, method, ref: reference, t: now, by: who(d) });
        d.ledger.unshift({ id: "L" + now, no: "", t: now, customerId: entry.customerId, type: "credit_payment", amount, method, ref: reference, creditId: id, by: who(d) });
        if (entry.sourceSessionId) {
          const session = d.sessions.find((item) => item.id === entry.sourceSessionId);
          if (session) {
            session.paid += amount;
            session.due = Math.max(0, session.due - amount);
            session.payments.push({ amount, method, ref: reference, t: now, by: who(d) });
          }
        }
        log(d, "Customer credit repayment", `${customer.name} · Rs ${amount} (${method})`);
        return d;
      });
      return true;
    },
    addEquipment: (name, category, total) => {
      if (db?.user?.role !== "admin" || !name.trim() || !category.trim() || !Number.isInteger(total) || total < 1 || db.equipment.some((item) => item.n.toLowerCase() === name.trim().toLowerCase())) return false;
      up((d) => {
        d.equipment.push({ n: name.trim(), c: category.trim(), total, use: 0, repair: 0 });
        log(d, "Equipment added", `${name.trim()} · ${total}`);
        return d;
      });
      return true;
    },
    adjustEquipmentRepair: (name, delta) => {
      const item = db?.equipment.find((entry) => entry.n === name);
      if (db?.user?.role !== "admin" || !item || ![-1, 1].includes(delta) || item.repair + delta < 0 || item.use + item.repair + delta > item.total) return false;
      up((d) => {
        const equipment = d.equipment.find((entry) => entry.n === name);
        equipment.repair += delta;
        log(d, "Equipment repair count changed", `${name} · ${equipment.repair} in repair`);
        return d;
      });
      return true;
    },
    addGame: (title, genre, rating, players, consoles) => {
      if (db?.user?.role !== "admin" || !title.trim() || !genre.trim() || !rating.trim() || !players.trim() || !Number.isInteger(consoles) || consoles < 1 || db.gamesLibrary.some((game) => game.t.toLowerCase() === title.trim().toLowerCase())) return false;
      up((d) => {
        d.gamesLibrary.push({ t: title.trim(), g: genre.trim(), r: rating.trim(), p: players.trim(), n: consoles });
        log(d, "Game added to library", `${title.trim()} · ${consoles} consoles`);
        return d;
      });
      return true;
    },
    addCafeStock: (name, quantity, min, price) => {
      if (db?.user?.role !== "admin" || !name.trim() || !Number.isInteger(quantity) || quantity < 0 || !Number.isInteger(min) || min < 0 || !Number.isFinite(price) || price <= 0 || db.cafeStock.some((item) => item.n.toLowerCase() === name.trim().toLowerCase())) return false;
      up((d) => {
        d.cafeStock.push({ n: name.trim(), q: quantity, min, price });
        log(d, "Cafe stock item added", `${name.trim()} · ${quantity} in stock`);
        return d;
      });
      return true;
    },
    adjustCafeStock: (name, delta) => {
      const item = db?.cafeStock.find((entry) => entry.n === name);
      if (db?.user?.role !== "admin" || !item || !Number.isInteger(delta) || delta === 0 || item.q + delta < 0) return false;
      up((d) => {
        const stock = d.cafeStock.find((entry) => entry.n === name);
        stock.q += delta;
        log(d, "Cafe stock adjusted", `${name} · ${delta > 0 ? "+" : ""}${delta} · ${stock.q} in stock`);
        return d;
      });
      return true;
    },
    placeCafeOrder: (items, customerId, method, ref) => {
      if (!STAFF_ROLES.includes(db?.user?.role) || !Array.isArray(items) || !items.length
        || (customerId !== null && !db.customers.some((customer) => customer.id === customerId))
        || !["Cash", "Easypaisa", "JazzCash", "Bank transfer"].includes(method)
        || (method !== "Cash" && !ref?.trim())) return false;
      const names = new Set();
      const orderItems = items.map((item) => {
        if (!item || typeof item.name !== "string") return null;
        const { name, quantity } = item;
        const stock = db.cafeStock.find((item) => item.n === name);
        if (!stock || !Number.isInteger(quantity) || quantity <= 0 || quantity > stock.q || names.has(name)) return null;
        names.add(name);
        return { name: stock.n, quantity, price: stock.price };
      });
      if (orderItems.some((item) => !item)) return false;
      const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      up((d) => {
        if (orderItems.some((item) => {
          const stock = d.cafeStock.find((entry) => entry.n === item.name);
          return !stock || stock.q < item.quantity;
        })) return d;
        const now = Date.now(), id = "C" + now, reference = ref?.trim() || "";
        orderItems.forEach((item) => {
          d.cafeStock.find((stock) => stock.n === item.name).q -= item.quantity;
        });
        d.cafeOrders.unshift({ id, customerId, items: orderItems, total, method, ref: reference, by: who(d), t: now });
        d.ledger.unshift({ id: "L" + now, no: "", t: now, customerId, type: "cafe_order", amount: total, method, ref: reference, orderId: id, by: who(d) });
        log(d, "Cafe order", `${customerId === null ? "Walk-in" : cust(d, customerId).name} · Rs ${total} (${method})`);
        return d;
      });
      return true;
    },
    start: (stationId, customerId, game, players, billingMode = "wallet", rateUnit = "minute") => up((d) => {
      const s = d.stations.find((x) => x.id === stationId);
      if (!s) return d;
      const customer = cust(d, customerId), rates = stationRates(s);
      if (s.active || s.status !== "ok" || !customer || !["wallet", "checkout"].includes(billingMode)
        || !["minute", "half_hour", "hour"].includes(rateUnit)) return d;
      s.active = { customerId, game, players, billingMode, rateUnit, by: who(d), rate: rates.perHour, ratePerMinute: rates.perMinute, ratePer30Minutes: rates.per30Minutes, ratePerHour: rates.perHour, t0: Date.now(), pausedMs: 0, pausedAt: 0 };
      log(d, "Session start", `${s.name} · ${game} · ${cust(d, customerId).name}`); return d;
    }),
    pause: (stationId) => up((d) => {
      const a = d.stations.find((x) => x.id === stationId).active;
      if (a.pausedAt) { a.pausedMs += Date.now() - a.pausedAt; a.pausedAt = 0; } else a.pausedAt = Date.now();
      return d;
    }),
    move: (fromId, toId) => up((d) => {
      const a = d.stations.find((x) => x.id === fromId), b = d.stations.find((x) => x.id === toId);
      if (!a.active || b.active || b.status !== "ok") return d;
      b.active = a.active; a.active = null; log(d, "Station switch", `${a.name} → ${b.name}`); return d;
    }),
    end: (stationId) => up((d) => {
      const s = d.stations.find((x) => x.id === stationId), a = s.active, now = Date.now();
      const amount = Math.round(cost(a, now)), c = cust(d, a.customerId);
      const walletPaid = Math.min(c.balance, amount), due = amount - walletPaid;
      c.balance -= walletPaid;
      d.sessions.unshift({ id: "S" + now, customerId: a.customerId, game: a.game, players: a.players, rateUnit: a.rateUnit || "minute", station: s.name, minutes: Math.round(elapsed(a, now) / MIN), amount, paid: walletPaid, due, payments: [], billingMode: a.billingMode || "wallet", by: a.by || who(d), t: now });
      if (walletPaid > 0) d.ledger.unshift({ id: "L" + now, no: "", t: now, customerId: a.customerId, type: "debit", amount: -walletPaid, method: s.name, ref: "", by: who(d) });
      log(d, "Session end", `${s.name} · ${c.name} · Rs ${amount}${due ? ` · Rs ${due} due at checkout` : ""}`); s.active = null; return d;
    }),
    checkoutSession: (id, method, ref, deferToCredit = false) => {
      const session = db?.sessions.find((entry) => entry.id === id);
      const customer = session && db.customers.find((entry) => entry.id === session.customerId);
      const walletApplied = customer ? Math.min(customer.balance, session.due) : 0;
      const toCollect = session ? session.due - walletApplied : 0;
      if (!STAFF_ROLES.includes(db?.user?.role) || !session || session.creditId || session.due <= 0 || !customer
        || (deferToCredit && toCollect <= 0)
        || (!deferToCredit && toCollect > 0 && (!["Cash", "Easypaisa", "JazzCash", "Bank transfer"].includes(method) || (method !== "Cash" && !ref?.trim())))) return false;
      up((d) => {
        const bill = d.sessions.find((entry) => entry.id === id);
        if (!bill || bill.creditId || bill.due <= 0) return d;
        const c = cust(d, bill.customerId), now = Date.now(), wallet = Math.min(c.balance, bill.due);
        c.balance -= wallet;
        bill.paid += wallet;
        bill.due -= wallet;
        if (wallet > 0) {
          bill.payments.push({ amount: wallet, method: "Wallet", ref: "", t: now, by: who(d) });
          d.ledger.unshift({ id: "L" + now, no: "", t: now, customerId: bill.customerId, type: "debit", amount: -wallet, method: "Session checkout", ref: bill.id, by: who(d) });
        }
        const collected = bill.due, reference = ref?.trim() || "";
        if (collected > 0) {
          if (deferToCredit) {
            const creditId = "loan-" + bill.id;
            d.customerCredits.unshift({ id: creditId, customerId: bill.customerId, description: `${bill.station} · ${bill.game}`, amount: collected, paid: 0, t: now, by: who(d), payments: [], sourceSessionId: id });
            bill.creditId = creditId;
          } else {
            bill.paid += collected;
            bill.due = 0;
            bill.payments.push({ amount: collected, method, ref: reference, t: now, by: who(d) });
            d.ledger.unshift({ id: "L" + now + "-checkout", no: "", t: now, customerId: bill.customerId, type: "session_payment", amount: collected, method, ref: reference, sessionId: id, by: who(d) });
          }
        }
        log(d, deferToCredit ? "Session added to customer credit" : "Session bill paid", `${c.name} · Rs ${wallet} from wallet${collected ? deferToCredit ? ` · Rs ${collected} added to customer credit` : ` and Rs ${collected} (${method})` : ""}`);
        return d;
      });
      return true;
    },
    requestRefund: (customerId, amt, why) => up((d) => {
      d.refunds.unshift({ id: Date.now(), customerId, amt, why, by: who(d), st: "pending", t: Date.now() });
      log(d, "Refund request", `Rs ${amt} for ${cust(d, customerId)?.name || "walk-in"}`); return d;
    }),
    decideRefund: (id, st) => up((d) => {
      const r = d.refunds.find((x) => x.id === id); if (r.st !== "pending") return d;
      r.st = st;
      if (st === "approved" && r.customerId !== null) {
        cust(d, r.customerId).balance += r.amt;
        d.ledger.unshift({ id: "L" + Date.now(), no: "", t: Date.now(), customerId: r.customerId, type: "refund", amount: r.amt, method: "Refund", ref: r.why, by: who(d) });
      }
      log(d, "Refund " + st, `Rs ${r.amt} · requested by ${r.by}`); return d;
    }),
    closeShift: (expected, counted) => up((d) => {
      d.shifts.unshift({ id: Date.now(), by: who(d), t: Date.now(), expected, counted });
      log(d, "Shift closed", `Expected Rs ${expected}, counted Rs ${counted}`); return d;
    }),
    addStation: (name, room, model, rates) => {
      if (db?.user?.role !== "admin" || !name?.trim() || !room?.trim() || !model?.trim() || !rates
        || db.stations.some((station) => station.name.toLowerCase() === name.trim().toLowerCase())
        || ![rates.perMinute, rates.per30Minutes, rates.perHour].every((rate) => Number.isFinite(rate) && rate > 0)) return false;
      up((d) => {
        d.stations.push({ id: Date.now(), name: name.trim(), room: room.trim(), model: model.trim(), plan: "Standard", status: "ok", active: null, ratePerMinute: rates.perMinute, ratePer30Minutes: rates.per30Minutes, ratePerHour: rates.perHour });
        log(d, "Station added", `${name.trim()} · ${room.trim()}`);
        return d;
      });
      return true;
    },
    setStation: (id, patch) => {
      const station = db?.stations.find((item) => item.id === id);
      if (db?.user?.role !== "admin" || !station
        || (patch.status !== undefined && !["ok", "maintenance"].includes(patch.status))
        || [patch.ratePerMinute, patch.ratePer30Minutes, patch.ratePerHour].some((rate) => rate !== undefined && (!Number.isFinite(rate) || rate <= 0))) return false;
      up((d) => {
        Object.assign(d.stations.find((item) => item.id === id), patch);
        log(d, "Station updated", `${station.name} · rates or status`);
        return d;
      });
      return true;
    },
    // platform (superadmin)
    createTenant: (f) => up((d) => {
      const id = Date.now();
      d.tenants.push({ id, name: f.name, owner: f.owner, plan: f.plan, status: "Trial", renewsAt: Date.now() + f.days * DAY, on: true });
      d.accounts.push({ id: `branch-admin-${id}`, username: f.username, password: f.password, role: "admin", name: f.owner, tenantId: id, active: true });
      plog(d, "Branch created", `${f.name} · ${f.plan} · ${f.days}-day trial`); return d;
    }),
    createEmployee: (f) => up((d) => {
      const id = Date.now();
      d.employees.push({ id, name: f.name, role: "Cashier", shift: "Unassigned", limit: 300, on: true, tenantId: d.user.tenantId });
      d.accounts.push({ id: `employee-${id}`, username: f.username, password: f.password, role: "employee", name: f.name, tenantId: d.user.tenantId, employeeId: id, active: true });
      log(d, "Employee added", f.name); return d;
    }),
    toggleEmployee: (id) => up((d) => {
      const employee = d.employees.find((x) => x.id === id && x.tenantId === d.user.tenantId);
      if (!employee || d.user.role !== "admin") return d;
      employee.on = !employee.on;
      const account = d.accounts.find((x) => x.employeeId === id);
      if (account) account.active = employee.on;
      return d;
    }),
    toggleTenant: (id) => up((d) => {
      const t = d.tenants.find((x) => x.id === id); t.on = !t.on; t.status = t.on ? "Active" : "Suspended";
      plog(d, t.on ? "Branch reactivated" : "Branch suspended", t.name); return d;
    }),
    setTenantPlan: (id, plan) => up((d) => { const t = d.tenants.find((x) => x.id === id); t.plan = plan; plog(d, "Plan changed", `${t.name} → ${plan}`); return d; }),
    recordPayment: (tenantId, amt, method, ref) => up((d) => {
      const t = d.tenants.find((x) => x.id === tenantId);
      d.payments.unshift({ id: Date.now(), tenantId, amt, t: Date.now(), method, ref });
      t.status = "Active"; t.on = true; t.renewsAt = Math.max(t.renewsAt, Date.now()) + 30 * DAY;
      plog(d, "Payment recorded", `${t.name} · Rs ${amt.toLocaleString()} (${method})`); return d;
    }),
    setPlanPrice: (plan, patch) => up((d) => { Object.assign(d.plans[plan], patch); plog(d, "Plan updated", `${plan}: Rs ${d.plans[plan].price}`); return d; }),
    updatePublicDownloads: (mobileUrl, desktopUrl) => {
      if (db?.user?.role !== "superadmin") return "Only a superadmin can update public downloads.";
      if ([mobileUrl, desktopUrl].some((url) => url && !isSecureWebUrl(url.trim()))) return "Download links must be valid HTTPS URLs.";
      up((d) => {
        d.resources.mobileUrl = mobileUrl.trim();
        d.resources.desktopUrl = desktopUrl.trim();
        plog(d, "Download links updated", "Public app downloads");
        return d;
      });
      return null;
    },
    saveDemoVideo: (id, title, url) => {
      const cleanTitle = title.trim(), cleanUrl = url.trim();
      if (db?.user?.role !== "superadmin") return "Only a superadmin can manage demo videos.";
      if (!cleanTitle || cleanTitle.length > 100) return "Enter a video title of 1–100 characters.";
      if (!getDemoVideoSource(cleanUrl)) return "Use a secure YouTube, Vimeo, or direct MP4, WebM, or Ogg video URL.";
      if (id && !db.resources.videos.some((video) => video.id === id)) return "That demo video no longer exists.";
      up((d) => {
        const existing = d.resources.videos.find((video) => video.id === id);
        if (existing) Object.assign(existing, { title: cleanTitle, url: cleanUrl });
        else d.resources.videos.unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, title: cleanTitle, url: cleanUrl });
        plog(d, id ? "Demo video updated" : "Demo video added", cleanTitle);
        return d;
      });
      return null;
    },
    deleteDemoVideo: (id) => {
      if (db?.user?.role !== "superadmin") return "Only a superadmin can manage demo videos.";
      const video = db.resources.videos.find((entry) => entry.id === id);
      if (!video) return "That demo video no longer exists.";
      up((d) => {
        d.resources.videos = d.resources.videos.filter((entry) => entry.id !== id);
        plog(d, "Demo video removed", video.title);
        return d;
      });
      return null;
    },
    reset: () => { localStorage.removeItem("gz-demo-v2"); setDb(hydrate(seed())); },
  };
  return <Ctx.Provider value={api}>{children}{toast && <div className="toast" role="status">{toast}</div>}</Ctx.Provider>;
}
