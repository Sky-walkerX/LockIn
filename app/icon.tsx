import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";

// File-based favicon (overrides any static favicon). The notebook's cover in
// miniature: a green cloth square with a cream label carrying the initial.
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
          background: "#24453b",
          borderRadius: 6,
        }}
      >
        <div
          style={{
            width: 20,
            height: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f7f5ee",
            color: "#1b2a2f",
            fontSize: 17,
            fontWeight: 800,
            borderRadius: 2,
          }}
        >
          {BRAND.name.charAt(0)}
        </div>
      </div>
    ),
    { ...size },
  );
}
