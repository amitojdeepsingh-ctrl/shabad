"use client";

import { useState } from "react";
import Link from "next/link";
import { SOURCES, type ScriptureSource } from "@/lib/types";

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
    } catch {
      setVerses([]);
    }
    setLoading(false);
    setSearched(true);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-amber-900 mb-2">Search Shabad</h1>
      <p className="text-sm text-stone-500 mb-8">
        Search across the scriptures by keyword — find verses relevant to your life.
      </p>

      <form onSubmit={handleSearch} className="mb-8 space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. peace, patience, anger..."
            className="flex-1 px-4 py-3 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-6 py-3 bg-amber-800 text-white text-sm font-medium rounded-xl hover:bg-amber-900 transition-colors disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value as ScriptureSource)}
          className="text-xs px-3 py-2 rounded-lg border border-stone-200 bg-white text-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-300 cursor-pointer"
        >
          {SOURCES.map((s) => (
            <option key={s.key} value={s.key}>
              Search: {s.label}
            </option>
          ))}
        </select>
      </form>

      {searched && verses.length === 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-stone-600">
          No verses found for &ldquo;{query}&rdquo;. Try different keywords.
        </div>
      )}

      {verses.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs text-stone-400">{verses.length} result{verses.length !== 1 ? "s" : ""}</p>
          {verses.map((v) => (
            <Link
              key={v.id}
              href={`/ang/${v.ang}${v.source !== "ggs" ? `?source=${v.source}` : ""}`}
              className="block p-4 rounded-xl border border-stone-200 bg-white hover:border-amber-300 transition-all"
            >
              <p className="text-base font-serif text-stone-800 mb-1" dir="auto">{v.gurmukhi}</p>
              <p className="text-sm text-stone-500 leading-relaxed">{v.translation}</p>
              <p className="text-xs text-stone-400 mt-1">
                {SOURCES.find(s => s.key === v.source)?.label || v.source} — {SOURCES.find(s => s.key === v.source)?.pageLabel || "Page"} {v.ang}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
