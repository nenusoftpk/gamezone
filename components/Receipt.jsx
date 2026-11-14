"use client";
import { Modal } from "@/components/ui";
import { money, dateStr, timeStr } from "@/lib/store";

export default function Receipt({ r, onClose }) {
  return (
    <Modal title={`Receipt ${r.no}`} onClose={onClose} foot={<><button className="btn" onClick={() => window.print()}>Print</button><button className="btn primary" onClick={onClose}>Done</button></>}>
      <div className="receipt">
        <div><span>Date</span><b>{dateStr(r.t)} · {timeStr(r.t)}</b></div>
        <div><span>Customer</span><b>{r.name}</b></div>
        <div><span>{r.what}</span><b>{r.detail}</b></div>
        <div><span>Method</span><b>{r.method}{r.ref ? ` · ${r.ref}` : ""}</b></div>
        <div className="total"><span>Wallet balance now</span><b>{money(r.balance)}</b></div>
      </div>
      <p className="muted" style={{ marginTop: 12 }}>Served by {r.by}. Unused balance stays in the wallet.</p>
    </Modal>
  );
}
