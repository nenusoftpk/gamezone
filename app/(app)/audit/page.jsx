"use client";
import { useState } from "react";
import { useStore, timeStr } from "@/lib/store";
import { PageHead } from "@/components/ui";

export default function Audit() {
  const { db } = useStore(), [f, setF] = useState("All");
  if (!db) return null;
  const types = ["All", ...new Set(db.audit.map((a) => a[0]))];
  return (
    <>
      <PageHead title="Audit log" sub="Who did what and when. Entries cannot be edited or deleted.">
        <select value={f} onChange={(e) => setF(e.target.value)}>{types.map((t) => <option key={t}>{t}</option>)}</select>
      </PageHead>
      <div className="panel"><table>
        <thead><tr><th>Time</th><th>Action</th><th>User</th><th>Details</th></tr></thead>
        <tbody>{db.audit.filter((a) => f === "All" || a[0] === f).map((a, i) => <tr key={i}><td>{timeStr(a[3])}</td><td><span className="badge">{a[0]}</span></td><td>{a[1]}</td><td>{a[2]}</td></tr>)}</tbody>
      </table></div>
    </>
  );
}
