// Custom SVG illustrations: controller, console, game covers, banners. No external images needed.
const PAL = [["#ff5a36", "#ff9a3d"], ["#6d5efc", "#27c4f5"], ["#0e9f8e", "#8be28b"], ["#e1306c", "#ffb347"], ["#2f3a8f", "#a855f7"], ["#f59e0b", "#ef4444"]];
const hash = (s) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0);
export const grad = (name) => PAL[hash(name) % PAL.length];

// Gamepad drawn in a 300x200 box. Use inside an <svg>/<g>.
export function Pad({ body = "#f4f5fa", edge = "#cfd4e6", glow = "#27c4f5" }) {
  return (
    <g>
      <path d="M62 66C92 34 208 34 238 66C268 98 292 158 262 178C240 192 214 152 190 142H110C86 152 60 192 38 178C8 158 32 98 62 66Z" fill={body} stroke={edge} strokeWidth="3" />
      <path d="M122 50C140 40 160 40 178 50" stroke={glow} strokeWidth="6" strokeLinecap="round" fill="none" />
      <rect x="120" y="62" width="60" height="26" rx="10" fill="#e3e6f2" />
      <circle cx="116" cy="122" r="16" fill="#2a2f4a" /><circle cx="116" cy="122" r="9" fill="#3a4166" />
      <circle cx="184" cy="122" r="16" fill="#2a2f4a" /><circle cx="184" cy="122" r="9" fill="#3a4166" />
      <path d="M82 80h10v8h8v10h-8v8H82v-8h-8V88h8z" fill="#2a2f4a" />
      <circle cx="218" cy="76" r="6" fill="#27c4f5" /><circle cx="232" cy="90" r="6" fill="#ff5a36" />
      <circle cx="218" cy="104" r="6" fill="#ffb347" /><circle cx="204" cy="90" r="6" fill="#a855f7" />
    </g>
  );
}
const Tower = ({ x = 0, y = 0, s = 1, glow = "#27c4f5" }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M0 24Q12 6 30 12V218Q12 226 0 208Z" fill="#fff" stroke="#d9deee" strokeWidth="2" />
    <path d="M60 24Q48 6 30 12V218Q48 226 60 208Z" fill="#e9ecf7" stroke="#d9deee" strokeWidth="2" />
    <rect x="28" y="22" width="4" height="186" rx="2" fill={glow} />
  </g>
);

export function HeroArt() {
  return (
    <svg viewBox="0 0 640 560" role="img" aria-label="Game controller and console illustration">
      <defs>
        <radialGradient id="g1" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#ff5a36" stopOpacity=".55" /><stop offset="1" stopColor="#ff5a36" stopOpacity="0" /></radialGradient>
        <radialGradient id="g2" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#6d5efc" stopOpacity=".6" /><stop offset="1" stopColor="#6d5efc" stopOpacity="0" /></radialGradient>
        <linearGradient id="fl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6d5efc" stopOpacity="0" /><stop offset="1" stopColor="#6d5efc" stopOpacity=".5" /></linearGradient>
      </defs>
      <circle cx="400" cy="230" r="230" fill="url(#g2)" /><circle cx="210" cy="330" r="190" fill="url(#g1)" />
      <g stroke="url(#fl)" strokeWidth="1.5">{[0, 1, 2, 3, 4, 5].map((i) => <line key={i} x1="0" x2="640" y1={400 + i * i * 6 + i * 10} y2={400 + i * i * 6 + i * 10} />)}
        {[-6, -4, -2, 0, 2, 4, 6, 8, 10, 12].map((i) => <line key={i} x1={320 + i * 28} y1="400" x2={320 + i * 120 - 320 * 0 + (i - 3) * 20} y2="560" />)}</g>
      <Tower x={400} y={120} s={1.55} />
      <g transform="translate(40 250) rotate(-12 150 100) scale(1.55)"><Pad glow="#ff5a36" /></g>
      <g opacity=".9"><circle cx="560" cy="110" r="10" fill="#27c4f5" /><rect x="90" y="150" width="22" height="22" rx="5" fill="#ffb347" transform="rotate(20 100 160)" /><path d="M520 400l14 24h-28z" fill="#ff5a36" /><circle cx="130" cy="470" r="7" fill="#a855f7" /><circle cx="590" cy="320" r="6" fill="#ffb347" /></g>
    </svg>
  );
}
export function BannerArt() {
  return (
    <svg viewBox="0 0 420 200" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
      <defs><radialGradient id="b1" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#ff5a36" stopOpacity=".5" /><stop offset="1" stopColor="#ff5a36" stopOpacity="0" /></radialGradient></defs>
      <circle cx="270" cy="100" r="150" fill="url(#b1)" />
      <Tower x={330} y={26} s={.62} />
      <g transform="translate(110 40) rotate(-10 150 100) scale(.78)"><Pad glow="#ff5a36" /></g>
      <circle cx="400" cy="30" r="6" fill="#27c4f5" /><rect x="90" y="30" width="12" height="12" rx="3" fill="#ffb347" transform="rotate(20 96 36)" /><circle cx="70" cy="150" r="5" fill="#a855f7" />
    </svg>
  );
}
export function Banner({ title, sub, stats = [] }) {
  return (
    <section className="banner">
      <div className="bn-txt"><h2>{title}</h2><p>{sub}</p>
        <div className="bn-stats">{stats.map(([l, v]) => <div key={l}><b>{v}</b><span>{l}</span></div>)}</div></div>
      <div className="bn-art"><BannerArt /></div>
    </section>
  );
}
export function GameCover({ title, w = 120 }) {
  const [a, b] = grad(title), ini = title.split(" ").filter((x) => /[A-Za-z0-9]/.test(x[0])).slice(0, 2).map((x) => x[0]).join("").toUpperCase(), id = "c" + hash(title);
  return (
    <svg width={w} height={(w * 4) / 3} viewBox="0 0 120 160" role="img" aria-label={title} style={{ borderRadius: 12, flex: "none", display: "block" }}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient></defs>
      <rect width="120" height="160" fill={`url(#${id})`} />
      <circle cx="100" cy="24" r="46" fill="#fff" opacity=".14" /><circle cx="14" cy="150" r="52" fill="#000" opacity=".16" />
      <path d="M0 110L120 70V160H0Z" fill="#000" opacity=".18" />
      <g transform="translate(34 98) scale(.18)" opacity=".9"><Pad body="#fff" edge="#fff" glow="#fff" /></g>
      <text x="14" y="62" fontFamily="Sora, sans-serif" fontWeight="700" fontSize="38" fill="#fff">{ini}</text>
    </svg>
  );
}
export function ConsoleMini({ state = "free" }) {
  const glow = { free: "#9aa3bd", live: "#0e9f8e", paused: "#d98a00", low: "#d92d4a", due: "#d92d4a", off: "#c3c8d8" }[state];
  return (
    <svg width="130" height="92" viewBox="0 0 130 92" aria-hidden="true">
      <ellipse cx="62" cy="86" rx="46" ry="5" fill="#10131f" opacity=".07" />
      <Tower x={36} y={4} s={.34} glow={glow} />
      <g transform="translate(70 42) scale(.19)"><Pad body="#fff" glow={glow} /></g>
    </svg>
  );
}
