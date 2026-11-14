"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useStore } from "@/lib/store";
import { Icon, Modal } from "@/components/ui";

// Demo accounts only. Replace with a real /api/auth/login call when the backend is ready.
const USERS = {
  // hina: { pw: "hina123", role: "employee", to: "/board" },
  hina: { pw: "hina123", role: "employee", to: "/" },
  // admin: { pw: "admin123", role: "admin", to: "/dashboard" },
  admin: { pw: "admin123", role: "admin", to: "/" },
  super: { pw: "super123", role: "superadmin", to: "/platform" },
};
const QUICK = [["Employee", "hina"], ["Admin", "admin"], ["Superadmin", "super"]];

export default function Login() {
  const { login } = useStore(), router = useRouter();
  const [fp, setFp] = useState(false), [u, setU] = useState(""), [p, setP] = useState(""), [show, setShow] = useState(false), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const submit = (e) => {
    e.preventDefault();
    const acc = USERS[u.trim().toLowerCase()];
    if (!u.trim() || !p) return setErr("Enter your username and password.");
    if (!acc || acc.pw !== p) return setErr("Username or password is incorrect. Check both and try again.");
    setErr(""); setBusy(true); login(acc.role); router.push(acc.to);
  };
  return (
    <div className="login">
      <section className="hero"><div className="hero-art"><Image src="/images/login-gaming.png" alt="A wireless gaming controller lit in blue and purple" fill priority sizes="(max-width: 960px) 100vw, 55vw" className="hero-photo" /></div>
        <span className="mark big"><Icon n="pad" size={28} /></span>
        <h1>Every station, every minute, accounted for.</h1>
        <p>Prepaid wallets, live PS5 timers and automatic billing for your gaming zone.</p>
        <div className="hero-stats"><div><b>8</b><span>stations</span></div><div><b>Rs 300</b><span>per hour from</span></div><div><b>0</b><span>missed minutes</span></div></div>
      </section>
      <section className="roles">
        <form className="lf" onSubmit={submit} noValidate>
          <h2>Welcome back</h2>
          <p className="muted">Sign in to manage your branch.</p>
          <label>Username<input autoComplete="username" value={u} onChange={(e) => setU(e.target.value)} placeholder="e.g. hina" autoFocus /></label>
          <label>Password
            <div className="pw"><input type={show ? "text" : "password"} autoComplete="current-password" value={p} onChange={(e) => setP(e.target.value)} placeholder="Your password" />
              <button type="button" className="eye" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>{show ? "Hide" : "Show"}</button></div>
          </label>
          <button type="button" className="eye fp" onClick={() => setFp(true)}>Forgot password?</button>
          {err && <div className="callout warn" role="alert">{err}</div>}
          <button className="btn primary full lg" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
          <div className="demo">
            <span>Demo accounts. Tap one to fill the form:</span>
            <div className="chips">{QUICK.map(([l, k]) => <button type="button" key={k} className="chip" onClick={() => { setU(k); setP(USERS[k].pw); setErr(""); }}>{l}</button>)}</div>
          </div>
        </form>
      </section>
    {fp && <Modal title="Forgot password" onClose={() => setFp(false)} foot={<button className="btn primary" onClick={() => setFp(false)}>Got it</button>}><p className="muted">Employees: ask your branch admin to reset your password from the Employees screen. Admins: contact the platform team.</p></Modal>}
    </div>
  );
}
