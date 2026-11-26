"use client";
import { useState } from "react";
import { useStore, money, dateStr, DAY } from "@/lib/store";
import { Icon, Modal, PageHead } from "@/components/ui";
import PayModal from "@/components/PayModal";

const PAYMENT_METHODS = ["Bank transfer", "Easypaisa", "JazzCash", "Cash"];

export default function Subs() {
  const { db, platformLoading, platformError, updatePayment, deletePayment, say } = useStore();
  const [pay, setPay] = useState(false), [editFor, setEditFor] = useState(null), [deleteFor, setDeleteFor] = useState(null);
  const [editForm, setEditForm] = useState({ amount: "", method: "Bank transfer", ref: "" });
  const [error, setError] = useState(""), [busy, setBusy] = useState(false);
  if (!db) return null;
  if (platformLoading) return <div className="boot">Loading platform data…</div>;
  if (platformError) return <><PageHead title="Payments" sub="Software license fees only. Customer wallets are never mixed in here." /><div className="callout warn" role="alert">{platformError}</div></>;
  const startEdit = (payment) => {
    setEditFor(payment);
    setEditForm({ amount: String(payment.amt), method: payment.method, ref: payment.ref });
    setError("");
  };
  const saveEdit = async () => {
    const amount = Number(editForm.amount), ref = editForm.ref.trim();
    if (!Number.isFinite(amount) || amount <= 0) return setError("Enter an amount greater than zero.");
    if (!PAYMENT_METHODS.includes(editForm.method)) return setError("Choose a valid payment method.");
    if (!ref || ref.length > 200) return setError("Enter a transaction reference of 1–200 characters.");
    setBusy(true);
    try {
      const result = await updatePayment(editFor.id, { amount, method: editForm.method, ref });
      if (result) return setError(result);
      setEditFor(null); setError(""); say("Payment updated");
    } finally {
      setBusy(false);
    }
  };
  const confirmDelete = async () => {
    if (!deleteFor) return;
    setBusy(true);
    try {
      const result = await deletePayment(deleteFor.id);
      if (result) return setError(result);
      setDeleteFor(null); setError(""); say("Payment deleted");
    } finally {
      setBusy(false);
    }
  };
  const closeEdit = () => { if (!busy) { setEditFor(null); setError(""); } };
  const closeDelete = () => { if (!busy) { setDeleteFor(null); setError(""); } };
  const branchName = (payment) => db.tenants.find((tenant) => String(tenant.id) === String(payment.tenantId))?.name || "Unknown branch";
  const total = db.payments.reduce((a, p) => a + p.amt, 0), month = db.payments.filter((p) => Date.now() - p.t < 30 * DAY).reduce((a, p) => a + p.amt, 0);
  const overdue = db.tenants.filter((t) => !t.on);
  return (
    <>
      <PageHead title="Payments" sub="Software license fees only. Customer wallets are never mixed in here."><button className="btn primary" disabled={!db.tenants.length} onClick={() => setPay(true)}>Record payment</button></PageHead>
      <div className="kpis">
        <div className="kpi"><span>Last 30 days</span><b>{money(month)}</b><small>License payments</small></div>
        <div className="kpi"><span>All time</span><b>{money(total)}</b><small>{db.payments.length} payments</small></div>
        <div className="kpi"><span>Overdue branches</span><b>{overdue.length}</b><small>{overdue.map((t) => t.name).join(", ") || "None"}</small></div>
        <div className="kpi"><span>Plans</span><b>{Object.keys(db.plans).length}</b><small>{Object.entries(db.plans).map(([n, p]) => `${n} ${money(p.price)}`).join(" · ")}</small></div>
      </div>
      <div className="panel"><table>
        <thead><tr><th>Date</th><th>Business</th><th>Method</th><th>Reference</th><th className="r">Amount</th><th className="r">Actions</th></tr></thead>
        <tbody>{db.payments.map((p) => <tr key={p.id}><td>{dateStr(p.t)}</td><td><b>{branchName(p)}</b></td><td>{p.method}</td><td>{p.ref}</td><td className="r"><b>{money(p.amt)}</b></td>
          <td><div className="table-actions">
            <button type="button" className="btn sm table-action admin-action" title="Edit payment record" aria-label={`Edit payment for ${branchName(p)}`} onClick={() => startEdit(p)}><Icon n="edit" size={20} /></button>
            <button type="button" className="btn sm danger table-action" title="Delete payment record" aria-label={`Delete payment for ${branchName(p)}`} onClick={() => { setDeleteFor(p); setError(""); }}><Icon n="trash" size={20} /></button>
          </div></td></tr>)}</tbody>
      </table></div>
      {pay && <PayModal onClose={() => setPay(false)} />}
      {editFor && <Modal title="Edit payment record" onClose={closeEdit} foot={<><button className="btn" disabled={busy} onClick={closeEdit}>Cancel</button><button className="btn primary" disabled={busy || !editForm.amount || !editForm.ref.trim()} onClick={saveEdit}>{busy ? "Saving…" : "Save changes"}</button></>}>
        <p className="muted">{branchName(editFor)} · {dateStr(editFor.t)}</p>
        <label>Amount<input type="number" min="0.01" step="0.01" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} /></label>
        <label>Method<select value={editForm.method} onChange={(e) => setEditForm({ ...editForm, method: e.target.value })}>{PAYMENT_METHODS.map((method) => <option key={method}>{method}</option>)}</select></label>
        <label>Transaction reference<input maxLength={200} value={editForm.ref} onChange={(e) => setEditForm({ ...editForm, ref: e.target.value })} /></label>
        <div className="callout">Editing payment details does not change the branch renewal date or access status.</div>
        {error && <div className="callout warn" role="alert">{error}</div>}
      </Modal>}
      {deleteFor && <Modal title="Delete payment record?" onClose={closeDelete} foot={<><button className="btn" disabled={busy} onClick={closeDelete}>Cancel</button><button className="btn danger" disabled={busy} onClick={confirmDelete}>{busy ? "Deleting…" : "Delete payment"}</button></>}>
        <p>This permanently removes the {money(deleteFor.amt)} payment for {branchName(deleteFor)}. The branch renewal date and access status will not change. An audit entry will be retained.</p>
        {error && <div className="callout warn" role="alert">{error}</div>}
      </Modal>}
    </>
  );
}
