import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "국가 과제 대시보드",
    short_name: "국가 과제",
    description:
      "정부 R&D, 창업지원, AI·데이터, 전력 분야 국가 과제를 한눈에 확인하세요",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f4f4",
    theme_color: "#3182f6",
    lang: "ko",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
