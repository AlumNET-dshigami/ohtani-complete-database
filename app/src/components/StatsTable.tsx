interface Column<T> {
  key: keyof T;
  label: string;
}

interface StatsTableProps<T> {
  title: string;
  columns: Column<T>[];
  data: T[];
}

export default function StatsTable<T extends object>({
  title,
  columns,
  data,
}: StatsTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-dodger-blue/15 bg-white p-6 dark:border-dodger-blue/25 dark:bg-gray-900">
        <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">データがありません</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-dodger-blue/15 bg-white dark:border-dodger-blue/25 dark:bg-gray-900">
      <div className="border-b border-dodger-blue/15 px-6 py-4 dark:border-dodger-blue/25">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dodger-blue/10 bg-dodger-blue-light dark:border-dodger-blue/20 dark:bg-dodger-blue/10">
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
            {data.map((row, i) => (
              <tr
                key={i}
                className="transition-colors hover:bg-dodger-blue-light/50 dark:hover:bg-dodger-blue/5"
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
