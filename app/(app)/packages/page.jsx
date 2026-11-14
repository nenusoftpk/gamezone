"use client";
import { useState } from "react";
import { PKG0 } from "@/lib/data";
import { money, useStore } from "@/lib/store";
import { PageHead } from "@/components/ui";

export default function Packages() {
  const { say } = useStore(), [p, setP] = useState(PKG0);
  return (
    <>
      <PageHead title="Packages" sub="Prepaid play time bundles. Price changes apply to new purchases only."><button className="btn primary" onClick={() => say("Package editor opens here")}>New package</button></PageHead>
      <div className="cards3">{p.map((k, i) => (
        <div className="pk" key={k.n} style={{ opacity: k.on ? 1 : .6 }}>
          <div className="line" style={{ border: 0, padding: 0 }}><h3>{k.n}</h3><button className={"switch" + (k.on ? " on" : "")} onClick={() => setP(p.map((x, j) => j === i ? { ...x, on: !x.on } : x))} aria-label={`Toggle ${k.n}`} /></div>
          <div className="big">{money(k.price)}</div>
          <small>{k.min / 60 >= 1 ? `${k.min / 60} hour${k.min > 60 ? "s" : ""}` : `${k.min} minutes`} of play · {money((k.price / k.min) * 60)}/hr</small>
          <small>Valid for {k.days} day{k.days > 1 ? "s" : ""} after purchase</small>
        </div>))}</div>
    </>
  );
}
