"use client";
import { useState } from "react";
import { EMP } from "@/lib/data";
import { money, useStore } from "@/lib/store";
import { Avatar, Modal, PageHead } from "@/components/ui";

export default function Employees() {
  const { say } = useStore(), [e, setE] = useState(EMP), [add, setAdd] = useState(false), [n, setN] = useState("");
  return (
    <>
      <PageHead title="Employees" sub="Cashier accounts, shifts and the refund amount each can approve alone"><button className="btn primary" onClick={() => setAdd(true)}>Add employee</button></PageHead>
      <div className="panel"><table>
        <thead><tr><th>Employee</th><th>Role</th><th>Shift</th><th className="r">Refund limit</th><th>Active</th><th /></tr></thead>
        <tbody>{e.map((x, i) => <tr key={x.id}><td><div className="cell"><Avatar name={x.name} />{x.name}</div></td><td>{x.role}</td><td>{x.shift}</td><td className="r">{money(x.limit)}</td>
          <td><button className={"switch" + (x.on ? " on" : "")} onClick={() => setE(e.map((y, j) => j === i ? { ...y, on: !y.on } : y))} aria-label={`Toggle ${x.name}`} /></td>
          <td className="r"><button className="btn sm" onClick={() => say("Password reset link created")}>Reset password</button></td></tr>)}</tbody>
      </table></div>
      {add && <Modal title="Add employee" onClose={() => setAdd(false)} foot={<><button className="btn" onClick={() => setAdd(false)}>Cancel</button><button className="btn primary" disabled={!n.trim()} onClick={() => { setE([...e, { id: Date.now(), name: n, role: "Cashier", shift: "Unassigned", limit: 300, on: true }]); setAdd(false); setN(""); say("Employee added"); }}>Create account</button></>}>
        <label>Full name<input value={n} onChange={(x) => setN(x.target.value)} /></label>
      </Modal>}
    </>
  );
}
