"use client";
import { useState } from "react";
import { useStore, money, timeStr, dateStr } from "@/lib/store";
import { PageHead } from "@/components/ui";

export default function Cash() {
  const { db, say, closeShift } = useStore();
  const [float, setFloat] = useState(2000), [count, setCount] = useState(""), [closed, setClosed] = useState(false);
  if (!db) return null;
  const mine = db.user.role === "employee";
  const tops = db.ledger.filter((l) => (l.type === "topup" || l.type === "package" || l.type === "session_payment") && (!mine || l.by === db.user.name));
  const paid = (l) => (l.type === "package" ? l.paid : l.amount);
  const by = tops.reduce((o, l) => ({ ...o, [l.method]: (o[l.method] || 0) + paid(l) }), {});
  const cash = by.Cash || 0, digital = Object.entries(by).filter(([k]) => k !== "Cash").reduce((a, [, v]) => a + v, 0);
  const refunded = db.refunds.filter((r) => r.st === "approved" && (!mine || r.by === db.user.name)).reduce((a, r) => a + r.amt, 0);
  const expected = +float + cash, diff = count === "" ? null : +count - expected;
  const shifts = db.shifts.filter((s) => !mine || s.by === db.user.name);
  return (
    <>
      <PageHead title="Cash collection" sub={mine ? "Your shift: what came in, what should be in the drawer, and what you counted" : "All cashiers today"}>
        <button className="btn primary" disabled={count === "" || closed} onClick={() => { closeShift(expected, +count); setClosed(true); say("Shift closed and saved"); }}>{closed ? "Shift closed" : "Close shift"}</button>
      </PageHead>
      <div className="kpis">
        <div className="kpi"><span>Cash received</span><b>{money(cash)}</b><small>Top-ups, packages and checkouts</small></div>
        <div className="kpi"><span>Digital received</span><b>{money(digital)}</b><small>Wallet and session payments</small></div>
        <div className="kpi"><span>Opening float</span><b>{money(float)}</b><small>Cash in drawer at start</small></div>
        <div className="kpi"><span>Expected in drawer</span><b>{money(expected)}</b><small>Float + cash received</small></div>
      </div>
      <div className="split">
        <section className="panel pad"><h3>Count the drawer</h3>
          <div className="fg"><label>Opening float (Rs)<input type="number" value={float} disabled={closed} onChange={(e) => setFloat(e.target.value)} /></label>
            <label>Counted cash (Rs)<input className="big-in" type="number" placeholder="0" value={count} disabled={closed} onChange={(e) => setCount(e.target.value)} /></label></div>
          <div className={"callout " + (diff === null || diff === 0 ? "" : "warn")} style={{ marginTop: 18 }}>
            {diff === null ? "Enter the counted amount to see the difference." : diff === 0 ? <>Drawer matches. <b>No difference.</b></> : <>Difference <b>{diff > 0 ? "+" : "−"}{money(Math.abs(diff))}</b> ({diff > 0 ? "extra cash" : "cash short"}). The admin will see this when you close the shift.</>}
          </div>
          {refunded > 0 && <p className="muted" style={{ marginTop: 12 }}>Approved refunds this period: {money(refunded)}. Refunds credit the wallet and do not come out of the drawer.</p>}
          <h3 style={{ marginTop: 24 }}>By payment method</h3>
          {Object.entries(by).map(([k, v]) => <div className="line" key={k}><span>{k}</span><b>{money(v)}</b></div>)}
        </section>
        <section className="panel pad"><h3>Entries this shift</h3>
          {tops.map((l) => <div className="line" key={l.id}><span>{timeStr(l.t)} · {db.customers.find((c) => c.id === l.customerId)?.name}<br /><small className="muted">{l.type === "session_payment" ? "Session checkout" : l.type === "package" ? "Package" : "Top-up"} · {l.method}{l.ref ? ` · ${l.ref}` : ""}{l.no ? ` · ${l.no}` : ""}</small></span><b className="pos">+{money(paid(l))}</b></div>)}
          {!tops.length && <p className="muted">No collections yet in this shift.</p>}
        </section>
      </div>
      <div className="panel" style={{ marginTop: 18 }}><table>
        <thead><tr><th>Closed on</th><th>Cashier</th><th className="r">Expected</th><th className="r">Counted</th><th className="r">Difference</th></tr></thead>
        <tbody>{shifts.map((s) => <tr key={s.id}><td>{dateStr(s.t)} · {timeStr(s.t)}</td><td>{s.by}</td><td className="r">{money(s.expected)}</td><td className="r">{money(s.counted)}</td>
          <td className={"r " + (s.counted === s.expected ? "pos" : "neg")}><b>{s.counted - s.expected === 0 ? "Matched" : (s.counted > s.expected ? "+" : "−") + money(Math.abs(s.counted - s.expected))}</b></td></tr>)}
          {!shifts.length && <tr><td colSpan="5" className="empty">No closed shifts yet.</td></tr>}</tbody>
      </table></div>
    </>
  );
}
