"use client";

import BottomNav from "@/components/BottomNav";

export default function DonatePage() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#0f0a1a] via-[#1a1035] to-[#0f0a1a] flex flex-col">
      <div className="h-16" />
      <div className="flex-1 px-6 pt-6 pb-24">
        <h1 className="text-xl font-bold text-white">Support This Work</h1>
        <p className="text-sm text-[#a89bc2] mt-2 leading-relaxed">
          100% of donations go to maintaining this platform and spreading Gurbani. Nothing is used for personal purposes.
        </p>
        <div className="mt-8 p-5 rounded-2xl bg-white/5 border border-white/10">
          <p className="text-sm text-white/60 text-center">
            Donation options coming soon.
          </p>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
