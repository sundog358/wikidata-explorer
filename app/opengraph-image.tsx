import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site-config.mjs";

export const alt = "Wikidata Explorer social preview";
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
          alignItems: "stretch",
          background: "#f8fafc",
          color: "#0f172a",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Inter, Arial, sans-serif",
          height: "100%",
          justifyContent: "space-between",
          padding: "64px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
          <div style={{ color: "#0369a1", fontSize: 30, fontWeight: 700, letterSpacing: 0 }}>
            Wikidata Explorer
          </div>
          <div
            style={{
              border: "2px solid #bae6fd",
              borderRadius: 999,
              color: "#075985",
              fontSize: 24,
              fontWeight: 700,
              padding: "10px 22px",
            }}
          >
            Evidence-first graph research
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 26, maxWidth: 900 }}>
          <div style={{ fontSize: 78, fontWeight: 800, letterSpacing: 0, lineHeight: 1.02 }}>
            Search Wikidata. Inspect evidence. Follow the graph.
          </div>
          <div style={{ color: "#475569", fontSize: 32, lineHeight: 1.35 }}>
            {siteConfig.description}
          </div>
        </div>

        <div style={{ display: "flex", gap: 18 }}>
          {["Q/P IDs", "References", "Qualifiers", "Graph exports", "AG2-ready"].map((label) => (
            <div
              key={label}
              style={{
                background: "#e0f2fe",
                border: "1px solid #7dd3fc",
                borderRadius: 10,
                color: "#075985",
                fontSize: 24,
                fontWeight: 700,
                padding: "12px 18px",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}