"use client";
import { useState } from "react";
import { useStore, money } from "@/lib/store";
import { Modal, PageHead } from "@/components/ui";

const EMPTY_PLAN = { name: "", price: "", stations: "1", employees: "0" };

function Plan({ name, p, count, onDelete }) {
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
      {count > 0 && <small className="muted">Reassign these branches before deleting this plan.</small>}
      <div className="head-actions" style={{ marginTop: 14 }}>
        <button className="btn primary" disabled={!(v.price > 0) || !Number.isInteger(v.stations) || v.stations < 1 || !Number.isInteger(v.employees) || v.employees < 0 || saving} onClick={save}>{saving ? "Saving…" : "Save changes"}</button>
        <button className="btn danger" disabled={count > 0} title={count > 0 ? "Reassign branches first" : "Delete plan"} onClick={() => onDelete(name)}>Delete</button>
      </div>
    </div>
  );
}
export default function Plans() {
  const { db, platformLoading, platformError, createPlan, deletePlan, say } = useStore();
  const [adding, setAdding] = useState(false), [deleteFor, setDeleteFor] = useState("");
  const [newPlan, setNewPlan] = useState(EMPTY_PLAN), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  if (!db) return null;
  if (platformLoading) return <div className="boot">Loading platform data…</div>;
  if (platformError) return <><PageHead title="Plans" sub="New prices apply from each branch's next renewal." /><div className="callout warn" role="alert">{platformError}</div></>;
  const saveNewPlan = async () => {
    const plan = {
      name: newPlan.name.trim(),
      price: Number(newPlan.price),
      stations: Number(newPlan.stations),
      employees: Number(newPlan.employees),
    };
    if (!plan.name || !Number.isFinite(plan.price) || plan.price <= 0 || !Number.isInteger(plan.stations) || plan.stations < 1
      || !Number.isInteger(plan.employees) || plan.employees < 0) return setError("Enter a valid plan name, price, and limits.");
    setBusy(true);
    try {
      const result = await createPlan(plan);
      if (result) return setError(result);
      setAdding(false); setNewPlan(EMPTY_PLAN); setError(""); say("Plan created");
    } finally {
      setBusy(false);
    }
  };
  const confirmDelete = async () => {
    if (!deleteFor) return;
    setBusy(true);
    try {
      const result = await deletePlan(deleteFor);
      if (result) return setError(result);
      setDeleteFor(""); setError(""); say("Plan deleted");
    } finally {
      setBusy(false);
    }
  };
  const closeAdd = () => { if (!busy) { setAdding(false); setError(""); } };
  const closeDelete = () => { if (!busy) { setDeleteFor(""); setError(""); } };
  return (
    <>
      <PageHead title="Plans" sub="New prices apply from each branch's next renewal."><button className="btn primary" onClick={() => { setNewPlan(EMPTY_PLAN); setError(""); setAdding(true); }}>Add plan</button></PageHead>
      <div className="cards3">{Object.entries(db.plans).map(([name, plan]) => <Plan key={name} name={name} p={plan} count={db.tenants.filter((tenant) => tenant.plan === name).length} onDelete={(planName) => { setError(""); setDeleteFor(planName); }} />)}</div>
      {adding && <Modal title="Add plan" onClose={closeAdd} foot={<><button className="btn" disabled={busy} onClick={closeAdd}>Cancel</button><button className="btn primary" disabled={busy || !newPlan.name.trim() || !(Number(newPlan.price) > 0)} onClick={saveNewPlan}>{busy ? "Creating…" : "Create plan"}</button></>}>
        <label>Plan name<input maxLength={40} value={newPlan.name} onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })} /></label>
        <label>Monthly price (Rs)<input type="number" min="0.01" step="0.01" value={newPlan.price} onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })} /></label>
        <label>Stations allowed<input type="number" min="1" step="1" value={newPlan.stations} onChange={(e) => setNewPlan({ ...newPlan, stations: e.target.value })} /></label>
        <label>Employees allowed<input type="number" min="0" step="1" value={newPlan.employees} onChange={(e) => setNewPlan({ ...newPlan, employees: e.target.value })} /></label>
        {error && <div className="callout warn" role="alert">{error}</div>}
      </Modal>}
      {deleteFor && <Modal title={`Delete ${deleteFor} plan?`} onClose={closeDelete} foot={<><button className="btn" disabled={busy} onClick={closeDelete}>Cancel</button><button className="btn danger" disabled={busy} onClick={confirmDelete}>{busy ? "Deleting…" : "Delete plan"}</button></>}>
        <p>This permanently deletes the plan. Plans assigned to branches cannot be deleted; reassign those branches first.</p>
        {error && <div className="callout warn" role="alert">{error}</div>}
      </Modal>}
    </>
  );
}
