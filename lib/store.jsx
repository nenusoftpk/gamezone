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
    username: i === 0 ? "employee" : ["hina", "zain", "maryam"][i] || `employee${employee.id}`,
    password: i === 0 ? "emp123" : ["hina123", "zain1234", "maryam123"][i] || "employee123",
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
  d.platformReady = false;
  if (!Array.isArray(d.branchAdminBootstrap)) {
    d.branchAdminBootstrap = d.accounts.filter((account) => account.role === "admin").map((account) => ({ ...account }));
  }
  d.accounts = d.accounts.filter((account) => account.role !== "superadmin");
  const firstEmployeeAccount = d.accounts.find((account) => account.id === `employee-${EMP[0]?.id}`);
  if (firstEmployeeAccount?.username === "hina" && firstEmployeeAccount.password === "hina123") {
    firstEmployeeAccount.username = "employee";
    firstEmployeeAccount.password = "emp123";
  }
  if (!d.employees) d.employees = EMP.map((employee) => ({ ...employee, tenantId: d.tenants?.[0]?.id }));
  const employeeNames = new Set([
    ...d.accounts.filter((account) => account.role === "employee").map((account) => account.name),
    ...d.employees.map((employee) => employee.name),
  ]);
  d.expenses.forEach((expense) => {
    if (!["admin", "employee"].includes(expense.recordedRole)) {
      expense.recordedRole = employeeNames.has(expense.by) ? "employee" : "admin";
    }
  });
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
  const [platformLoading, setPlatformLoading] = useState(false);
  const [platformError, setPlatformError] = useState("");
  const [resourcesError, setResourcesError] = useState("");
  useEffect(() => {
    try { setDb(hydrate(JSON.parse(localStorage.getItem("gz-demo-v2")))); } catch { setDb(hydrate(null)); }
  }, []);
  useEffect(() => { if (db) localStorage.setItem("gz-demo-v2", JSON.stringify(db)); }, [db]);
  const applyPlatformData = useCallback((data) => {
    setDb((current) => current && ({
      ...current,
      ...data,
      accounts: current.accounts.filter((account) => account.role !== "admin" && account.role !== "superadmin"),
      branchAdminBootstrap: [],
      platformReady: true,
    }));
  }, []);
  const loadPlatformData = useCallback(async (localState) => {
    const request = async (url, options) => {
      const response = await fetch(url, options);
      let result;
      try { result = await response.json(); } catch { throw new Error("The platform service returned an invalid response."); }
      if (!response.ok) throw new Error(result.error || "Could not load platform data.");
      return result;
    };
    let result = await request("/api/platform", { cache: "no-store" });
    if (!result.initialized) {
      const branchAdminAccounts = localState.branchAdminBootstrap?.length
        ? localState.branchAdminBootstrap
        : localState.accounts.filter((account) => account.role === "admin");
      result = await request("/api/platform/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            tenants: localState.tenants || [],
            plans: localState.plans || {},
            payments: localState.payments || [],
            resources: localState.resources || { mobileUrl: "", desktopUrl: "", videos: [] },
            platformAudit: localState.platformAudit || [],
          },
          adminAccounts: branchAdminAccounts,
        }),
      });
    }
    if (!result.initialized || !result.data) throw new Error("Platform data has not been initialized.");
    applyPlatformData(result.data);
    setPlatformError("");
    return result.data;
  }, [applyPlatformData]);
  const platformRole = db?.user?.role, platformUserId = db?.user?.id;
  useEffect(() => {
    if (platformRole !== "superadmin" || db?.platformReady) return;
    setPlatformLoading(true);
    setPlatformError("");
    loadPlatformData(db)
      .catch((error) => setPlatformError(error.message || "Could not load platform data."))
      .finally(() => setPlatformLoading(false));
  }, [platformRole, platformUserId, db?.platformReady, loadPlatformData]);
  useEffect(() => {
    if (!db || platformRole === "superadmin") return;
    let current = true;
    fetch("/api/public/resources", { cache: "no-store" })
      .then(async (response) => {
        let result;
        try { result = await response.json(); } catch { throw new Error("The public resources service returned an invalid response."); }
        if (!response.ok) throw new Error(result.error || "Could not load public resources.");
        if (current) {
          setDb((value) => value && ({ ...value, resources: result.resources }));
          setResourcesError("");
        }
      })
      .catch((error) => { if (current) setResourcesError(error.message || "Could not load public resources."); });
    return () => { current = false; };
  }, [Boolean(db), platformRole]);
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
  const changeOwnPassword = async (current, next) => {
    const isSuperadmin = db?.user?.role === "superadmin";
    const account = isSuperadmin ? null : db?.accounts.find((x) => x.id === db.user?.id);
    if (!isSuperadmin && !account) return "The signed-in account could not be found.";
    if (isSuperadmin) {
      try {
        const response = await fetch("/api/auth/superadmin/password", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ current, next }),
        });
        const result = await response.json();
        if (!response.ok) return result.error || "Could not update the superadmin password.";
      } catch {
        return "Could not reach the superadmin password service. Try again.";
      }
    } else if (account.password !== current) {
      return "Current password is incorrect.";
    }
    up((d) => {
      if (account) d.accounts.find((x) => x.id === account.id).password = next;
      if (isSuperadmin) plog(d, "Password changed", "Platform account");
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
  const requestPlatformAction = async (action, payload) => {
    if (db?.user?.role !== "superadmin") return "Only a superadmin can update platform data.";
    try {
      const response = await fetch("/api/platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload }),
      });
      let result;
      try { result = await response.json(); } catch { return "The platform service returned an invalid response."; }
      if (!response.ok) return result.error || "Could not save platform changes.";
      applyPlatformData(result.data);
      return null;
    } catch {
      return "Could not reach the platform service. Check MongoDB and try again.";
    }
  };

  const api = {
    db, say, nextNo, authenticate, changeOwnPassword, setAccountPassword,
    platformLoading, platformError, resourcesError,
    login: async (account) => {
      if (account.role === "superadmin") {
        setPlatformLoading(true);
        setPlatformError("");
        try {
          await loadPlatformData(db);
        } catch (error) {
          setPlatformError(error.message || "Could not load platform data.");
          throw error;
        } finally {
          setPlatformLoading(false);
        }
      }
      up((d) => {
        if (account.role === "admin") {
          d.employees.forEach((employee) => { employee.tenantId = String(employee.tenantId); });
          d.accounts.forEach((entry) => {
            if (entry.role === "employee") entry.tenantId = String(entry.tenantId);
          });
        }
        d.user = {
          id: account.id,
          role: account.role,
          name: account.name,
          tenantId: account.tenantId === undefined ? undefined : String(account.tenantId),
        };
        return d;
      });
    },
    logout: async () => {
      if (db?.user?.role === "superadmin") {
        const response = await fetch("/api/auth/logout", { method: "POST" });
        if (!response.ok) throw new Error("The superadmin session could not be cleared.");
      }
      up((d) => { d.user = null; return d; });
    },
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
    updateCustomer: (id, name, phone) => {
      const customer = db?.customers.find((entry) => entry.id === id);
      if (db?.user?.role !== "admin" || !customer || !name?.trim()) return false;
      up((d) => {
        const entry = cust(d, id);
        if (!entry) return d;
        const previousName = entry.name;
        entry.name = name.trim();
        entry.phone = phone?.trim() || "—";
        log(d, "Customer updated", `${previousName} → ${entry.name}`);
        return d;
      });
      return true;
    },
    deleteCustomer: (id) => {
      const customer = db?.customers.find((entry) => entry.id === id);
      if (db?.user?.role !== "admin" || !customer) return false;
      up((d) => {
        const entry = cust(d, id);
        if (!entry) return d;
        d.stations.forEach((station) => {
          if (station.active?.customerId === id) station.active = null;
        });
        d.customers = d.customers.filter((item) => item.id !== id);
        d.sessions = d.sessions.filter((session) => session.customerId !== id);
        d.ledger = d.ledger.filter((item) => item.customerId !== id);
        d.customerCredits = d.customerCredits.filter((credit) => credit.customerId !== id);
        d.refunds = d.refunds.filter((refund) => refund.customerId !== id);
        d.cafeOrders = d.cafeOrders.filter((order) => order.customerId !== id);
        log(d, "Customer deleted", `${entry.name} · linked customer records removed`);
        return d;
      });
      return true;
    },
    addExpense: (category, description, amount) => {
      if (!STAFF_ROLES.includes(db?.user?.role) || !description.trim() || !Number.isFinite(amount) || amount <= 0) return false;
      up((d) => {
        const expense = { id: Date.now(), category, description, amount, t: Date.now(), by: who(d), recordedRole: d.user.role };
        d.expenses.unshift(expense);
        log(d, "Expense recorded", `${category} · Rs ${amount} · ${description}`);
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
    editActiveCustomer: (stationId, customerId) => {
      const station = db?.stations.find((entry) => entry.id === stationId);
      const customer = db?.customers.find((entry) => entry.id === customerId);
      if (db?.user?.role !== "admin" || !station?.active || !Number.isInteger(customerId) || !customer || station.active.customerId === customerId) return false;
      up((d) => {
        const activeStation = d.stations.find((entry) => entry.id === stationId);
        const nextCustomer = cust(d, customerId);
        if (!activeStation?.active || !nextCustomer) return d;
        const previousCustomer = cust(d, activeStation.active.customerId);
        activeStation.active.customerId = customerId;
        log(d, "Session customer changed", `${activeStation.name} · ${previousCustomer?.name || "Unknown"} → ${nextCustomer.name}`);
        return d;
      });
      return true;
    },
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
    createTenant: (form) => requestPlatformAction("tenant.create", form),
    toggleTenant: (id) => requestPlatformAction("tenant.toggle", { tenantId: id }),
    setTenantPlan: (id, plan) => requestPlatformAction("tenant.plan", { tenantId: id, plan }),
    setBranchAdminPassword: (tenantId, password) => requestPlatformAction("tenant.adminPassword", { tenantId, password }),
    recordPayment: (tenantId, _amount, method, ref) => requestPlatformAction("payment.record", { tenantId, method, ref }),
    setPlanPrice: (plan, patch) => requestPlatformAction("plan.update", { name: plan, patch }),
    updatePublicDownloads: (mobileUrl, desktopUrl) => {
      if (db?.user?.role !== "superadmin") return Promise.resolve("Only a superadmin can update public downloads.");
      if ([mobileUrl, desktopUrl].some((url) => url && !isSecureWebUrl(url.trim()))) return Promise.resolve("Download links must be valid HTTPS URLs.");
      return requestPlatformAction("resources.downloads", { mobileUrl: mobileUrl.trim(), desktopUrl: desktopUrl.trim() });
    },
    saveDemoVideo: (id, title, url) => {
      const cleanTitle = title.trim(), cleanUrl = url.trim();
      if (db?.user?.role !== "superadmin") return Promise.resolve("Only a superadmin can manage demo videos.");
      if (!cleanTitle || cleanTitle.length > 100) return Promise.resolve("Enter a video title of 1–100 characters.");
      if (!getDemoVideoSource(cleanUrl)) return Promise.resolve("Use a secure YouTube, Vimeo, or direct MP4, WebM, or Ogg video URL.");
      return requestPlatformAction("resources.video.save", { id, title: cleanTitle, url: cleanUrl });
    },
    deleteDemoVideo: (id) => requestPlatformAction("resources.video.delete", { id }),
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
    reset: () => { localStorage.removeItem("gz-demo-v2"); setDb(hydrate(seed())); },
  };
  return <Ctx.Provider value={api}>{children}{toast && <div className="toast" role="status">{toast}</div>}</Ctx.Provider>;
}
