import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "국가 과제 대시보드 | IT·SW·AI",
  description:
    "정부 R&D, 창업지원, AI·데이터 관련 국가 과제를 한눈에 확인하세요",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://static.toss.im/tps/main.css"
        />
        <link
          rel="stylesheet"
          href="https://static.toss.im/tps/others.css"
        />
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
