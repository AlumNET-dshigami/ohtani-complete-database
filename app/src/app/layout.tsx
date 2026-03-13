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
    <html lang="ja" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="border-t border-border">
          <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium text-dodger-blue">MLB Stats API</span>
            {" "}からリアルタイムでデータを取得 | 5分ごとに自動更新
          </div>
        </footer>
      </body>
    </html>
  );
}
