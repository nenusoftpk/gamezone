"use client";
import { useState } from "react";
import { PKG0 } from "@/lib/data";
import { useStore, money, RATES } from "@/lib/store";
import { PageHead } from "@/components/ui";
import Receipt from "@/components/Receipt";

export default function Sell() {
  const { db, sellPackage, nextNo, say } = useStore();
  const [c, setC] = useState(0), [m, setM] = useState("Cash"), [rc, setRc] = useState(null);
  if (!db) return null;
  const sell = (k) => {
    const cu = db.customers.find((x) => x.id === +c), no = nextNo(), credit = Math.round((k.min / 60) * RATES.Standard);
    sellPackage(+c, k, m, no); say(`${k.n} sold`);
    setRc({ no, t: Date.now(), name: cu.name, what: k.n, detail: `Paid ${money(k.price)} · wallet +${money(credit)}`, method: m, ref: "", balance: cu.balance + credit, by: db.user.name });
  };
  return (
    <>
      <PageHead title="Sell package" sub="The customer pays the package price and the wallet is credited with the full play value." />
      <div className="fg" style={{ maxWidth: 560, marginBottom: 18 }}>
        <label>Customer<select value={c} onChange={(e) => setC(e.target.value)}>{db.customers.map((x) => <option key={x.id} value={x.id}>{x.name} · {money(x.balance)}</option>)}</select></label>
        <label>Payment method<select value={m} onChange={(e) => setM(e.target.value)}>{["Cash", "Easypaisa", "JazzCash", "Bank transfer"].map((x) => <option key={x}>{x}</option>)}</select></label>
      </div>
      <div className="cards3">{PKG0.filter((k) => k.on).map((k) => (
        <div className="pk" key={k.n}><h3>{k.n}</h3><div className="big">{money(k.price)}</div>
          <small>{k.min / 60 >= 1 ? `${k.min / 60} hour${k.min > 60 ? "s" : ""}` : `${k.min} minutes`} of play · wallet +{money(Math.round((k.min / 60) * RATES.Standard))}</small>
          <small>Valid {k.days} day{k.days > 1 ? "s" : ""}</small>
          <button className="btn primary" style={{ marginTop: 10 }} onClick={() => sell(k)}>Sell to customer</button></div>))}</div>
      {rc && <Receipt r={rc} onClose={() => setRc(null)} />}
    </>
  );
}
