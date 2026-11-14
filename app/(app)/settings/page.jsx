"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { PageHead } from "@/components/ui";

export default function Settings() {
  const { say } = useStore();
  const [pm, setPm] = useState({ Cash: true, Easypaisa: true, JazzCash: true, "Bank transfer": false });
  return (
    <>
      <PageHead title="Settings" sub="Branch profile, billing rules and payment methods"><button className="btn primary" onClick={() => say("Settings saved")}>Save changes</button></PageHead>
      <section className="panel sect"><h3>Branch profile</h3><p>Shown on receipts and reports.</p>
        <div className="fg"><label>Business name<input defaultValue="Gaming Zone Lahore" /></label><label>Phone<input defaultValue="042-35001234" /></label>
          <label>Timezone<select defaultValue="PKT"><option value="PKT">Asia/Karachi (PKT)</option></select></label><label>Currency<select><option>Pakistani Rupee (Rs)</option></select></label></div></section>
      <section className="panel sect"><h3>Billing rules</h3><p>Applied to every new session.</p>
        <div className="fg"><label>Rounding<select><option>Exact minute</option><option>Next 5 minutes</option><option>15-minute blocks</option></select></label>
          <label>Minimum balance to start (minutes of play)<input type="number" defaultValue="10" /></label>
          <label>Low balance warning (minutes left)<input type="number" defaultValue="5" /></label><label>Grace period at zero balance (minutes)<input type="number" defaultValue="2" /></label>
          <label>Pause billing<select><option>Pause stops the charge</option><option>Pause is billed</option></select></label><label>Refund limit without approval (Rs)<input type="number" defaultValue="500" /></label></div></section>
      <section className="panel sect"><h3>Payment methods</h3><p>Methods cashiers can choose when topping up.</p>
        {Object.entries(pm).map(([k, v]) => <div className="line" key={k}><span>{k}</span><button className={"switch" + (v ? " on" : "")} onClick={() => setPm({ ...pm, [k]: !v })} aria-label={`Toggle ${k}`} /></div>)}</section>
      <section className="panel sect"><h3>Receipt</h3><label>Footer message<input defaultValue="Thanks for playing. Unused balance stays in your wallet." /></label></section>
    </>
  );
}
