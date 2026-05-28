/**
 * GET/POST /api/scrape
 *
 * 스크래핑 트리거 API 엔드포인트.
 * - Vercel Cron Job에서 매일 아침 6시(KST)에 호출
 * - 수동으로도 호출 가능
 * - ?reset=true 파라미터로 기존 데이터 삭제 후 재수집
 */

import { NextRequest, NextResponse } from "next/server";
import { runAllScrapers } from "@/lib/scrapers";
import { getSupabaseAdmin } from "@/lib/supabase";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // ?reset=true 시 기존 데이터 삭제
    const reset = request.nextUrl.searchParams.get("reset") === "true";
    if (reset) {
      console.log("[cron] Resetting all projects...");
      const supabase = getSupabaseAdmin();
      await supabase.from("projects").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      console.log("[cron] All projects deleted");
    }

    console.log("[cron] Starting scrape job...");
    const results = await runAllScrapers();
    console.log("[cron] Scrape completed:", results);

    return NextResponse.json({
      success: true,
      reset,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (err) {
    console.error("[cron] Scrape failed:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
