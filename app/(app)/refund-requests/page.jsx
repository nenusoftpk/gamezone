"use client";
import { useState } from "react";
import { useStore, money, timeStr } from "@/lib/store";
import { PageHead } from "@/components/ui";

export default function RefundRequests() {
  const { db, requestRefund, say } = useStore();
  const [c, setC] = useState(0), [amt, setAmt] = useState(""), [why, setWhy] = useState("");
  if (!db) return null;
  const mine = db.refunds.filter((r) => r.by === db.user.name), cu = db.customers.find((x) => x.id === +c);
  const ok = +amt > 0 && cu && +amt <= cu.balance && why.trim();
  return (
    <>
      <PageHead title="Refund requests" sub="Every refund needs admin approval. The wallet is credited once it is approved." />
      <div className="split">
        <section className="panel pad"><h3>My requests</h3>
          <table style={{ marginTop: 8 }}><thead><tr><th>Time</th><th>Customer</th><th>Reason</th><th className="r">Amount</th><th>Status</th></tr></thead>
            <tbody>{mine.map((r) => <tr key={r.id}><td>{timeStr(r.t)}</td><td>{db.customers.find((x) => x.id === r.customerId)?.name || "Walk-in"}</td><td>{r.why}</td><td className="r"><b>{money(r.amt)}</b></td>
              <td><span className={"badge " + ({ pending: "paused", approved: "live", rejected: "low" }[r.st])}>{r.st}</span></td></tr>)}
              {!mine.length && <tr><td colSpan="5" className="empty">You have not requested any refund yet.</td></tr>}</tbody></table>
        </section>
        <section className="panel pad"><h3>New request</h3>
          <label>Customer<select value={c} onChange={(e) => setC(e.target.value)}>{db.customers.map((x) => <option key={x.id} value={x.id}>{x.name} · {money(x.balance)}</option>)}</select></label>
          <label>Amount (Rs)<input type="number" value={amt} onChange={(e) => setAmt(e.target.value)} /></label>
          <label>Reason<input value={why} onChange={(e) => setWhy(e.target.value)} placeholder="e.g. Console froze" /></label>
          {amt && cu && +amt > cu.balance && <div className="callout warn">This is more than the wallet balance ({money(cu.balance)}).</div>}
          <button className="btn primary full lg" disabled={!ok} onClick={() => { requestRefund(+c, +amt, why.trim()); setAmt(""); setWhy(""); say("Refund sent to admin for approval"); }}>Send for approval</button>
        </section>
      </div>
    </>
  );
}
