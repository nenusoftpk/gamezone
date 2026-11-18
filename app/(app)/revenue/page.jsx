"use client";
import { useStore, money, dateStr, timeStr } from "@/lib/store";
import { PageHead } from "@/components/ui";

export default function Revenue() {
  const { db } = useStore();
  if (!db) return null;

  const sessionRevenue = db.sessions.reduce((sum, session) => sum + session.amount, 0);
  const cafeRevenue = db.cafeOrders.reduce((sum, order) => sum + order.total, 0);
  const expenses = db.expenses.filter((expense) => expense.recordedRole === db.user.role)
    .reduce((sum, expense) => sum + expense.amount, 0);
  const prepayments = db.ledger.filter((entry) => ["topup", "package"].includes(entry.type))
    .reduce((sum, entry) => sum + (entry.type === "package" ? entry.paid : entry.amount), 0);
  const dueAtCheckout = db.sessions.reduce((sum, session) => sum + (session.due || 0), 0);
  const customerName = (id) => db.customers.find((customer) => customer.id === id)?.name || "Walk-in";
  const revenueRows = [
    ...db.sessions.map((session) => ({
      id: `session-${session.id}`, t: session.t, source: "Game session", customer: customerName(session.customerId),
      details: `${session.station} · ${session.game}`, amount: session.amount, received: session.paid ?? session.amount, due: session.due || 0,
    })),
    ...db.cafeOrders.map((order) => ({
      id: `cafe-${order.id}`, t: order.t, source: "Cafe order", customer: customerName(order.customerId),
      details: order.items.map((item) => `${item.name} × ${item.quantity}`).join(", "), amount: order.total, received: order.total, due: 0,
    })),
  ].sort((a, b) => b.t - a.t);

  return (
    <>
      <PageHead title="Revenue" sub="Earned game and cafe sales, kept separate from wallet prepayments" />
      <div className="kpis">
        <div className="kpi"><span>Game revenue</span><b>{money(sessionRevenue)}</b><small>Completed play sessions</small></div>
        <div className="kpi"><span>Cafe sales</span><b>{money(cafeRevenue)}</b><small>Paid cafe orders</small></div>
        <div className="kpi"><span>Expenses</span><b>{money(expenses)}</b><small>{db.user.role === "employee" ? "Employee" : "Admin"} expense ledger</small></div>
        <div className="kpi"><span>Net after recorded expenses</span><b>{money(sessionRevenue + cafeRevenue - expenses)}</b><small>Sales minus recorded expenses</small></div>
      </div>
      <div className="callout" style={{ margin: "0 0 18px" }}>
        Wallet top-ups and package payments ({money(prepayments)}) are prepayments, not earned revenue. Unpaid session bills: <b>{money(dueAtCheckout)}</b>.
      </div>
      <div className="panel"><table>
        <thead><tr><th>Date</th><th>Source</th><th>Customer</th><th>Details</th><th className="r">Earned</th><th className="r">Received</th><th className="r">Due</th></tr></thead>
        <tbody>{revenueRows.map((row) => <tr key={row.id}>
          <td>{dateStr(row.t)} · {timeStr(row.t)}</td><td>{row.source}</td><td>{row.customer}</td><td>{row.details}</td>
          <td className="r"><b>{money(row.amount)}</b></td><td className="r">{money(row.received)}</td><td className={"r " + (row.due > 0 ? "neg" : "pos")}>{money(row.due)}</td>
        </tr>)}
          {!revenueRows.length && <tr><td colSpan="7" className="empty">No revenue has been recorded yet.</td></tr>}
        </tbody>
      </table></div>
    </>
  );
}
