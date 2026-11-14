"use client";
import Link from "next/link";
import { useStore, money, dateStr, DAY } from "@/lib/store";
import { PageHead } from "@/components/ui";
import { Banner } from "@/components/Art";

export default function Platform() {
  const { db } = useStore();
  if (!db) return null;
  const now = Date.now(), act = db.tenants.filter((t) => t.on && t.status === "Active"), mrr = act.reduce((a, t) => a + db.plans[t.plan].price, 0);
  const month = db.payments.filter((p) => now - p.t < 30 * DAY).reduce((a, p) => a + p.amt, 0);
  const soon = [...db.tenants].filter((t) => t.on).sort((a, b) => a.renewsAt - b.renewsAt).slice(0, 4);
  return (
    <>
      <Banner title="Platform control room" sub="Branches, plans and license revenue." stats={[["Monthly recurring", money(mrr)], ["Active branches", act.length], ["Collected (30 days)", money(month)]]} />
      <PageHead title="Platform overview" sub="License revenue and branch health. Customer wallets are never shown here." />
      <div className="kpis">
        <div className="kpi"><span>Monthly recurring</span><b>{money(mrr)}</b><small>From {act.length} active branches</small></div>
        <div className="kpi"><span>Collected (30 days)</span><b>{money(month)}</b><small>{db.payments.length} payments</small></div>
        <div className="kpi"><span>On trial</span><b>{db.tenants.filter((t) => t.status === "Trial").length}</b><small>Convert before trial ends</small></div>
        <div className="kpi"><span>Suspended</span><b>{db.tenants.filter((t) => !t.on).length}</b><small>Payment overdue</small></div>
      </div>
      <div className="split">
        <section className="panel pad"><h3>Renewals coming up</h3>
          {soon.map((t) => { const d = Math.ceil((t.renewsAt - now) / DAY); return <div className="line" key={t.id}><span><b>{t.name}</b><br /><small className="muted">{t.plan} · {dateStr(t.renewsAt)}</small></span><span className={"badge " + (d <= 5 ? "paused" : "live")}>{d <= 0 ? "Due now" : `${d} days`}</span></div>; })}
        </section>
        <section className="panel pad"><h3>Quick actions</h3>
          <div className="line"><span>Add a new branch</span><Link className="btn sm" href="/tenants">Open branches</Link></div>
          <div className="line"><span>Record a payment</span><Link className="btn sm" href="/subscriptions">Open payments</Link></div>
          <div className="line"><span>Change plan prices</span><Link className="btn sm" href="/plans">Open plans</Link></div>
        </section>
      </div>
    </>
  );
}
