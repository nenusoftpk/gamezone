"use client";
import { useState } from "react";
import { money, useStore } from "@/lib/store";
import { Modal, PageHead } from "@/components/ui";
import { GameCover } from "@/components/Art";

const TABS = [["eq", "Equipment"], ["gm", "Game library"], ["cf", "Cafe stock"]];
const EQUIPMENT_TYPES = ["Console", "Controller", "Display", "Audio", "Cable", "Other"];

export default function Inventory() {
  const { db, addEquipment, adjustEquipmentRepair, addGame, addCafeStock, adjustCafeStock, say } = useStore();
  const employee = db?.user?.role === "employee";
  const [tab, setTab] = useState(employee ? "cf" : "eq"), [adding, setAdding] = useState(false);
  const [name, setName] = useState(""), [category, setCategory] = useState(EQUIPMENT_TYPES[0]), [total, setTotal] = useState("");
  const [genre, setGenre] = useState(""), [rating, setRating] = useState("E"), [players, setPlayers] = useState("1"), [consoles, setConsoles] = useState("");
  const [quantity, setQuantity] = useState(""), [min, setMin] = useState(""), [price, setPrice] = useState("");
  if (!db) return null;

  const activeTab = employee ? "cf" : tab;
  const low = db.cafeStock.filter((item) => item.q < item.min).length;
  const openAdd = () => { setName(""); setCategory(EQUIPMENT_TYPES[0]); setTotal(""); setGenre(""); setRating("E"); setPlayers("1"); setConsoles(""); setQuantity(""); setMin(""); setPrice(""); setAdding(true); };
  const closeAdd = () => setAdding(false);
  const save = () => {
    let ok = false;
    if (tab === "eq") ok = addEquipment(name, category, Number(total));
    if (tab === "gm") ok = addGame(name, genre, rating, players, Number(consoles));
    if (tab === "cf") ok = addCafeStock(name, Number(quantity), Number(min), Number(price));
    if (!ok) { say("Unable to add item. Check the details or use a unique name."); return; }
    closeAdd();
    say(tab === "eq" ? "Equipment added" : tab === "gm" ? "Game added to library" : "Cafe stock item added");
  };
  const canSave = tab === "eq"
    ? !!name.trim() && !!category && Number.isInteger(Number(total)) && Number(total) > 0
    : tab === "gm"
      ? !!name.trim() && !!genre.trim() && !!rating && !!players.trim() && Number.isInteger(Number(consoles)) && Number(consoles) > 0
      : !!name.trim() && quantity !== "" && Number.isInteger(Number(quantity)) && Number(quantity) >= 0 && min !== "" && Number.isInteger(Number(min)) && Number(min) >= 0 && Number.isFinite(Number(price)) && Number(price) > 0;
  const addTitle = tab === "eq" ? "Add equipment" : tab === "gm" ? "Add game to library" : "Add cafe stock item";

  return (
    <>
      <PageHead title={employee ? "Cafe inventory" : "Inventory"} sub={employee ? "View cafe stock and items that need reordering" : "Manage equipment, games and cafe stock"}>
        {!employee && <button className="btn primary" onClick={openAdd}>Add {tab === "eq" ? "equipment" : tab === "gm" ? "game" : "cafe item"}</button>}
      </PageHead>
      {!employee && <div className="tabs">{TABS.map(([key, label]) => <button key={key} className={tab === key ? "on" : ""} onClick={() => setTab(key)}>{label}{key === "cf" && low > 0 ? ` (${low} low)` : ""}</button>)}</div>}
      <div className="panel">
        {!employee && activeTab === "eq" && <table><thead><tr><th>Item</th><th>Type</th><th className="r">Total</th><th className="r">In use</th><th className="r">In repair</th><th className="r">Free</th><th>Usage</th></tr></thead>
          <tbody>{db.equipment.map((item) => <tr key={item.n}><td><b>{item.n}</b></td><td>{item.c}</td><td className="r">{item.total}</td><td className="r">{item.use}</td>
            <td className="r"><span className="qty"><button disabled={item.repair === 0} onClick={() => adjustEquipmentRepair(item.n, -1)}>−</button>{item.repair}<button disabled={item.use + item.repair >= item.total} onClick={() => adjustEquipmentRepair(item.n, 1)}>+</button></span></td>
            <td className="r"><b>{item.total - item.use - item.repair}</b></td><td><div className="prog"><i style={{ width: (item.use / item.total) * 100 + "%" }} /></div></td></tr>)}
            {!db.equipment.length && <tr><td colSpan="7" className="empty">No equipment has been added.</td></tr>}</tbody></table>}
        {!employee && activeTab === "gm" && <div className="covers">{db.gamesLibrary.map((game) => <div className="cover" key={game.t}><GameCover title={game.t} w={150} /><b>{game.t}</b><small>{game.g} · {game.p}P · rated {game.r} · on {game.n} consoles</small></div>)}
          {!db.gamesLibrary.length && <p className="empty">No games have been added to the library.</p>}</div>}
        {activeTab === "cf" && <table><thead><tr><th>Product</th><th className="r">Price</th><th className="r">In stock</th><th>Status</th>{!employee && <th className="r">Adjust stock</th>}</tr></thead>
          <tbody>{db.cafeStock.map((item) => <tr key={item.n}><td><b>{item.n}</b></td><td className="r">{money(item.price)}</td><td className="r">{item.q}</td>
            <td><span className={"badge " + (item.q < item.min ? "low" : "live")}>{item.q < item.min ? `Reorder (min ${item.min})` : "OK"}</span></td>
            {!employee && <td className="r"><span className="qty"><button disabled={item.q === 0} onClick={() => { if (adjustCafeStock(item.n, -1)) say("Cafe stock updated"); }}>−</button><button onClick={() => { if (adjustCafeStock(item.n, 6)) say("Cafe stock updated"); }}>+6</button></span></td>}</tr>)}
            {!db.cafeStock.length && <tr><td colSpan={employee ? "4" : "5"} className="empty">No cafe stock has been added.</td></tr>}</tbody></table>}
      </div>

      {adding && <Modal title={addTitle} onClose={closeAdd} foot={<><button className="btn" onClick={closeAdd}>Cancel</button><button className="btn primary" disabled={!canSave} onClick={save}>Save</button></>}>
        <label>{tab === "eq" ? "Equipment name" : tab === "gm" ? "Game title" : "Product name"}<input value={name} onChange={(event) => setName(event.target.value)} /></label>
        {tab === "eq" && <>
          <label>Type<select value={category} onChange={(event) => setCategory(event.target.value)}>{EQUIPMENT_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
          <label>Total units<input type="number" min="1" step="1" value={total} onChange={(event) => setTotal(event.target.value)} /></label>
        </>}
        {tab === "gm" && <>
          <label>Genre<input value={genre} onChange={(event) => setGenre(event.target.value)} /></label>
          <label>Rating<select value={rating} onChange={(event) => setRating(event.target.value)}>{["E", "E10+", "T", "M"].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Players<input value={players} onChange={(event) => setPlayers(event.target.value)} placeholder="e.g. 1–4" /></label>
          <label>Number of consoles<input type="number" min="1" step="1" value={consoles} onChange={(event) => setConsoles(event.target.value)} /></label>
        </>}
        {tab === "cf" && <>
          <label>Starting quantity<input type="number" min="0" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
          <label>Reorder threshold<input type="number" min="0" step="1" value={min} onChange={(event) => setMin(event.target.value)} /></label>
          <label>Selling price (Rs)<input type="number" min="1" step="1" value={price} onChange={(event) => setPrice(event.target.value)} /></label>
        </>}
      </Modal>}
    </>
  );
}
