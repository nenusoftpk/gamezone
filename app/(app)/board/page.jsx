"use client";
import { useState } from "react";
import { useStore, useNow, cost, elapsed, clock, money, GAMES, RATES, dateStr, timeStr } from "@/lib/store";
import { Icon, Modal, PageHead } from "@/components/ui";
import TopUp from "@/components/TopUp";
import Receipt from "@/components/Receipt";
import { Banner, ConsoleMini, GameCover } from "@/components/Art";

function Card({ s, now, db, onStart, onEnd, onTop, onMove }) {
  const { pause } = useStore();
  const a = s.active, c = a && db.customers.find((x) => x.id === a.customerId);
  const left = a ? c.balance - cost(a, now) : 0, mins = a ? left / (a.rate / 60) : 0;
  const checkout = a?.billingMode === "checkout";
  const state = s.status !== "ok" ? "off" : !a ? "free" : a.pausedAt ? "paused" : !checkout && left <= 0 ? "due" : !checkout && mins < 5 ? "low" : "live";
  const label = { off: "Maintenance", free: "Available", paused: "Paused", low: "Low balance", live: "Playing", due: "Payment required" }[state];
  return (
    <article className={"st " + state}>
      <div className="st-top">
        <div><h3>{s.name}</h3><small>{s.model} · {s.room}</small></div>
        <span className={"badge " + state}>{label}</span>
      </div>
      {a ? (
        <div className="st-body">
          <div className="act"><GameCover title={a.game} w={58} /><div style={{ flex: 1, minWidth: 0 }}><div className="timer">{clock(elapsed(a, now))}</div><div className="who"><b>{c.name}</b><span>{a.game} · {a.players}P</span></div></div></div>
          {checkout ? <div className="kv"><span>Play bill <b>{money(Math.round(cost(a, now)))}</b></span><span>Pay at checkout</span></div> : <>
            <div className="meter"><i style={{ width: Math.min(100, (cost(a, now) / Math.max(1, c.balance)) * 100) + "%" }} /></div>
            <div className="kv"><span>Charged <b>{money(cost(a, now))}</b></span><span>Left <b>{money(Math.max(0, left))}</b> · ~{Math.max(0, Math.floor(mins))} min</span></div>
          </>}
          {state === "due" && <div className="callout warn" style={{ marginTop: 10 }}>Wallet is empty. Ask for a top-up or end the session.</div>}
        </div>
      ) : (
        <div className="st-body idle"><ConsoleMini state={state} /><span>{s.status === "ok" ? `${money(RATES[s.plan])}/hr · ${s.plan}` : "Not available for play"}</span></div>
      )}
      <div className="st-foot">
        {s.status !== "ok" ? null : !a ? <button className="btn primary full" onClick={() => onStart(s)}>Start session</button> : <>
          <button className="btn" onClick={() => pause(s.id)}><Icon n={a.pausedAt ? "play" : "pause"} size={15} />{a.pausedAt ? "Resume" : "Pause"}</button>
          <button className="btn" onClick={() => onTop(c.id)}><Icon n="plus" size={15} />Top-up</button>
          <button className="btn" onClick={() => onMove(s)}>Move</button>
          <button className="btn danger" onClick={() => onEnd(s)}>End</button>
        </>}
      </div>
    </article>
  );
}

export default function Board() {
  const { db, start, end, move, checkoutSession, say } = useStore(), now = useNow();
  const [f, setF] = useState("all"), [startFor, setStartFor] = useState(null), [endFor, setEndFor] = useState(null), [top, setTop] = useState(null), [mv, setMv] = useState(null), [to, setTo] = useState("");
  const [checkoutId, setCheckoutId] = useState(null), [checkoutMethod, setCheckoutMethod] = useState("Cash"), [checkoutRef, setCheckoutRef] = useState("");
  const [checkoutReceipt, setCheckoutReceipt] = useState(null);
  const [form, setForm] = useState({ c: 0, g: GAMES[0], p: 2, billingMode: "wallet" });
  if (!db) return null;
  const mine = db.user.role === "employee", canCheckOut = mine || db.user.role === "admin";
  const games = db.gamesLibrary.map((game) => game.t);
  const live = db.stations.filter((s) => s.active).length, free = db.stations.filter((s) => !s.active && s.status === "ok").length;
  const list = db.stations.filter((s) => f === "all" || (f === "live" ? s.active : !s.active && s.status === "ok"));
  const sc = startFor && db.customers.find((c) => c.id === +form.c), rate = startFor && RATES[startFor.plan];
  const canStart = !!sc && (form.billingMode === "checkout" || sc.balance >= rate / 6);
  const freeSt = db.stations.filter((s) => !s.active && s.status === "ok");
  const today = new Date(now).toDateString();
  const todaySessions = db.sessions.filter((session) => new Date(session.t).toDateString() === today);
  const todayPlay = todaySessions.reduce((sum, session) => sum + session.amount, 0);
  const todayCollected = db.ledger.filter((entry) => new Date(entry.t).toDateString() === today && ["topup", "package", "session_payment"].includes(entry.type) && (!mine || entry.by === db.user.name))
    .reduce((sum, entry) => sum + (entry.type === "package" ? entry.paid : entry.amount), 0);
  const activePlayBill = db.stations.filter((station) => station.active)
    .reduce((sum, station) => sum + Math.round(cost(station.active, now)), 0);
  const pendingBills = db.sessions.filter((session) => session.due > 0);
  const pendingTotal = pendingBills.reduce((sum, session) => sum + session.due, 0);
  const checkoutBill = db.sessions.find((session) => session.id === checkoutId);
  const checkoutCustomer = checkoutBill && db.customers.find((customer) => customer.id === checkoutBill.customerId);
  const checkoutWalletApplied = checkoutBill && checkoutCustomer ? Math.min(checkoutCustomer.balance, checkoutBill.due) : 0;
  const checkoutToCollect = checkoutBill ? checkoutBill.due - checkoutWalletApplied : 0;
  return (
    <>
      <Banner title={`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, ${db.user.name.split(" ")[0]}`} sub="Here is how the floor looks right now." stats={[["Playing", live], ["Available", free], ["Wallet balances held", money(db.customers.reduce((a, c) => a + c.balance, 0))]]} />
      <PageHead title="Live board" sub={`${live} playing · ${free} available · timers run on the server clock`}>
        <button className="btn primary" onClick={() => setTop(db.customers[0].id)}><Icon n="plus" size={16} />Wallet top-up</button>
      </PageHead>
      {canCheckOut && <section className="panel pad" style={{ marginBottom: 18 }}>
        <h3>Today's play & checkout</h3>
        <div className="kpis" style={{ marginTop: 14 }}>
          <div className="kpi"><span>Today's play bill</span><b>{money(todayPlay)}</b><small>{todaySessions.length} completed sessions</small></div>
          <div className="kpi"><span>Playing now</span><b>{money(activePlayBill)}</b><small>Current session charges</small></div>
          <div className="kpi"><span>{mine ? "Your collections today" : "Collected today"}</span><b>{money(todayCollected)}</b><small>Top-ups, packages and checkouts</small></div>
          <div className="kpi"><span>Due at checkout</span><b>{money(pendingTotal)}</b><small>{pendingBills.length} unpaid session bills</small></div>
        </div>
        <h3 style={{ marginTop: 12 }}>Bills to check out</h3>
        <div className="panel" style={{ marginTop: 10 }}><table>
          <thead><tr><th>Date</th><th>Customer</th><th>Station · game</th><th className="r">Play bill</th><th className="r">Due</th><th /></tr></thead>
          <tbody>{pendingBills.map((session) => <tr key={session.id}>
            <td>{dateStr(session.t)} · {timeStr(session.t)}</td><td><b>{db.customers.find((customer) => customer.id === session.customerId)?.name || "Walk-in"}</b></td>
            <td>{session.station} · {session.game}</td><td className="r">{money(session.amount)}</td><td className="r"><b>{money(session.due)}</b></td>
            <td className="r"><button className="btn primary sm" onClick={() => { setCheckoutId(session.id); setCheckoutMethod("Cash"); setCheckoutRef(""); }}>Checkout bill</button></td>
          </tr>)}
            {!pendingBills.length && <tr><td colSpan="6" className="empty">No session bills are waiting for checkout.</td></tr>}</tbody>
        </table></div>
      </section>}
      <div className="tabs">{[["all", "All stations"], ["live", "Playing"], ["free", "Available"]].map(([k, l]) => <button key={k} className={f === k ? "on" : ""} onClick={() => setF(k)}>{l}</button>)}</div>
      <div className="stations">{list.map((s) => <Card key={s.id} s={s} now={now} db={db} onStart={(x) => { setStartFor(x); setForm({ c: db.customers[0].id, g: games[0] || GAMES[0], p: 2, billingMode: "wallet" }); }} onEnd={setEndFor} onTop={setTop} onMove={(x) => { setMv(x); setTo(freeSt[0]?.id || ""); }} />)}</div>

      {startFor && <Modal title={`Start session · ${startFor.name}`} onClose={() => setStartFor(null)}
        foot={<><button className="btn" onClick={() => setStartFor(null)}>Cancel</button><button className="btn primary" disabled={!canStart} onClick={() => { start(startFor.id, +form.c, form.g, +form.p, form.billingMode); setStartFor(null); say("Session started"); }}>Start session</button></>}>
        <label>Customer<select value={form.c} onChange={(e) => setForm({ ...form, c: e.target.value })}>{db.customers.map((c) => <option key={c.id} value={c.id}>{c.name} · {money(c.balance)}</option>)}</select></label>
        <label>Game<select value={form.g} onChange={(e) => setForm({ ...form, g: e.target.value })}>{games.map((g) => <option key={g}>{g}</option>)}</select></label>
        <label>Players<select value={form.p} onChange={(e) => setForm({ ...form, p: e.target.value })}>{[1, 2, 3, 4].map((n) => <option key={n}>{n}</option>)}</select></label>
        <label>Payment option<select value={form.billingMode} onChange={(e) => setForm({ ...form, billingMode: e.target.value })}><option value="wallet">Pay first from wallet</option><option value="checkout">Pay after play at checkout</option></select></label>
        <div className={"callout " + (canStart ? "" : "warn")}>{form.billingMode === "checkout"
          ? <>Rate <b>{money(rate)}/hr</b>. The wallet will be applied to the final bill; collect any remaining balance at checkout.</>
          : canStart ? <>Rate <b>{money(rate)}/hr</b>. This wallet covers about <b>{Math.floor(sc.balance / (rate / 60))} minutes</b>.</> : <>This wallet needs at least <b>{money(rate / 6)}</b> (10 minutes) to start. Top up first.</>}</div>
      </Modal>}

      {mv && <Modal title={`Move session from ${mv.name}`} onClose={() => setMv(null)}
        foot={<><button className="btn" onClick={() => setMv(null)}>Cancel</button><button className="btn primary" disabled={!to} onClick={() => { move(mv.id, +to); setMv(null); say("Session moved. The original rate is kept."); }}>Move session</button></>}>
        {freeSt.length ? <label>New station<select value={to} onChange={(e) => setTo(e.target.value)}>{freeSt.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.room}</option>)}</select></label> : <div className="callout warn">No free station right now.</div>}
        <p className="muted" style={{ marginTop: 12 }}>The timer and the charge continue without a break.</p>
      </Modal>}

      {endFor && (() => { const a = endFor.active, c = db.customers.find((x) => x.id === a.customerId), t = Math.round(cost(a, now)), walletUsed = Math.min(c.balance, t), due = t - walletUsed; return (
        <Modal title={`End session · ${endFor.name}`} onClose={() => setEndFor(null)}
          foot={<><button className="btn" onClick={() => setEndFor(null)}>Keep playing</button><button className="btn danger" onClick={() => { end(endFor.id); setEndFor(null); say(due ? "Session ended; bill is ready for checkout" : `Settled ${money(t)} from wallet`); }}>End session</button></>}>
          <div className="receipt">
            <div><span>Player</span><b>{c.name}</b></div><div><span>Duration</span><b>{clock(elapsed(a, now))}</b></div>
            <div><span>Rate</span><b>{money(a.rate)}/hr</b></div><div><span>Play bill</span><b>{money(t)}</b></div>
            <div><span>Wallet applied</span><b>{money(walletUsed)}</b></div><div><span>Due at checkout</span><b>{money(due)}</b></div>
            <div className="total"><span>Wallet after</span><b>{money(c.balance - walletUsed)}</b></div>
          </div>
        </Modal>); })()}
      {checkoutBill && <Modal title="Checkout bill" onClose={() => setCheckoutId(null)} foot={<><button className="btn" onClick={() => setCheckoutId(null)}>Cancel</button><button className="btn primary" disabled={checkoutBill.due <= 0 || (checkoutToCollect > 0 && checkoutMethod !== "Cash" && !checkoutRef.trim())} onClick={() => {
        if (checkoutSession(checkoutBill.id, checkoutMethod, checkoutRef)) {
          setCheckoutReceipt({ no: `B-${checkoutBill.id}`, t: Date.now(), name: checkoutCustomer?.name || "Walk-in", what: "Session checkout", detail: `${checkoutBill.station} · ${checkoutBill.game} · Wallet ${money(checkoutWalletApplied)} · Collected ${money(checkoutToCollect)}`, method: checkoutToCollect ? checkoutMethod : "Wallet", ref: checkoutToCollect ? checkoutRef.trim() : "", balance: Math.max(0, (checkoutCustomer?.balance || 0) - checkoutWalletApplied), by: db.user.name });
          setCheckoutId(null); say("Checkout payment recorded");
        } else say("Unable to complete checkout");
      }}>{checkoutToCollect ? `Collect ${money(checkoutToCollect)}` : "Complete checkout"}</button></>}>
        <div className="receipt">
          <div><span>Customer</span><b>{db.customers.find((customer) => customer.id === checkoutBill.customerId)?.name || "Walk-in"}</b></div>
          <div><span>Station · game</span><b>{checkoutBill.station} · {checkoutBill.game}</b></div>
          <div><span>Play bill</span><b>{money(checkoutBill.amount)}</b></div>
          <div><span>Previously paid</span><b>{money(checkoutBill.paid)}</b></div>
          <div><span>Wallet applied now</span><b>{money(checkoutWalletApplied)}</b></div>
          <div className="total"><span>{checkoutToCollect ? "Collect now" : "Wallet covers remaining bill"}</span><b>{money(checkoutToCollect || checkoutWalletApplied)}</b></div>
        </div>
        {checkoutToCollect > 0 && <>
          <label>Payment method<select value={checkoutMethod} onChange={(e) => setCheckoutMethod(e.target.value)}>{["Cash", "Easypaisa", "JazzCash", "Bank transfer"].map((method) => <option key={method}>{method}</option>)}</select></label>
          {checkoutMethod !== "Cash" && <label>Transaction reference<input value={checkoutRef} onChange={(e) => setCheckoutRef(e.target.value)} placeholder="Enter transaction reference" /></label>}
        </>}
      </Modal>}
      {checkoutReceipt && <Receipt r={checkoutReceipt} onClose={() => setCheckoutReceipt(null)} />}
      {top !== null && <TopUp initial={top} onClose={() => setTop(null)} />}
    </>
  );
}
