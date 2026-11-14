"use client";
import { useState } from "react";
import { EQUIP0, STOCK0, GAMES_LIB } from "@/lib/data";
import { money, useStore } from "@/lib/store";
import { PageHead } from "@/components/ui";
import { GameCover } from "@/components/Art";

export default function Inventory() {
  const { say } = useStore(), [tab, setTab] = useState("eq"), [eq, setEq] = useState(EQUIP0), [st, setSt] = useState(STOCK0);
  const adj = (i, d) => setSt(st.map((x, j) => (j === i ? { ...x, q: Math.max(0, x.q + d) } : x)));
  const low = st.filter((x) => x.q < x.min).length;
  return (
    <>
      <PageHead title="Inventory" sub="Gaming equipment, game library and cafe stock"><button className="btn primary" onClick={() => say("Stock count saved")}>Save stock count</button></PageHead>
      <div className="tabs">{[["eq", "Equipment"], ["gm", "Game library"], ["cf", "Cafe stock" + (low ? ` (${low} low)` : "")]].map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}</div>
      <div className="panel">
        {tab === "eq" && <table><thead><tr><th>Item</th><th>Type</th><th className="r">Total</th><th className="r">In use</th><th className="r">In repair</th><th className="r">Free</th><th>Usage</th></tr></thead>
          <tbody>{eq.map((e, i) => <tr key={e.n}><td><b>{e.n}</b></td><td>{e.c}</td><td className="r">{e.total}</td><td className="r">{e.use}</td>
            <td className="r"><span className="qty"><button onClick={() => setEq(eq.map((x, j) => j === i ? { ...x, repair: Math.max(0, x.repair - 1) } : x))}>−</button>{e.repair}<button onClick={() => setEq(eq.map((x, j) => j === i && x.repair + x.use < x.total ? { ...x, repair: x.repair + 1 } : x))}>+</button></span></td>
            <td className="r"><b>{e.total - e.use - e.repair}</b></td><td><div className="prog"><i style={{ width: (e.use / e.total) * 100 + "%" }} /></div></td></tr>)}</tbody></table>}
        {tab === "gm" && <div className="covers">{GAMES_LIB.map((g) => <div className="cover" key={g.t}><GameCover title={g.t} w={150} /><b>{g.t}</b><small>{g.g} · {g.p}P · rated {g.r} · on {g.n} consoles</small></div>)}</div>}
        {tab === "cf" && <table><thead><tr><th>Product</th><th className="r">Price</th><th className="r">In stock</th><th>Status</th><th className="r">Adjust</th></tr></thead>
          <tbody>{st.map((s, i) => <tr key={s.n}><td><b>{s.n}</b></td><td className="r">{money(s.price)}</td><td className="r">{s.q}</td>
            <td><span className={"badge " + (s.q < s.min ? "low" : "live")}>{s.q < s.min ? `Reorder (min ${s.min})` : "OK"}</span></td>
            <td className="r"><span className="qty"><button onClick={() => adj(i, -1)}>−</button><button onClick={() => adj(i, 6)}>+6</button></span></td></tr>)}</tbody></table>}
      </div>
    </>
  );
}
