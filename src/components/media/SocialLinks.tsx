import type { SocialLinks as SocialData } from "@/lib/types";
import { mediaConfig } from "@/config/media";
import { spotifyEmbedUrl } from "@/lib/media-urls";
export function SocialLinks({ social }: { social: SocialData }) {
  const spotify = social.spotify || mediaConfig.spotifyUrl;
  const links = [
    { name: "Instagram", href: social.instagram, icon: "instagram" },
    { name: "YouTube", href: social.youtube, icon: "youtube" },
    {
      name: spotifyEmbedUrl(spotify) ? "Spotify" : "Find on Spotify",
      href: spotifyEmbedUrl(spotify)
        ? spotify
        : "https://open.spotify.com/search/Reza%20Ohadi",
      icon: "spotify",
    },
  ].filter((link) => link.href);
  return (
    <div className="social-links">
      {links.map((link) => (
        <a
          key={link.icon}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src={"/assets/icons/" + link.icon + ".svg"}
            alt=""
            width={19}
            height={19}
            className="brand-icon"
          />
          {link.name}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ))}
    </div>
  );
}
