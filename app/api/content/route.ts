import { contentPayload } from "@/lib/content-payload";

// 세 가지 id 형식을 모두 받는다.
//   confucius-01        기존 짧은 격언
//   confucius-01-02a    논어·도덕경: 편-장-분할
//   sunzi-11-aa         손자: 편 자체가 단위라 분할 표시만 붙는다
const VERSE_ID = /^(confucius|laozi|sunzi)-\d{2}(-(\d{2}[a-z]?|[a-z]{1,2}))?$/;

export async function GET(request: Request) {
  const ids = new URL(request.url).searchParams.get("ids")?.split(",") ?? [];
  const verseIds = Array.from(new Set(ids.filter((id) => VERSE_ID.test(id)))).slice(0, 60);
  return Response.json(contentPayload({ verseIds }), {
    headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
  });
}
