export default function DonatePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-amber-900 mb-4">
        Support Shabad
      </h1>

      <div className="p-6 rounded-xl border border-amber-200 bg-amber-50/50 mb-6 text-left space-y-4">
        <p className="text-sm text-stone-700 leading-relaxed">
          Shabad is a community project built with one purpose: to make the
          wisdom of Sri Guru Granth Sahib accessible to everyone, everywhere —
          free of charge, forever.
        </p>

        <p className="text-sm text-stone-700 leading-relaxed font-medium">
          100% of every donation goes directly to:
        </p>

        <ul className="text-sm text-stone-600 space-y-2 list-disc pl-5">
          <li>Server hosting and maintenance costs</li>
          <li>Improving the platform and adding more scriptures (Dasam Granth, Vaaran)</li>
          <li>Making the app available on mobile devices</li>
        </ul>

        <p className="text-sm text-amber-800 font-medium bg-amber-100/50 p-3 rounded-lg">
          Nothing — not a single rupee or penny — is used for personal purposes.
          This project is about giving back to the sangat.
        </p>
      </div>

      <div className="p-8 rounded-xl border border-stone-200 bg-white">
        <p className="text-stone-500 text-sm mb-2">
          Donation options coming soon
        </p>
        <p className="text-xs text-stone-400">
          We are setting up secure payment processing. Check back shortly.
        </p>
      </div>

      <p className="mt-8 text-xs text-stone-400">
        Waheguru ji ka Khalsa, Waheguru ji ki Fateh.
      </p>
    </div>
  );
}
