import type { NewsArticle } from "./types";

const MLB_API_BASE = "https://statsapi.mlb.com";
const OHTANI_PLAYER_ID = 660271;

interface MlbEditorial {
  headline?: string;
  subhead?: string;
  seoTitle?: string;
  blurb?: string;
  body?: string;
  date?: string;
  url?: string;
  image?: {
    cuts?: { at2x?: { src?: string }; "270x154"?: { src?: string } }[];
    altText?: string;
  };
  contributor?: { source?: string };
  media?: {
    type?: string;
    image?: { cuts?: Record<string, { src?: string }> };
  };
}

interface MlbContentItem {
  headline?: string;
  subhead?: string;
  seoTitle?: string;
  blurb?: string;
  date?: string;
  url?: string;
  image?: {
    cuts?: Record<string, { src?: string }>;
  };
  contributor?: { source?: string };
}

export async function getOhtaniNews(): Promise<NewsArticle[]> {
  try {
    const res = await fetch(
      `${MLB_API_BASE}/api/v1/people/${OHTANI_PLAYER_ID}?hydrate=editorial(all)`,
      { next: { revalidate: 1800 } }
    );
    const data = await res.json();
    const articles: NewsArticle[] = [];

    const editorial = data.people?.[0]?.editorial;
    if (!editorial) return articles;

    const sources: MlbEditorial[] = [];

    if (editorial.recap?.mlb?.articles) {
      sources.push(...editorial.recap.mlb.articles);
    }
    if (editorial.featured?.mlb?.articles) {
      sources.push(...editorial.featured.mlb.articles);
    }
    if (editorial.latest?.mlb?.articles) {
      sources.push(...editorial.latest.mlb.articles);
    }

    for (const item of sources) {
      const title = item.headline ?? item.seoTitle ?? "";
      if (!title) continue;

      articles.push({
        title,
        description: item.blurb ?? item.subhead ?? "",
        url: item.url ? `https://www.mlb.com${item.url}` : "",
        source: "MLB.com",
        publishedAt: item.date ?? "",
        imageUrl: extractImageUrl(item),
      });
    }

    // Deduplicate by title
    const seen = new Set<string>();
    return articles.filter((a) => {
      if (seen.has(a.title)) return false;
      seen.add(a.title);
      return true;
    });
  } catch {
    return getFallbackNews();
  }
}

function extractImageUrl(item: MlbEditorial): string | undefined {
  if (item.image?.cuts) {
    const cuts = item.image.cuts;
    if (Array.isArray(cuts)) {
      return cuts[0]?.at2x?.src ?? cuts[0]?.["270x154"]?.src;
    }
    const cutObj = cuts as unknown as Record<string, { src?: string }>;
    return cutObj["270x154"]?.src ?? Object.values(cutObj)[0]?.src;
  }
  return undefined;
}

async function getFallbackNews(): Promise<NewsArticle[]> {
  try {
    const res = await fetch(
      `${MLB_API_BASE}/api/v1/content?sportId=1&playerIds=${OHTANI_PLAYER_ID}&limit=20`,
      { next: { revalidate: 1800 } }
    );
    const data = await res.json();
    const items: MlbContentItem[] = data.items ?? [];

    return items.map((item) => ({
      title: item.headline ?? item.seoTitle ?? "",
      description: item.blurb ?? item.subhead ?? "",
      url: item.url ? `https://www.mlb.com${item.url}` : "",
      source: item.contributor?.source ?? "MLB.com",
      publishedAt: item.date ?? "",
      imageUrl: item.image?.cuts?.["270x154"]?.src,
    })).filter((a) => a.title);
  } catch {
    return [];
  }
}
