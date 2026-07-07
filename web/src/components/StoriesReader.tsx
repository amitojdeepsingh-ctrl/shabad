"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { SOURCES, type Verse } from "@/lib/types";
import BottomNav from "./BottomNav";

interface PageData {
  verses: Verse[];
  explanation: string | null;
  source: string;
  ang: number;
  info: { key: string; label: string; pages: number; pageLabel: string };
}

export default function StoriesReader({ initialSource, initialAng }: { initialSource: string; initialAng: number }) {
  const router = useRouter();
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [slideDir, setSlideDir] = useState<"left" | "right" | null>(null);
  const sourceRef = useRef(initialSource);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  const source = sourceRef.current;
  const info = SOURCES.find((s) => s.key === source) || SOURCES[0];

  const fetchPage = useCallback(async (ang: number, slide?: "left" | "right") => {
    setLoading(true);
    setSlideDir(slide || null);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    try {
      const res = await fetch(`/api/ang?n=${ang}&s=${source}`);
      const json = await res.json();
      setData(json);
      const href = json.source === "ggs" ? `/ang/${ang}` : `/ang/${ang}?source=${json.source}`;
      window.history.replaceState(null, "", href);
    } catch {
      setData(null);
    }
    setLoading(false);
  }, [source]);

  useEffect(() => { fetchPage(initialAng); }, [initialAng, fetchPage]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft" && data) goTo(data.ang - 1);
      else if (e.key === "ArrowRight" && data) goTo(data.ang + 1);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  useEffect(() => {
    if (data) localStorage.setItem("shabad.bookmark", JSON.stringify({ source: data.source, page: data.ang }));
  }, [data]);

  function goTo(ang: number) {
    if (ang < 1 || ang > info.pages) return;
    fetchPage(ang, ang > (data?.ang || 0) ? "left" : "right");
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!data || loading) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 60) {
      if (diff > 0) goTo(data.ang + 1);
      else goTo(data.ang - 1);
    }
  }

  const hasPrev = data && data.ang > 1;
  const hasNext = data && data.ang < info.pages;
  const progressPct = data ? (data.ang / info.pages) * 100 : 0;

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-b from-[#0f0a1a] via-[#1a1035] to-[#0f0a1a]">
      <div className="absolute top-0 left-0 right-0 z-30 h-1 bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, #d4a574, #e8c99b)" }}
        />
      </div>

      <div className="absolute top-3 left-0 right-0 z-20 flex items-center justify-between px-5">
        <button onClick={() => router.push("/")} className="text-white/60 hover:text-white/90 transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest text-white/40">{info.label}</p>
          <p className="text-xs font-medium text-white/70">{info.pageLabel} {data?.ang || initialAng}</p>
        </div>
        <div className="w-6" />
      </div>

      {/* Navigate buttons — visible on sm+ screens, hidden on small touch screens */}
      {hasPrev && (
        <button
          onClick={() => goTo(data!.ang - 1)}
          className="hidden sm:flex absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-white/40 hover:text-white/80 transition-all"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      {hasNext && (
        <button
          onClick={() => goTo(data!.ang + 1)}
          className="hidden sm:flex absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-white/40 hover:text-white/80 transition-all"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Mobile tap zones — narrow strips on edges, only active on small screens */}
      {hasPrev && (
        <div className="sm:hidden absolute left-0 top-0 bottom-0 w-16 z-10" onClick={() => goTo(data!.ang - 1)} />
      )}
      {hasNext && (
        <div className="sm:hidden absolute right-0 top-0 bottom-0 w-16 z-10" onClick={() => goTo(data!.ang + 1)} />
      )}

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 sm:px-8 md:px-12 pt-20 pb-32"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {loading && (
          <div className="flex items-center justify-center gap-2 text-white/30 pt-32">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm">Loading...</span>
          </div>
        )}

        {!loading && data && data.verses.length > 0 && (
          <div
            key={data.ang}
            className={`max-w-2xl mx-auto space-y-6 ${
              slideDir ? (slideDir === "left" ? "animate-slide-right" : "animate-slide-left") : "animate-fade-slide"
            }`}
          >
            {data.verses.map((verse) => (
              <div key={verse.id} className="space-y-2 pb-4 border-b border-white/5 last:border-b-0">
                <p className="text-xl md:text-2xl lg:text-3xl font-likhita leading-relaxed text-white" dir="auto">{verse.gurmukhi}</p>
                <p className="text-sm md:text-base leading-relaxed text-[#a89bc2] border-l-2 border-[#d4a574]/40 pl-3">{verse.translation}</p>
                {(verse.raag || verse.author) && (
                  <p className="text-[10px] md:text-xs text-white/20">{verse.raag}{verse.author ? ` • ${verse.author}` : ""}</p>
                )}
                {data.explanation && (
                  <div className="mt-3 pl-3 border-l-2 border-[#d4a574]/20">
                    <ExplanationDisplay text={data.explanation} mode="per-verse" />
                  </div>
                )}
              </div>
            ))}

            {data.explanation && <ExplanationDisplay text={data.explanation} mode="page-bottom" />}
          </div>
        )}

        {!loading && (!data || data.verses.length === 0) && (
          <p className="text-white/40 text-sm text-center pt-32">No verses found</p>
        )}
      </div>

      <div className="absolute bottom-16 left-0 right-0 text-center pb-1 pointer-events-none">
        <p className="text-[10px] sm:text-xs text-white/20">← swipe or use arrow keys →</p>
      </div>

      <BottomNav />
    </div>
  );
}

function ExplanationDisplay({ text, mode }: { text: string; mode: "per-verse" | "page-bottom" }) {
  if (!text || !text.trim()) return null;

  const perVerseSections = new Set(["the wisdom", "in simple words"]);
  const pageBottomSections = new Set(["how to live it", "real life application"]);
  const allowed = mode === "per-verse" ? perVerseSections : pageBottomSections;

  const sections: { title: string; body: string }[] = [];
  const parts = text.split(/###\s+/);
  for (const part of parts) {
    if (!part.trim()) continue;
    const newline = part.indexOf("\n");
    const title = newline > 0 ? part.slice(0, newline).trim() : "";
    const body = newline > 0 ? part.slice(newline + 1).trim() : part.trim();
    if (title && body && allowed.has(title.toLowerCase())) {
      sections.push({ title, body });
    }
  }

  if (sections.length === 0) return null;

  if (mode === "page-bottom") {
    return (
      <div className="pt-6 border-t border-white/10 mt-6 space-y-3">
        {sections.map((s, i) => (
          <div key={i}>
            <p className="text-xs md:text-sm font-medium text-[#d4a574] uppercase tracking-wider mb-1">{s.title}</p>
            <p className="text-sm md:text-base text-[#a89bc2] leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {sections.map((s, i) => (
        <p key={i} className="text-xs md:text-sm text-[#a89bc2] leading-relaxed">
          <span className="font-medium text-[#d4a574]">{s.title}:</span> {s.body}
        </p>
      ))}
    </div>
  );
}
