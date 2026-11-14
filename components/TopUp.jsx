"use client";
import { useState } from "react";
import { useStore, money } from "@/lib/store";
import { Modal } from "@/components/ui";
import Receipt from "@/components/Receipt";

export default function TopUp({ initial, onClose }) {
  const { db, topUp, say, nextNo } = useStore();
  const [c, setC] = useState(initial), [amt, setAmt] = useState(1000), [m, setM] = useState("Cash"), [ref, setRef] = useState(""), [rc, setRc] = useState(null);
  if (rc) return <Receipt r={rc} onClose={onClose} />;
  const digital = m !== "Cash", bad = !(amt > 0) || (digital && !ref.trim());
  const go = () => {
    const cu = db.customers.find((x) => x.id === +c), no = nextNo();
    topUp(+c, +amt, m, ref.trim(), no); say(`${money(amt)} added to wallet`);
    setRc({ no, t: Date.now(), name: cu.name, what: "Top-up", detail: money(amt), method: m, ref: ref.trim(), balance: cu.balance + +amt, by: db.user.name });
  };
  return (
    <Modal title="Wallet top-up" onClose={onClose}
      foot={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" disabled={bad} onClick={go}>Add to wallet</button></>}>
      <label>Customer<select value={c} onChange={(e) => setC(e.target.value)}>{db.customers.map((x) => <option key={x.id} value={x.id}>{x.name} · {money(x.balance)}</option>)}</select></label>
      <label>Amount (Rs)<input type="number" min="1" value={amt} onChange={(e) => setAmt(e.target.value)} /></label>
      <div className="chips">{[500, 1000, 2000, 5000].map((a) => <button key={a} className={"chip" + (+amt === a ? " on" : "")} onClick={() => setAmt(a)}>{money(a)}</button>)}</div>
      <label>Payment method<select value={m} onChange={(e) => setM(e.target.value)}>{["Cash", "Easypaisa", "JazzCash", "Bank transfer"].map((x) => <option key={x}>{x}</option>)}</select></label>
      {digital && <label>Transaction reference<input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. EP-120045" /></label>}
    </Modal>
  );
}
