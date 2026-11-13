import { contentPayload } from "@/lib/content-payload";

// "confucius-01" (기존) 과 "confucius-01-02a" (편-장-분할) 를 모두 받는다.
const VERSE_ID = /^(confucius|laozi|sunzi)-\d{2}(-\d{2}[a-z]?)?$/;

export async function GET(request: Request) {
  const ids = new URL(request.url).searchParams.get("ids")?.split(",") ?? [];
  const verseIds = Array.from(new Set(ids.filter((id) => VERSE_ID.test(id)))).slice(0, 60);
  return Response.json(contentPayload({ verseIds }), {
    headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
  });
}
