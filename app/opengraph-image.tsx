import { ImageResponse } from "next/og";

export const alt = "SURAJ.WEB — Suraj Kirtaniya, Freelance Web Developer & Website Designer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(145deg,#000 0%,#060606 60%,#231008 100%)",
          color: "#f7eee8",
          padding: "64px 72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 28 }}>
          <span style={{ color: "#f47b38" }}>✦</span>
          <span>SURAJ.WEB</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontSize: 74, lineHeight: 1.02, letterSpacing: -3 }}>
            Websites designed to turn attention into action.
          </div>
          <div style={{ fontSize: 27, color: "#b9aaa0" }}>
            Suraj Kirtaniya · Web Design · Web Development · AI Automation
          </div>
        </div>
      </div>
    ),
    size
  );
}
