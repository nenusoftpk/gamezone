"use client";
import { useState } from "react";
import { useStore, money, timeStr } from "@/lib/store";
import { PageHead } from "@/components/ui";

export default function History() {
  const { db } = useStore(), [tab, setTab] = useState("s");
  if (!db) return null;
  const name = (id) => db.customers.find((c) => c.id === id)?.name || "Walk-in";
  return (
    <>
      <PageHead title="History" sub="Every session and every wallet movement. Entries are never edited." />
      <div className="tabs">{[["s", "Sessions"], ["l", "Wallet ledger"]].map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}</div>
      <div className="panel">{tab === "s" ? (
        <table><thead><tr><th>Time</th><th>Customer</th><th>Station</th><th>Game</th><th className="r">Minutes</th><th className="r">Charged</th></tr></thead>
          <tbody>{db.sessions.map((s) => <tr key={s.id}><td>{timeStr(s.t)}</td><td>{name(s.customerId)}</td><td>{s.station}</td><td>{s.game}</td><td className="r">{s.minutes}</td><td className="r"><b>{money(s.amount)}</b></td></tr>)}</tbody></table>
      ) : (
        <table><thead><tr><th>Time</th><th>Customer</th><th>Type</th><th>Method</th><th>By</th><th className="r">Amount</th></tr></thead>
          <tbody>{db.ledger.map((l) => <tr key={l.id}><td>{timeStr(l.t)}</td><td>{name(l.customerId)}</td><td><span className={"badge " + ({ topup: "live", package: "live", refund: "low", debit: "paused" }[l.type])}>{{ topup: "Top-up", package: "Package", refund: "Refund", debit: "Session debit" }[l.type]}</span></td><td>{l.method}{l.no ? ` · ${l.no}` : ""}</td><td>{l.by}</td><td className={"r " + (l.amount < 0 ? "neg" : "pos")}><b>{l.amount < 0 ? "−" : "+"}{money(Math.abs(l.amount))}</b></td></tr>)}</tbody></table>
      )}</div>
    </>
  );
}
