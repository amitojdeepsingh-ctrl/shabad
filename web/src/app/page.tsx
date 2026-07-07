"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SOURCES } from "@/lib/types";

export default function Home() {
  const [bookmark, setBookmark] = useState<{ source: string; page: number } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("shabad.bookmark");
    if (saved) {
      try {
        setBookmark(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const bookmarkInfo = bookmark
    ? SOURCES.find((s) => s.key === bookmark.source)
    : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-bold text-amber-900 mb-4">
        Shabad
      </h1>
      <p className="text-lg text-stone-600 mb-2">
        Wisdom from Sri Guru Granth Sahib, Sri Dasam Granth &amp; Vaaran Bhai Gurdas
        — in words a child can understand and an elder can feel.
      </p>
      <p className="text-sm text-stone-400 mb-10">
        Gurmukhi &middot; English Translation &middot; Simple Meaning
      </p>

      {bookmark && bookmarkInfo && (
        <Link
          href={`/ang/${bookmark.page}${bookmark.source !== "ggs" ? `?source=${bookmark.source}` : ""}`}
          className="block max-w-xl mx-auto mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors text-left"
        >
          <p className="text-xs text-amber-600 uppercase tracking-wider font-medium mb-1">Continue Reading</p>
          <p className="text-sm text-stone-700">
            {bookmarkInfo.label} — {bookmarkInfo.pageLabel} {bookmark.page}
          </p>
        </Link>
      )}

      <div className="grid gap-6 sm:grid-cols-2 text-left max-w-xl mx-auto">
        <Link
          href="/ang/1"
          className="block p-6 rounded-xl border border-stone-200 bg-white hover:border-amber-300 hover:shadow-sm transition-all"
        >
          <h2 className="font-semibold text-amber-800 mb-1">Read Scriptures</h2>
          <p className="text-sm text-stone-500">
            Browse Sri Guru Granth Sahib (1,430 Angs), Sri Dasam Granth (1,428 Pannas), and Vaaran Bhai Gurdas (41 Vaars).
          </p>
        </Link>

        <Link
          href="/ask"
          className="block p-6 rounded-xl border border-stone-200 bg-white hover:border-amber-300 hover:shadow-sm transition-all"
        >
          <h2 className="font-semibold text-amber-800 mb-1">Ask Shabad</h2>
          <p className="text-sm text-stone-500">
            Facing a problem? Ask and receive wisdom from the Guru relevant to your situation.
          </p>
        </Link>

        <Link
          href="/donate"
          className="block p-6 rounded-xl border border-stone-200 bg-white hover:border-amber-300 hover:shadow-sm transition-all sm:col-span-2"
        >
          <h2 className="font-semibold text-amber-800 mb-1">Support This Work</h2>
          <p className="text-sm text-stone-500">
            100% of donations go to maintaining this platform and spreading Gurbani. Nothing is used for personal purposes.
          </p>
        </Link>
      </div>

      <p className="mt-12 text-xs text-stone-400 leading-relaxed max-w-md mx-auto">
        Guru Granth Sahib translation by Dr. Sant Singh Khalsa. Dasam Granth and Vaaran translations as provided by GurbaniNow.
        All scripture is presented with the utmost respect and without alteration.
      </p>
    </div>
  );
}
