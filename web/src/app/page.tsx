"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SOURCES } from "@/lib/types";
import BottomNav from "@/components/BottomNav";

export default function Home() {
  const [bookmark, setBookmark] = useState<{ source: string; page: number } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("shabad.bookmark");
    if (saved) {
      try { setBookmark(JSON.parse(saved)); } catch {}
    }
  }, []);

  const bookmarkInfo = bookmark ? SOURCES.find((s) => s.key === bookmark.source) : null;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#0f0a1a] via-[#1a1035] to-[#0f0a1a] flex flex-col">
      <div className="h-16" />

      <div className="px-6 pt-8 pb-6 text-center">
        <h1 className="text-3xl font-bold text-white tracking-tight">Shabad</h1>
        <p className="text-sm text-[#a89bc2] mt-2 max-w-sm mx-auto leading-relaxed">
          Wisdom from the Guru — in words a child can understand and an elder can feel.
        </p>
      </div>

      {bookmark && bookmarkInfo && (
        <div className="px-6 mb-6">
          <Link
            href={`/ang/${bookmark.page}${bookmark.source !== "ggs" ? `?source=${bookmark.source}` : ""}`}
            className="block w-full p-4 rounded-2xl bg-gradient-to-r from-[#d4a574]/20 to-[#e8c99b]/10 border border-[#d4a574]/30 hover:border-[#d4a574]/60 transition-all"
          >
            <p className="text-[10px] uppercase tracking-widest text-[#d4a574] font-medium mb-1">Continue Reading</p>
            <p className="text-sm text-white/80">{bookmarkInfo.label} — {bookmarkInfo.pageLabel} {bookmark.page}</p>
          </Link>
        </div>
      )}

      <div className="flex-1 px-6 space-y-3 pb-24">
        <p className="text-[10px] uppercase tracking-widest text-white/30 font-medium mb-2">Scriptures</p>
        {SOURCES.map((s) => (
          <Link
            key={s.key}
            href={s.key === "ggs" ? "/ang/1" : `/ang/1?source=${s.key}`}
            className="block p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all"
          >
            <p className="text-base font-medium text-white">{s.label}</p>
            <p className="text-xs text-[#a89bc2] mt-1">{s.pages} {s.pageLabel}s — start reading</p>
          </Link>
        ))}

        <div className="pt-3">
          <Link
            href="/ask"
            className="block p-5 rounded-2xl bg-gradient-to-r from-[#d4a574]/10 to-transparent border border-[#d4a574]/20 hover:border-[#d4a574]/40 transition-all"
          >
            <p className="text-base font-medium text-white">Search Shabad</p>
            <p className="text-xs text-[#a89bc2] mt-1">Find verses by keyword across all scriptures</p>
          </Link>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
