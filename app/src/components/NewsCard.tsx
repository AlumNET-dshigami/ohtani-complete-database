import type { NewsArticle } from "@/lib/types";

export default function NewsCard({ article }: { article: NewsArticle }) {
  const date = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="card-hover group block rounded-xl border border-border bg-surface shadow-sm"
    >
      {article.imageUrl && (
        <div className="overflow-hidden rounded-t-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.imageUrl}
            alt={article.title}
            className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="rounded-full bg-dodger-blue px-2.5 py-0.5 font-medium text-white">
            {article.source}
          </span>
          {date && <span>{date}</span>}
        </div>
        <h3 className="mb-1 font-bold text-gray-900 group-hover:text-dodger-blue dark:text-white dark:group-hover:text-dodger-blue">
          {article.title}
        </h3>
        {article.description && (
          <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
            {article.description}
          </p>
        )}
      </div>
    </a>
  );
}
