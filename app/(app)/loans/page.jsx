"use client";
import { useState } from "react";
import { useStore, money, dateStr } from "@/lib/store";
import { Modal, PageHead } from "@/components/ui";

const METHODS = ["Cash", "Easypaisa", "JazzCash", "Bank transfer"];

export default function Loans() {
  const { db, repayCustomerCredit, say } = useStore();
  const [repayId, setRepayId] = useState(null);
  const [repayAmount, setRepayAmount] = useState(""), [method, setMethod] = useState(METHODS[0]), [repayRef, setRepayRef] = useState("");
  if (!db) return null;

  const totalLoaned = db.customerCredits.reduce((sum, credit) => sum + credit.amount, 0);
  const totalPaid = db.customerCredits.reduce((sum, credit) => sum + credit.paid, 0);
  const outstanding = totalLoaned - totalPaid;
  const activeCredit = db.customerCredits.find((credit) => credit.id === repayId);
  const customerName = (id) => db.customers.find((customer) => customer.id === id)?.name || "Unknown customer";

  return (
    <>
      <PageHead title="Customer loans" sub="Loans are created only by converting unpaid session bills at checkout." />
      <div className="callout" style={{ margin: "0 0 18px" }}>To create a loan, open a session bill in checkout and choose “Convert to customer loan”. Record repayments here.</div>
      <div className="kpis">
        <div className="kpi"><span>Total loans</span><b>{money(totalLoaned)}</b><small>Customer credit recorded</small></div>
        <div className="kpi"><span>Repaid</span><b>{money(totalPaid)}</b><small>Payments received against loans</small></div>
        <div className="kpi"><span>Outstanding</span><b>{money(outstanding)}</b><small>Still owed by customers</small></div>
      </div>
      <div className="panel"><table>
        <thead><tr><th>Date</th><th>Customer</th><th>Charge</th><th className="r">Amount</th><th className="r">Paid</th><th className="r">Due</th><th>Status</th><th /></tr></thead>
        <tbody>{db.customerCredits.map((credit) => {
          const due = credit.amount - credit.paid;
          return <tr key={credit.id}>
            <td>{dateStr(credit.t)}</td><td><b>{customerName(credit.customerId)}</b></td><td>{credit.description}
              {credit.payments.length > 0 && <details><summary>Payments ({credit.payments.length})</summary>{credit.payments.map((payment, index) => <div className="line" key={index}><span>{dateStr(payment.t)} · {payment.method}{payment.ref ? ` · ${payment.ref}` : ""} · {payment.by}</span><b>{money(payment.amount)}</b></div>)}</details>}
            </td>
            <td className="r">{money(credit.amount)}</td><td className="r">{money(credit.paid)}</td><td className="r"><b>{money(due)}</b></td>
            <td><span className={"badge " + (due === 0 ? "live" : "paused")}>{due === 0 ? "Paid" : "Outstanding"}</span></td>
            <td className="r">{due > 0 && <button className="btn sm" onClick={() => { setRepayId(credit.id); setRepayAmount(String(due)); setMethod(METHODS[0]); setRepayRef(""); }}>Record payment</button>}</td>
          </tr>;
        })}
          {!db.customerCredits.length && <tr><td colSpan="8" className="empty">No customer loans recorded yet.</td></tr>}
        </tbody>
      </table></div>

      {activeCredit && <Modal title="Record customer payment" onClose={() => setRepayId(null)} foot={<>
        <button className="btn" onClick={() => setRepayId(null)}>Cancel</button>
        <button className="btn primary" disabled={!Number.isFinite(Number(repayAmount)) || Number(repayAmount) <= 0 || Number(repayAmount) > activeCredit.amount - activeCredit.paid || (method !== "Cash" && !repayRef.trim())} onClick={() => {
          if (repayCustomerCredit(activeCredit.id, Number(repayAmount), method, repayRef)) { setRepayId(null); setRepayRef(""); say("Customer payment recorded"); }
          else say("Unable to record customer payment");
        }}>Save payment</button>
      </>}>
        <p className="muted">{customerName(activeCredit.customerId)} · {activeCredit.description}</p>
        <div className="line"><span>Outstanding</span><b>{money(activeCredit.amount - activeCredit.paid)}</b></div>
        <label>Payment amount (Rs)<input type="number" min="1" max={activeCredit.amount - activeCredit.paid} step="1" value={repayAmount} onChange={(event) => setRepayAmount(event.target.value)} /></label>
        <label>Payment method<select value={method} onChange={(event) => setMethod(event.target.value)}>{METHODS.map((item) => <option key={item}>{item}</option>)}</select></label>
        {method !== "Cash" && <label>Transaction reference<input value={repayRef} onChange={(event) => setRepayRef(event.target.value)} placeholder="Enter transaction reference" /></label>}
      </Modal>}
    </>
  );
}
