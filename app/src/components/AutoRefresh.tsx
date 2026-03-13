"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AutoRefreshProps {
  intervalMs?: number;
}

export default function AutoRefresh({ intervalMs = 300000 }: AutoRefreshProps) {
  const router = useRouter();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      router.refresh();
      setLastUpdated(new Date());
    }, intervalMs);
    return () => clearInterval(timer);
  }, [router, intervalMs]);

  const timeStr = lastUpdated.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
      <span className="inline-block h-2 w-2 rounded-full bg-green-400 pulse-dot" />
      <span>最終更新: {timeStr}</span>
    </div>
  );
}
