"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Project, ProjectFilters } from "@/types";

interface UseProjectsResult {
  projects: Project[];
  total: number;
  loading: boolean;
  scraping: boolean;
  error: string | null;
  refetch: () => void;
}

// 스크래핑이 이미 트리거됐는지 추적 (앱 전체에서 1번만)
let scrapingTriggered = false;

export function useProjects(filters: ProjectFilters): UseProjectsResult {
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitialLoad = useRef(true);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (filters.status && filters.status !== "all")
      params.set("status", filters.status);
    if (filters.category && filters.category !== "all")
      params.set("category", filters.category);
    if (filters.search) params.set("search", filters.search);
    params.set("limit", "100");

    try {
      const res = await fetch(`/api/projects?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setProjects(data.projects);
      setTotal(data.total);

      // 첫 로드에서 DB가 비어있으면 자동 스크래핑
      if (isInitialLoad.current && data.total === 0 && !scrapingTriggered) {
        scrapingTriggered = true;
        isInitialLoad.current = false;
        setScraping(true);

        try {
          const scrapeRes = await fetch("/api/scrape");
          const scrapeData = await scrapeRes.json();
          console.log("[auto-scrape] 결과:", scrapeData);

          // 스크래핑 후 다시 불러오기
          const res2 = await fetch(`/api/projects?${params}`);
          if (res2.ok) {
            const data2 = await res2.json();
            setProjects(data2.projects);
            setTotal(data2.total);
          }
        } catch (e) {
          console.error("[auto-scrape] 실패:", e);
        } finally {
          setScraping(false);
        }
      } else {
        isInitialLoad.current = false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.category, filters.search]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return { projects, total, loading, scraping, error, refetch: fetchProjects };
}
