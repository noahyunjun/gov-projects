"use client";

import type { Project } from "@/types";
import {
  getDday,
  getDdayText,
  getStatusLabel,
  getCategoryStyle,
  formatDate,
} from "@/lib/utils";

interface Props {
  project: Project;
  onClick: () => void;
  isProposal?: boolean;
}

export function ProjectCard({ project, onClick, isProposal }: Props) {
  const dday = getDday(project.end_date);
  const ddayText = getDdayText(project);

  const ddayColor =
    project.status === "open" && dday !== null
      ? dday <= 7
        ? "var(--red)"
        : dday <= 30
          ? "var(--yellow)"
          : "var(--green)"
      : "var(--text-dim)";

  const statusDot =
    project.status === "open"
      ? "var(--green)"
      : project.status === "closed"
        ? "var(--red)"
        : "var(--yellow)";

  const catStyle = getCategoryStyle(project.category);

  return (
    <div
      onClick={onClick}
      className="rounded-2xl p-5 cursor-pointer transition-all"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--border-strong)";
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Top: badges */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-1.5">
          <span
            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
            style={catStyle}
          >
            {project.category}
          </span>
          {isProposal && (
            <span
              className="text-[10px] font-bold px-2 py-1 rounded-lg"
              style={{
                background: "var(--green-soft)",
                color: "var(--green)",
              }}
            >
              제안형
            </span>
          )}
        </div>
        <span
          className="text-[11px] font-medium px-2.5 py-1 rounded-lg flex items-center gap-1.5"
          style={{
            background:
              project.status === "open"
                ? "var(--green-soft)"
                : project.status === "closed"
                  ? "var(--red-soft)"
                  : "var(--yellow-soft)",
            color: statusDot,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: statusDot }}
          />
          {getStatusLabel(project.status)}
        </span>
      </div>

      {/* Title */}
      <h3
        className="text-[14px] font-semibold leading-[1.6] mb-3 line-clamp-2"
        style={{ color: "var(--text)" }}
      >
        {project.title}
      </h3>

      {/* Meta */}
      <div className="flex flex-col gap-1.5 mb-3">
        <div
          className="flex items-center gap-2 text-[12px]"
          style={{ color: "var(--text-dim)" }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          {formatDate(project.start_date)} ~ {formatDate(project.end_date)}
        </div>
        {project.ministry && (
          <div
            className="flex items-center gap-2 text-[12px]"
            style={{ color: "var(--text-dim)" }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16" />
              <path d="M3 21h18" />
            </svg>
            {project.ministry}
            {project.executing_agency && ` · ${project.executing_agency}`}
          </div>
        )}
      </div>

      {/* Tags */}
      {project.fields && project.fields.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-3">
          {project.fields.slice(0, 4).map((f) => (
            <span
              key={f}
              className="text-[11px] px-2 py-0.5 rounded-lg"
              style={{
                background: "var(--surface2)",
                color: "var(--text-dim)",
              }}
            >
              {f}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div
        className="flex justify-between items-center pt-3 mt-1"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div>
          <div
            className="text-[11px] mb-0.5"
            style={{ color: "var(--text-dim)" }}
          >
            지원금액
          </div>
          <div
            className="text-[15px] font-bold"
            style={{ color: "var(--accent)" }}
          >
            {project.funding_amount || "공고 참조"}
          </div>
        </div>
        <span
          className="text-[13px] font-bold tabular-nums"
          style={{ color: ddayColor }}
        >
          {ddayText}
        </span>
      </div>
    </div>
  );
}
