"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Icon, PageHead } from "@/components/ui";

export default function Account() {
  const { db, changeOwnPassword, say } = useStore();
  const [current, setCurrent] = useState(""), [next, setNext] = useState(""), [confirm, setConfirm] = useState(""), [error, setError] = useState(""), [saving, setSaving] = useState(false);
  const [visible, setVisible] = useState({ current: false, next: false, confirm: false });
  if (!db) return null;
  const minPasswordLength = db.user.role === "superadmin" ? 12 : 8;
  const toggleVisible = (field) => setVisible((value) => ({ ...value, [field]: !value[field] }));

  const passwordInput = (label, field, value, setValue, autoComplete) => (
    <label>{label}
      <div className="pw">
        <input type={visible[field] ? "text" : "password"} autoComplete={autoComplete} value={value} onChange={(e) => setValue(e.target.value)} minLength={field === "current" ? undefined : minPasswordLength} required />
        <button type="button" className="eye" onClick={() => toggleVisible(field)} aria-label={visible[field] ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} aria-pressed={visible[field]}>
          <Icon n={visible[field] ? "eyeOff" : "eye"} />
        </button>
      </div>
    </label>
  );

  const submit = async (e) => {
    e.preventDefault();
    if (next.length < minPasswordLength) return setError(`New password must be at least ${minPasswordLength} characters.`);
    if (next !== confirm) return setError("New passwords do not match.");
    setSaving(true);
    try {
      const result = await changeOwnPassword(current, next);
      if (result) return setError(result);
      setCurrent(""); setNext(""); setConfirm(""); setError(""); say("Password changed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHead title="Change password" sub={`Update the password for ${db.user.name}'s account`} />
      <form className="panel sect" onSubmit={submit}>
        {passwordInput("Current password", "current", current, setCurrent, "current-password")}
        {passwordInput("New password", "next", next, setNext, "new-password")}
        {passwordInput("Confirm new password", "confirm", confirm, setConfirm, "new-password")}
        {error && <div className="callout warn" role="alert">{error}</div>}
        <button className="btn primary account-password-submit" disabled={!current || !next || !confirm || saving}>{saving ? "Updating…" : "Update password"}</button>
      </form>
    </>
  );
}
