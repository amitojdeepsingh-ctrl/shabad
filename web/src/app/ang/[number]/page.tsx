import StoriesReader from "@/components/StoriesReader";

export const dynamic = "force-dynamic";

export default async function AngPage({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ source?: string }>;
}) {
  const { number } = await params;
  const { source: rawSource } = await searchParams;
  const source = rawSource === "D" || rawSource === "B" ? rawSource : "ggs";
  const ang = parseInt(number, 10) || 1;

  return <StoriesReader initialSource={source} initialAng={ang} />;
}
