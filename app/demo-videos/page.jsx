"use client";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { getDemoVideoSource } from "@/lib/resources";
import { Icon } from "@/components/ui";

export default function DemoVideos() {
  const { db } = useStore();
  const videos = db?.resources?.videos || [];
  return (
    <main className="public-videos">
      <header className="public-videos-head">
        <Link href="/login" className="back">← Back to sign in</Link>
        <h1>Gaming Zone demo videos</h1>
        <p>Explore tutorials and product demos from the Gaming Zone team.</p>
      </header>
      {!db ? <p className="empty">Loading videos…</p> : videos.length === 0
        ? <p className="empty">Demo videos will appear here soon.</p>
        : <div className="video-grid">{videos.map((video) => {
          const source = getDemoVideoSource(video.url);
          if (!source) return null;
          return (
            <article className="panel video-card" key={video.id}>
              {source.kind === "embed"
                ? <iframe src={source.src} title={video.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
                : <video src={source.src} controls preload="metadata" />}
              <h2>{video.title}</h2>
            </article>
          );
        })}</div>}
      <footer className="public-videos-foot"><Link href="/login" className="btn primary"><Icon n="login" />Sign in to Gaming Zone</Link></footer>
    </main>
  );
}
