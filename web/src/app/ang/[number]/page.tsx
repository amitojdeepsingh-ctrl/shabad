import { getVersesByAng, getPageExplanation } from "@/lib/db";
import AngViewer from "@/components/AngViewer";
import BookmarkSave from "@/components/BookmarkSave";
import KeyboardNav from "@/components/KeyboardNav";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SOURCES, type ScriptureSource } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AngPage({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ source?: string }>;
}) {
  const { number } = await params;
  const { source: rawSource } = await searchParams;
  const source: ScriptureSource = (rawSource === "D" || rawSource === "B") ? rawSource : "ggs";
  const sourceInfo = SOURCES.find((s) => s.key === source)!;
  const ang = parseInt(number, 10);
  if (isNaN(ang) || ang < 1 || ang > sourceInfo.pages) notFound();

  const verses = await getVersesByAng(ang, source);
  const pageExplanation = await getPageExplanation(source, ang);

  if (verses.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-stone-600 mb-2">
          No verses found
        </h1>
        <p className="text-sm text-stone-400">
          This {sourceInfo.pageLabel.toLowerCase()} does not exist in {sourceInfo.label}.
        </p>
      </div>
    );
  }

  const prevHref = ang > 1 ? `/ang/${ang - 1}${source !== "ggs" ? `?source=${source}` : ""}` : null;
  const nextHref = ang < sourceInfo.pages ? `/ang/${ang + 1}${source !== "ggs" ? `?source=${source}` : ""}` : null;

  return (
    <div className="min-h-screen bg-stone-100 py-6">
      <BookmarkSave source={source} page={ang} />
      <KeyboardNav prevHref={prevHref} nextHref={nextHref} />

      {/* Book header */}
      <div className="text-center mb-4 px-4">
        <p className="text-xs text-stone-400 uppercase tracking-widest">
          {sourceInfo.label}
        </p>
      </div>

      {/* Book spread */}
      <div className="max-w-3xl mx-auto px-4 flex items-start gap-3 md:gap-6">
        {/* Left arrow */}
        <div className="pt-24 shrink-0">
          {prevHref ? (
            <Link
              href={prevHref}
              className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-white border border-stone-200 text-stone-400 hover:text-amber-700 hover:border-amber-300 shadow-sm hover:shadow transition-all"
              aria-label={`Previous ${sourceInfo.pageLabel}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          ) : (
            <div className="w-10 h-10 md:w-12 md:h-12" />
          )}
        </div>

        {/* Book page */}
        <div className="flex-1 bg-white rounded-lg shadow-lg border border-stone-200 min-h-[60vh]">
          <div className="p-6 md:p-10">
            <div className="text-center mb-8 pb-4 border-b border-stone-100">
              <p className="text-lg font-semibold text-stone-700 font-mono">
                {sourceInfo.pageLabel} {ang}
              </p>
            </div>
            <AngViewer verses={verses} pageExplanation={pageExplanation} />
          </div>
        </div>

        {/* Right arrow */}
        <div className="pt-24 shrink-0">
          {nextHref ? (
            <Link
              href={nextHref}
              className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-white border border-stone-200 text-stone-400 hover:text-amber-700 hover:border-amber-300 shadow-sm hover:shadow transition-all"
              aria-label={`Next ${sourceInfo.pageLabel}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ) : (
            <div className="w-10 h-10 md:w-12 md:h-12" />
          )}
        </div>
      </div>

      {/* Page number footer */}
      <p className="text-center mt-6 text-xs text-stone-400 font-mono">
        {sourceInfo.pageLabel} {ang} of {sourceInfo.pages}
      </p>
      <p className="text-center mt-1 text-[10px] text-stone-300">
        Use ← → arrow keys to navigate
      </p>
    </div>
  );
}