import type { NextConfig } from "next";

if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) {
  console.warn(
    "[build] NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID가 설정되지 않았습니다 — 배포본에서 Firebase Analytics가 수집되지 않습니다."
  );
}

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["192.168.45.108"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // v1 경로 전부 308로 영구 이전 (SPEC v4 §4.9)
  async redirects() {
    return [
      { source: "/play", destination: "/", permanent: true },
      { source: "/result", destination: "/", permanent: true },
      { source: "/r/:sage", destination: "/z/:sage", permanent: true },
    ];
  },
};

export default nextConfig;
