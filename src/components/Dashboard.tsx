"use client";

import { useState, useMemo } from "react";
import { useProjects } from "@/lib/hooks";
import { isProposalType } from "@/lib/utils";
import { ProjectCard } from "./ProjectCard";
import { CalendarView } from "./CalendarView";
import { ProjectModal } from "./ProjectModal";
import type { Project, ProjectStatus, ProjectCategory } from "@/types";

type ViewMode = "cards" | "calendar";
type SortOrder = "asc" | "desc";

const STATUS_OPTIONS: { key: ProjectStatus | "all"; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "open", label: "모집중" },
  { key: "upcoming", label: "예정" },
  { key: "closed", label: "마감" },
];

const CATEGORY_OPTIONS: { key: ProjectCategory | "all"; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "전기/에너지", label: "전기 · 에너지" },
  { key: "R&D", label: "R&D" },
  { key: "창업지원", label: "창업지원" },
  { key: "AI/데이터", label: "AI · 데이터" },
  { key: "중소기업", label: "중소기업" },
  { key: "인력양성", label: "인력양성" },
];

export function Dashboard() {
  const [view, setView] = useState<ViewMode>("cards");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<ProjectCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [proposalOnly, setProposalOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const { projects, total, loading, scraping, error } = useProjects({
    status: statusFilter,
    category: categoryFilter,
    search,
  });

  const filteredProjects = useMemo(() => {
    let list = proposalOnly ? projects.filter(isProposalType) : [...projects];
    list.sort((a, b) => {
      const dateA = a.end_date || "9999-12-31";
      const dateB = b.end_date || "9999-12-31";
      return sortOrder === "asc"
        ? dateA.localeCompare(dateB)
        : dateB.localeCompare(dateA);
    });
    return list;
  }, [projects, proposalOnly, sortOrder]);

  const { projects: allProjects } = useProjects({});
  const statusCounts = useMemo(() => {
    const counts = { all: 0, open: 0, closed: 0, upcoming: 0 };
    for (const p of allProjects) {
      counts.all++;
      counts[p.status]++;
    }
    return counts;
  }, [allProjects]);

  const proposalCount = useMemo(() => {
    return allProjects.filter(isProposalType).length;
  }, [allProjects]);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-50"
        style={{
          background: "var(--bg)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="max-w-[1400px] mx-auto px-6 py-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1
                className="text-[22px] font-bold tracking-tight"
                style={{ color: "var(--text)" }}
              >
                국가 과제
              </h1>
              <p
                className="text-[13px] mt-1"
                style={{ color: "var(--text-dim)" }}
              >
                IT · SW · AI · 전력 · 창업 지원사업
              </p>
            </div>
            <div
              className="flex items-center gap-2 text-[12px] px-3 py-1.5 rounded-full"
              style={{
                background: "var(--surface)",
                color: "var(--text-dim)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--green)" }}
              />
              매일 06:00 자동 수집
            </div>
          </div>

          {/* Stat Chips */}
          <div className="flex gap-2 flex-wrap">
            {[
              { label: "전체", count: statusCounts.all, color: "var(--accent)" },
              { label: "모집중", count: statusCounts.open, color: "var(--green)" },
              { label: "예정", count: statusCounts.upcoming, color: "var(--yellow)" },
              { label: "마감", count: statusCounts.closed, color: "var(--red)" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
                style={{ background: "var(--surface)" }}
              >
                <span
                  className="text-[18px] font-bold tabular-nums"
                  style={{ color: s.color }}
                >
                  {s.count}
                </span>
                <span
                  className="text-[13px] font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto flex">
        {/* ── Sidebar ── */}
        <aside
          className="w-[260px] min-w-[260px] sticky top-[145px] h-[calc(100vh-145px)] overflow-y-auto hidden lg:flex flex-col gap-6 py-6 pr-6 pl-6"
          style={{ borderRight: "1px solid var(--border)" }}
        >
          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6b7684"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="과제명, 키워드 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 rounded-xl text-[13px] focus:outline-none transition-colors"
              style={{
                background: "var(--surface)",
                color: "var(--text)",
                border: "1px solid transparent",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.background = "var(--surface2)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "transparent";
                e.currentTarget.style.background = "var(--surface)";
              }}
            />
          </div>

          {/* Proposal Toggle */}
          <button
            onClick={() => setProposalOnly(!proposalOnly)}
            className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-[13px] font-medium transition-all"
            style={{
              background: proposalOnly ? "var(--green-soft)" : "var(--surface)",
              color: proposalOnly ? "var(--green)" : "var(--text-secondary)",
              border: proposalOnly
                ? "1px solid rgba(0,192,115,0.2)"
                : "1px solid transparent",
            }}
          >
            <span>제안형 과제만</span>
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{
                background: proposalOnly
                  ? "rgba(0,192,115,0.18)"
                  : "var(--surface2)",
              }}
            >
              {proposalCount}
            </span>
          </button>

          {/* Status Filter */}
          <div>
            <div
              className="text-[11px] font-semibold uppercase tracking-widest mb-2 px-1"
              style={{ color: "var(--text-dim)" }}
            >
              모집 상태
            </div>
            <div className="flex flex-col gap-1">
              {STATUS_OPTIONS.map((opt) => {
                const active = statusFilter === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setStatusFilter(opt.key)}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] transition-all text-left"
                    style={{
                      background: active ? "var(--accent-soft)" : "transparent",
                      color: active ? "var(--accent)" : "var(--text-secondary)",
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {opt.label}
                    <span
                      className="text-[11px] tabular-nums font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: active
                          ? "rgba(49,130,246,0.15)"
                          : "var(--surface)",
                        color: active ? "var(--accent)" : "var(--text-dim)",
                      }}
                    >
                      {statusCounts[opt.key]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <div
              className="text-[11px] font-semibold uppercase tracking-widest mb-2 px-1"
              style={{ color: "var(--text-dim)" }}
            >
              분류
            </div>
            <div className="flex flex-col gap-1">
              {CATEGORY_OPTIONS.map((opt) => {
                const active = categoryFilter === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setCategoryFilter(opt.key)}
                    className="px-3.5 py-2.5 rounded-xl text-[13px] transition-all text-left"
                    style={{
                      background: active ? "var(--accent-soft)" : "transparent",
                      color: active ? "var(--accent)" : "var(--text-secondary)",
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 p-6">
          {/* Mobile Search */}
          <div className="relative lg:hidden mb-4">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6b7684"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="과제명, 키워드 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 rounded-xl text-[13px] focus:outline-none"
              style={{
                background: "var(--surface)",
                color: "var(--text)",
              }}
            />
          </div>

          {/* View Toggle + Mobile Filters */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div
              className="flex p-1 rounded-xl"
              style={{ background: "var(--surface)" }}
            >
              {(["cards", "calendar"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className="px-5 py-2 rounded-lg text-[13px] font-medium transition-all"
                  style={{
                    background: view === v ? "var(--accent)" : "transparent",
                    color: view === v ? "#fff" : "var(--text-dim)",
                    boxShadow:
                      view === v ? "0 2px 8px rgba(49,130,246,0.25)" : "none",
                  }}
                >
                  {v === "cards" ? "카드" : "캘린더"}
                </button>
              ))}
            </div>

            {/* Mobile Filters */}
            <div className="flex gap-2 lg:hidden flex-wrap">
              <button
                onClick={() => setProposalOnly(!proposalOnly)}
                className="px-3 py-2 rounded-xl text-[12px] font-medium"
                style={{
                  background: proposalOnly
                    ? "var(--green-soft)"
                    : "var(--surface)",
                  color: proposalOnly ? "var(--green)" : "var(--text-secondary)",
                  border: proposalOnly
                    ? "1px solid rgba(0,192,115,0.2)"
                    : "1px solid var(--border)",
                }}
              >
                제안형
              </button>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as ProjectStatus | "all")
                }
                className="px-3 py-2 rounded-xl text-[12px] appearance-none"
                style={{
                  background: "var(--surface)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                }}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>
              <select
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(e.target.value as ProjectCategory | "all")
                }
                className="px-3 py-2 rounded-xl text-[12px] appearance-none"
                style={{
                  background: "var(--surface)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                }}
              >
                {CATEGORY_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              {/* Sort Toggle */}
              <button
                onClick={() =>
                  setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
                }
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-all"
                style={{
                  background: "var(--surface)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  {sortOrder === "asc" ? (
                    <>
                      <path d="M12 5v14" />
                      <path d="m19 12-7 7-7-7" />
                    </>
                  ) : (
                    <>
                      <path d="M12 19V5" />
                      <path d="m5 12 7-7 7 7" />
                    </>
                  )}
                </svg>
                마감일 {sortOrder === "asc" ? "가까운 순" : "먼 순"}
              </button>

              <span
                className="text-[13px] font-medium tabular-nums"
                style={{ color: "var(--text-dim)" }}
              >
                {filteredProjects.length}건
                {proposalOnly && " · 제안형"}
              </span>
            </div>
          </div>

          {/* Scraping State */}
          {scraping && (
            <div
              className="flex flex-col items-center justify-center py-24"
              style={{ color: "var(--accent)" }}
            >
              <div className="w-10 h-10 border-2 border-current border-t-transparent rounded-full animate-spin mb-5" />
              <p className="text-[15px] font-semibold mb-1">
                과제를 수집하고 있어요
              </p>
              <p className="text-[13px]" style={{ color: "var(--text-dim)" }}>
                기업마당, NTIS, K-Startup에서 데이터를 가져오는 중이에요
              </p>
            </div>
          )}

          {/* Loading */}
          {loading && !scraping && (
            <div
              className="flex flex-col items-center justify-center py-24"
              style={{ color: "var(--text-dim)" }}
            >
              <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-[13px]">불러오는 중</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="text-center py-20 rounded-2xl"
              style={{
                background: "var(--red-soft)",
                color: "var(--red)",
              }}
            >
              <p className="text-[14px] font-medium mb-1">
                데이터를 불러오지 못했어요
              </p>
              <p className="text-[12px] opacity-60">{error}</p>
            </div>
          )}

          {/* Content */}
          {!loading && !error && (
            <>
              {view === "cards" && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredProjects.map((p) => (
                    <ProjectCard
                      key={p.id}
                      project={p}
                      onClick={() => setSelectedProject(p)}
                      isProposal={isProposalType(p)}
                    />
                  ))}
                </div>
              )}

              {view === "calendar" && (
                <CalendarView
                  projects={filteredProjects}
                  onProjectClick={(p) => setSelectedProject(p)}
                />
              )}

              {filteredProjects.length === 0 && (
                <div
                  className="flex flex-col items-center justify-center py-24"
                  style={{ color: "var(--text-dim)" }}
                >
                  <p className="text-[14px]">조건에 맞는 과제가 없어요</p>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Modal */}
      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
}
