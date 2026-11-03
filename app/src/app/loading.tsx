// Route-level skeleton shown while server components fetch from the MLB API.
export default function Loading() {
  return (
    <div className="space-y-8" role="status" aria-label="読み込み中">
      <div className="h-36 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-3">
          <div className="h-6 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="h-20 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
            ))}
          </div>
        </div>
      ))}
      <p className="text-center text-xs text-gray-400">データを読み込み中...</p>
    </div>
  );
}
