"use client";
import { useState } from "react";
import { useStore, money, dateStr, timeStr } from "@/lib/store";
import { PageHead } from "@/components/ui";

const METHODS = ["Cash", "Easypaisa", "JazzCash", "Bank transfer"];

export default function CafeOrders() {
  const { db, placeCafeOrder, say } = useStore();
  const [cart, setCart] = useState({}), [customerId, setCustomerId] = useState(""), [method, setMethod] = useState("Cash"), [ref, setRef] = useState("");
  if (!db) return null;

  const items = db.cafeStock.filter((item) => cart[item.n] > 0);
  const total = items.reduce((sum, item) => sum + item.price * cart[item.n], 0);
  const canSubmit = items.length > 0 && (method === "Cash" || !!ref.trim());
  const changeQuantity = (name, delta) => setCart((current) => {
    const quantity = (current[name] || 0) + delta;
    if (quantity <= 0) {
      const next = { ...current };
      delete next[name];
      return next;
    }
    return { ...current, [name]: quantity };
  });
  const submit = () => {
    const lines = items.map((item) => ({ name: item.n, quantity: cart[item.n] }));
    if (!placeCafeOrder(lines, customerId ? Number(customerId) : null, method, ref)) {
      say("Unable to place order. Check available stock and payment details.");
      return;
    }
    setCart({});
    setCustomerId("");
    setMethod("Cash");
    setRef("");
    say("Cafe order recorded");
  };

  return (
    <>
      <PageHead title="Cafe orders" sub="Place a paid order, update stock automatically, and keep a collection record" />
      <div className="split">
        <section className="panel">
          <table>
            <thead><tr><th>Product</th><th className="r">Price</th><th className="r">In stock</th><th className="r">Order</th></tr></thead>
            <tbody>{db.cafeStock.map((item) => {
              const quantity = cart[item.n] || 0;
              return <tr key={item.n}>
                <td><b>{item.n}</b>{item.q < item.min && <div><small className="neg">Low stock · reorder at {item.min}</small></div>}</td>
                <td className="r">{money(item.price)}</td><td className="r">{item.q}</td>
                <td className="r"><span className="qty"><button disabled={quantity === 0} onClick={() => changeQuantity(item.n, -1)} aria-label={`Remove one ${item.n}`}>−</button>{quantity}<button disabled={quantity >= item.q} onClick={() => changeQuantity(item.n, 1)} aria-label={`Add one ${item.n}`}>+</button></span></td>
              </tr>;
            })}
              {!db.cafeStock.length && <tr><td colSpan="4" className="empty">No cafe products are in stock.</td></tr>}
            </tbody>
          </table>
        </section>
        <section className="panel pad">
          <h3>Order checkout</h3>
          {!items.length ? <p className="muted">Choose products from the menu to start an order.</p> : items.map((item) => (
            <div className="line" key={item.n}><span>{item.n} × {cart[item.n]}</span><b>{money(item.price * cart[item.n])}</b></div>
          ))}
          <div className="line"><b>Total</b><b>{money(total)}</b></div>
          <label style={{ marginTop: 16 }}>Customer (optional)
            <select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
              <option value="">Walk-in</option>
              {db.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
          </label>
          <label>Payment method<select value={method} onChange={(event) => setMethod(event.target.value)}>{METHODS.map((item) => <option key={item}>{item}</option>)}</select></label>
          {method !== "Cash" && <label>Transaction reference<input value={ref} onChange={(event) => setRef(event.target.value)} placeholder="Enter transaction reference" /></label>}
          <button className="btn primary full" disabled={!canSubmit} onClick={submit}>Place order · {money(total)}</button>
        </section>
      </div>
      <section className="panel" style={{ marginTop: 18 }}>
        <table>
          <thead><tr><th>Date</th><th>Customer</th><th>Items</th><th>Payment</th><th>Employee</th><th className="r">Total</th></tr></thead>
          <tbody>{db.cafeOrders.map((order) => (
            <tr key={order.id}>
              <td>{dateStr(order.t)} · {timeStr(order.t)}</td>
              <td>{db.customers.find((customer) => customer.id === order.customerId)?.name || "Walk-in"}</td>
              <td>{order.items.map((item) => `${item.name} × ${item.quantity}`).join(", ")}</td>
              <td>{order.method}{order.ref ? ` · ${order.ref}` : ""}</td><td>{order.by}</td><td className="r"><b>{money(order.total)}</b></td>
            </tr>
          ))}
            {!db.cafeOrders.length && <tr><td colSpan="6" className="empty">No cafe orders yet.</td></tr>}
          </tbody>
        </table>
      </section>
    </>
  );
}
