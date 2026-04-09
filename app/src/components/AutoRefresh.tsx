"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

const DODGERS_TEAM_ID = 119;

interface AutoRefreshProps {
  intervalMs?: number;
}

export default function AutoRefresh({ intervalMs = 300000 }: AutoRefreshProps) {
  const router = useRouter();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isGameDay, setIsGameDay] = useState<boolean | null>(null);

  const checkGameDay = useCallback(async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await fetch(
        `https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=${DODGERS_TEAM_ID}&date=${today}`
      );
      if (!res.ok) return true; // Default to refreshing on error
      const data = await res.json();
      const games = data.dates?.[0]?.games ?? [];
      return games.length > 0;
    } catch {
      return true; // Default to refreshing on error
    }
  }, []);

  useEffect(() => {
    checkGameDay().then(setIsGameDay);
  }, [checkGameDay]);

  useEffect(() => {
    if (isGameDay === false) return; // No game today — skip auto-refresh

    const timer = setInterval(() => {
      router.refresh();
      setLastUpdated(new Date());
    }, intervalMs);
    return () => clearInterval(timer);
  }, [router, intervalMs, isGameDay]);

  const timeStr = lastUpdated.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
      {isGameDay === false ? (
        <>
          <span className="inline-block h-2 w-2 rounded-full bg-gray-400" />
          <span>本日試合なし</span>
        </>
      ) : (
        <>
          <span className="inline-block h-2 w-2 rounded-full bg-green-400 pulse-dot" />
          <span>最終更新: {timeStr}</span>
        </>
      )}
    </div>
  );
}
