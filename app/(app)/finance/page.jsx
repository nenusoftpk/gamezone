"use client";
import { useState } from "react";
import { useStore, money, dateStr } from "@/lib/store";
import { Modal, PageHead } from "@/components/ui";

const CATEGORIES = ["Rent", "Utilities", "Salaries", "Equipment", "Maintenance", "Supplies", "Other"];
const METHODS = ["Cash", "Easypaisa", "JazzCash", "Bank transfer"];

export default function Finance() {
  const { db, addExpense, addCustomerCredit, repayCustomerCredit, say } = useStore();
  const [tab, setTab] = useState("expenses");
  const [expenseOpen, setExpenseOpen] = useState(false), [creditOpen, setCreditOpen] = useState(false), [repayId, setRepayId] = useState(null);
  const [category, setCategory] = useState(CATEGORIES[0]), [description, setDescription] = useState(""), [amount, setAmount] = useState("");
  const [customerId, setCustomerId] = useState(""), [creditDescription, setCreditDescription] = useState(""), [creditAmount, setCreditAmount] = useState("");
  const [repayAmount, setRepayAmount] = useState(""), [method, setMethod] = useState(METHODS[0]), [repayRef, setRepayRef] = useState("");
  if (!db) return null;

  const sessionRevenue = db.sessions.reduce((sum, session) => sum + session.amount, 0);
  const expensesTotal = db.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const creditDue = db.customerCredits.reduce((sum, credit) => sum + credit.amount - credit.paid, 0);
  const activeCredit = db.customerCredits.find((credit) => credit.id === repayId);
  const customerName = (id) => db.customers.find((customer) => customer.id === id)?.name || "Unknown customer";
  const resetExpense = () => { setExpenseOpen(false); setDescription(""); setAmount(""); setCategory(CATEGORIES[0]); };
  const resetCredit = () => { setCreditOpen(false); setCustomerId(""); setCreditDescription(""); setCreditAmount(""); };

  return (
    <>
      <PageHead title="Loans & expenses" sub="Track customer loans, repayments and operating costs alongside earned revenue">
        <button className="btn" onClick={() => setCreditOpen(true)}>Record customer loan</button>
        <button className="btn primary" onClick={() => setExpenseOpen(true)}>Add expense</button>
      </PageHead>
      <div className="kpis">
        <div className="kpi"><span>Session revenue</span><b>{money(sessionRevenue)}</b><small>Earned from play time</small></div>
        <div className="kpi"><span>Expenses</span><b>{money(expensesTotal)}</b><small>Recorded operating costs</small></div>
        <div className="kpi"><span>Net profit</span><b>{money(sessionRevenue - expensesTotal)}</b><small>Session revenue less expenses</small></div>
        <div className="kpi"><span>Customer credit due</span><b>{money(creditDue)}</b><small>Outstanding unpaid charges</small></div>
      </div>
      <div className="tabs">
        {[["expenses", "Expenses"], ["credit", "Customer loans"]].map(([key, label]) => <button key={key} className={tab === key ? "on" : ""} onClick={() => setTab(key)}>{label}</button>)}
      </div>
      <div className="panel">
        {tab === "expenses" ? (
          <table>
            <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Recorded by</th><th className="r">Amount</th></tr></thead>
            <tbody>{db.expenses.map((expense) => <tr key={expense.id}><td>{dateStr(expense.t)}</td><td>{expense.category}</td><td>{expense.description}</td><td>{expense.by}</td><td className="r"><b>{money(expense.amount)}</b></td></tr>)}
              {!db.expenses.length && <tr><td colSpan="5" className="empty">No expenses recorded yet.</td></tr>}</tbody>
          </table>
        ) : (
          <table>
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
              {!db.customerCredits.length && <tr><td colSpan="8" className="empty">No customer loans recorded yet.</td></tr>}</tbody>
          </table>
        )}
      </div>

      {expenseOpen && <Modal title="Record expense" onClose={resetExpense} foot={<><button className="btn" onClick={resetExpense}>Cancel</button><button className="btn primary" disabled={!description.trim() || !Number.isFinite(Number(amount)) || Number(amount) <= 0} onClick={() => {
        if (addExpense(category, description.trim(), Number(amount))) { resetExpense(); say("Expense recorded"); } else say("Unable to record expense");
      }}>Save expense</button></>}>
        <label>Category<select value={category} onChange={(event) => setCategory(event.target.value)}>{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Description<input value={description} onChange={(event) => setDescription(event.target.value)} /></label>
        <label>Amount (Rs)<input type="number" min="1" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
      </Modal>}

      {creditOpen && <Modal title="Record customer loan" onClose={resetCredit} foot={<><button className="btn" onClick={resetCredit}>Cancel</button><button className="btn primary" disabled={!customerId || !creditDescription.trim() || !Number.isFinite(Number(creditAmount)) || Number(creditAmount) <= 0} onClick={() => {
        if (addCustomerCredit(Number(customerId), creditDescription.trim(), Number(creditAmount))) { resetCredit(); say("Customer loan recorded"); } else say("Unable to record customer loan");
      }}>Save loan</button></>}>
        <label>Customer<select value={customerId} onChange={(event) => setCustomerId(event.target.value)}><option value="">Select a customer</option>{db.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
        <label>Reason for loan<input value={creditDescription} onChange={(event) => setCreditDescription(event.target.value)} placeholder="e.g. Unpaid gaming session" /></label>
        <label>Amount owed (Rs)<input type="number" min="1" step="1" value={creditAmount} onChange={(event) => setCreditAmount(event.target.value)} /></label>
      </Modal>}

      {activeCredit && <Modal title="Record customer payment" onClose={() => setRepayId(null)} foot={<><button className="btn" onClick={() => setRepayId(null)}>Cancel</button><button className="btn primary" disabled={!Number.isFinite(Number(repayAmount)) || Number(repayAmount) <= 0 || Number(repayAmount) > activeCredit.amount - activeCredit.paid || (method !== "Cash" && !repayRef.trim())} onClick={() => {
        if (repayCustomerCredit(activeCredit.id, Number(repayAmount), method, repayRef)) { setRepayId(null); setRepayRef(""); say("Customer payment recorded"); } else say("Unable to record customer payment");
      }}>Save payment</button></>}>
        <p className="muted">{customerName(activeCredit.customerId)} · {activeCredit.description}</p>
        <div className="line"><span>Outstanding</span><b>{money(activeCredit.amount - activeCredit.paid)}</b></div>
        <label>Payment amount (Rs)<input type="number" min="1" max={activeCredit.amount - activeCredit.paid} step="1" value={repayAmount} onChange={(event) => setRepayAmount(event.target.value)} /></label>
        <label>Payment method<select value={method} onChange={(event) => setMethod(event.target.value)}>{METHODS.map((item) => <option key={item}>{item}</option>)}</select></label>
        {method !== "Cash" && <label>Transaction reference<input value={repayRef} onChange={(event) => setRepayRef(event.target.value)} placeholder="Enter transaction reference" /></label>}
      </Modal>}
    </>
  );
}
