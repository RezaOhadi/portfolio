/** Only accept known provider hosts and complete identifiers. */
export function parseYouTubeId(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol)) return null;
    const host = url.hostname.toLowerCase();
    let id: string | null = null;
    if (host === "youtu.be") id = url.pathname.split("/")[1];
    else if (
      [
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "youtube-nocookie.com",
        "www.youtube-nocookie.com",
      ].includes(host)
    ) {
      const segments = url.pathname.split("/").filter(Boolean);
      id =
        segments[0] === "watch"
          ? url.searchParams.get("v")
          : ["embed", "shorts", "live"].includes(segments[0])
            ? segments[1]
            : null;
    }
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}
export function spotifyEmbedUrl(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "open.spotify.com")
      return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0]?.startsWith("intl-")) parts.shift();
    if (parts[0] === "embed") parts.shift();
    if (
      parts.length !== 2 ||
      !["artist", "album", "track", "playlist", "episode", "show"].includes(
        parts[0],
      ) ||
      !/^[a-zA-Z0-9]{22}$/.test(parts[1])
    )
      return null;
    return "https://open.spotify.com/embed/" + parts.join("/") + "?theme=0";
  } catch {
    return null;
  }
}
