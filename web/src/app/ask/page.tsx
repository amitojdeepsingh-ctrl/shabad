"use client";

import { useState } from "react";
import Link from "next/link";
import { SOURCES, type ScriptureSource } from "@/lib/types";
import BottomNav from "@/components/BottomNav";

export default function AskPage() {
  const [query, setQuery] = useState("");
  const [verses, setVerses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<ScriptureSource>("ggs");
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(false);
    try {
      const params = new URLSearchParams({ q: query.trim(), source });
      const res = await fetch(`/api/ask?${params}`);
      const data = await res.json();
      setVerses(data.verses || []);
    } catch { setVerses([]); }
    setLoading(false);
    setSearched(true);
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#0f0a1a] via-[#1a1035] to-[#0f0a1a] flex flex-col">
      <div className="h-16" />
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-xl font-bold text-white">Search</h1>
        <p className="text-xs text-[#a89bc2] mt-1">Find verses across all scriptures</p>
      </div>
      <div className="px-6 pb-6">
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. peace, patience, anger..."
              className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#d4a574]/60 focus:ring-1 focus:ring-[#d4a574]/30"
            />
            <button type="submit" disabled={loading || !query.trim()} className="px-5 py-3 rounded-xl bg-[#d4a574] text-[#0f0a1a] text-sm font-semibold hover:bg-[#e8c99b] transition-colors disabled:opacity-40">
              {loading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : "Search"}
            </button>
          </div>
          <select value={source} onChange={(e) => setSource(e.target.value as ScriptureSource)} className="text-xs px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white/70 focus:outline-none focus:border-[#d4a574]/60 cursor-pointer">
            {SOURCES.map((s) => (
              <option key={s.key} value={s.key} className="bg-[#1a1035]">Search: {s.label}</option>
            ))}
          </select>
        </form>
      </div>
      <div className="flex-1 px-6 pb-24 overflow-y-auto">
        {searched && verses.length === 0 && (
          <p className="text-sm text-white/40 text-center pt-8">No verses found for &ldquo;{query}&rdquo;. Try different keywords.</p>
        )}
        {verses.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-white/40">{verses.length} result{verses.length !== 1 ? "s" : ""}</p>
            {verses.map((v) => (
              <Link key={v.id} href={`/ang/${v.ang}${v.source !== "ggs" ? `?source=${v.source}` : ""}`}
                className="block p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all">
                <p className="text-base font-likhita text-white mb-1" dir="auto">{v.gurmukhi}</p>
                <p className="text-sm text-[#a89bc2] leading-relaxed">{v.translation}</p>
                <p className="text-[10px] text-white/30 mt-1.5">{SOURCES.find(s => s.key === v.source)?.label || v.source} — {SOURCES.find(s => s.key === v.source)?.pageLabel || "Page"} {v.ang}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
