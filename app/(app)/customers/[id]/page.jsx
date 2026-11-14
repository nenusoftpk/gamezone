"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useStore, money, dateStr, timeStr } from "@/lib/store";
import { Avatar, Modal, Icon } from "@/components/ui";
import TopUp from "@/components/TopUp";

export default function Customer() {
  const { id } = useParams(), { db, requestRefund, say } = useStore();
  const [top, setTop] = useState(false), [rf, setRf] = useState(false), [amt, setAmt] = useState(""), [why, setWhy] = useState("");
  if (!db) return null;
  const c = db.customers.find((x) => x.id === +id);
  if (!c) return <><Link className="back" href="/customers">← Customers</Link><div className="panel pad">This customer was not found. Go back to the list and pick another.</div></>;
  const led = db.ledger.filter((l) => l.customerId === c.id), ses = db.sessions.filter((s) => s.customerId === c.id);
  const topped = led.filter((l) => l.type !== "debit" && l.type !== "refund").reduce((a, l) => a + l.amount, 0), spent = ses.reduce((a, s) => a + s.amount, 0);
  const kind = { topup: ["Top-up", "live"], package: ["Package", "live"], refund: ["Refund", "low"], debit: ["Session", "paused"] };
  return (
    <>
      <Link className="back" href="/customers">← Customers</Link>
      <header className="page-head"><div className="hdr"><Avatar name={c.name} /><div><h1>{c.name}</h1><p style={{ margin: 0, color: "var(--mu)" }}>{c.phone}</p></div></div>
        <div className="head-actions"><button className="btn" onClick={() => setRf(true)}>Request refund</button><button className="btn primary" onClick={() => setTop(true)}><Icon n="plus" size={16} />Top-up</button></div></header>
      <div className="kpis">
        <div className="kpi"><span>Wallet balance</span><b>{money(c.balance)}</b><small>Available now</small></div>
        <div className="kpi"><span>Total added</span><b>{money(topped)}</b><small>Top-ups and packages</small></div>
        <div className="kpi"><span>Total played</span><b>{money(spent)}</b><small>Across all sessions</small></div>
        <div className="kpi"><span>Sessions</span><b>{ses.length}</b><small>{ses.reduce((a, s) => a + s.minutes, 0)} minutes</small></div>
      </div>
      <div className="panel"><table>
        <thead><tr><th>Date</th><th>Type</th><th>Details</th><th className="r">Amount</th></tr></thead>
        <tbody>{led.map((l) => <tr key={l.id}><td>{dateStr(l.t)} · {timeStr(l.t)}</td><td><span className={"badge " + kind[l.type][1]}>{kind[l.type][0]}</span></td>
          <td>{l.type === "debit" ? `Played on ${l.method}` : `${l.method}${l.ref ? " · " + l.ref : ""}${l.no ? " · " + l.no : ""}`}</td>
          <td className={"r " + (l.amount < 0 ? "neg" : "pos")}><b>{l.amount < 0 ? "−" : "+"}{money(Math.abs(l.amount))}</b></td></tr>)}
          {!led.length && <tr><td colSpan="4" className="empty">No wallet activity yet. Add a top-up to get started.</td></tr>}</tbody>
      </table></div>
      {top && <TopUp initial={c.id} onClose={() => setTop(false)} />}
      {rf && <Modal title="Request refund" onClose={() => setRf(false)} foot={<><button className="btn" onClick={() => setRf(false)}>Cancel</button><button className="btn primary" disabled={!(+amt > 0 && +amt <= c.balance) || !why.trim()} onClick={() => { requestRefund(c.id, +amt, why.trim()); setRf(false); setAmt(""); setWhy(""); say("Refund sent to admin for approval"); }}>Send for approval</button></>}>
        <label>Amount (Rs, up to {money(c.balance)})<input type="number" value={amt} onChange={(e) => setAmt(e.target.value)} /></label>
        <label>Reason<input value={why} onChange={(e) => setWhy(e.target.value)} placeholder="Why is this refund needed?" /></label>
      </Modal>}
    </>
  );
}
