"use client";
import { useState } from "react";
import { useStore, useNow, cost, elapsed, clock, money, GAMES, RATES } from "@/lib/store";
import { Icon, Modal, PageHead } from "@/components/ui";
import TopUp from "@/components/TopUp";
import { Banner, ConsoleMini, GameCover } from "@/components/Art";

function Card({ s, now, db, onStart, onEnd, onTop, onMove }) {
  const { pause } = useStore();
  const a = s.active, c = a && db.customers.find((x) => x.id === a.customerId);
  const left = a ? c.balance - cost(a, now) : 0, mins = a ? left / (a.rate / 60) : 0;
  const state = s.status !== "ok" ? "off" : !a ? "free" : left <= 0 ? "due" : a.pausedAt ? "paused" : mins < 5 ? "low" : "live";
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
          <div className="meter"><i style={{ width: Math.min(100, (cost(a, now) / Math.max(1, c.balance)) * 100) + "%" }} /></div>
          <div className="kv"><span>Charged <b>{money(cost(a, now))}</b></span><span>Left <b>{money(Math.max(0, left))}</b> · ~{Math.max(0, Math.floor(mins))} min</span></div>
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
  const { db, start, end, move, say } = useStore(), now = useNow();
  const [f, setF] = useState("all"), [startFor, setStartFor] = useState(null), [endFor, setEndFor] = useState(null), [top, setTop] = useState(null), [mv, setMv] = useState(null), [to, setTo] = useState("");
  const [form, setForm] = useState({ c: 0, g: GAMES[0], p: 2 });
  if (!db) return null;
  const games = db.gamesLibrary.map((game) => game.t);
  const live = db.stations.filter((s) => s.active).length, free = db.stations.filter((s) => !s.active && s.status === "ok").length;
  const list = db.stations.filter((s) => f === "all" || (f === "live" ? s.active : !s.active && s.status === "ok"));
  const sc = startFor && db.customers.find((c) => c.id === +form.c), rate = startFor && RATES[startFor.plan];
  const canStart = sc && sc.balance >= rate / 6; // at least 10 minutes of play
  const freeSt = db.stations.filter((s) => !s.active && s.status === "ok");
  return (
    <>
      <Banner title={`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, ${db.user.name.split(" ")[0]}`} sub="Here is how the floor looks right now." stats={[["Playing", live], ["Available", free], ["Wallet balances held", money(db.customers.reduce((a, c) => a + c.balance, 0))]]} />
      <PageHead title="Live board" sub={`${live} playing · ${free} available · timers run on the server clock`}>
        <button className="btn primary" onClick={() => setTop(db.customers[0].id)}><Icon n="plus" size={16} />Wallet top-up</button>
      </PageHead>
      <div className="tabs">{[["all", "All stations"], ["live", "Playing"], ["free", "Available"]].map(([k, l]) => <button key={k} className={f === k ? "on" : ""} onClick={() => setF(k)}>{l}</button>)}</div>
      <div className="stations">{list.map((s) => <Card key={s.id} s={s} now={now} db={db} onStart={(x) => { setStartFor(x); setForm({ c: db.customers[0].id, g: games[0] || GAMES[0], p: 2 }); }} onEnd={setEndFor} onTop={setTop} onMove={(x) => { setMv(x); setTo(freeSt[0]?.id || ""); }} />)}</div>

      {startFor && <Modal title={`Start session · ${startFor.name}`} onClose={() => setStartFor(null)}
        foot={<><button className="btn" onClick={() => setStartFor(null)}>Cancel</button><button className="btn primary" disabled={!canStart} onClick={() => { start(startFor.id, +form.c, form.g, +form.p); setStartFor(null); say("Session started"); }}>Start session</button></>}>
        <label>Customer<select value={form.c} onChange={(e) => setForm({ ...form, c: e.target.value })}>{db.customers.map((c) => <option key={c.id} value={c.id}>{c.name} · {money(c.balance)}</option>)}</select></label>
        <label>Game<select value={form.g} onChange={(e) => setForm({ ...form, g: e.target.value })}>{games.map((g) => <option key={g}>{g}</option>)}</select></label>
        <label>Players<select value={form.p} onChange={(e) => setForm({ ...form, p: e.target.value })}>{[1, 2, 3, 4].map((n) => <option key={n}>{n}</option>)}</select></label>
        <div className={"callout " + (canStart ? "" : "warn")}>
          {canStart ? <>Rate <b>{money(rate)}/hr</b>. This wallet covers about <b>{Math.floor(sc.balance / (rate / 60))} minutes</b>.</> : <>This wallet needs at least <b>{money(rate / 6)}</b> (10 minutes) to start. Top up first.</>}
        </div>
      </Modal>}

      {mv && <Modal title={`Move session from ${mv.name}`} onClose={() => setMv(null)}
        foot={<><button className="btn" onClick={() => setMv(null)}>Cancel</button><button className="btn primary" disabled={!to} onClick={() => { move(mv.id, +to); setMv(null); say("Session moved. The original rate is kept."); }}>Move session</button></>}>
        {freeSt.length ? <label>New station<select value={to} onChange={(e) => setTo(e.target.value)}>{freeSt.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.room}</option>)}</select></label> : <div className="callout warn">No free station right now.</div>}
        <p className="muted" style={{ marginTop: 12 }}>The timer and the charge continue without a break.</p>
      </Modal>}

      {endFor && (() => { const a = endFor.active, c = db.customers.find((x) => x.id === a.customerId), t = Math.round(cost(a, now)); return (
        <Modal title={`End session · ${endFor.name}`} onClose={() => setEndFor(null)}
          foot={<><button className="btn" onClick={() => setEndFor(null)}>Keep playing</button><button className="btn danger" onClick={() => { end(endFor.id); setEndFor(null); say(`Settled ${money(t)} · receipt saved`); }}>End and settle</button></>}>
          <div className="receipt">
            <div><span>Player</span><b>{c.name}</b></div><div><span>Duration</span><b>{clock(elapsed(a, now))}</b></div>
            <div><span>Rate</span><b>{money(a.rate)}/hr</b></div><div><span>Final charge</span><b>{money(t)}</b></div>
            <div className="total"><span>Wallet after</span><b>{money(Math.max(0, c.balance - t))}</b></div>
          </div>
        </Modal>); })()}
      {top !== null && <TopUp initial={top} onClose={() => setTop(null)} />}
    </>
  );
}
