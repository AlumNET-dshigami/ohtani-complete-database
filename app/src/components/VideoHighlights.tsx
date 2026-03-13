import type { VideoHighlight } from "@/lib/types";

interface VideoHighlightsProps {
  highlights: VideoHighlight[];
  gameDate: string;
  opponent: string;
}

export default function VideoHighlights({ highlights, gameDate, opponent }: VideoHighlightsProps) {
  if (highlights.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        {gameDate} {opponent} — ハイライト動画
      </h4>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {highlights.map((video, i) => (
          <a
            key={i}
            href={video.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="card-hover group flex gap-3 rounded-lg border border-border bg-surface p-3"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-dodger-red/10 text-dodger-red">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 group-hover:text-dodger-blue dark:text-white line-clamp-2">
                {video.title}
              </p>
              {video.duration && (
                <p className="mt-0.5 text-xs text-gray-400">{video.duration}</p>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
