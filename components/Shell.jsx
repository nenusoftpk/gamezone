"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useStore, HOME } from "@/lib/store";
import { Icon, Avatar } from "@/components/ui";

const NAV = {
  employee: [["Counter", [["/board", "Live board", "board"], ["/customers", "Customers", "users"], ["/sell-package", "Sell package", "box"], ["/cash", "Cash collection", "wallet"], ["/refund-requests", "Refund requests", "undo"], ["/history", "History", "clock"]]]],
  admin: [
    ["Overview", [["/dashboard", "Dashboard", "chart"], ["/board", "Live board", "board"], ["/customers", "Customers", "users"]]],
    ["Money", [["/cash", "Cash collection", "wallet"], ["/reports", "Reports", "file"], ["/refunds", "Refunds", "undo"], ["/history", "History", "clock"]]],
    ["Setup", [["/stations", "Stations & rates", "grid"], ["/packages", "Packages", "box"], ["/inventory", "Inventory", "box"], ["/employees", "Employees", "users"], ["/audit", "Audit log", "shield"], ["/settings", "Settings", "gear"]]],
  ],
  superadmin: [["Platform", [["/platform", "Overview", "chart"], ["/tenants", "Branches", "building"], ["/plans", "Plans", "box"], ["/subscriptions", "Payments", "wallet"], ["/platform-audit", "Platform audit", "shield"]]]],
};
export default function Shell({ children }) {
  const { db, logout } = useStore();
  const path = usePathname(), router = useRouter();
  const role = db?.user?.role;
  const allowed = role && NAV[role].some(([, ls]) => ls.some(([h]) => path === h || path.startsWith(h + "/")));
  useEffect(() => {
    if (!db) return;
    if (!db.user) router.replace("/login");
    else if (!allowed) router.replace(HOME[role]); // role guard
  }, [db, allowed, role, router]);
  if (!db?.user || !allowed) return <div className="boot">Loading…</div>;
  const u = db.user;
  return (
    <div className="shell">
      <aside className="side">
        <div className="brand"><span className="mark"><Icon n="pad" size={20} /></span><div><b>Gaming Zone</b><small>{role === "superadmin" ? "Platform" : "Lahore branch"}</small></div></div>
        <nav>{NAV[role].map(([g, links]) => (
          <div key={g} className="grp"><small>{g}</small>{links.map(([h, l, i]) => <Link key={h + l} href={h} className={"nav" + (path === h || path.startsWith(h + "/") ? " on" : "")}><Icon n={i} />{l}</Link>)}</div>
        ))}</nav>
        <div className="side-foot">
          <div className="me"><Avatar name={u.name} /><div><b>{u.name}</b><small>{u.role}</small></div></div>
          <button className="nav" onClick={() => { logout(); router.replace("/login"); }}><Icon n="out" />Sign out</button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
