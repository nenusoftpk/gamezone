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
      <PageHead title="Game history" sub="Game sessions across employee and admin shifts, with player counts and payments." />
      <div className="tabs">{[["s", "Sessions"], ["l", "Transactions"]].map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}</div>
      <div className="panel">{tab === "s" ? (
        <table><thead><tr><th>Time</th><th>Customer</th><th>Station</th><th>Game</th><th>Rate mode</th><th className="r">Players</th><th className="r">Minutes</th><th className="r">Bill</th><th className="r">Paid</th><th className="r">Due</th></tr></thead>
          <tbody>{db.sessions.map((s) => <tr key={s.id}><td>{timeStr(s.t)}</td><td>{name(s.customerId)}</td><td>{s.station}</td><td>{s.game}</td><td>{{ minute: "Per minute", half_hour: "30 minutes", hour: "1 hour" }[s.rateUnit] || "Per minute"}</td><td className="r">{s.players ?? "—"}</td><td className="r">{s.minutes}</td><td className="r"><b>{money(s.amount)}</b></td><td className="r">{money(s.paid)}</td><td className={"r " + (s.due > 0 ? "neg" : "pos")}><b>{money(s.due)}</b>{s.creditId && <small className="muted"> · On customer loan</small>}</td></tr>)}</tbody></table>
      ) : (
        <table><thead><tr><th>Time</th><th>Customer</th><th>Type</th><th>Method</th><th>By</th><th className="r">Amount</th></tr></thead>
          <tbody>{db.ledger.map((l) => <tr key={l.id}><td>{timeStr(l.t)}</td><td>{name(l.customerId)}</td><td><span className={"badge " + ({ topup: "live", package: "live", refund: "low", debit: "paused", session_payment: "live", credit_payment: "live", cafe_order: "live" }[l.type])}>{{ topup: "Top-up", package: "Package", refund: "Refund", debit: "Session debit", session_payment: "Session checkout", credit_payment: "Loan repayment", cafe_order: "Cafe order" }[l.type]}</span></td><td>{l.method}{l.ref ? ` · ${l.ref}` : ""}{l.no ? ` · ${l.no}` : ""}</td><td>{l.by}</td><td className={"r " + (l.amount < 0 ? "neg" : "pos")}><b>{l.amount < 0 ? "−" : "+"}{money(Math.abs(l.amount))}</b></td></tr>)}</tbody></table>
      )}</div>
    </>
  );
}
