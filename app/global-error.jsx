"use client";

import { useEffect } from "react";

const pageStyle = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  padding: 24,
  background: "#f4f5f8",
  color: "#141828",
  fontFamily: "Inter, system-ui, sans-serif",
};

const cardStyle = {
  width: "min(100%, 520px)",
  padding: "40px 32px",
  border: "1px solid #e5e7ee",
  borderRadius: 24,
  background: "#fff",
  boxShadow: "0 18px 50px rgba(16,19,31,.1)",
  textAlign: "center",
};

const buttonStyle = {
  display: "inline-flex",
  justifyContent: "center",
  padding: "12px 18px",
  border: 0,
  borderRadius: 12,
  background: "linear-gradient(135deg,#ff5a36,#ff8a3d)",
  color: "#fff",
  font: "600 15px Inter,system-ui,sans-serif",
  textDecoration: "none",
  cursor: "pointer",
};

export default function GlobalError({ error, reset }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <main style={pageStyle}>
          <section style={cardStyle} role="alert" aria-labelledby="global-error-title">
            <img src="/icon.png" alt="" width="48" height="48" />
            <p style={{ margin: "20px 0 8px", color: "#d94b2b", fontSize: 12, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase" }}>Gaming Zone Manager</p>
            <h1 id="global-error-title" style={{ margin: 0, fontSize: 28, letterSpacing: "-.04em" }}>We hit an unexpected error.</h1>
            <p style={{ margin: "12px 0 24px", color: "#6a7288", lineHeight: 1.6 }}>The application couldn’t finish loading. Try again, or return to sign in.</p>
            {error.digest && <p style={{ margin: "0 0 20px", color: "#6a7288", fontSize: 12 }}>Reference: {error.digest}</p>}
            <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 10 }}>
              <button onClick={reset} style={buttonStyle}>Try again</button>
              <a href="/login" style={{ ...buttonStyle, background: "#fff", color: "#141828", border: "1px solid #e5e7ee" }}>Go to sign in</a>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
