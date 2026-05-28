/**
 * GET /api/projects
 *
 * 과제 목록 조회 API
 * Query params:
 *   - status: open | closed | upcoming | all
 *   - category: R&D | 창업지원 | AI/데이터 | 중소기업 | 인력양성 | all
 *   - search: 검색어
 *   - page: 페이지 번호 (기본 1)
 *   - limit: 페이지 크기 (기본 50)
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import type { Project, ProjectStatus } from "@/types";

function computeStatus(row: {
  start_date: string | null;
  end_date: string | null;
}): ProjectStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (row.end_date) {
    const end = new Date(row.end_date);
    end.setHours(0, 0, 0, 0);
    if (end < today) return "closed";
  }
  if (row.start_date) {
    const start = new Date(row.start_date);
    start.setHours(0, 0, 0, 0);
    if (start > today) return "upcoming";
  }
  return "open";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const status = searchParams.get("status") || "all";
  const category = searchParams.get("category") || "all";
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

  const supabase = getSupabaseClient();

  // 상태 필터링은 앱 레벨에서 하므로 전체를 가져옴
  let query = supabase
    .from("projects")
    .select("*", { count: "exact" })
    .order("end_date", { ascending: true, nullsFirst: false });

  // 카테고리 필터 (DB 레벨)
  if (category !== "all") {
    query = query.eq("category", category);
  }

  // 검색어 필터 (DB 레벨)
  if (search) {
    query = query.or(
      `title.ilike.%${search}%,description.ilike.%${search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // status를 앱에서 계산하고 필터 적용
  let projects = (data || []).map((row) => ({
    ...row,
    status: computeStatus(row),
  }));

  // 상태 필터 (앱 레벨)
  if (status !== "all") {
    projects = projects.filter((p) => p.status === status);
  }

  // 페이지네이션
  const total = projects.length;
  const offset = (page - 1) * limit;
  const paged = projects.slice(offset, offset + limit);

  return NextResponse.json({
    projects: paged,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}
