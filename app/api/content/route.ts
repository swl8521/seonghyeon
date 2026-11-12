import { contentPayload } from "@/lib/content-payload";

const VERSE_ID = /^(confucius|laozi|sunzi)-\d{2}$/;

export async function GET(request: Request) {
  const ids = new URL(request.url).searchParams.get("ids")?.split(",") ?? [];
  const verseIds = Array.from(new Set(ids.filter((id) => VERSE_ID.test(id)))).slice(0, 60);
  return Response.json(contentPayload({ verseIds }), {
    headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
  });
}
