"use client";
import { useEffect } from "react";

const P = {
  board: "M4 6h16v10H4zM8 20h8M12 16v4",
  users: "M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6M21 19v-1a4 4 0 0 0-3-3.9M16 4.1a3 3 0 0 1 0 5.8",
  clock: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  building: "M5 21V4h9v17M14 9h5v12M9 8h1M9 12h1M9 16h1M3 21h18",
  pause: "M8 5v14M16 5v14",
  play: "M7 4l13 8-13 8z",
  plus: "M12 5v14M5 12h14",
  out: "M9 21H5V3h4M16 17l5-5-5-5M21 12H9",
  wallet: "M3 7a2 2 0 0 1 2-2h13v4M3 7v10a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2M16 14h2",
  file: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6",
  undo: "M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3",
  box: "M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19 12l2-1-1-3-2 .5-1.5-1.5.5-2-3-1-1 2h-2l-1-2-3 1 .5 2L6 8.5 4 8l-1 3 2 1v2l-2 1 1 3 2-.5L7.5 19l-.5 2 3 1 1-2h2l1 2 3-1-.5-2 1.5-1.5 2 .5 1-3-2-1z",
  pad: "M6 9h12a4 4 0 0 1 4 4v1a3 3 0 0 1-5.2 2l-1.3-1.5h-5L9.2 16A3 3 0 0 1 2 14v-1a4 4 0 0 1 4-4M8 11v3M6.5 12.5h3M15.5 12h.01M18 13.5h.01",
  alert: "M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0",
};
export const Icon = ({ n, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={P[n]} /></svg>
);

export function Modal({ title, onClose, children, foot }) {
  useEffect(() => { const h = (e) => e.key === "Escape" && onClose(); window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <h2>{title}</h2>
        {children}
        {foot && <div className="modal-foot">{foot}</div>}
      </div>
    </div>
  );
}
export const PageHead = ({ title, sub, children }) => (
  <header className="page-head"><div><h1>{title}</h1><p>{sub}</p></div><div className="head-actions">{children}</div></header>
);
export const Avatar = ({ name }) => { const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) * 47 % 360; return <span className="avatar" style={{ background: `linear-gradient(135deg,hsl(${h} 75% 52%),hsl(${(h + 50) % 360} 80% 60%))`, color: "#fff" }}>{name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>; };
