"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function RetryButton({ label = "再試行" }: { label?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
      className="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-medium text-dodger-blue transition-colors hover:bg-surface-alt disabled:opacity-50"
    >
      {pending ? "読み込み中..." : label}
    </button>
  );
}
