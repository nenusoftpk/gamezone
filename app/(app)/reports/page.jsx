"use client";
import { useState } from "react";
import { useStore, money } from "@/lib/store";
import { PageHead } from "@/components/ui";

export default function Reports() {
  const { db, say } = useStore(), [tab, setTab] = useState("station");
  if (!db) return null;
  const grp = (rows, key) => Object.entries(rows.reduce((o, r) => { const k = key(r); (o[k] ||= { n: 0, a: 0 }); o[k].n++; o[k].a += r.amount; return o; }, {})).map(([k, v]) => [k, v.n, v.a]);
  const tops = db.ledger.filter((l) => l.type === "topup");
  const T = {
    station: ["Station", "Sessions", "Session revenue", grp(db.sessions, (s) => s.station)],
    game: ["Game", "Sessions", "Session revenue", grp(db.sessions, (s) => s.game)],
    method: ["Payment method", "Top-ups", "Cash collected", grp(tops, (l) => l.method)],
    emp: ["Employee", "Top-ups", "Cash collected", grp(tops, (l) => l.by)],
  };
  const [c1, c2, c3, rows] = T[tab] || [];
  const total = rows?.reduce((a, r) => a + r[2], 0) || 0;
  const csv = () => {
    const data = tab === "cafe"
      ? [["Product", "In stock", "Reorder at", "Selling price", "Status"], ...db.cafeStock.map((item) => [item.n, item.q, item.min, item.price, item.q < item.min ? "Reorder" : "OK"])]
      : [[c1, c2, c3], ...rows];
    const content = data.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const b = new Blob([content], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = `report-${tab}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 0);
    say("Report exported");
  };
  return (
    <>
      <PageHead title="Reports" sub="Session revenue, top-ups and cafe stock are reported separately"><button className="btn" onClick={csv}>Export CSV</button></PageHead>
      <div className="tabs">{[["station", "By station"], ["game", "By game"], ["method", "By payment method"], ["emp", "By employee"], ["cafe", "Cafe stock"]].map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}</div>
      <div className="panel">{tab === "cafe" ? <table>
        <thead><tr><th>Product</th><th className="r">In stock</th><th className="r">Reorder at</th><th className="r">Selling price</th><th>Status</th></tr></thead>
        <tbody>{db.cafeStock.length ? <>
          {db.cafeStock.map((item) => <tr key={item.n}><td><b>{item.n}</b></td><td className="r">{item.q}</td><td className="r">{item.min}</td><td className="r">{money(item.price)}</td><td><span className={"badge " + (item.q < item.min ? "low" : "live")}>{item.q < item.min ? "Reorder" : "OK"}</span></td></tr>)}
          <tr><td><b>Totals</b></td><td className="r"><b>{db.cafeStock.reduce((sum, item) => sum + item.q, 0)}</b></td><td colSpan="2">{db.cafeStock.length} products · {db.cafeStock.filter((item) => item.q < item.min).length} below reorder level</td><td /></tr>
        </> : <tr><td colSpan="5" className="empty">No cafe stock has been added.</td></tr>}</tbody>
      </table> : <table>
        <thead><tr><th>{c1}</th><th className="r">{c2}</th><th className="r">{c3}</th><th>Share</th></tr></thead>
        <tbody>{rows.sort((a, b) => b[2] - a[2]).map((r) => <tr key={r[0]}><td><b>{r[0]}</b></td><td className="r">{r[1]}</td><td className="r">{money(r[2])}</td><td><div className="prog"><i style={{ width: (r[2] / total) * 100 + "%" }} /></div></td></tr>)}
          <tr><td><b>Total</b></td><td className="r">{rows.reduce((a, r) => a + r[1], 0)}</td><td className="r"><b>{money(total)}</b></td><td /></tr></tbody>
      </table>}</div>
    </>
  );
}
