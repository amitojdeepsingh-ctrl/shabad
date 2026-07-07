"use client";

import type { Verse } from "@/lib/types";

interface Props {
  verses: Verse[];
  pageExplanation: string | null;
}

export default function AngViewer({ verses, pageExplanation }: Props) {
  const sections = pageExplanation ? parseExplanation(pageExplanation) : [];

  return (
    <div className="max-w-2xl mx-auto">
      {verses.map((verse) => (
        <div
          key={verse.id}
          className="mb-8 pb-8 border-b border-stone-100 last:border-b-0"
        >
          <div className="space-y-2">
            <p className="text-xl leading-relaxed font-serif text-stone-800" dir="auto">
              {verse.gurmukhi}
            </p>
            <p className="text-sm text-stone-600 leading-relaxed border-l-2 border-amber-200 pl-3">
              {verse.translation}
            </p>
            {(verse.raag || verse.author) && (
              <p className="text-xs text-stone-400">
                {verse.raag}{verse.author ? ` \u2022 ${verse.author}` : ""}
              </p>
            )}
          </div>

          {sections.length > 0 && (
            <div className="mt-3 pl-3 border-l-2 border-amber-300 space-y-1">
              {sections.map((s, i) => (
                <p key={i} className="text-xs text-stone-500 leading-relaxed">
                  <span className="font-medium text-amber-700">{s.title}:</span> {s.body}
                </p>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function parseExplanation(text: string) {
  const sections: { title: string; body: string }[] = [];
  const parts = text.split(/###\s+/);
  for (const part of parts) {
    if (!part.trim()) continue;
    const colon = part.indexOf("\n");
    const title = colon > 0 ? part.slice(0, colon).trim() : "";
    const body = colon > 0 ? part.slice(colon + 1).trim() : part.trim();
    if (title && body && (title === "The Wisdom" || title === "In Simple Words")) {
      sections.push({ title, body });
    }
  }
  return sections;
}
