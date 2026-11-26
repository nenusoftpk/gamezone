"use client";
import { useState } from "react";
import { useStore, money } from "@/lib/store";
import { Modal } from "@/components/ui";

export default function PayModal({ tenantId, onClose }) {
  const { db, recordPayment, say } = useStore();
  const [t, setT] = useState(String(tenantId ?? db.tenants[0]?.id ?? "")), [m, setM] = useState("Bank transfer"), [ref, setRef] = useState(""), [error, setError] = useState(""), [saving, setSaving] = useState(false);
  const ten = db.tenants.find((x) => String(x.id) === t), amt = ten ? db.plans[ten.plan]?.price : 0;
  const submit = async () => {
    if (!ten) return setError("Choose a branch before recording a payment.");
    setSaving(true);
    try {
      const result = await recordPayment(ten.id, amt, m, ref.trim());
      if (result) return setError(result);
      say(`${ten.name} renewed for 30 days`);
      onClose();
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal title="Record license payment" onClose={onClose} foot={<><button className="btn" onClick={onClose}>Cancel</button>
      <button className="btn primary" disabled={!ref.trim() || !ten || saving} onClick={submit}>{saving ? "Recording…" : "Record payment"}</button></>}>
      <label>Branch<select value={t} onChange={(e) => setT(e.target.value)}>{db.tenants.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
      <label>Amount<input value={money(amt)} disabled /></label>
      <label>Method<select value={m} onChange={(e) => setM(e.target.value)}>{["Bank transfer", "Easypaisa", "JazzCash", "Cash"].map((x) => <option key={x}>{x}</option>)}</select></label>
      <label>Transaction reference<input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. TRX-88231" /></label>
      {error && <div className="callout warn" role="alert">{error}</div>}
      <div className="callout">The branch becomes active and renews for 30 days.</div>
    </Modal>
  );
}
