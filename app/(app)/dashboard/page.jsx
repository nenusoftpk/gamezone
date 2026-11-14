"use client";
import { useStore, useNow, money, cost } from "@/lib/store";
import { Icon, PageHead } from "@/components/ui";
import { Banner } from "@/components/Art";

export default function Dashboard() {
  const { db } = useStore(), now = useNow();
  if (!db) return null;
  const rev = db.sessions.reduce((a, s) => a + s.amount, 0);
  const tops = db.ledger.filter((l) => l.type === "topup").reduce((a, l) => a + l.amount, 0);
  const liab = db.customers.reduce((a, c) => a + c.balance, 0);
  const running = db.stations.filter((s) => s.active);
  const buckets = Array.from({ length: 8 }, (_, i) => {
    const hi = 7 - i, from = now - (hi + 1) * 3600000, to = now - hi * 3600000;
    return { l: new Date(to).toLocaleTimeString("en-PK", { hour: "numeric", hour12: true }), s: db.sessions.filter((x) => x.t >= from && x.t < to).reduce((a, x) => a + x.amount, 0), t: db.ledger.filter((x) => x.type === "topup" && x.t >= from && x.t < to).reduce((a, x) => a + x.amount, 0) };
  });
  const max = Math.max(...buckets.flatMap((b) => [b.s, b.t]), 1);
  const util = Math.round((running.length / db.stations.filter((s) => s.status === "ok").length) * 100);
  const risky = db.stations.filter((s) => s.active && db.customers.find((c) => c.id === s.active.customerId).balance - cost(s.active, now) < s.active.rate / 12);
  return (
    <>
      <Banner title={`Welcome back, ${db.user.name.split(" ")[0]}`} sub="Gaming Zone Lahore at a glance." stats={[["Session revenue", money(rev)], ["Top-ups", money(tops)], ["Utilization", util + "%"]]} />
      <PageHead title="Dashboard" sub="Today at Gaming Zone Lahore" />
      <div className="kpis">
        <div className="kpi"><span>Session revenue</span><b>{money(rev)}</b><small>Earned from play time</small></div>
        <div className="kpi"><span>Top-ups collected</span><b>{money(tops)}</b><small>Cash received, not yet earned</small></div>
        <div className="kpi"><span>Wallet liability</span><b>{money(liab)}</b><small>Unspent customer balance</small></div>
        <div className="kpi"><span>Utilization</span><b>{util}%</b><small>{running.length} stations playing now</small></div>
      </div>
      <div className="split">
        <section className="panel pad"><h3>Last 8 hours</h3>
          <div className="legend"><i className="a" />Session revenue<i className="b" />Top-ups</div>
          <div className="bars">{buckets.map((b, i) => <div key={i}><div className="pair"><i className="a" style={{ height: (b.s / max) * 100 + "%" }} /><i className="b" style={{ height: (b.t / max) * 100 + "%" }} /></div><span>{b.l}</span></div>)}</div>
        </section>
        <section className="panel pad"><h3>Needs attention</h3>
          <ul className="alerts">
            {risky.map((s) => <li key={s.id}><Icon n="alert" size={16} /><span><b>{s.name}</b> wallet is almost empty. Ask for a top-up.</span></li>)}
            {db.stations.filter((s) => s.active?.pausedAt && now - s.active.pausedAt > 2 * 60000).map((s) => <li key={s.id}><Icon n="pause" size={16} /><span><b>{s.name}</b> has been paused for over 2 minutes.</span></li>)}
            {db.stations.filter((s) => s.status !== "ok").map((s) => <li key={s.id}><Icon n="grid" size={16} /><span><b>{s.name}</b> is in maintenance.</span></li>)}
          </ul>
        </section>
      </div>
    </>
  );
}
