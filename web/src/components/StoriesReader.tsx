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

  function handleTap(e: React.MouseEvent) {
    if (!data || loading) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.3) goTo(data.ang - 1);
    else if (x > rect.width * 0.7) goTo(data.ang + 1);
  }

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

      {/* Tap zones overlay (only when not scrolling) */}
      <div className="absolute left-0 top-0 bottom-0 w-[30%] z-10" onClick={() => { if (data && !loading) goTo(data.ang - 1); }} />
      <div className="absolute right-0 top-0 bottom-0 w-[30%] z-10" onClick={() => { if (data && !loading) goTo(data.ang + 1); }} />

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 pt-20 pb-32"
        onClick={handleTap}
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
            className={`max-w-lg mx-auto space-y-6 ${
              slideDir ? (slideDir === "left" ? "animate-slide-right" : "animate-slide-left") : "animate-fade-slide"
            }`}
          >
            {data.verses.map((verse, i) => (
              <div key={verse.id} className="space-y-2 pb-4 border-b border-white/5 last:border-b-0">
                <p className="text-xl md:text-2xl font-likhita leading-relaxed text-white" dir="auto">{verse.gurmukhi}</p>
                <p className="text-sm leading-relaxed text-[#a89bc2] border-l-2 border-[#d4a574]/40 pl-3">{verse.translation}</p>
                {(verse.raag || verse.author) && (
                  <p className="text-[10px] text-white/20">{verse.raag}{verse.author ? ` • ${verse.author}` : ""}</p>
                )}
                {data.explanation && (
                  <div className="mt-3 pl-3 border-l-2 border-[#d4a574]/20">
                    <ExplanationDisplay text={data.explanation} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && (!data || data.verses.length === 0) && (
          <p className="text-white/40 text-sm text-center pt-32">No verses found</p>
        )}
      </div>

      <div className="absolute bottom-16 left-0 right-0 text-center pb-1 pointer-events-none">
        <p className="text-[10px] text-white/20">Tap sides to navigate • ← → keys</p>
      </div>

      <BottomNav />
    </div>
  );
}

function ExplanationDisplay({ text }: { text: string }) {
  if (!text || !text.trim()) return null;

  const keepSections = new Set(["the wisdom", "in simple words", "how to live it"]);
  const sections: { title: string; body: string }[] = [];
  const parts = text.split(/###\s+/);
  for (const part of parts) {
    if (!part.trim()) continue;
    const newline = part.indexOf("\n");
    const title = newline > 0 ? part.slice(0, newline).trim() : "";
    const body = newline > 0 ? part.slice(newline + 1).trim() : part.trim();
    if (title && body && keepSections.has(title.toLowerCase())) {
      sections.push({ title, body });
    }
  }

  if (sections.length === 0) {
    return <p className="text-xs text-[#a89bc2] leading-relaxed italic">No simple meaning available for this verse.</p>;
  }

  return (
    <div className="space-y-1.5">
      {sections.map((s, i) => (
        <p key={i} className="text-xs text-[#a89bc2] leading-relaxed">
          <span className="font-medium text-[#d4a574]">{s.title}:</span> {s.body}
        </p>
      ))}
    </div>
  );
}
