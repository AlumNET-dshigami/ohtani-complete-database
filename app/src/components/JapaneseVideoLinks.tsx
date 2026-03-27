interface VideoLink {
  title: string;
  url: string;
  source: string;
  icon: string;
}

const VIDEO_LINKS: VideoLink[] = [
  {
    title: "MLB Japan 公式（日本語実況付き）",
    url: "https://www.mlb.com/ja/video/search?q=ohtani&qt=FREETEXT",
    source: "MLB.com",
    icon: "⚾",
  },
  {
    title: "大谷翔平 ハイライト動画",
    url: "https://www.mlb.com/ja/player/shohei-ohtani-660271?stats=highlights",
    source: "MLB.com",
    icon: "🎬",
  },
  {
    title: "MLB Japan YouTube",
    url: "https://www.youtube.com/@MLBJapan/search?query=%E5%A4%A7%E8%B0%B7",
    source: "YouTube",
    icon: "▶️",
  },
  {
    title: "大谷翔平 全ホームラン集",
    url: "https://www.youtube.com/results?search_query=%E5%A4%A7%E8%B0%B7%E7%BF%94%E5%B9%B3+%E3%83%9B%E3%83%BC%E3%83%A0%E3%83%A9%E3%83%B3+2026",
    source: "YouTube",
    icon: "💥",
  },
  {
    title: "NHK スポーツ 大谷翔平",
    url: "https://www3.nhk.or.jp/news/word/0002049.html",
    source: "NHK",
    icon: "📺",
  },
  {
    title: "スポーツナビ 大谷翔平",
    url: "https://sports.yahoo.co.jp/mlb/player/2018900030/video",
    source: "Yahoo! JAPAN",
    icon: "🏟️",
  },
];

export default function JapaneseVideoLinks() {
  return (
    <section>
      <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
        動画・ハイライト（日本語）
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {VIDEO_LINKS.map((link) => (
          <a
            key={link.title}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="card-hover group flex items-center gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm transition-all hover:border-dodger-blue/40"
          >
            <span className="text-2xl">{link.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-900 dark:text-white group-hover:text-dodger-blue transition-colors truncate">
                {link.title}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {link.source}
              </p>
            </div>
            <svg
              className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-dodger-blue"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </a>
        ))}
      </div>
    </section>
  );
}
