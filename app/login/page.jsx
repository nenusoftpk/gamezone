"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { HOME, useStore } from "@/lib/store";
import { BrandLogo, Icon, Modal } from "@/components/ui";

export default function Login() {
  const { db, authenticate, login, resourcesError } = useStore(), router = useRouter();
  const [fp, setFp] = useState(false), [u, setU] = useState(""), [p, setP] = useState(""), [show, setShow] = useState(false), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const [demoCredentials, setDemoCredentials] = useState(null), [demoError, setDemoError] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/api/public/demo-credentials", { cache: "no-store" })
      .then(async (response) => {
        let result;
        try { result = await response.json(); } catch { throw new Error("The demo credential service returned an invalid response."); }
        if (!response.ok) throw new Error(result.error || "Demo credentials are unavailable.");
        const validDemo = (demo) => demo && typeof demo.username === "string" && typeof demo.password === "string";
        result.employee = validDemo(result.employee) ? result.employee : null;
        result.admin = validDemo(result.admin) ? result.admin : null;
        if (!result.employee && !result.admin) throw new Error("Demo credentials are unavailable.");
        if (active) setDemoCredentials(result);
      })
      .catch((error) => { if (active) setDemoError(error.message || "Demo credentials are unavailable."); });
    return () => { active = false; };
  }, []);
  const submit = async (e) => {
    e.preventDefault();
    if (!u.trim() || !p) return setErr("Enter your username and password.");
    setErr(""); setBusy(true);
    try {
      let acc;
      if (u.trim().toLowerCase() === "superadmin") {
        const response = await fetch("/api/auth/superadmin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: u, password: p }),
        });
        const result = await response.json();
        if (!response.ok) return setErr(result.error || "Superadmin sign in failed.");
        acc = result.account;
      } else {
        const isDemoEmployee = demoCredentials?.employee
          && u.trim().toLowerCase() === demoCredentials.employee.username.toLowerCase()
          && p === demoCredentials.employee.password;
        if (isDemoEmployee) {
          acc = db?.accounts.find((account) => account.role === "employee" && account.active
            && db.employees.some((employee) => employee.id === account.employeeId && employee.on));
          if (!acc) return setErr("No active employee account is available for demo sign-in.");
        } else {
          const localAccount = authenticate(u, p);
          if (localAccount?.role === "employee") {
            acc = localAccount;
          } else {
            const response = await fetch("/api/auth/admin", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username: u, password: p }),
            });
            const result = await response.json();
            if (response.status === 404 && localAccount?.role === "admin") acc = localAccount;
            else if (!response.ok) return setErr(result.error || "Username or password is incorrect. Check both and try again.");
            else acc = result.account;
          }
        }
      }
      await login(acc);
      router.push(HOME[acc.role]);
    } catch (error) {
      setErr(error.message || "Could not reach the sign-in service. Check the server and MongoDB, then try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="login">
      <section className="hero"><div className="hero-art"><Image src="/images/login-gaming.png" alt="A wireless gaming controller lit in blue and purple" fill priority sizes="(max-width: 960px) 100vw, 55vw" className="hero-photo" /></div>
        <BrandLogo size={64} />
        <h1>Every station, every minute, accounted for.</h1>
        <p>Prepaid wallets, live PS5 timers and automatic billing for your gaming zone.</p>
        <div className="hero-stats"><div><b>8</b><span>stations</span></div><div><b>Rs 300</b><span>per hour from</span></div><div><b>0</b><span>missed minutes</span></div></div>
        <div className="public-links" aria-label="App downloads and demo videos">
          <div className="download-grid">
            {[
              { label: "Mobile app", detail: "Download for mobile", url: db?.resources?.mobileUrl, icon: "mobile", style: "mobile" },
              { label: "Desktop app", detail: "Install on desktop", url: db?.resources?.desktopUrl, icon: "desktop", style: "desktop" },
            ].map(({ label, detail, url, icon, style }) => {
              const content = <>
                <span className={"download-icon " + style}><Icon n={icon} size={21} /></span>
                <span className="download-copy"><strong>{label}</strong><small>{url ? detail : "Coming soon"}</small></span>
                <span className="download-arrow"><Icon n="download" size={18} /></span>
              </>;
              return url
                ? <a className="download-card" key={label} href={url} target="_blank" rel="noopener noreferrer">{content}</a>
                : <button className="download-card" key={label} type="button" disabled title="Download link not configured">{content}</button>;
            })}
          </div>
          {resourcesError && <p className="callout warn" role="alert">{resourcesError}</p>}
        </div>
      </section>
      <section className="roles">
        <form className="lf" onSubmit={submit} noValidate>
          <h2>Welcome back</h2>
          <p className="muted">Sign in to manage your branch.</p>
          <label>Username<input autoComplete="username" value={u} onChange={(e) => setU(e.target.value)} placeholder="e.g. employee" autoFocus /></label>
          <label>Password
            <div className="pw"><input type={show ? "text" : "password"} autoComplete="current-password" value={p} onChange={(e) => setP(e.target.value)} placeholder="Your password" />
              <button type="button" className="eye" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} aria-pressed={show}><Icon n={show ? "eyeOff" : "eye"} /></button></div>
          </label>
          <button type="button" className="eye fp" onClick={() => setFp(true)}>Forgot password?</button>
          {err && <div className="callout warn" role="alert">{err}</div>}
          <button className="btn primary full lg" disabled={busy || !db}><Icon n="login" />{busy ? "Signing in…" : "Sign in"}</button>
          <Link className="btn demo-form-link" href="/demo-videos"><Icon n="video" />Watch demo videos</Link>
          <div className="demo">
            <span>Demo accounts. Tap one to fill the form:</span>
            <div className="chips">
              {demoCredentials?.employee && <button type="button" className="chip" onClick={() => { setU(demoCredentials.employee.username); setP(demoCredentials.employee.password); setErr(""); }}>Employee</button>}
              {demoCredentials?.admin && <button type="button" className="chip" onClick={() => { setU(demoCredentials.admin.username); setP(demoCredentials.admin.password); setErr(""); }}>Admin</button>}
            </div>
            {demoError && <small className="callout warn" role="alert">{demoError}</small>}
            <small className="muted">Demo only: passwords are stored in this browser, not on a secure authentication server.</small>
          </div>
        </form>
      </section>
      {fp && <Modal title="Forgot password" onClose={() => setFp(false)} foot={<button className="btn primary" onClick={() => setFp(false)}>Got it</button>}><p className="muted">Employees: ask your branch admin to reset your password from the Employees screen. Branch admins: contact the platform team if you cannot sign in.</p></Modal>}
    </div>
  );
}
