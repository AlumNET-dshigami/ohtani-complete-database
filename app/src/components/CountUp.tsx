"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  /** 最終値（数値）。小数も可 */
  value: number;
  /** 小数桁数。打率系は3、本数系は0 */
  decimals?: number;
  /** 接頭辞（"." など。打率の先頭ゼロ省略表示用） */
  prefix?: string;
  /** 接尾辞（"%", " mph" など） */
  suffix?: string;
  /** アニメーション時間(ms) */
  duration?: number;
  className?: string;
}

/**
 * 数字カウントアップ表示。サンジ設計の「アニメは数字カウントアップ＋fadein程度」に対応。
 * - prefers-reduced-motion 環境では即時表示（やりすぎない＝アクセシビリティ配慮）
 * - tabular-nums で桁揺れを防ぐ
 */
export default function CountUp({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 900,
  className = "",
}: CountUpProps) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduce || duration <= 0) {
      setDisplay(value);
      return;
    }

    const start = performance.now();
    const from = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (value - from) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(value);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return (
    <span className={`tabular ${className}`}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}
