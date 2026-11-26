"use client";
import { useState } from "react";
import { useStore, dateStr, DAY } from "@/lib/store";
import { Modal, PageHead } from "@/components/ui";
import PayModal from "@/components/PayModal";

const EMPTY_BRANCH = { name: "", owner: "", username: "", password: "", plan: "Basic", days: 14 };

export default function Tenants() {
  const { db, toggleTenant, setTenantPlan, createTenant, setBranchAdminPassword, say, platformLoading, platformError } = useStore();
  const [add, setAdd] = useState(false), [pay, setPay] = useState(null), [adminFor, setAdminFor] = useState(null);
  const [form, setForm] = useState(EMPTY_BRANCH), [newPassword, setNewPassword] = useState(""), [confirmPassword, setConfirmPassword] = useState(""), [error, setError] = useState("");
  if (!db || platformLoading) return <div className="boot">Loading platform data…</div>;
  if (platformError) return <><PageHead title="Branches" sub="Every gaming business on the platform, with its plan and access" /><div className="callout warn" role="alert">{platformError}</div></>;
  const tone = { Active: "live", Trial: "paused", Suspended: "low" };
  const days = (t) => Math.ceil((t - Date.now()) / DAY);
  const adminAccount = (tenantId) => db.branchAdmins.find((account) => String(account.tenantId) === String(tenantId));
  const submitBranch = async () => {
    if (db.branchAdmins.some((account) => account.username.toLowerCase() === form.username.trim().toLowerCase())
      || db.accounts.some((account) => account.role === "employee" && account.username.toLowerCase() === form.username.trim().toLowerCase())) return setError("That username is already in use.");
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");
    const result = await createTenant({ ...form, name: form.name.trim(), owner: form.owner.trim(), username: form.username.trim(), days: +form.days });
    if (result) return setError(result);
    setAdd(false); setForm(EMPTY_BRANCH); setError(""); say("Branch created with a trial");
  };
  const submitPassword = async () => {
    if (newPassword.length < 8) return setError("Password must be at least 8 characters.");
    if (newPassword !== confirmPassword) return setError("Passwords do not match.");
    const result = await setBranchAdminPassword(adminFor.id, newPassword);
    if (result) return setError(result);
    setAdminFor(null); setNewPassword(""); setConfirmPassword(""); setError(""); say("Branch admin password changed");
  };
  const changePlan = async (tenant, plan) => {
    const result = await setTenantPlan(tenant.id, plan);
    if (result) setError(result);
    else { setError(""); say("Plan changed"); }
  };
  const changeAccess = async (tenant) => {
    const result = await toggleTenant(tenant.id);
    if (result) setError(result);
    else { setError(""); say(tenant.on ? "Branch suspended" : "Branch reactivated"); }
  };
  const closeAdminPassword = () => { setAdminFor(null); setNewPassword(""); setConfirmPassword(""); setError(""); };
  return (
    <>
      <PageHead title="Branches" sub="Every gaming business on the platform, with its plan and access"><button className="btn primary" onClick={() => { setError(""); setAdd(true); }}>New branch</button></PageHead>
      {error && !add && !adminFor && <div className="callout warn" role="alert">{error}</div>}
      <div className="panel"><table>
        <thead><tr><th>Business</th><th>Owner</th><th>Admin login</th><th>Plan</th><th>Status</th><th>Renews</th><th>Access</th><th /></tr></thead>
        <tbody>{db.tenants.map((t) => (
          <tr key={t.id}><td><b>{t.name}</b></td><td>{t.owner}</td><td>{adminAccount(t.id)?.username || "—"}</td>
            <td><select value={t.plan} onChange={(e) => changePlan(t, e.target.value)}>{Object.keys(db.plans).map((p) => <option key={p}>{p}</option>)}</select></td>
            <td><span className={"badge " + tone[t.status]}>{t.status === "Trial" ? `Trial · ${Math.max(0, days(t.renewsAt))} days left` : t.status}</span></td>
            <td>{dateStr(t.renewsAt)}</td>
            <td><button className={"switch" + (t.on ? " on" : "")} onClick={() => changeAccess(t)} aria-label={`Toggle ${t.name}`} /></td>
            <td className="r"><button className="btn sm" onClick={() => { setAdminFor(t); setError(""); }}>Admin password</button> <button className="btn sm" onClick={() => setPay(t.id)}>Record payment</button></td>
          </tr>))}</tbody>
      </table></div>
      {pay !== null && <PayModal tenantId={pay} onClose={() => setPay(null)} />}
      {add && <Modal title="New branch" onClose={() => setAdd(false)} foot={<><button className="btn" onClick={() => setAdd(false)}>Cancel</button>
        <button className="btn primary" disabled={!form.name.trim() || !form.owner.trim() || !form.username.trim() || form.password.length < 8} onClick={submitBranch}>Create branch</button></>}>
        <label>Business name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label>Owner (becomes the branch admin)<input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} /></label>
        <label>Admin username<input autoComplete="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></label>
        <label>Admin password<input type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        <div className="fg"><label>Plan<select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>{Object.keys(db.plans).map((p) => <option key={p}>{p}</option>)}</select></label>
          <label>Trial days<input type="number" min="0" value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} /></label></div>
        {error && <div className="callout warn" role="alert">{error}</div>}
      </Modal>}
      {adminFor && <Modal title={`Change admin password · ${adminFor.name}`} onClose={closeAdminPassword} foot={<><button className="btn" onClick={closeAdminPassword}>Cancel</button><button className="btn primary" disabled={newPassword.length < 8 || !confirmPassword} onClick={submitPassword}>Save password</button></>}>
        <p className="muted">Admin username: <b>{adminAccount(adminFor.id)?.username || "No account"}</b></p>
        <label>New password<input type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} /></label>
        <label>Confirm new password<input type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={8} /></label>
        {error && <div className="callout warn" role="alert">{error}</div>}
      </Modal>}
    </>
  );
}
