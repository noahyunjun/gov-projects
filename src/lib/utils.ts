import type React from "react";
import type { Project, ProjectStatus } from "@/types";

/** D-day 계산 */
export function getDday(endDate: string | null): number | null {
  if (!endDate) return null;
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/** D-day 텍스트 */
export function getDdayText(project: Project): string {
  if (project.status === "closed") return "마감";
  if (project.status === "upcoming") {
    const d = getDday(project.start_date);
    return d !== null ? `${d}일 후 시작` : "예정";
  }
  const d = getDday(project.end_date);
  return d !== null ? `D-${d}` : "모집중";
}

/** 상태 한글 레이블 */
export function getStatusLabel(status: ProjectStatus): string {
  switch (status) {
    case "open":
      return "모집중";
    case "closed":
      return "마감";
    case "upcoming":
      return "예정";
  }
}

/** 카테고리 색상 — inline style 기반 (Toss style) */
export function getCategoryStyle(category: string): React.CSSProperties {
  const palette: Record<string, [string, string]> = {
    "R&D": ["rgba(124,77,255,0.08)", "#6d4cc4"],
    "창업지원": ["rgba(0,166,97,0.08)", "#00875a"],
    "중소기업": ["rgba(49,130,246,0.08)", "#1b64da"],
    "AI/데이터": ["rgba(234,88,12,0.08)", "#c2410c"],
    "인력양성": ["rgba(217,119,6,0.08)", "#a16207"],
    "전기/에너지": ["rgba(6,148,180,0.08)", "#0e7490"],
  };
  const [bg, color] = palette[category] || ["rgba(107,118,132,0.08)", "#6b7684"];
  return { background: bg, color };
}

/** 카테고리 색상 클래스 (legacy compat) */
export function getCategoryColor(category: string): string {
  switch (category) {
    case "R&D":
      return "";
    case "창업지원":
      return "";
    case "중소기업":
      return "";
    case "AI/데이터":
      return "";
    case "인력양성":
      return "";
    case "전기/에너지":
      return "";
    default:
      return "";
  }
}

/** 상태 색상 클래스 */
export function getStatusColor(status: ProjectStatus): string {
  switch (status) {
    case "open":
      return "bg-emerald-500/15 text-emerald-400";
    case "closed":
      return "bg-red-500/15 text-red-400";
    case "upcoming":
      return "bg-yellow-500/15 text-yellow-400";
  }
}

/** 날짜 포맷 (YYYY-MM-DD → YYYY.MM.DD) */
export function formatDate(date: string | null): string {
  if (!date) return "-";
  return date.replace(/-/g, ".");
}

/**
 * 제안형 과제 여부 판별
 *
 * "우리가 이런 걸 해보겠습니다"라고 제안서를 제출하는 공모형 과제.
 * 반대: 지정공모(정부가 구체적 주제를 지정), 단순 모집 등
 */
const PROPOSAL_KEYWORDS =
  /자유공모|제안공모|제안형|기업주도|기업제안|수요기반|자유과제|신규과제.*공모|신규.*공모|재공모|공모.*공고|과제.*공모|기업공모|아이디어.*공모|기술.*공모|솔루션.*공모|실증.*공모|시범.*공모|혁신.*공모|도전.*공모|챌린지/i;

export function isProposalType(project: Project): boolean {
  const text = `${project.title} ${project.description || ""}`;
  return PROPOSAL_KEYWORDS.test(text);
}
