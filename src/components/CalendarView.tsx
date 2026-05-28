"use client";

import { useState, useMemo } from "react";
import type { Project } from "@/types";

interface Props {
  projects: Project[];
  onProjectClick: (p: Project) => void;
}

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];
const MONTH_NAMES = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

export function CalendarView({ projects, onProjectClick }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const changeMonth = (dir: number) => {
    let m = month + dir;
    let y = year;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setMonth(m);
    setYear(y);
  };

  const events = useMemo(() => {
    const map: Record<string, { project: Project; type: "start" | "end" }[]> = {};

    for (const p of projects) {
      for (const [dateStr, type] of [
        [p.start_date, "start"],
        [p.end_date, "end"],
      ] as const) {
        if (!dateStr) continue;
        const d = new Date(dateStr);
        if (d.getFullYear() === year && d.getMonth() === month) {
          const key = d.getDate().toString();
          if (!map[key]) map[key] = [];
          map[key].push({ project: p, type });
        }
      }
    }
    return map;
  }, [projects, year, month]);

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay();

  const days: { date: number; isCurrentMonth: boolean; isToday: boolean }[] = [];

  const prevMonthLast = new Date(year, month, 0).getDate();
  for (let i = startDow - 1; i >= 0; i--) {
    days.push({ date: prevMonthLast - i, isCurrentMonth: false, isToday: false });
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const isToday =
      d === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear();
    days.push({ date: d, isCurrentMonth: true, isToday });
  }

  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      days.push({ date: d, isCurrentMonth: false, isToday: false });
    }
  }

  return (
    <div>
      {/* Navigation */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => changeMonth(-1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          style={{ background: "var(--surface)", color: "var(--text-secondary)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface2)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--surface)"; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="text-[16px] font-bold tabular-nums" style={{ color: "var(--text)" }}>
          {year}년 {MONTH_NAMES[month]}
        </span>
        <button
          onClick={() => changeMonth(1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          style={{ background: "var(--surface)", color: "var(--text-secondary)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface2)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--surface)"; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Calendar Grid */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid var(--border)" }}
      >
        {/* Day Headers */}
        <div className="grid grid-cols-7">
          {DAY_NAMES.map((d) => (
            <div
              key={d}
              className="text-center py-3 text-[12px] font-semibold"
              style={{
                background: "var(--surface)",
                color: "var(--text-dim)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Date Cells */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const dayEvents = day.isCurrentMonth
              ? events[day.date.toString()] || []
              : [];

            return (
              <div
                key={i}
                className="min-h-[100px] p-2"
                style={{
                  background: day.isCurrentMonth
                    ? day.isToday
                      ? "var(--accent-soft)"
                      : "var(--surface)"
                    : "var(--bg)",
                  opacity: day.isCurrentMonth ? 1 : 0.35,
                  borderRight: "1px solid var(--border)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div
                  className="text-[12px] mb-1.5"
                  style={{
                    color: day.isToday ? "var(--accent)" : "var(--text-dim)",
                    fontWeight: day.isToday ? 700 : 500,
                  }}
                >
                  {day.date}
                </div>
                {dayEvents.slice(0, 3).map((evt, j) => (
                  <div
                    key={j}
                    onClick={() => onProjectClick(evt.project)}
                    className="text-[10px] px-1.5 py-0.5 rounded-md mb-0.5 cursor-pointer font-medium truncate transition-opacity hover:opacity-80"
                    style={{
                      background:
                        evt.type === "start"
                          ? "var(--green-soft)"
                          : "var(--red-soft)",
                      color:
                        evt.type === "start" ? "var(--green)" : "var(--red)",
                      borderLeft: `2px solid ${evt.type === "start" ? "var(--green)" : "var(--red)"}`,
                    }}
                    title={evt.project.title}
                  >
                    {evt.type === "start" ? "시작" : "마감"}{" "}
                    {evt.project.title.slice(0, 16)}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div
                    className="text-[10px] px-1.5 mt-0.5"
                    style={{ color: "var(--text-dim)" }}
                  >
                    +{dayEvents.length - 3}건
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
