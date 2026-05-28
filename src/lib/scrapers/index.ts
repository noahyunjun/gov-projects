/**
 * 스크래퍼 통합 모듈
 *
 * 모든 소스에서 데이터를 수집하고 Supabase에 upsert합니다.
 */

import { getSupabaseAdmin } from "@/lib/supabase";
import { scrapeBizinfo } from "./bizinfo";
import { scrapeNtis } from "./ntis";
import { scrapeKStartup } from "./kstartup";
import { scrapeDataGoKr } from "./data-go-kr";
import type { ScrapedProject, ScrapeResult, SourceSite } from "@/types";

interface ScraperEntry {
  name: SourceSite;
  fn: () => Promise<ScrapedProject[]>;
}

const scrapers: ScraperEntry[] = [
  { name: "bizinfo", fn: scrapeBizinfo },
  { name: "ntis", fn: scrapeNtis },
  { name: "kstartup", fn: scrapeKStartup },
  { name: "data_go_kr", fn: scrapeDataGoKr },
];

/**
 * 수집된 과제를 Supabase에 upsert
 */
async function upsertProjects(
  projects: ScrapedProject[]
): Promise<{ newCount: number; updatedCount: number }> {
  const supabase = getSupabaseAdmin();
  let newCount = 0;
  let updatedCount = 0;

  for (const p of projects) {
    // 기존 데이터 확인
    const { data: existing } = await supabase
      .from("projects")
      .select("id")
      .eq("source_site", p.source_site)
      .eq("external_id", p.external_id)
      .single();

    if (existing) {
      // 업데이트
      const { error } = await supabase
        .from("projects")
        .update({
          title: p.title,
          description: p.description,
          category: p.category,
          source_url: p.source_url,
          start_date: p.start_date,
          end_date: p.end_date,
          ministry: p.ministry,
          executing_agency: p.executing_agency,
          funding_amount: p.funding_amount,
          funding_detail: p.funding_detail,
          eligibility: p.eligibility,
          how_to_apply: p.how_to_apply,
          apply_url: p.apply_url,
          fields: p.fields,
          scraped_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (!error) updatedCount++;
    } else {
      // 신규 삽입
      const { error } = await supabase.from("projects").insert({
        title: p.title,
        description: p.description,
        category: p.category,
        source_site: p.source_site,
        source_url: p.source_url,
        external_id: p.external_id,
        start_date: p.start_date,
        end_date: p.end_date,
        ministry: p.ministry,
        executing_agency: p.executing_agency,
        funding_amount: p.funding_amount,
        funding_detail: p.funding_detail,
        eligibility: p.eligibility,
        how_to_apply: p.how_to_apply,
        apply_url: p.apply_url,
        fields: p.fields,
      });

      if (!error) newCount++;
    }
  }

  return { newCount, updatedCount };
}

/**
 * 전체 스크래핑 실행
 */
export async function runAllScrapers(): Promise<ScrapeResult[]> {
  const supabase = getSupabaseAdmin();
  const results: ScrapeResult[] = [];

  for (const { name, fn } of scrapers) {
    // 스크래핑 로그 시작
    const { data: log } = await supabase
      .from("scrape_logs")
      .insert({ source_site: name, status: "running" })
      .select("id")
      .single();

    try {
      console.log(`[scraper] Starting ${name}...`);
      const projects = await fn();
      console.log(`[scraper] ${name}: found ${projects.length} projects`);

      const { newCount, updatedCount } = await upsertProjects(projects);

      const result: ScrapeResult = {
        source: name,
        success: true,
        projectsFound: projects.length,
        projectsNew: newCount,
        projectsUpdated: updatedCount,
      };
      results.push(result);

      // 로그 업데이트
      if (log?.id) {
        await supabase
          .from("scrape_logs")
          .update({
            finished_at: new Date().toISOString(),
            status: "success",
            projects_found: projects.length,
            projects_new: newCount,
            projects_updated: updatedCount,
          })
          .eq("id", log.id);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`[scraper] ${name} failed:`, errorMsg);

      results.push({
        source: name,
        success: false,
        projectsFound: 0,
        projectsNew: 0,
        projectsUpdated: 0,
        error: errorMsg,
      });

      if (log?.id) {
        await supabase
          .from("scrape_logs")
          .update({
            finished_at: new Date().toISOString(),
            status: "error",
            error_message: errorMsg,
          })
          .eq("id", log.id);
      }
    }
  }

  return results;
}
