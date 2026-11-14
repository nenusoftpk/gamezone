"use client";
import { useState } from "react";
import { useStore, dateStr, DAY } from "@/lib/store";
import { Modal, PageHead } from "@/components/ui";
import PayModal from "@/components/PayModal";

export default function Tenants() {
  const { db, toggleTenant, setTenantPlan, createTenant, say } = useStore();
  const [add, setAdd] = useState(false), [pay, setPay] = useState(null), [f, setF] = useState({ name: "", owner: "", plan: "Basic", days: 14 });
  if (!db) return null;
  const tone = { Active: "live", Trial: "paused", Suspended: "low" };
  const days = (t) => Math.ceil((t - Date.now()) / DAY);
  return (
    <>
      <PageHead title="Branches" sub="Every gaming business on the platform, with its plan and access"><button className="btn primary" onClick={() => setAdd(true)}>New branch</button></PageHead>
      <div className="panel"><table>
        <thead><tr><th>Business</th><th>Owner</th><th>Plan</th><th>Status</th><th>Renews</th><th>Access</th><th /></tr></thead>
        <tbody>{db.tenants.map((t) => (
          <tr key={t.id}><td><b>{t.name}</b></td><td>{t.owner}</td>
            <td><select value={t.plan} onChange={(e) => { setTenantPlan(t.id, e.target.value); say("Plan changed"); }}>{Object.keys(db.plans).map((p) => <option key={p}>{p}</option>)}</select></td>
            <td><span className={"badge " + tone[t.status]}>{t.status === "Trial" ? `Trial · ${Math.max(0, days(t.renewsAt))} days left` : t.status}</span></td>
            <td>{dateStr(t.renewsAt)}</td>
            <td><button className={"switch" + (t.on ? " on" : "")} onClick={() => { toggleTenant(t.id); say(t.on ? "Branch suspended" : "Branch reactivated"); }} aria-label={`Toggle ${t.name}`} /></td>
            <td className="r"><button className="btn sm" onClick={() => setPay(t.id)}>Record payment</button></td></tr>))}</tbody>
      </table></div>
      {pay !== null && <PayModal tenantId={pay} onClose={() => setPay(null)} />}
      {add && <Modal title="New branch" onClose={() => setAdd(false)} foot={<><button className="btn" onClick={() => setAdd(false)}>Cancel</button>
        <button className="btn primary" disabled={!f.name.trim() || !f.owner.trim()} onClick={() => { createTenant({ ...f, name: f.name.trim(), owner: f.owner.trim(), days: +f.days }); setAdd(false); setF({ name: "", owner: "", plan: "Basic", days: 14 }); say("Branch created with a trial"); }}>Create branch</button></>}>
        <label>Business name<input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label>Owner (becomes the branch admin)<input value={f.owner} onChange={(e) => setF({ ...f, owner: e.target.value })} /></label>
        <div className="fg"><label>Plan<select value={f.plan} onChange={(e) => setF({ ...f, plan: e.target.value })}>{Object.keys(db.plans).map((p) => <option key={p}>{p}</option>)}</select></label>
          <label>Trial days<input type="number" min="0" value={f.days} onChange={(e) => setF({ ...f, days: e.target.value })} /></label></div>
      </Modal>}
    </>
  );
}
