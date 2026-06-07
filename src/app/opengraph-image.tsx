import { ImageResponse } from "next/og";
import { siteName } from "@/lib/seo";

export const alt = siteName;
export const size = {
  width: 1200,
  height: 630,
};
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
          justifyContent: "center",
          background: "#10100e",
          color: "#f8f0df",
          padding: 72,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            color: "#d9ad59",
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          World Cup 2026 Satire
        </div>
        <div
          style={{
            marginTop: 34,
            maxWidth: 920,
            fontSize: 88,
            fontWeight: 800,
            lineHeight: 0.95,
          }}
        >
          World Cup Funeral Home
        </div>
        <div
          style={{
            marginTop: 34,
            maxWidth: 840,
            color: "#d8ccb6",
            fontSize: 34,
            lineHeight: 1.25,
          }}
        >
          Bury eliminated teams, carve epitaphs, and share football grief with other fans.
        </div>
      </div>
    ),
    size,
  );
}
