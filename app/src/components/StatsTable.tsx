interface Column<T> {
  key: keyof T;
  label: string;
}

interface StatsTableProps<T> {
  title: string;
  columns: Column<T>[];
  data: T[];
  highlightKey?: keyof T;
  highlightValue?: string | number;
}

export default function StatsTable<T extends object>({
  title,
  columns,
  data,
  highlightKey,
  highlightValue,
}: StatsTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">データがありません</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="border-b border-border px-6 py-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-dodger-blue-light dark:bg-dodger-blue/10">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-dodger-blue dark:text-gray-300"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.map((row, i) => {
              const isHighlighted =
                highlightKey &&
                highlightValue !== undefined &&
                row[highlightKey] === highlightValue;
              return (
                <tr
                  key={i}
                  className={`fade-in transition-colors ${
                    isHighlighted
                      ? "bg-accent-gold/10 font-medium"
                      : "hover:bg-dodger-blue-light/50 dark:hover:bg-dodger-blue/5"
                  }`}
                  style={{ animationDelay: `${i * 20}ms` }}
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-300"
                    >
                      {String(row[col.key] ?? "-")}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
