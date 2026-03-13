interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
}

export default function StatCard({ label, value, sub, highlight }: StatCardProps) {
  return (
    <div
      className={`card-hover rounded-xl border bg-surface p-4 shadow-sm ${
        highlight
          ? "border-accent-gold/40 ring-1 ring-accent-gold/20"
          : "border-border"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-dodger-blue">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${
        highlight ? "gradient-text" : "text-gray-900 dark:text-white"
      }`}>
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{sub}</p>
      )}
    </div>
  );
}
