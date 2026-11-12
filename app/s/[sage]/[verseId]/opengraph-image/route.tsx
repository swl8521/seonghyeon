import type { NextRequest } from "next/server";
import { renderShareImage } from "@/lib/share-image";
export async function GET(request: NextRequest, { params }: { params: Promise<{ sage: string; verseId: string }> }) {
  const { sage, verseId } = await params;
  return renderShareImage(request, verseId, sage);
}
