import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SAP NOW 웨비나",
  description: "온라인 영상 시청 플랫폼",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
