import { ImageResponse } from "next/og";

export const alt = "Reza Ohadi — Pianist & Composer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background: "#0A0A0C",
          padding: 72,
          position: "relative",
        }}
      >
        {/* piano keys strip */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, display: "flex", height: 120 }}>
          {Array.from({ length: 28 }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                background: i % 7 === 1 || i % 7 === 4 ? "#0A0A0C" : "#F2EEE6",
                opacity: 0.12,
                marginRight: 2,
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 10, color: "#9A9AA6" }}>
          REZA OHADI
        </div>
        <div style={{ display: "flex", fontSize: 110, color: "#F2EEE6", marginTop: 8 }}>
          Pianist · Composer
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#B9B9C2", marginTop: 18 }}>
          Music shaped by memory, silence, and emotion.
        </div>
      </div>
    ),
    size,
  );
}
