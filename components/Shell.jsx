"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore, HOME } from "@/lib/store";
import { Icon, Avatar, BrandLogo } from "@/components/ui";

const NAV = {
  employee: [["Counter", [["/board", "Live board", "board"], ["/customers", "Customers", "users"], ["/cash", "Cash collection", "wallet"], ["/finance", "Loans & expenses", "wallet"], ["/cafe-orders", "Cafe orders", "box"], ["/inventory", "Cafe inventory", "box"], ["/refund-requests", "Refund requests", "undo"], ["/history", "Game history", "clock"]]]],
  admin: [
    ["Overview", [["/dashboard", "Dashboard", "chart"], ["/board", "Live board", "board"], ["/customers", "Customers", "users"]]],
    ["Money", [["/cash", "Cash collection", "wallet"], ["/reports", "Reports", "file"], ["/finance", "Loans & expenses", "wallet"], ["/refunds", "Refunds", "undo"], ["/history", "Game history", "clock"]]],
    ["Setup", [["/stations", "Stations & rates", "grid"], ["/packages", "Packages", "box"], ["/inventory", "Inventory", "box"], ["/cafe-orders", "Cafe orders", "box"], ["/employees", "Employees", "users"], ["/audit", "Audit log", "shield"], ["/settings", "Settings", "gear"], ["/account", "Change password", "shield"]]],
  ],
  superadmin: [["Platform", [["/platform", "Overview", "chart"], ["/tenants", "Branches", "building"], ["/plans", "Plans", "box"], ["/subscriptions", "Payments", "wallet"], ["/resources", "Downloads & demos", "file"], ["/platform-audit", "Platform audit", "shield"], ["/account", "Change password", "shield"]]]],
};
export default function Shell({ children }) {
  const { db, logout } = useStore();
  const path = usePathname(), router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const role = db?.user?.role;
  const allowed = role && NAV[role].some(([, ls]) => ls.some(([h]) => path === h || path.startsWith(h + "/")));
  useEffect(() => {
    if (!db) return;
    if (!db.user) router.replace("/login");
    else if (!allowed) router.replace(HOME[role]); // role guard
  }, [db, allowed, role, router]);
  useEffect(() => {
    if (!drawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => { if (event.key === "Escape") setDrawerOpen(false); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [drawerOpen]);
  if (!db?.user || !allowed) return <div className="boot">Loading…</div>;
  const u = db.user;
  return (
    <div className="shell">
      <header className="mobile-topbar">
        <button className="menu-toggle" onClick={() => setDrawerOpen(!drawerOpen)} aria-label={drawerOpen ? "Close navigation" : "Open navigation"} aria-expanded={drawerOpen} aria-controls="app-navigation">
          <Icon n={drawerOpen ? "close" : "menu"} />
        </button>
        <div className="mobile-brand"><BrandLogo size={34} /><div><b>Gaming Zone</b><small>{role === "superadmin" ? "Platform" : "Branch workspace"}</small></div></div>
        <Avatar name={u.name} />
      </header>
      {drawerOpen && <button className="drawer-scrim" onClick={() => setDrawerOpen(false)} aria-label="Close navigation" />}
      <aside className={"side" + (drawerOpen ? " open" : "")}>
        <div className="brand"><BrandLogo /><div><b>Gaming Zone</b><small>{role === "superadmin" ? "Platform" : "Lahore branch"}</small></div></div>
        <nav id="app-navigation">{NAV[role].map(([g, links]) => (
          <div key={g} className="grp"><small>{g}</small>{links.map(([h, l, i]) => <Link key={h + l} href={h} onClick={() => setDrawerOpen(false)} className={"nav" + (path === h || path.startsWith(h + "/") ? " on" : "")}><Icon n={i} />{l}</Link>)}</div>
        ))}</nav>
        <div className="side-foot">
          <div className="me"><Avatar name={u.name} /><div><b>{u.name}</b><small>{u.role}</small></div></div>
          <button className="nav" onClick={() => { setDrawerOpen(false); logout(); router.replace("/login"); }}><Icon n="out" />Sign out</button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
