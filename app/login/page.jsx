"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { HOME, useStore } from "@/lib/store";
import { BrandLogo, Modal } from "@/components/ui";

export default function Login() {
  const { db, authenticate, login } = useStore(), router = useRouter();
  const [fp, setFp] = useState(false), [u, setU] = useState(""), [p, setP] = useState(""), [show, setShow] = useState(false), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const submit = (e) => {
    e.preventDefault();
    if (!u.trim() || !p) return setErr("Enter your username and password.");
    const acc = authenticate(u, p);
    if (!acc) return setErr("Username or password is incorrect. Check both and try again.");
    setErr(""); setBusy(true); login(acc); router.push(HOME[acc.role]);
  };
  const quick = db?.accounts.filter((x) => ["hina", "admin", "super"].includes(x.username)).map((x) => [
    x.role === "employee" ? "Employee" : x.role === "admin" ? "Admin" : "Superadmin",
    x.username,
    x.password,
  ]) || [];
  return (
    <div className="login">
      <section className="hero"><div className="hero-art"><Image src="/images/login-gaming.png" alt="A wireless gaming controller lit in blue and purple" fill priority sizes="(max-width: 960px) 100vw, 55vw" className="hero-photo" /></div>
        <BrandLogo size={64} />
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
          <button className="btn primary full lg" disabled={busy || !db}>{busy ? "Signing in…" : "Sign in"}</button>
          <div className="demo">
            <span>Demo accounts. Tap one to fill the form:</span>
            <div className="chips">{quick.map(([l, k, password]) => <button type="button" key={k} className="chip" onClick={() => { setU(k); setP(password); setErr(""); }}>{l}</button>)}</div>
            <small className="muted">Demo only: passwords are stored in this browser, not on a secure authentication server.</small>
          </div>
        </form>
      </section>
      {fp && <Modal title="Forgot password" onClose={() => setFp(false)} foot={<button className="btn primary" onClick={() => setFp(false)}>Got it</button>}><p className="muted">Employees: ask your branch admin to reset your password from the Employees screen. Branch admins: contact the platform team if you cannot sign in.</p></Modal>}
    </div>
  );
}
