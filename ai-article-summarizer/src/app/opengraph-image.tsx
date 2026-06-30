import { ImageResponse } from "next/og";

export const alt = "AI Article Summarizer social preview";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};

/**
 * Generates a lightweight Open Graph image without remote assets or secrets.
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "stretch",
          background: "#f7f7f5",
          color: "#1c1917",
          display: "flex",
          fontFamily: "Arial, sans-serif",
          height: "100%",
          padding: "72px",
          width: "100%",
        }}
      >
        <div
          style={{
            background: "white",
            border: "2px solid #e7e5e4",
            borderRadius: "44px",
            boxShadow: "0 24px 80px rgba(28, 25, 23, 0.10)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "58px",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <div
              style={{
                background: "#ecfdf5",
                borderRadius: "999px",
                color: "#047857",
                display: "flex",
                fontSize: 30,
                fontWeight: 700,
                padding: "18px 28px",
              }}
            >
              Three summary lengths
            </div>
            <div style={{ color: "#78716c", display: "flex", fontSize: 28 }}>
              SSG Ready
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h1
              style={{
                fontSize: 78,
                letterSpacing: "-0.05em",
                lineHeight: 1.02,
                margin: 0,
                maxWidth: 900,
              }}
            >
              AI Article Summarizer
            </h1>
            <p
              style={{
                color: "#57534e",
                fontSize: 32,
                lineHeight: 1.35,
                margin: "30px 0 0",
                maxWidth: 900,
              }}
            >
              Paste an article URL and generate brief, short, and detailed AI summaries.
            </p>
          </div>
          <div style={{ display: "flex", gap: 18 }}>
            {["Brief", "Short", "Detailed"].map((label) => (
              <div
                key={label}
                style={{
                  background: label === "Short" ? "#047857" : "#f5f5f4",
                  border: "1px solid #e7e5e4",
                  borderRadius: 16,
                  color: label === "Short" ? "white" : "#44403c",
                  display: "flex",
                  fontSize: 26,
                  fontWeight: 700,
                  padding: "16px 24px",
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
