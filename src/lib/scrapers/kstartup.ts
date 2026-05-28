/**
 * K-Startup (k-startup.go.kr) 스크래퍼
 *
 * 1단계: 목록 페이지(bizpbanc-ongoing.do)에서 pbancSn + 제목 + 마감일 수집
 * 2단계: 각 상세 페이지에서 접수기간, 주관기관, 신청방법 등 파싱
 *
 * URL 패턴 (검증됨):
 * - 목록: https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do
 * - 상세: https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=XXXXXX
 */

import axios from "axios";
import type { ScrapedProject, ProjectCategory } from "@/types";

const BASE_URL = "https://www.k-startup.go.kr";
const LIST_URL = `${BASE_URL}/web/contents/bizpbanc-ongoing.do`;

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
};

function inferCategory(title: string): ProjectCategory {
  const t = title.toLowerCase();
  if (/전력|에너지|스마트그리드|마이크로그리드|전력거래|전력중개|vpp|수요반응|ems|bems|fems|hems|ami|배전.*자동|배전.*지능|전기차.*충전|v2g|ess|신재생.*모니터|계통|전력.*실증|에너지.*실증|에너지.*신산업|re100|탄소중립|디지털.*트윈|ppa|전력.*데이터|에너지.*데이터|전력.*플랫폼|에너지.*플랫폼|에너지.*관리|전력.*예측|수요예측|발전량.*예측|태양광|풍력|수소/.test(t)) return "전기/에너지";
  if (/ai|인공지능|데이터|디지털|클라우드/.test(t)) return "AI/데이터";
  if (/교육|양성|인재|아카데미/.test(t)) return "인력양성";
  if (/기술개발|r&d|연구/.test(t)) return "R&D";
  if (/중소기업|소상공인/.test(t)) return "중소기업";
  return "창업지원";
}

function cleanHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/새로운게시글/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDate(raw: string): string | undefined {
  const m = raw.match(/(\d{4})[.\-/](\d{2})[.\-/](\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : undefined;
}

interface KStartupListItem {
  pbancSn: string;
  title: string;
  endDate?: string;
}

/** 목록 페이지에서 공고 ID + 제목 + 마감일 추출 */
async function fetchList(): Promise<KStartupListItem[]> {
  const items: KStartupListItem[] = [];

  try {
    const { data: html } = await axios.get(LIST_URL, {
      headers: HEADERS,
      timeout: 15000,
    });

    // go_view(ID) 패턴으로 pbancSn 추출
    const seen = new Set<string>();

    // 패턴: go_view(177825) 주변에서 마감일과 제목 추출
    // <a href='javascript:go_view(177825);'> ... 마감일자 YYYY-MM-DD ... <p class="tit">제목</p>
    const blockPattern =
      /go_view\((\d+)\);[\s\S]*?마감일자\s*(\d{4}-\d{2}-\d{2})[\s\S]*?class="tit">([\s\S]*?)<\/p>/g;
    let match;

    while ((match = blockPattern.exec(html)) !== null) {
      const sn = match[1];
      if (seen.has(sn)) continue;
      seen.add(sn);

      const endDate = match[2];
      // 제목에서 <span> 태그 제거
      const title = cleanHtml(match[3]);
      if (!title || title.length < 5) continue;

      items.push({
        pbancSn: sn,
        title,
        endDate,
      });
    }

    // 메인 페이지의 신규 공고 링크도 수집 (pbancSn= 파라미터 패턴)
    const linkPattern =
      /bizpbanc-ongoing\.do\?(?:schM=view&)?pbancSn=(\d+)[^>]*>([^<]+)</g;
    while ((match = linkPattern.exec(html)) !== null) {
      const sn = match[1];
      if (seen.has(sn)) continue;
      seen.add(sn);

      const title = cleanHtml(match[2]);
      if (!title || title.length < 5) continue;

      items.push({
        pbancSn: sn,
        title,
      });
    }

    console.log(`[kstartup] 목록에서 ${items.length}건 발견`);
  } catch (err) {
    console.error("[kstartup] 목록 페이지 요청 실패:", err);
  }

  return items;
}

/** 상세 페이지에서 추가 정보 파싱 */
async function fetchDetail(
  item: KStartupListItem
): Promise<ScrapedProject | null> {
  const url = `${LIST_URL}?schM=view&pbancSn=${item.pbancSn}`;

  try {
    const { data: html } = await axios.get(url, {
      headers: HEADERS,
      timeout: 10000,
    });

    // h3 태그에서 제목 추출 (더 정확)
    const h3Match = html.match(/<h3>([\s\S]*?)<\/h3>/);
    const title = h3Match ? cleanHtml(h3Match[1]) : item.title;

    // p.tit → p.txt 패턴으로 필드 추출
    const fieldPattern =
      /<p\s+class="tit"[^>]*>([\s\S]*?)<\/p>\s*(?:<p\s+class="txt"[^>]*(?:\s+id="[^"]*")?[^>]*>([\s\S]*?)<\/p>|<div\s+class="txt">([\s\S]*?)<\/div>)/g;
    const fields: Record<string, string> = {};
    let m;

    while ((m = fieldPattern.exec(html)) !== null) {
      const label = cleanHtml(m[1]);
      const value = cleanHtml(m[2] || m[3] || "");
      if (label && value && label.length < 20) {
        fields[label] = value;
      }
    }

    // 접수기간 (id="rcptPeriod")
    const rcptMatch = html.match(
      /id="rcptPeriod"[^>]*>([\s\S]*?)<\/p>/
    );
    const rcptPeriod = rcptMatch ? cleanHtml(rcptMatch[1]) : "";

    // 신청기간 (id="aplyPeriod")
    const aplyMatch = html.match(
      /id="aplyPeriod"[^>]*>([\s\S]*?)<\/p>/
    );
    const aplyPeriod = aplyMatch ? cleanHtml(aplyMatch[1]) : "";

    // 날짜 파싱: 접수기간 또는 신청기간에서
    const periodStr = rcptPeriod || aplyPeriod || "";
    const dates = periodStr.match(/(\d{4}[.\-/]\d{2}[.\-/]\d{2})/g);
    const startDate = dates?.[0] ? parseDate(dates[0]) : undefined;
    const endDate =
      (dates?.[1] ? parseDate(dates[1]) : undefined) || item.endDate;

    // 주관기관
    const agency = fields["주관기관명"] || undefined;

    // 신청방법
    const howToApply =
      fields["신청방법"] || "K-Startup 창업지원포털에서 온라인 신청";

    return {
      title,
      description: title,
      category: inferCategory(title),
      source_site: "kstartup",
      source_url: url,
      external_id: item.pbancSn,
      start_date: startDate,
      end_date: endDate,
      ministry: "중소벤처기업부",
      executing_agency: agency || "창업진흥원",
      fields: [inferCategory(title)],
      how_to_apply: howToApply,
      apply_url: url,
    };
  } catch (err) {
    console.error(`[kstartup] 상세 파싱 실패 (${item.pbancSn}):`, err);

    // 상세 실패 시 목록 정보만으로 생성
    return {
      title: item.title,
      description: item.title,
      category: inferCategory(item.title),
      source_site: "kstartup",
      source_url: url,
      external_id: item.pbancSn,
      end_date: item.endDate,
      ministry: "중소벤처기업부",
      executing_agency: "창업진흥원",
      fields: [inferCategory(item.title)],
      how_to_apply: "K-Startup 창업지원포털에서 온라인 신청",
      apply_url: url,
    };
  }
}

export async function scrapeKStartup(): Promise<ScrapedProject[]> {
  const items = await fetchList();
  const results: ScrapedProject[] = [];

  for (const item of items) {
    const project = await fetchDetail(item);
    if (project) {
      results.push(project);
      console.log(`[kstartup] ✓ ${project.title.slice(0, 50)}`);
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`[kstartup] 총 ${results.length}건 수집 완료`);
  return results;
}
