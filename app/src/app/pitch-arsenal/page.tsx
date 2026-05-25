import { getPitchArsenalDetail, type PitchRole } from "@/lib/statcast-api";
import { OHTANI_HEADSHOT_URL } from "@/lib/mlb-api";
import PitchDeepDive from "@/components/PitchDeepDive";

export const dynamic = "force-dynamic";

export default async function PitchArsenalPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const currentYear = new Date().getFullYear();
  const { role } = await searchParams;
  const initialRole: PitchRole = role === "pitcher" ? "pitcher" : "batter";

  const [batter, pitcher] = await Promise.all([
    getPitchArsenalDetail(currentYear, "batter"),
    getPitchArsenalDetail(currentYear, "pitcher"),
  ]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-dodger-blue via-dodger-blue to-dodger-blue-dark p-6 text-white shadow-lg">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-white/5 to-transparent" />
        <div className="relative flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-3 border-white/30 bg-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={OHTANI_HEADSHOT_URL} alt="Shohei Ohtani" className="h-full w-full object-cover" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">球種の深掘り</h1>
            <p className="text-sm text-white/70">
              大谷翔平 — {currentYear}シーズン 打者/投手の球種別分析
            </p>
          </div>
        </div>
      </section>

      <PitchDeepDive
        batter={batter}
        pitcher={pitcher}
        season={currentYear}
        initialRole={initialRole}
      />

      <p className="text-center text-[10px] text-gray-400 dark:text-gray-500">
        ※ データは Baseball Savant（Statcast）より取得。球速・回転数は投手としての投球球種について表示しています。
      </p>
    </div>
  );
}
