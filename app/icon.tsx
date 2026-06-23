import { ImageResponse } from "next/og";

// File-based favicon (overrides any static favicon). Renders the LockIn brand
// mark: a lime square with a bold "L".
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#c6f135",
          color: "#141414",
          fontSize: 24,
          fontWeight: 800,
          borderRadius: 7,
        }}
      >
        L
      </div>
    ),
    { ...size },
  );
}
