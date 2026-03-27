"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Check if dismissed recently
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    // Detect iOS
    const ua = navigator.userAgent;
    const isiOS = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
    setIsIOS(isiOS);

    if (isiOS) {
      // On iOS Safari, show custom guide after a delay
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android/Desktop: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-[fadeIn_0.3s_ease-out]">
      <div className="rounded-2xl border border-border-strong bg-surface p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-dodger-blue text-white text-lg font-bold">
            17
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm">
              アプリをインストール
            </p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              ホーム画面に追加して、アプリのように使えます
            </p>

            {isIOS && showIOSGuide && (
              <div className="mt-2 rounded-lg bg-surface-alt p-2 text-xs text-gray-600 dark:text-gray-300">
                <p>
                  Safari の共有ボタン{" "}
                  <span className="inline-block rounded bg-gray-200 px-1 dark:bg-gray-700">
                    ↑
                  </span>{" "}
                  をタップ →「ホーム画面に追加」を選択
                </p>
              </div>
            )}

            <div className="mt-3 flex gap-2">
              {isIOS ? (
                <button
                  onClick={() => setShowIOSGuide(!showIOSGuide)}
                  className="rounded-lg bg-dodger-blue px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-dodger-blue-dark"
                >
                  追加方法を見る
                </button>
              ) : (
                <button
                  onClick={handleInstall}
                  className="rounded-lg bg-dodger-blue px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-dodger-blue-dark"
                >
                  インストール
                </button>
              )}
              <button
                onClick={handleDismiss}
                className="rounded-lg px-3 py-1.5 text-xs text-gray-500 transition-colors hover:bg-surface-alt dark:text-gray-400"
              >
                あとで
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
