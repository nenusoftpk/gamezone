"use client";

import Link from "next/link";
import { Icon } from "@/components/ui";

export default function StatusPage({
  status,
  eyebrow,
  title,
  description,
  onRetry,
  homeHref = "/dashboard",
  homeLabel = "Back to dashboard",
}) {
  return (
    <section className="feedback-page" role={onRetry ? "alert" : undefined} aria-labelledby="feedback-title">
      <div className="feedback-card">
        <div className="feedback-visual" aria-hidden="true">
          {status === "404" ? <span className="feedback-number">404</span> : <Icon n="alert" size={28} />}
        </div>
        <p className="feedback-eyebrow">{eyebrow}</p>
        <h1 id="feedback-title">{title}</h1>
        <p className="feedback-description">{description}</p>
        <div className="feedback-actions">
          {onRetry && <button className="btn primary" onClick={onRetry}>Try again</button>}
          <Link className={`btn${onRetry ? "" : " primary"}`} href={homeHref}>{homeLabel}</Link>
          <Link className="feedback-link" href="/login">Go to sign in</Link>
        </div>
      </div>
    </section>
  );
}
