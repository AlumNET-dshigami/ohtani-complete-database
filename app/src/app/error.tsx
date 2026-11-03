"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-12 text-center">
      <p className="text-lg text-gray-500 dark:text-gray-400">データの読み込みに失敗しました</p>
      <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
        通信状況を確認して、もう一度お試しください
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-4 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-dodger-blue transition-colors hover:bg-surface-alt"
      >
        再試行
      </button>
    </section>
  );
}
