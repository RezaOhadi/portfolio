/**
 * What a sign-in looked like from the server's side: which browser, roughly
 * where, and when. Built from request headers only (Vercel adds the location
 * headers in production; locally they are absent and the location is unknown).
 */
export interface RequestInfo {
  /** "Chrome on Windows", "Safari on iPhone"… */
  browser: string;
  /** "Vienna, Austria" or "Unknown location". */
  location: string;
  ip: string | null;
  userAgent: string;
  /** IANA zone the request came from, when known. */
  timeZone: string | null;
  at: Date;
}

export function describeRequest(headers: Headers): RequestInfo {
  const userAgent = headers.get("user-agent") ?? "";
  const city = decode(headers.get("x-vercel-ip-city"));
  const region = decode(headers.get("x-vercel-ip-country-region"));
  const country = countryName(headers.get("x-vercel-ip-country"));
  const parts = [city, region && region !== city ? region : null, country].filter(Boolean);
  const forwarded = headers.get("x-forwarded-for");
  return {
    browser: describeBrowser(userAgent),
    location: parts.length ? parts.join(", ") : "Unknown location",
    ip: forwarded ? forwarded.split(",")[0].trim() : (headers.get("x-real-ip") ?? null),
    userAgent,
    timeZone: headers.get("x-vercel-ip-timezone"),
    at: new Date(),
  };
}

function decode(value: string | null): string | null {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function countryName(code: string | null): string | null {
  if (!code) return null;
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

/** A short, human name for the browser and the device it runs on. */
export function describeBrowser(ua: string): string {
  if (!ua) return "Unknown browser";
  const browser = /Edg(e|A|iOS)?\//.test(ua)
    ? "Edge"
    : /SamsungBrowser\//.test(ua)
      ? "Samsung Internet"
      : /OPR\/|Opera/.test(ua)
        ? "Opera"
        : /CriOS\//.test(ua)
          ? "Chrome"
          : /FxiOS\//.test(ua)
            ? "Firefox"
            : /Firefox\//.test(ua)
              ? "Firefox"
              : /Chrome\/|Chromium\//.test(ua)
                ? "Chrome"
                : /Safari\//.test(ua) && /Version\//.test(ua)
                  ? "Safari"
                  : "a browser";
  const device = /iPhone/.test(ua)
    ? "iPhone"
    : /iPad/.test(ua)
      ? "iPad"
      : /Android/.test(ua)
        ? "Android"
        : /Windows/.test(ua)
          ? "Windows"
          : /Macintosh|Mac OS X/.test(ua)
            ? "Mac"
            : /CrOS/.test(ua)
              ? "Chromebook"
              : /Linux/.test(ua)
                ? "Linux"
                : null;
  return device ? `${browser} on ${device}` : browser;
}

/** "Sunday 19 October 2026 at 14:32 (Europe/Vienna)" */
export function formatMoment(at: Date, timeZone: string | null): string {
  const zone = timeZone && isZone(timeZone) ? timeZone : "UTC";
  const text = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: zone,
  }).format(at);
  return `${text} (${zone === "UTC" ? "UTC" : zone.replace(/_/g, " ")})`;
}

function isZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}
