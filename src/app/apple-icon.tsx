import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ff5c45",
          borderRadius: 40,
        }}
      >
        <svg
          width="118"
          height="118"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="8" y="1.2" width="8" height="13.2" rx="4" fill="#fff" />
          <path
            d="M5.2 11.2c0 3.7 3 6.7 6.8 6.7s6.8-3 6.8-6.7"
            stroke="#fff"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          <path
            d="M12 17.9v3.2M8.2 21.1h7.6"
            stroke="#fff"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
