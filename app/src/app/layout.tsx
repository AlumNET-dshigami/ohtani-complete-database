import type { Metadata } from "next";
import Header from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "大谷翔平 データベース",
  description: "大谷翔平の成績をリアルタイムで可視化 - 打撃・投球の全成績とニュース",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased bg-gray-50 dark:bg-gray-950">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="border-t border-gray-200 dark:border-gray-800">
          <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
            データ提供: MLB Stats API | 大谷翔平 データベース
          </div>
        </footer>
      </body>
    </html>
  );
}
