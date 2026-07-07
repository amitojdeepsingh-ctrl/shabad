import { NextRequest, NextResponse } from "next/server";
import { searchVerses } from "@/lib/db";
import { SOURCES, type ScriptureSource } from "@/lib/types";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  const rawSource = req.nextUrl.searchParams.get("source");
  const source: ScriptureSource | null =
    rawSource === "D" || rawSource === "B" ? rawSource : "ggs";

  if (!q.trim()) {
    return NextResponse.json({ verses: [] });
  }

  const keywords = q
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 5);

  const searchResults = new Map<number, { verse: any; score: number }>();
  for (const keyword of keywords) {
    const verses = await searchVerses(keyword, source, 10);
    for (const v of verses) {
      const existing = searchResults.get(v.id);
      if (existing) {
        existing.score += 1;
      } else {
        searchResults.set(v.id, { verse: v, score: 1 });
      }
    }
  }

  const topVerses = Array.from(searchResults.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map((r) => r.verse);

  const sourceLabel = SOURCES.find((s) => s.key === source)?.label || "scriptures";

  return NextResponse.json({
    verses: topVerses,
    sourceLabel,
    query: q,
  });
}
