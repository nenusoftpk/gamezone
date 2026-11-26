"use client";
import { useStore, dateStr, timeStr } from "@/lib/store";
import { PageHead } from "@/components/ui";

export default function PlatformAudit() {
  const { db, platformLoading, platformError } = useStore();
  if (!db) return null;
  if (platformLoading) return <div className="boot">Loading platform data…</div>;
  if (platformError) return <><PageHead title="Platform audit" sub="Every change to branches, plans and payments. Entries cannot be edited." /><div className="callout warn" role="alert">{platformError}</div></>;
  return (
    <>
      <PageHead title="Platform audit" sub="Every change to branches, plans and payments. Entries cannot be edited." />
      <div className="panel"><table>
        <thead><tr><th>When</th><th>Action</th><th>By</th><th>Details</th></tr></thead>
        <tbody>{db.platformAudit.map((a, i) => <tr key={i}><td>{dateStr(a[3])} · {timeStr(a[3])}</td><td><span className="badge">{a[0]}</span></td><td>{a[1]}</td><td>{a[2]}</td></tr>)}</tbody>
      </table></div>
    </>
  );
}
