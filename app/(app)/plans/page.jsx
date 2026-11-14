"use client";
import { useState } from "react";
import { useStore, money } from "@/lib/store";
import { PageHead } from "@/components/ui";

function Plan({ name, p, count }) {
  const { setPlanPrice, say } = useStore();
  const [v, setV] = useState(p);
  return (
    <div className="pk plan"><h3>{name}</h3><div className="big">{money(v.price)}<small> / month</small></div><small>{count} branch{count === 1 ? "" : "es"} on this plan</small>
      <label>Price (Rs)<input type="number" value={v.price} onChange={(e) => setV({ ...v, price: +e.target.value })} /></label>
      <label>Stations allowed<input type="number" value={v.stations} onChange={(e) => setV({ ...v, stations: +e.target.value })} /></label>
      <label>Employees allowed<input type="number" value={v.employees} onChange={(e) => setV({ ...v, employees: +e.target.value })} /></label>
      <button className="btn primary" style={{ marginTop: 14 }} disabled={!(v.price > 0)} onClick={() => { setPlanPrice(name, v); say(`${name} plan saved`); }}>Save plan</button>
    </div>
  );
}
export default function Plans() {
  const { db } = useStore();
  if (!db) return null;
  return (
    <>
      <PageHead title="Plans" sub="New prices apply from each branch's next renewal." />
      <div className="cards3">{Object.entries(db.plans).map(([n, p]) => <Plan key={n} name={n} p={p} count={db.tenants.filter((t) => t.plan === n).length} />)}</div>
    </>
  );
}
