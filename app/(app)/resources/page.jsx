"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Icon, PageHead } from "@/components/ui";

const EMPTY_VIDEO = { id: "", title: "", url: "" };

export default function PublicResources() {
  const { db, updatePublicDownloads, saveDemoVideo, deleteDemoVideo, say } = useStore();
  const [mobileUrl, setMobileUrl] = useState(null);
  const [desktopUrl, setDesktopUrl] = useState(null);
  const [video, setVideo] = useState(EMPTY_VIDEO);
  const [downloadError, setDownloadError] = useState("");
  const [videoError, setVideoError] = useState("");
  if (!db) return null;
  const mobile = mobileUrl === null ? db.resources.mobileUrl : mobileUrl;
  const desktop = desktopUrl === null ? db.resources.desktopUrl : desktopUrl;
  const submitDownloads = (event) => {
    event.preventDefault();
    const result = updatePublicDownloads(mobile, desktop);
    if (result) return setDownloadError(result);
    setMobileUrl(null);
    setDesktopUrl(null);
    setDownloadError("");
    say("Public download links saved");
  };
  const submitVideo = (event) => {
    event.preventDefault();
    const result = saveDemoVideo(video.id || null, video.title, video.url);
    if (result) return setVideoError(result);
    setVideo(EMPTY_VIDEO);
    setVideoError("");
    say(video.id ? "Demo video updated" : "Demo video added");
  };
  const removeVideo = (id) => {
    const result = deleteDemoVideo(id);
    if (result) return setVideoError(result);
    if (video.id === id) setVideo(EMPTY_VIDEO);
    setVideoError("");
    say("Demo video removed");
  };
  return (
    <>
      <PageHead title="Public downloads & demos" sub="Manage the app links and demo videos shown before sign-in." />
      <form className="panel pad resource-form" onSubmit={submitDownloads}>
        <h2>App download links</h2>
        <p className="muted">Add secure HTTPS links. The download buttons on the login screen stay disabled until a link is set.</p>
        <div className="fg">
          <label>Mobile application download URL<input type="url" value={mobile} onChange={(event) => setMobileUrl(event.target.value)} placeholder="https://…" /></label>
          <label>Desktop application download URL<input type="url" value={desktop} onChange={(event) => setDesktopUrl(event.target.value)} placeholder="https://…" /></label>
        </div>
        {downloadError && <div className="callout warn" role="alert">{downloadError}</div>}
        <button className="btn primary resource-submit" type="submit"><Icon n="download" />Save download links</button>
      </form>

      <section className="panel pad resource-form">
        <h2>{video.id ? "Edit demo video" : "Add a demo video"}</h2>
        <p className="muted">Use a YouTube or Vimeo link, or a direct HTTPS MP4, WebM, or Ogg URL.</p>
        <form onSubmit={submitVideo}>
          <label>Video title<input required maxLength={100} value={video.title} onChange={(event) => setVideo({ ...video, title: event.target.value })} placeholder="Getting started with Gaming Zone" /></label>
          <label>Video URL<input required type="url" value={video.url} onChange={(event) => setVideo({ ...video, url: event.target.value })} placeholder="https://…" /></label>
          {videoError && <div className="callout warn" role="alert">{videoError}</div>}
          <div className="resource-actions">
            {video.id && <button className="btn" type="button" onClick={() => { setVideo(EMPTY_VIDEO); setVideoError(""); }}>Cancel edit</button>}
            <button className="btn primary" type="submit"><Icon n={video.id ? "edit" : "plus"} />{video.id ? "Save changes" : "Add video"}</button>
          </div>
        </form>
      </section>

      <section className="resource-list">
        <h2>Published demo videos <span className="muted">({db.resources.videos.length})</span></h2>
        {db.resources.videos.length === 0 ? <div className="panel empty">No demo videos have been added yet.</div> : (
          <div className="panel">
            <table><thead><tr><th>Title</th><th>Video URL</th><th /></tr></thead>
              <tbody>{db.resources.videos.map((item) => <tr key={item.id}>
                <td><b>{item.title}</b></td><td><a href={item.url} target="_blank" rel="noopener noreferrer">{item.url}</a></td>
                <td className="r"><button className="btn sm" type="button" onClick={() => { setVideo(item); setVideoError(""); }}><Icon n="edit" size={15} />Edit</button>{" "}
                  <button className="btn sm danger" type="button" onClick={() => removeVideo(item.id)}><Icon n="trash" size={15} />Remove</button></td>
              </tr>)}</tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
