"use client";

import { useEffect } from "react";
import type { Project } from "@/types";
import {
  getDday,
  getStatusLabel,
  getCategoryStyle,
  formatDate,
  isProposalType,
} from "@/lib/utils";

interface Props {
  project: Project;
  onClose: () => void;
}

const SOURCE_LABELS: Record<string, string> = {
  bizinfo: "기업마당",
  ntis: "NTIS",
  kstartup: "K-Startup",
  iitp: "IITP",
  data_go_kr: "공공데이터포털",
};

export function ProjectModal({ project, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const dday = getDday(project.end_date);
  const ddayColor =
    project.status === "open" && dday !== null
      ? dday <= 7
        ? "var(--red)"
        : "var(--green)"
      : "var(--text-dim)";

  const catStyle = getCategoryStyle(project.category);
  const statusDot =
    project.status === "open"
      ? "var(--green)"
      : project.status === "closed"
        ? "var(--red)"
        : "var(--yellow)";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-6"
      style={{
        background: "rgba(0,0,0,0.35)",
        backdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl max-w-[720px] w-full max-h-[85vh] overflow-y-auto"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-strong)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.12)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div
          className="px-7 pt-6 pb-5 sticky top-0 z-10 rounded-t-2xl"
          style={{
            background: "var(--surface)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
            style={{
              background: "var(--surface2)",
              color: "var(--text-dim)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--surface3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--surface2)";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>

          <div className="flex gap-2 flex-wrap mb-3">
            <span
              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
              style={catStyle}
            >
              {project.category}
            </span>
            {isProposalType(project) && (
              <span
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
                style={{
                  background: "var(--green-soft)",
                  color: "var(--green)",
                }}
              >
                제안형 과제
              </span>
            )}
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

          <h2
            className="text-[17px] font-bold leading-relaxed pr-10"
            style={{ color: "var(--text)" }}
          >
            {project.title}
          </h2>
        </div>

        {/* ── Body ── */}
        <div className="px-7 py-6">

          {/* 사업 설명 — 항상 표시, 없으면 안내 */}
          <Section title="사업 개요">
            <div
              className="text-[13px] leading-[1.8] whitespace-pre-line"
              style={{ color: "var(--text-secondary)" }}
            >
              {project.description || "상세 설명이 아직 수집되지 않았습니다. 원문 공고를 확인해 주세요."}
            </div>
          </Section>

          {/* 기본 정보 */}
          <Section title="기본 정보">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoItem label="신청 기간">
                {formatDate(project.start_date)} ~ {formatDate(project.end_date)}
              </InfoItem>

              {project.status === "open" && dday !== null && (
                <InfoItem label="마감까지">
                  <span
                    className="text-[17px] font-bold tabular-nums"
                    style={{ color: ddayColor }}
                  >
                    D-{dday}
                  </span>
                </InfoItem>
              )}

              <InfoItem label="주관기관">
                {project.ministry || "-"}
                {project.executing_agency && ` · ${project.executing_agency}`}
              </InfoItem>

              <InfoItem label="지원금액">
                <span
                  className="text-[17px] font-bold"
                  style={{ color: "var(--accent)" }}
                >
                  {project.funding_amount || "공고 참조"}
                </span>
              </InfoItem>

              {project.funding_detail && (
                <InfoItem label="지원 상세" full>
                  {project.funding_detail}
                </InfoItem>
              )}

              <InfoItem label="출처">
                {SOURCE_LABELS[project.source_site] || project.source_site}
              </InfoItem>

              <InfoItem label="최종 수집일">
                {formatDate(project.updated_at?.slice(0, 10) ?? null)}
              </InfoItem>
            </div>
          </Section>

          {/* 신청 자격 */}
          {project.eligibility && project.eligibility.length > 0 && (
            <Section title="신청 자격 및 조건">
              <ul className="space-y-0">
                {project.eligibility.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 py-2.5 text-[13px] leading-relaxed"
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <span
                      className="flex-shrink-0 mt-0.5 text-[12px]"
                      style={{ color: "var(--green)" }}
                    >
                      ✓
                    </span>
                    <span style={{ color: "var(--text-secondary)" }}>{item}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* 신청 방법 */}
          <Section title="신청 방법">
            <div className="grid grid-cols-1 gap-3">
              <InfoItem label="접수 방법" full>
                {project.how_to_apply || "공고문 참조"}
              </InfoItem>
              {project.apply_url && (
                <InfoItem label="신청 사이트" full>
                  <a
                    href={project.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--accent)" }}
                    className="hover:underline text-[13px] break-all"
                  >
                    {project.apply_url}
                  </a>
                </InfoItem>
              )}
            </div>
          </Section>

          {/* 관련 분야 */}
          {project.fields && project.fields.length > 0 && (
            <Section title="관련 분야">
              <div className="flex gap-2 flex-wrap">
                {project.fields.map((f) => (
                  <span
                    key={f}
                    className="text-[12px] px-3 py-1.5 rounded-lg"
                    style={{
                      background: "var(--surface2)",
                      color: "var(--text-dim)",
                    }}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Buttons */}
          <div className="flex gap-3 flex-wrap mt-6">
            {project.status === "open" && project.apply_url ? (
              <a
                href={project.apply_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-[14px] font-semibold text-white transition-all hover:-translate-y-0.5"
                style={{
                  background: "var(--accent)",
                  boxShadow: "0 4px 16px rgba(49,130,246,0.3)",
                }}
              >
                신청하러 가기
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            ) : (
              <button
                disabled
                className="px-7 py-3 rounded-xl text-[14px] font-semibold cursor-not-allowed"
                style={{
                  background: "var(--surface2)",
                  color: "var(--text-dim)",
                }}
              >
                {project.status === "upcoming"
                  ? "아직 모집 전이에요"
                  : "모집이 마감됐어요"}
              </button>
            )}

            {project.source_url && (
              <a
                href={project.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-[14px] font-medium transition-all hover:-translate-y-0.5"
                style={{
                  background: "var(--surface2)",
                  color: "var(--text-secondary)",
                }}
              >
                원문 공고 보기
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h3
        className="text-[12px] font-semibold tracking-wide mb-3"
        style={{ color: "var(--text-dim)" }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function InfoItem({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div
      className={`p-4 rounded-xl ${full ? "sm:col-span-2" : ""}`}
      style={{ background: "var(--bg)" }}
    >
      <div
        className="text-[11px] font-medium mb-1.5"
        style={{ color: "var(--text-dim)" }}
      >
        {label}
      </div>
      <div
        className="text-[13px] font-medium leading-relaxed"
        style={{ color: "var(--text-secondary)" }}
      >
        {children}
      </div>
    </div>
  );
}
