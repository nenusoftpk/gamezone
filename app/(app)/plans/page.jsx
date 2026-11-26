"use client";
import { useState } from "react";
import { useStore, money } from "@/lib/store";
import { PageHead } from "@/components/ui";

function Plan({ name, p, count }) {
  const { setPlanPrice, say } = useStore();
  const [v, setV] = useState(p), [error, setError] = useState(""), [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      const result = await setPlanPrice(name, v);
      if (result) return setError(result);
      setError("");
      say(`${name} plan saved`);
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="pk plan"><h3>{name}</h3><div className="big">{money(v.price)}<small> / month</small></div><small>{count} branch{count === 1 ? "" : "es"} on this plan</small>
      <label>Price (Rs)<input type="number" value={v.price} onChange={(e) => setV({ ...v, price: +e.target.value })} /></label>
      <label>Stations allowed<input type="number" value={v.stations} onChange={(e) => setV({ ...v, stations: +e.target.value })} /></label>
      <label>Employees allowed<input type="number" value={v.employees} onChange={(e) => setV({ ...v, employees: +e.target.value })} /></label>
      {error && <div className="callout warn" role="alert">{error}</div>}
      <button className="btn primary" style={{ marginTop: 14 }} disabled={!(v.price > 0) || saving} onClick={save}>{saving ? "Saving…" : "Save plan"}</button>
    </div>
  );
}
export default function Plans() {
  const { db, platformLoading, platformError } = useStore();
  if (!db) return null;
  if (platformLoading) return <div className="boot">Loading platform data…</div>;
  if (platformError) return <><PageHead title="Plans" sub="New prices apply from each branch's next renewal." /><div className="callout warn" role="alert">{platformError}</div></>;
  return (
    <>
      <PageHead title="Plans" sub="New prices apply from each branch's next renewal." />
      <div className="cards3">{Object.entries(db.plans).map(([n, p]) => <Plan key={n} name={n} p={p} count={db.tenants.filter((t) => t.plan === n).length} />)}</div>
    </>
  );
}
