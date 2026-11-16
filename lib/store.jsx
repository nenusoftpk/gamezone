"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AUDIT, EMP, REF0 } from "@/lib/data";

export const RATES = { Standard: 300, Peak: 360, "VIP room": 450 }; // Rs per hour
export const GAMES = ["EA FC 26", "Tekken 8", "Spider-Man 2", "God of War Ragnarök", "UFC 5", "Gran Turismo 7", "It Takes Two", "Call of Duty"];
export const MIN = 60000, DAY = 86400000;
export const money = (n) => "Rs " + Math.round(n).toLocaleString("en-PK");
export const clock = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((v) => String(v).padStart(2, "0")).join(":");
};
export const elapsed = (a, now) => (a.pausedAt || now) - a.t0 - a.pausedMs;
export const cost = (a, now) => (elapsed(a, now) / 3600000) * a.rate;
export const timeStr = (t) => new Date(t).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" });
export const dateStr = (t) => new Date(t).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
export const HOME = { employee: "/board", admin: "/dashboard", superadmin: "/platform" };

const seed = () => {
  const t = Date.now();
  const mk = (id, name, room, model, plan, active = null, status = "ok") => ({ id, name, room, model, plan, active, status });
  const act = (customerId, game, players, rate, mins, paused = 0) => ({
    customerId, game, players, rate, t0: t - mins * MIN, pausedMs: paused ? 6 * MIN : 0, pausedAt: paused ? t - paused * MIN : 0,
  });
  const hist = [[0, "EA FC 26", "PS5-04", 45, 225, 40], [2, "Spider-Man 2", "PS5-07", 90, 675, 95], [1, "UFC 5", "PS5-02", 30, 150, 150], [4, "Tekken 8", "PS5-05", 60, 300, 210], [3, "God of War Ragnarök", "PS5-03", 75, 375, 260], [2, "Gran Turismo 7", "PS5-08", 120, 900, 330]]
    .map(([c, g, s, d, amt, agoM], i) => ({ id: "S" + (100 + i), customerId: c, game: g, station: s, minutes: d, amount: amt, t: t - agoM * MIN }));
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
    start: (stationId, customerId, game, players) => up((d) => {
      const s = d.stations.find((x) => x.id === stationId);
      if (s.active || s.status !== "ok") return d; // one active session per station
      s.active = { customerId, game, players, rate: RATES[s.plan], t0: Date.now(), pausedMs: 0, pausedAt: 0 };
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
      c.balance = Math.max(0, c.balance - amount);
      d.sessions.unshift({ id: "S" + now, customerId: a.customerId, game: a.game, station: s.name, minutes: Math.round(elapsed(a, now) / MIN), amount, t: now });
      d.ledger.unshift({ id: "L" + now, no: "", t: now, customerId: a.customerId, type: "debit", amount: -amount, method: s.name, ref: "", by: who(d) });
      log(d, "Session end", `${s.name} · ${c.name} · Rs ${amount}`); s.active = null; return d;
    }),
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
    setStation: (id, patch) => up((d) => { Object.assign(d.stations.find((x) => x.id === id), patch); return d; }),
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
    reset: () => { localStorage.removeItem("gz-demo-v2"); setDb(hydrate(seed())); },
  };
  return <Ctx.Provider value={api}>{children}{toast && <div className="toast" role="status">{toast}</div>}</Ctx.Provider>;
}
