import { getOhtaniNews } from "@/lib/news-api";
import NewsCard from "@/components/NewsCard";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const articles = await getOhtaniNews();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          ニュース
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          大谷翔平に関する最新ニュース記事
        </p>
      </div>

      {articles.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-lg text-gray-500 dark:text-gray-400">
            現在ニュース記事はありません
          </p>
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
            シーズン中はMLB.comから最新記事が表示されます
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, i) => (
            <NewsCard key={i} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
