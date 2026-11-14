"use client";
import { useStore, money, timeStr } from "@/lib/store";
import { PageHead } from "@/components/ui";

export default function Refunds() {
  const { db, decideRefund, say } = useStore();
  if (!db) return null;
  const set = (id, st) => { decideRefund(id, st); say(st === "approved" ? "Refund approved and credited to the wallet" : "Refund rejected"); };
  const pend = db.refunds.filter((x) => x.st === "pending");
  return (
    <>
      <PageHead title="Refunds" sub={`${pend.length} waiting for approval. Approved refunds are added to the wallet ledger.`} />
      <div className="panel"><table>
        <thead><tr><th>Time</th><th>Customer</th><th>Requested by</th><th>Reason</th><th className="r">Amount</th><th>Status</th><th /></tr></thead>
        <tbody>{db.refunds.map((x) => <tr key={x.id}><td>{timeStr(x.t)}</td><td><b>{db.customers.find((c) => c.id === x.customerId)?.name || "Walk-in"}</b></td><td>{x.by}</td><td>{x.why}</td><td className="r"><b>{money(x.amt)}</b></td>
          <td><span className={"badge " + ({ pending: "paused", approved: "live", rejected: "low" }[x.st])}>{x.st}</span></td>
          <td className="r">{x.st === "pending" && <span className="qty"><button style={{ width: "auto", padding: "0 10px" }} onClick={() => set(x.id, "rejected")}>Reject</button><button className="btn primary sm" onClick={() => set(x.id, "approved")}>Approve</button></span>}</td></tr>)}</tbody>
      </table></div>
    </>
  );
}
