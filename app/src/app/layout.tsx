import type { Metadata, Viewport } from "next";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import InstallPrompt from "@/components/InstallPrompt";
import "./globals.css";

export const metadata: Metadata = {
  title: "大谷翔平 データベース",
  description: "大谷翔平の成績をリアルタイムで可視化 - 打撃・投球の全成績とニュース",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "大谷DB",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#005A9C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        <ServiceWorkerRegister />
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-6 pb-20 md:pb-8">{children}</main>
        <footer className="border-t border-border mb-16 md:mb-0">
          <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium text-dodger-blue">MLB Stats API</span>
            {" "}からリアルタイムでデータを取得 | 5分ごとに自動更新
          </div>
        </footer>
        <BottomNav />
        <InstallPrompt />
      </body>
    </html>
  );
}
