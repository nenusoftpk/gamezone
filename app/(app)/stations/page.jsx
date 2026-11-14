"use client";
import { useStore, RATES, money } from "@/lib/store";
import { PageHead } from "@/components/ui";

export default function Stations() {
  const { db, setStation, say } = useStore();
  if (!db) return null;
  return (
    <>
      <PageHead title="Stations & rates" sub="New rates apply to future sessions. Running sessions keep the rate they started with." />
      <div className="panel"><table>
        <thead><tr><th>Station</th><th>Room</th><th>Model</th><th>Rate plan</th><th className="r">Per hour</th><th>Status</th></tr></thead>
        <tbody>{db.stations.map((s) => (
          <tr key={s.id}><td><b>{s.name}</b></td><td>{s.room}</td><td>{s.model}</td>
            <td><select value={s.plan} onChange={(e) => { setStation(s.id, { plan: e.target.value }); say("Rate plan updated"); }}>{Object.keys(RATES).map((r) => <option key={r}>{r}</option>)}</select></td>
            <td className="r"><b>{money(RATES[s.plan])}</b></td>
            <td><button className={"switch" + (s.status === "ok" ? " on" : "")} disabled={!!s.active} onClick={() => setStation(s.id, { status: s.status === "ok" ? "maintenance" : "ok" })} aria-label={`Toggle ${s.name}`} title={s.active ? "End the running session first" : ""} /></td></tr>
        ))}</tbody>
      </table></div>
    </>
  );
}
