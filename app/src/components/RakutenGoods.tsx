interface GoodsItem {
  title: string;
  imageUrl: string;
  price: string;
  affiliateUrl: string;
  tag: string;
}

// Affiliate ID: 524b31a7.39d945e3.524b31a8.cd6a58aa
const AFFILIATE_BASE = "https://hb.afl.rakuten.co.jp/ichiba/524b31a7.39d945e3.524b31a8.cd6a58aa";

function buildAffiliateUrl(rakutenItemUrl: string): string {
  return `${AFFILIATE_BASE}/?pc=${encodeURIComponent(rakutenItemUrl)}&link_type=text`;
}

const GOODS: GoodsItem[] = [
  {
    title: "大谷翔平 ドジャース レプリカユニフォーム HOME #17",
    imageUrl: "https://hbb.afl.rakuten.co.jp/hgb/524b31a7.39d945e3.524b31a8.cd6a58aa/?me_id=1207922&item_id=10452589&pc=https%3A%2F%2Fthumbnail.image.rakuten.co.jp%2F%400_mall%2Falpen%2Fcabinet%2Fimg%2F792%2F8179722014_2.jpg%3F_ex%3D240x240&s=240x240&t=picttext",
    price: "16,940円",
    affiliateUrl: buildAffiliateUrl("https://item.rakuten.co.jp/alpen/8179722014/"),
    tag: "人気",
  },
  {
    title: "大谷翔平 グッズをもっと探す",
    imageUrl: "",
    price: "",
    affiliateUrl: buildAffiliateUrl("https://search.rakuten.co.jp/search/mall/%E5%A4%A7%E8%B0%B7%E7%BF%94%E5%B9%B3+%E3%82%B0%E3%83%83%E3%82%BA/"),
    tag: "すべて",
  },
];

export default function RakutenGoods() {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          大谷翔平グッズ
        </h2>
        <a
          href={buildAffiliateUrl("https://search.rakuten.co.jp/search/mall/%E5%A4%A7%E8%B0%B7%E7%BF%94%E5%B9%B3/")}
          target="_blank"
          rel="nofollow sponsored noopener"
          className="text-xs font-medium text-dodger-blue hover:underline"
        >
          すべて見る →
        </a>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {GOODS.map((item) => (
          <a
            key={item.title}
            href={item.affiliateUrl}
            target="_blank"
            rel="nofollow sponsored noopener"
            className="card-hover group flex flex-col rounded-xl border border-border bg-surface shadow-sm transition-all hover:border-dodger-blue/40"
          >
            {/* Image area */}
            <div className="relative aspect-square overflow-hidden rounded-t-xl bg-gray-100 dark:bg-gray-800">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="h-full w-full object-contain p-2 transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-4xl">⚾</span>
                </div>
              )}
              {/* Tag badge */}
              <span className="absolute left-2 top-2 rounded-full bg-dodger-red px-2 py-0.5 text-[10px] font-bold text-white shadow">
                {item.tag}
              </span>
            </div>

            {/* Text */}
            <div className="flex flex-1 flex-col p-3">
              <p className="text-xs font-medium leading-snug text-gray-700 dark:text-gray-200 line-clamp-2 group-hover:text-dodger-blue transition-colors">
                {item.title}
              </p>
              {item.price && (
                <p className="mt-auto pt-2 text-sm font-bold text-dodger-red">
                  {item.price}<span className="text-[10px] font-normal text-gray-400">（税込）</span>
                </p>
              )}
              {!item.price && (
                <p className="mt-auto pt-2 text-[10px] text-gray-400">
                  楽天市場で探す
                </p>
              )}
            </div>
          </a>
        ))}
      </div>

      <p className="mt-3 text-center text-[10px] text-gray-400 dark:text-gray-500">
        ※ 価格は変動する場合があります。楽天市場のページでご確認ください。
      </p>
    </section>
  );
}
