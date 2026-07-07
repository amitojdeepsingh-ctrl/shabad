import { NextRequest, NextResponse } from "next/server";
import { getVersesByAng, getPageExplanation } from "@/lib/db";
import { SOURCES, type ScriptureSource } from "@/lib/types";

export async function GET(req: NextRequest) {
  const n = parseInt(req.nextUrl.searchParams.get("n") || "0", 10);
  const rawSource = req.nextUrl.searchParams.get("s");
  const source: ScriptureSource = rawSource === "D" || rawSource === "B" ? rawSource : "ggs";
  const info = SOURCES.find((s) => s.key === source)!;

  if (n < 1 || n > info.pages) {
    return NextResponse.json({ verses: [], explanation: null, source, ang: n, info });
  }

  const [verses, explanation] = await Promise.all([
    getVersesByAng(n, source),
    getPageExplanation(source, n),
  ]);

  return NextResponse.json({ verses, explanation, source, ang: n, info });
}
