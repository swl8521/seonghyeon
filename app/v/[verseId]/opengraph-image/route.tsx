import type { NextRequest } from "next/server";
import { renderShareImage } from "@/lib/share-image";
export async function GET(request: NextRequest, { params }: { params: Promise<{ verseId: string }> }) {
  return renderShareImage(request, (await params).verseId);
}
