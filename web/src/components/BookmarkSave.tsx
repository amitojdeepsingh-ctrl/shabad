"use client";

import { useEffect } from "react";

export default function BookmarkSave({ source, page }: { source: string; page: number }) {
  useEffect(() => {
    localStorage.setItem("shabad.bookmark", JSON.stringify({ source, page }));
  }, [source, page]);

  return null;
}
