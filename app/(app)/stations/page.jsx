"use client";
import { useState } from "react";
import { useStore, RATES, money } from "@/lib/store";
import { Modal, PageHead } from "@/components/ui";

const EMPTY_FORM = { name: "", room: "", model: "", perMinute: "5", per30Minutes: "150", perHour: "300" };
const asRates = (form) => ({
  perMinute: Number(form.perMinute),
  per30Minutes: Number(form.per30Minutes),
  perHour: Number(form.perHour),
});

export default function Stations() {
  const { db, addStation, setStation, say } = useStore();
  const [adding, setAdding] = useState(false), [editing, setEditing] = useState(null), [form, setForm] = useState(EMPTY_FORM);
  if (!db) return null;

  const admin = db.user.role === "admin";
  const validRates = [form.perMinute, form.per30Minutes, form.perHour]
    .every((rate) => rate !== "" && Number.isFinite(Number(rate)) && Number(rate) > 0);
  const saveStation = () => {
    if (!addStation(form.name, form.room, form.model, asRates(form))) {
      say("Unable to add station. Check the details and use a unique name.");
      return;
    }
    setAdding(false);
    setForm(EMPTY_FORM);
    say("Station added");
  };
  const saveRates = () => {
    if (!setStation(editing.id, {
      ratePerMinute: Number(form.perMinute),
      ratePer30Minutes: Number(form.per30Minutes),
      ratePerHour: Number(form.perHour),
    })) {
      say("Unable to update station rates");
      return;
    }
    setEditing(null);
    setForm(EMPTY_FORM);
    say("Station rates updated for future sessions");
  };
  const openRates = (station) => {
    setForm({
      ...EMPTY_FORM,
      perMinute: String(station.ratePerMinute ?? RATES[station.plan] / 60),
      per30Minutes: String(station.ratePer30Minutes ?? RATES[station.plan] / 2),
      perHour: String(station.ratePerHour ?? RATES[station.plan]),
    });
    setEditing(station);
  };
  const closeModal = () => { setAdding(false); setEditing(null); setForm(EMPTY_FORM); };
  const fields = (
    <>
      {adding && <>
        <label>Station name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
        <label>Room<input value={form.room} onChange={(event) => setForm({ ...form, room: event.target.value })} /></label>
        <label>Model<input value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })} /></label>
      </>}
      <label>Per-minute rate (Rs)<input type="number" min="0.01" step="0.01" value={form.perMinute} onChange={(event) => setForm({ ...form, perMinute: event.target.value })} /></label>
      <label>30-minute rate (Rs)<input type="number" min="0.01" step="0.01" value={form.per30Minutes} onChange={(event) => setForm({ ...form, per30Minutes: event.target.value })} /></label>
      <label>1-hour rate (Rs)<input type="number" min="0.01" step="0.01" value={form.perHour} onChange={(event) => setForm({ ...form, perHour: event.target.value })} /></label>
      <p className="muted">Per-minute billing charges each minute. A 30-minute block includes 5 minutes grace; an hourly block includes 10 minutes grace. After grace, another 30-minute block is charged.</p>
    </>
  );

  return (
    <>
      <PageHead title="Stations & rates" sub="New rates apply to future sessions. Running sessions keep their saved rates.">
        {admin && <button className="btn primary" onClick={() => { setForm(EMPTY_FORM); setAdding(true); }}>Add station</button>}
      </PageHead>
      <div className="panel"><table>
        <thead><tr><th>Station</th><th>Room</th><th>Model</th><th className="r">Per minute</th><th className="r">30 minutes</th><th className="r">1 hour</th><th>Status</th>{admin && <th />}</tr></thead>
        <tbody>{db.stations.map((station) => (
          <tr key={station.id}><td><b>{station.name}</b></td><td>{station.room}</td><td>{station.model}</td>
            <td className="r">{money(station.ratePerMinute ?? RATES[station.plan] / 60)}</td>
            <td className="r">{money(station.ratePer30Minutes ?? RATES[station.plan] / 2)}</td>
            <td className="r">{money(station.ratePerHour ?? RATES[station.plan])}</td>
            <td><button className={"switch" + (station.status === "ok" ? " on" : "")} disabled={!!station.active || !admin} onClick={() => {
              if (setStation(station.id, { status: station.status === "ok" ? "maintenance" : "ok" })) say("Station status updated");
              else say("Unable to update station status");
            }} aria-label={`Toggle ${station.name}`} title={station.active ? "End the running session first" : ""} /></td>
            {admin && <td className="r"><button className="btn sm" onClick={() => openRates(station)}>Edit rates</button></td>}
          </tr>
        ))}</tbody>
      </table></div>

      {adding && <Modal title="Add station" onClose={closeModal} foot={<><button className="btn" onClick={closeModal}>Cancel</button><button className="btn primary" disabled={!form.name.trim() || !form.room.trim() || !form.model.trim() || !validRates} onClick={saveStation}>Add station</button></>}>{fields}</Modal>}
      {editing && <Modal title={`Edit rates · ${editing.name}`} onClose={closeModal} foot={<><button className="btn" onClick={closeModal}>Cancel</button><button className="btn primary" disabled={!validRates} onClick={saveRates}>Save rates</button></>}>{fields}</Modal>}
    </>
  );
}
