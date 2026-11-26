"use client";
import { useState } from "react";
import Link from "next/link";
import { useStore, money } from "@/lib/store";
import { Avatar, Icon, Modal, PageHead } from "@/components/ui";
import TopUp from "@/components/TopUp";

export default function Customers() {
  const { db, addCustomer, updateCustomer, deleteCustomer, say } = useStore();
  const [q, setQ] = useState(""), [top, setTop] = useState(null), [add, setAdd] = useState(false), [n, setN] = useState(""), [p, setP] = useState("");
  const [editing, setEditing] = useState(null), [editName, setEditName] = useState(""), [editPhone, setEditPhone] = useState("");
  const [deleting, setDeleting] = useState(null);
  if (!db) return null;
  const admin = db.user.role === "admin";
  const rows = db.customers.filter((c) => (c.name + c.phone).toLowerCase().includes(q.toLowerCase()));
  const openEdit = (customer) => {
    setEditing(customer);
    setEditName(customer.name);
    setEditPhone(customer.phone === "—" ? "" : customer.phone);
  };
  const saveEdit = () => {
    if (updateCustomer(editing.id, editName.trim(), editPhone.trim())) {
      setEditing(null);
      say("Customer updated");
    } else say("Unable to update customer");
  };
  const removeCustomer = () => {
    if (deleteCustomer(deleting.id)) {
      setDeleting(null);
      say("Customer and linked records deleted");
    } else say("Unable to delete customer");
  };
  return (
    <>
      <PageHead title="Customers" sub="Prepaid wallets, found by name or phone number">
        <input className="search" placeholder="Search name or phone" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn primary" onClick={() => setAdd(true)}><Icon n="plus" size={16} />New customer</button>
      </PageHead>
      <div className="panel"><table>
        <thead><tr><th>Customer</th><th>Phone</th><th className="r">Wallet balance</th><th /></tr></thead>
        <tbody>{rows.map((c) => (
          <tr key={c.id}><td><Link className="cell" href={`/customers/${c.id}`}><Avatar name={c.name} />{c.name}</Link></td><td>{c.phone}</td>
            <td className="r"><b className={c.balance < 100 ? "neg" : ""}>{money(c.balance)}</b></td>
            <td className="r"><button className="btn sm" onClick={() => setTop(c.id)}>Top up</button> {admin && <><button className="btn sm" onClick={() => openEdit(c)}>Edit</button> <button className="btn sm danger" onClick={() => setDeleting(c)}>Delete</button></>}</td></tr>
        ))}{!rows.length && <tr><td colSpan="4" className="empty">No customer matches this search. Try a phone number or add a new customer.</td></tr>}</tbody>
      </table></div>
      {top !== null && <TopUp initial={top} onClose={() => setTop(null)} />}
      {add && <Modal title="New customer" onClose={() => setAdd(false)} foot={<><button className="btn" onClick={() => setAdd(false)}>Cancel</button><button className="btn primary" disabled={!n.trim()} onClick={() => { addCustomer(n.trim(), p); setAdd(false); setN(""); setP(""); say("Customer saved"); }}>Save customer</button></>}>
        <label>Full name<input value={n} onChange={(e) => setN(e.target.value)} /></label>
        <label>Phone<input value={p} placeholder="03XX-XXXXXXX" onChange={(e) => setP(e.target.value)} /></label>
      </Modal>}
      {editing && <Modal title="Edit customer" onClose={() => setEditing(null)} foot={<><button className="btn" onClick={() => setEditing(null)}>Cancel</button><button className="btn primary" disabled={!editName.trim()} onClick={saveEdit}>Save changes</button></>}>
        <label>Full name<input value={editName} onChange={(event) => setEditName(event.target.value)} /></label>
        <label>Phone<input value={editPhone} placeholder="03XX-XXXXXXX" onChange={(event) => setEditPhone(event.target.value)} /></label>
      </Modal>}
      {deleting && <Modal title="Delete customer permanently?" onClose={() => setDeleting(null)} foot={<><button className="btn" onClick={() => setDeleting(null)}>Cancel</button><button className="btn danger" onClick={removeCustomer}>Delete customer</button></>}>
        <p><b>{deleting.name}</b> and all linked records will be permanently deleted.</p>
        <div className="callout warn">This removes the wallet balance, session history, payments, loans, cafe orders, and refund requests. Any active session will be stopped. The audit log will record this deletion. This cannot be undone.</div>
      </Modal>}
    </>
  );
}
