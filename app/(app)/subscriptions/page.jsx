"use client";
import { useState } from "react";
import { useStore, money, dateStr, DAY } from "@/lib/store";
import { PageHead } from "@/components/ui";
import PayModal from "@/components/PayModal";

export default function Subs() {
  const { db } = useStore(), [pay, setPay] = useState(false);
  if (!db) return null;
  const total = db.payments.reduce((a, p) => a + p.amt, 0), month = db.payments.filter((p) => Date.now() - p.t < 30 * DAY).reduce((a, p) => a + p.amt, 0);
  const overdue = db.tenants.filter((t) => !t.on);
  return (
    <>
      <PageHead title="Payments" sub="Software license fees only. Customer wallets are never mixed in here."><button className="btn primary" onClick={() => setPay(true)}>Record payment</button></PageHead>
      <div className="kpis">
        <div className="kpi"><span>Last 30 days</span><b>{money(month)}</b><small>License payments</small></div>
        <div className="kpi"><span>All time</span><b>{money(total)}</b><small>{db.payments.length} payments</small></div>
        <div className="kpi"><span>Overdue branches</span><b>{overdue.length}</b><small>{overdue.map((t) => t.name).join(", ") || "None"}</small></div>
        <div className="kpi"><span>Plans</span><b>{Object.keys(db.plans).length}</b><small>{Object.entries(db.plans).map(([n, p]) => `${n} ${money(p.price)}`).join(" · ")}</small></div>
      </div>
      <div className="panel"><table>
        <thead><tr><th>Date</th><th>Business</th><th>Method</th><th>Reference</th><th className="r">Amount</th></tr></thead>
        <tbody>{db.payments.map((p) => <tr key={p.id}><td>{dateStr(p.t)}</td><td><b>{db.tenants.find((t) => t.id === p.tenantId)?.name}</b></td><td>{p.method}</td><td>{p.ref}</td><td className="r"><b>{money(p.amt)}</b></td></tr>)}</tbody>
      </table></div>
      {pay && <PayModal onClose={() => setPay(false)} />}
    </>
  );
}
