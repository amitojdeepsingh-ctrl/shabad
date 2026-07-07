"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SOURCES } from "@/lib/types";

const links = [
  { href: "/", label: "Home" },
  { href: "/ang/1", label: "Read" },
  { href: "/ask", label: "Ask Shabad" },
  { href: "/donate", label: "Donate" },
];

export default function Navbar() {
  const pathname = usePathname();

  function getReadHref(source: string) {
    return source === "ggs" ? "/ang/1" : `/ang/1?source=${source}`;
  }

  return (
    <nav className="border-b border-stone-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="font-semibold text-lg text-amber-800 shrink-0">
          Shabad
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <select
            defaultValue="ggs"
            onChange={(e) => {
              const val = e.target.value;
              window.location.href = val === "ggs" ? "/ang/1" : `/ang/1?source=${val}`;
            }}
            className="text-xs px-2 py-1.5 rounded-lg border border-stone-200 bg-stone-50 text-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-300 cursor-pointer"
          >
            {SOURCES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <div className="flex gap-5">
            {links.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors ${
                    isActive
                      ? "text-amber-800 font-medium"
                      : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}