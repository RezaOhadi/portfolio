"use client";
import { useState } from "react";
import { spotifyEmbedUrl } from "@/lib/media-urls";
export function SpotifyEmbed({
  url,
  title = "Reza Ohadi on Spotify",
}: {
  url?: string;
  title?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const source = spotifyEmbedUrl(url);
  return (
    <div className="spotify-frame">
      {source && loaded ? (
        <iframe
          src={source}
          title={title}
          loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <div className="embed-prompt">
          <p>
            {source
              ? "Listen to the recordings here. The Spotify player connects only when you choose to load it."
              : "Spotify recordings will appear here when a release is available."}
          </p>
          {source ? (
            <button
              className="action-primary"
              type="button"
              onClick={() => setLoaded(true)}
            >
              Load Spotify player
            </button>
          ) : (
            <a className="action-text" href="/contact">
              Ask about recordings
            </a>
          )}
        </div>
      )}
    </div>
  );
}
