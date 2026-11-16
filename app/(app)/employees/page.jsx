"use client";
import { useState } from "react";
import { money, useStore } from "@/lib/store";
import { Avatar, Modal, PageHead } from "@/components/ui";

const EMPTY_EMPLOYEE = { name: "", username: "", password: "" };

export default function Employees() {
  const { db, say, createEmployee, toggleEmployee, setAccountPassword } = useStore();
  const [add, setAdd] = useState(false), [form, setForm] = useState(EMPTY_EMPLOYEE);
  const [resetting, setResetting] = useState(null), [password, setPassword] = useState(""), [confirm, setConfirm] = useState(""), [error, setError] = useState("");
  if (!db) return null;

  const employees = db.employees.filter((employee) => employee.tenantId === db.user.tenantId);
  const accountFor = (employee) => db.accounts.find((account) => account.employeeId === employee.id);
  const create = () => {
    if (db.accounts.some((account) => account.username.toLowerCase() === form.username.trim().toLowerCase())) return setError("That username is already in use.");
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");
    createEmployee({ ...form, name: form.name.trim(), username: form.username.trim() });
    setAdd(false); setForm(EMPTY_EMPLOYEE); setError(""); say("Employee account created");
  };
  const savePassword = () => {
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    const result = setAccountPassword(accountFor(resetting)?.id, password);
    if (result) return setError(result);
    setResetting(null); setPassword(""); setConfirm(""); setError(""); say("Employee password changed");
  };
  const closeReset = () => { setResetting(null); setPassword(""); setConfirm(""); setError(""); };

  return (
    <>
      <PageHead title="Employees" sub="Cashier accounts, shifts and the refund amount each can approve alone"><button className="btn primary" onClick={() => { setError(""); setAdd(true); }}>Add employee</button></PageHead>
      <div className="panel"><table>
        <thead><tr><th>Employee</th><th>Username</th><th>Role</th><th>Shift</th><th className="r">Refund limit</th><th>Active</th><th /></tr></thead>
        <tbody>{employees.map((employee) => (
          <tr key={employee.id}><td><div className="cell"><Avatar name={employee.name} />{employee.name}</div></td><td>{accountFor(employee)?.username || "—"}</td><td>{employee.role}</td><td>{employee.shift}</td><td className="r">{money(employee.limit)}</td>
            <td><button className={"switch" + (employee.on ? " on" : "")} onClick={() => toggleEmployee(employee.id)} aria-label={`Toggle ${employee.name}`} /></td>
            <td className="r"><button className="btn sm" onClick={() => { setResetting(employee); setError(""); }}>Change password</button></td></tr>
        ))}</tbody>
      </table></div>
      {add && <Modal title="Add employee" onClose={() => setAdd(false)} foot={<><button className="btn" onClick={() => setAdd(false)}>Cancel</button><button className="btn primary" disabled={!form.name.trim() || !form.username.trim() || form.password.length < 8} onClick={create}>Create account</button></>}>
        <label>Full name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label>Username<input autoComplete="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></label>
        <label>Initial password<input type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        {error && <div className="callout warn" role="alert">{error}</div>}
      </Modal>}
      {resetting && <Modal title={`Change password · ${resetting.name}`} onClose={closeReset} foot={<><button className="btn" onClick={closeReset}>Cancel</button><button className="btn primary" disabled={password.length < 8 || !confirm} onClick={savePassword}>Save password</button></>}>
        <p className="muted">Set a new password for username <b>{accountFor(resetting)?.username}</b>.</p>
        <label>New password<input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} /></label>
        <label>Confirm new password<input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={8} /></label>
        {error && <div className="callout warn" role="alert">{error}</div>}
      </Modal>}
    </>
  );
}
