interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
}

export default function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="rounded-xl border border-dodger-blue/15 bg-white p-4 shadow-sm dark:border-dodger-blue/25 dark:bg-gray-900">
      <p className="text-xs font-medium text-dodger-blue dark:text-dodger-blue">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      {sub && (
        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{sub}</p>
      )}
    </div>
  );
}
