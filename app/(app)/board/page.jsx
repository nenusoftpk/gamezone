"use client";
import { useState } from "react";
import { useStore, useNow, cost, elapsed, clock, money, GAMES, stationRates, dateStr, timeStr } from "@/lib/store";
import { Icon, Modal, PageHead } from "@/components/ui";
import TopUp from "@/components/TopUp";
import Receipt from "@/components/Receipt";
import { Banner, ConsoleMini, GameCover } from "@/components/Art";

const playerOptions = (supported) => {
  const counts = String(supported || "").match(/\d+/g)?.map(Number) || [];
  if (counts.length === 1 && counts[0] >= 1 && counts[0] <= 4) return counts;
  if (counts.length >= 2 && counts[0] >= 1 && counts[1] >= counts[0] && counts[1] <= 4) {
    return Array.from({ length: counts[1] - counts[0] + 1 }, (_, index) => counts[0] + index);
  }
  return [1, 2, 3, 4];
};
const defaultPlayerCount = (game) => {
  const options = playerOptions(game?.p);
  return options.includes(2) ? 2 : options[0];
};

function Card({ s, now, db, onStart, onEnd, onTop, onMove }) {
  const { pause } = useStore();
  const a = s.active, c = a && db.customers.find((x) => x.id === a.customerId);
  const rates = stationRates(s);
  const left = a ? c.balance - cost(a, now) : 0, mins = a ? left / (a.ratePerMinute ?? a.rate / 60) : 0;
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
        <div className="st-body idle"><ConsoleMini state={state} /><span>{s.status === "ok" ? `${money(rates.perHour)}/hr · ${money(rates.perMinute)}/min` : "Not available for play"}</span></div>
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
  const [form, setForm] = useState({ c: 0, g: GAMES[0], p: 2, rateUnit: "minute" });
  if (!db) return null;
  const mine = db.user.role === "employee", canCheckOut = mine || db.user.role === "admin";
  const games = db.gamesLibrary.map((game) => game.t);
  const selectedGame = db.gamesLibrary.find((game) => game.t === form.g);
  const availablePlayers = playerOptions(selectedGame?.p);
  const live = db.stations.filter((s) => s.active).length, free = db.stations.filter((s) => !s.active && s.status === "ok").length;
  const list = db.stations.filter((s) => f === "all" || (f === "live" ? s.active : !s.active && s.status === "ok"));
  const sc = startFor && db.customers.find((c) => c.id === +form.c);
  const sessionRates = startFor && stationRates(startFor);
  const canStart = !!sc;
  const freeSt = db.stations.filter((s) => !s.active && s.status === "ok");
  const today = new Date(now).toDateString();
  const todaySessions = db.sessions.filter((session) => new Date(session.t).toDateString() === today);
  const todayPlay = todaySessions.reduce((sum, session) => sum + session.amount, 0);
  const todayCollected = db.ledger.filter((entry) => new Date(entry.t).toDateString() === today && ["topup", "package", "session_payment", "credit_payment", "cafe_order"].includes(entry.type) && (!mine || entry.by === db.user.name))
    .reduce((sum, entry) => sum + (entry.type === "package" ? entry.paid : entry.amount), 0);
  const activePlayBill = db.stations.filter((station) => station.active)
    .reduce((sum, station) => sum + Math.round(cost(station.active, now)), 0);
  const pendingBills = db.sessions.filter((session) => session.due > 0 && !session.creditId);
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
          <div className="kpi"><span>{mine ? "Your collections today" : "Collected today"}</span><b>{money(todayCollected)}</b><small>Top-ups, packages, checkouts, loan repayments and cafe orders</small></div>
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
      <div className="stations">{list.map((s) => <Card key={s.id} s={s} now={now} db={db} onStart={(x) => { const game = db.gamesLibrary[0]; setStartFor(x); setForm({ c: db.customers[0].id, g: game?.t || GAMES[0], p: defaultPlayerCount(game), rateUnit: "minute" }); }} onEnd={setEndFor} onTop={setTop} onMove={(x) => { setMv(x); setTo(freeSt[0]?.id || ""); }} />)}</div>

      {startFor && <Modal title={`Start session · ${startFor.name}`} onClose={() => setStartFor(null)}
        foot={<><button className="btn" onClick={() => setStartFor(null)}>Cancel</button><button className="btn primary" disabled={!canStart} onClick={() => { start(startFor.id, +form.c, form.g, +form.p, "wallet", form.rateUnit); setStartFor(null); say("Session started"); }}>Start session</button></>}>
        <label>Customer<select value={form.c} onChange={(e) => setForm({ ...form, c: e.target.value })}>{db.customers.map((c) => <option key={c.id} value={c.id}>{c.name} · {money(c.balance)}</option>)}</select></label>
        <label>Game<select value={form.g} onChange={(e) => {
          const game = db.gamesLibrary.find((entry) => entry.t === e.target.value);
          const options = playerOptions(game?.p);
          setForm({ ...form, g: e.target.value, p: options.includes(Number(form.p)) ? form.p : options[0] });
        }}>{games.map((g) => <option key={g}>{g}</option>)}</select></label>
        <label>Players<select value={form.p} onChange={(e) => setForm({ ...form, p: e.target.value })}>{availablePlayers.map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
        <label>Rate mode<select value={form.rateUnit} onChange={(e) => setForm({ ...form, rateUnit: e.target.value })}>
          <option value="minute">Per minute · {money(sessionRates.perMinute)}/min</option>
          <option value="half_hour">30 minutes · {money(sessionRates.per30Minutes)}</option>
          <option value="hour">1 hour · {money(sessionRates.perHour)}</option>
        </select></label>
        <div className="callout">Available wallet funds are deducted when the session ends. Any remaining bill can be paid at checkout.</div>
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
            <div><span>Rate</span><b>{a.rateUnit === "hour" ? `${money(a.ratePerHour ?? a.rate)}/hour` : a.rateUnit === "half_hour" ? `${money(a.ratePer30Minutes ?? a.rate / 2)}/30 min` : `${money(a.ratePerMinute ?? a.rate / 60)}/min`}</b></div><div><span>Play bill</span><b>{money(t)}</b></div>
            <div><span>Wallet applied</span><b>{money(walletUsed)}</b></div><div><span>Due at checkout</span><b>{money(due)}</b></div>
            <div className="total"><span>Wallet after</span><b>{money(c.balance - walletUsed)}</b></div>
          </div>
        </Modal>); })()}
      {checkoutBill && <Modal title="Checkout bill" onClose={() => setCheckoutId(null)} foot={<><button className="btn" onClick={() => setCheckoutId(null)}>Cancel</button><button className="btn primary" disabled={checkoutBill.due <= 0 || (checkoutToCollect > 0 && checkoutMethod !== "Cash" && checkoutMethod !== "Customer credit" && !checkoutRef.trim())} onClick={() => {
        const deferred = checkoutToCollect > 0 && checkoutMethod === "Customer credit";
        if (checkoutSession(checkoutBill.id, checkoutMethod, checkoutRef, deferred)) {
          setCheckoutReceipt({ no: `B-${checkoutBill.id}`, t: Date.now(), name: checkoutCustomer?.name || "Walk-in", what: deferred ? "Customer loan" : "Session checkout", detail: `${checkoutBill.station} · ${checkoutBill.game} · Wallet ${money(checkoutWalletApplied)} · ${deferred ? `Loan recorded ${money(checkoutToCollect)}` : `Collected ${money(checkoutToCollect)}`}`, method: deferred ? "Customer credit" : checkoutToCollect ? checkoutMethod : "Wallet", ref: checkoutToCollect && !deferred ? checkoutRef.trim() : "", balance: Math.max(0, (checkoutCustomer?.balance || 0) - checkoutWalletApplied), by: db.user.name });
          setCheckoutId(null); say(deferred ? "Customer loan recorded" : "Checkout payment recorded");
        } else say("Unable to complete checkout");
      }}>{checkoutToCollect ? checkoutMethod === "Customer credit" ? `Record ${money(checkoutToCollect)} as loan` : `Collect ${money(checkoutToCollect)}` : "Complete checkout"}</button></>}>
        <div className="receipt">
          <div><span>Customer</span><b>{db.customers.find((customer) => customer.id === checkoutBill.customerId)?.name || "Walk-in"}</b></div>
          <div><span>Station · game</span><b>{checkoutBill.station} · {checkoutBill.game}</b></div>
          <div><span>Play bill</span><b>{money(checkoutBill.amount)}</b></div>
          <div><span>Previously paid</span><b>{money(checkoutBill.paid)}</b></div>
          <div><span>Wallet applied now</span><b>{money(checkoutWalletApplied)}</b></div>
          <div className="total"><span>{checkoutToCollect ? "Collect now" : "Wallet covers remaining bill"}</span><b>{money(checkoutToCollect || checkoutWalletApplied)}</b></div>
        </div>
        {checkoutToCollect > 0 && <>
          <label>Payment method<select value={checkoutMethod} onChange={(e) => setCheckoutMethod(e.target.value)}>{["Cash", "Easypaisa", "JazzCash", "Bank transfer", "Customer credit"].map((method) => <option key={method}>{method}</option>)}</select></label>
          {checkoutMethod !== "Cash" && checkoutMethod !== "Customer credit" && <label>Transaction reference<input value={checkoutRef} onChange={(e) => setCheckoutRef(e.target.value)} placeholder="Enter transaction reference" /></label>}
        </>}
      </Modal>}
      {checkoutReceipt && <Receipt r={checkoutReceipt} onClose={() => setCheckoutReceipt(null)} />}
      {top !== null && <TopUp initial={top} onClose={() => setTop(null)} />}
    </>
  );
}
