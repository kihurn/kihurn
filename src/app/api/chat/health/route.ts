import { NextResponse } from "next/server";
import { isC0reOnline } from "@/lib/server/health";

export const dynamic = "force-dynamic";

export async function GET() {
  const online = await isC0reOnline();
  return NextResponse.json({ online }, { headers: { "Cache-Control": "public, s-maxage=30" } });
}
