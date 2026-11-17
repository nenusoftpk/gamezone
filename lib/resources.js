export const isSecureWebUrl = (value) => {
  if (!value) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

export const getDemoVideoSource = (value) => {
  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;

  const host = url.hostname.toLowerCase();
  const youtubeHost = host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be";
  if (youtubeHost) {
    const id = host === "youtu.be"
      ? url.pathname.slice(1).split("/")[0]
      : url.pathname === "/watch"
        ? url.searchParams.get("v")
        : url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];
    if (!id || !/^[\w-]{11}$/.test(id)) return null;
    return { kind: "embed", src: `https://www.youtube-nocookie.com/embed/${id}` };
  }

  const vimeoHost = host === "vimeo.com" || host.endsWith(".vimeo.com");
  if (vimeoHost) {
    const id = url.pathname.match(/\/(?:video\/)?(\d+)(?:\/|$)/)?.[1];
    if (!id) return null;
    return { kind: "embed", src: `https://player.vimeo.com/video/${id}` };
  }

  if (/\.(mp4|webm|ogg)$/i.test(url.pathname)) return { kind: "video", src: url.href };
  return null;
};
