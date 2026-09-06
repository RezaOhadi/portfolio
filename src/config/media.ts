/** Public media URLs only. Never put API secrets in this file.
 * YouTube overrides use the existing site_content.media item's id.
 * Add/edit the full media records through Supabase site_content.media.
 */
export const mediaConfig = {
  spotifyUrl: "https://open.spotify.com/artist/0PF3j82FQfwxYpr2YGFzZQ",
  youtubeOverrides: {
    m1: "https://www.youtube.com/watch?v=5GiLjAbmLGc",
    m2: "https://www.youtube.com/watch?v=cuzWQkuKDVE",
  } as Record<string, string>,
};
