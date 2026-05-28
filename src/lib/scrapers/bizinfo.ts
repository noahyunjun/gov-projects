/**
 * 기업마당 (bizinfo.go.kr) 스크래퍼
 *
 * 1단계: 공고 목록 페이지에서 pblancId 목록 수집
 * 2단계: 각 상세 페이지에서 제목, 기간, 기관, 신청방법 파싱
 */

import axios from "axios";
import type { ScrapedProject, ProjectCategory } from "@/types";

const BASE_URL = "https://www.bizinfo.go.kr";
const LIST_URL = `${BASE_URL}/sii/siia/selectSIIA200View.do`;
const DETAIL_URL = `${BASE_URL}/sii/siia/selectSIIA200Detail.do`;

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
};

function inferCategory(title: string): ProjectCategory {
  const t = title.toLowerCase();
  if (/전력|에너지|스마트그리드|마이크로그리드|전력거래|전력중개|vpp|수요반응|ems|bems|fems|hems|ami|배전.*자동|배전.*지능|전기차.*충전|v2g|ess|신재생.*모니터|계통|전력.*실증|에너지.*실증|에너지.*신산업|re100|탄소중립|디지털.*트윈|ppa|전력.*데이터|에너지.*데이터|전력.*플랫폼|에너지.*플랫폼|에너지.*관리|전력.*예측|수요예측|발전량.*예측|태양광|풍력|수소/.test(t)) return "전기/에너지";
  if (/ai|인공지능|데이터|클라우드|gpu|디지털|반도체/.test(t)) return "AI/데이터";
  if (/창업|스타트업|벤처|패키지|팁스|tips/.test(t)) return "창업지원";
  if (/인재|교육|양성|훈련|채움|학사|석사/.test(t)) return "인력양성";
  if (/r&d|연구|기초연구|과제|기술개발/.test(t)) return "R&D";
  return "중소기업";
}

function cleanHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDate(raw: string): string | undefined {
  const m = raw.match(/(\d{4})[.\-/](\d{2})[.\-/](\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : undefined;
}

/** 목록 페이지에서 pblancId 추출 */
async function fetchIds(): Promise<string[]> {
  try {
    const { data: html } = await axios.get(LIST_URL, {
      headers: HEADERS,
      timeout: 15000,
    });
    const ids = [...new Set(html.match(/PBLN_\d+/g) || [])] as string[];
    console.log(`[bizinfo] 목록에서 ${ids.length}건 ID 발견`);
    return ids;
  } catch (err) {
    console.error("[bizinfo] 목록 페이지 요청 실패:", err);
    return [];
  }
}

/** 상세 페이지에서 과제 정보 파싱 */
async function fetchDetail(pblancId: string): Promise<ScrapedProject | null> {
  try {
    const url = `${DETAIL_URL}?pblancId=${pblancId}`;
    const { data: html } = await axios.get(url, {
      headers: HEADERS,
      timeout: 10000,
    });

    // 제목: 2026이 포함된 h 태그
    const hTags = html.match(/<h[1-4][^>]*>[\s\S]*?<\/h[1-4]>/g) || [];
    let title = "";
    for (const h of hTags) {
      const cleaned = cleanHtml(h);
      if (cleaned.includes("2026") && cleaned.length > 15) {
        title = cleaned;
        break;
      }
    }
    if (!title) {
      // fallback: 가장 긴 h 태그
      for (const h of hTags) {
        const cleaned = cleanHtml(h);
        if (cleaned.length > 15 && !cleaned.includes("만족") && !cleaned.includes("해시")) {
          title = cleaned;
          break;
        }
      }
    }
    if (!title) return null;

    // s_title 라벨 → 값 매핑
    const labelPattern =
      /<span[^>]*class="s_title"[^>]*>(.*?)<\/span>\s*(?:<[^>]*>\s*)*([\s\S]*?)(?=<span[^>]*class="s_title"|<\/div|<h[1-4])/g;
    const fields: Record<string, string> = {};
    let match;
    while ((match = labelPattern.exec(html)) !== null) {
      const label = cleanHtml(match[1]);
      const value = cleanHtml(match[2]);
      if (label && value) fields[label] = value;
    }

    // 신청기간 파싱
    const periodStr = fields["신청기간"] || "";
    const dates = periodStr.match(/(\d{4}[.\-/]\d{2}[.\-/]\d{2})/g);
    const startDate = dates?.[0] ? parseDate(dates[0]) : undefined;
    const endDate = dates?.[1] ? parseDate(dates[1]) : undefined;

    // 소관부처
    const ministry = fields["소관부처·지자체"] || fields["소관부처"] || undefined;
    const agency = fields["사업수행기관"] || undefined;

    // 신청방법
    const howToApply = fields["사업신청 방법"] || fields["신청방법"] || "공고문 참조";

    // 사업개요
    const description = fields["사업개요"] || title;

    return {
      title,
      description: description.slice(0, 500),
      category: inferCategory(title),
      source_site: "bizinfo",
      source_url: url,
      external_id: pblancId,
      start_date: startDate,
      end_date: endDate,
      ministry,
      executing_agency: agency,
      fields: [inferCategory(title)],
      how_to_apply: howToApply,
      apply_url: url,
    };
  } catch (err) {
    console.error(`[bizinfo] 상세 파싱 실패 (${pblancId}):`, err);
    return null;
  }
}

export async function scrapeBizinfo(): Promise<ScrapedProject[]> {
  const ids = await fetchIds();
  const results: ScrapedProject[] = [];

  // 순차 요청 (서버 부하 방지)
  for (const id of ids) {
    const project = await fetchDetail(id);
    if (project) {
      results.push(project);
      console.log(`[bizinfo] ✓ ${project.title.slice(0, 50)}`);
    }
    // 요청 간격 0.5초
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`[bizinfo] 총 ${results.length}건 수집 완료`);
  return results;
}
