"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { PageHead } from "@/components/ui";

export default function Account() {
  const { db, changeOwnPassword, say } = useStore();
  const [current, setCurrent] = useState(""), [next, setNext] = useState(""), [confirm, setConfirm] = useState(""), [error, setError] = useState("");
  if (!db) return null;

  const submit = (e) => {
    e.preventDefault();
    if (next.length < 8) return setError("New password must be at least 8 characters.");
    if (next !== confirm) return setError("New passwords do not match.");
    const result = changeOwnPassword(current, next);
    if (result) return setError(result);
    setCurrent(""); setNext(""); setConfirm(""); setError(""); say("Password changed");
  };

  return (
    <>
      <PageHead title="Change password" sub={`Update the password for ${db.user.name}'s account`} />
      <form className="panel sect" onSubmit={submit}>
        <label>Current password<input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required /></label>
        <label>New password<input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} minLength={8} required /></label>
        <label>Confirm new password<input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={8} required /></label>
        {error && <div className="callout warn" role="alert">{error}</div>}
        <button className="btn primary" disabled={!current || !next || !confirm}>Update password</button>
      </form>
    </>
  );
}
