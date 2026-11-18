"use client";
import { useState } from "react";
import { useStore, money, dateStr } from "@/lib/store";
import { Modal, PageHead } from "@/components/ui";

const CATEGORIES = ["Rent", "Utilities", "Salaries", "Equipment", "Maintenance", "Supplies", "Other"];

export default function Expenses() {
  const { db, addExpense, say } = useStore();
  const [open, setOpen] = useState(false), [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState(""), [amount, setAmount] = useState("");
  if (!db) return null;

  const role = db.user.role;
  const ledgerTitle = role === "employee" ? "Employee expenses" : "Admin expenses";
  const expenses = db.expenses.filter((expense) => expense.recordedRole === role);
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const reset = () => { setOpen(false); setCategory(CATEGORIES[0]); setDescription(""); setAmount(""); };

  return (
    <>
      <PageHead title={ledgerTitle} sub="This expense ledger is separate from the other role's ledger">
        <button className="btn primary" onClick={() => setOpen(true)}>Add expense</button>
      </PageHead>
      <div className="kpis">
        <div className="kpi"><span>{ledgerTitle} total</span><b>{money(total)}</b><small>Recorded operating costs</small></div>
        <div className="kpi"><span>Expense entries</span><b>{expenses.length}</b><small>{role === "employee" ? "Employee" : "Admin"} ledger entries</small></div>
      </div>
      <div className="panel"><table>
        <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Recorded by</th><th className="r">Amount</th></tr></thead>
        <tbody>{expenses.map((expense) => <tr key={expense.id}>
          <td>{dateStr(expense.t)}</td><td>{expense.category}</td><td>{expense.description}</td><td>{expense.by}</td><td className="r"><b>{money(expense.amount)}</b></td>
        </tr>)}
          {!expenses.length && <tr><td colSpan="5" className="empty">No {role === "employee" ? "employee" : "admin"} expenses recorded yet.</td></tr>}
        </tbody>
      </table></div>

      {open && <Modal title="Record expense" onClose={reset} foot={<>
        <button className="btn" onClick={reset}>Cancel</button>
        <button className="btn primary" disabled={!description.trim() || !Number.isFinite(Number(amount)) || Number(amount) <= 0} onClick={() => {
          if (addExpense(category, description.trim(), Number(amount))) { reset(); say("Expense recorded"); }
          else say("Unable to record expense");
        }}>Save expense</button>
      </>}>
        <label>Category<select value={category} onChange={(event) => setCategory(event.target.value)}>{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Description<input value={description} onChange={(event) => setDescription(event.target.value)} /></label>
        <label>Amount (Rs)<input type="number" min="1" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
      </Modal>}
    </>
  );
}
