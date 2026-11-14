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
  const [c1, c2, c3, rows] = T[tab], total = rows.reduce((a, r) => a + r[2], 0);
  const csv = () => { const b = new Blob([[c1, c2, c3, ...[]].join(",") + "\n" + rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `report-${tab}.csv`; a.click(); say("Report exported"); };
  return (
    <>
      <PageHead title="Reports" sub="Session revenue and top-ups are shown separately, never mixed"><button className="btn" onClick={csv}>Export CSV</button></PageHead>
      <div className="tabs">{[["station", "By station"], ["game", "By game"], ["method", "By payment method"], ["emp", "By employee"]].map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}</div>
      <div className="panel"><table>
        <thead><tr><th>{c1}</th><th className="r">{c2}</th><th className="r">{c3}</th><th>Share</th></tr></thead>
        <tbody>{rows.sort((a, b) => b[2] - a[2]).map((r) => <tr key={r[0]}><td><b>{r[0]}</b></td><td className="r">{r[1]}</td><td className="r">{money(r[2])}</td><td><div className="prog"><i style={{ width: (r[2] / total) * 100 + "%" }} /></div></td></tr>)}
          <tr><td><b>Total</b></td><td className="r">{rows.reduce((a, r) => a + r[1], 0)}</td><td className="r"><b>{money(total)}</b></td><td /></tr></tbody>
      </table></div>
    </>
  );
}
