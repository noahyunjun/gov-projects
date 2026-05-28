/**
 * NTIS (ntis.go.kr) 스크래퍼
 *
 * 1단계: 목록 페이지에서 roRndUid 목록 + 기본 정보(제목, 부처, 접수일, 마감일) 수집
 * 2단계: 각 상세 페이지에서 추가 정보 파싱
 *
 * URL 패턴 (검증됨):
 * - 목록: https://www.ntis.go.kr/rndgate/eg/un/ra/mng.do
 * - 상세: https://www.ntis.go.kr/rndgate/eg/un/ra/view.do?roRndUid=XXXXXXX
 */

import axios from "axios";
import type { ScrapedProject, ProjectCategory } from "@/types";

const BASE_URL = "https://www.ntis.go.kr";
const LIST_URL = `${BASE_URL}/rndgate/eg/un/ra/mng.do`;

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
};

function inferCategory(title: string): ProjectCategory {
  const t = title.toLowerCase();
  if (/전력|에너지|스마트그리드|마이크로그리드|전력거래|전력중개|vpp|수요반응|ems|bems|fems|hems|ami|배전.*자동|배전.*지능|전기차.*충전|v2g|ess|신재생.*모니터|계통|전력.*실증|에너지.*실증|에너지.*신산업|re100|탄소중립|디지털.*트윈|ppa|전력.*데이터|에너지.*데이터|전력.*플랫폼|에너지.*플랫폼|에너지.*관리|전력.*예측|수요예측|발전량.*예측|태양광|풍력|수소/.test(t)) return "전기/에너지";
  if (/ai|인공지능|데이터|클라우드|gpu|디지털|반도체/.test(t)) return "AI/데이터";
  if (/창업|스타트업|벤처/.test(t)) return "창업지원";
  if (/인재|교육|양성|학사|석사|인력/.test(t)) return "인력양성";
  if (/중소기업|소상공인/.test(t)) return "중소기업";
  return "R&D";
}

function cleanHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDate(raw: string): string | undefined {
  const m = raw.match(/(\d{4})[.\-/](\d{2})[.\-/](\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : undefined;
}

interface NtisListItem {
  roRndUid: string;
  title: string;
  ministry: string;
  startDate?: string;
  endDate?: string;
}

/** 목록 페이지에서 공고 기본 정보 추출 */
async function fetchList(): Promise<NtisListItem[]> {
  const items: NtisListItem[] = [];

  try {
    const { data: html } = await axios.get(LIST_URL, {
      headers: HEADERS,
      timeout: 15000,
    });

    // roRndUid + title 추출 (title 속성에 제목이 들어있음)
    const linkPattern =
      /href="\/rndgate\/eg\/un\/ra\/view\.do\?roRndUid=(\d+)[^"]*"\s*(?:onclick="[^"]*"\s*)?title="([^"]+)"/g;
    let match;
    const seen = new Set<string>();

    while ((match = linkPattern.exec(html)) !== null) {
      const uid = match[1];
      if (seen.has(uid)) continue;
      seen.add(uid);

      const title = cleanHtml(match[2]);
      if (!title || title.length < 10) continue;

      items.push({
        roRndUid: uid,
        title,
        ministry: "",
        startDate: undefined,
        endDate: undefined,
      });
    }

    // 테이블 행에서 부처명, 접수일, 마감일 추출
    // 패턴: <td data-title="부처명">XXX</td> ... <td data-title="접수일">YYYY.MM.DD</td> ... <td data-title="마감일">YYYY.MM.DD</td>
    for (const item of items) {
      // 해당 uid 주변 컨텍스트에서 부처, 날짜 추출
      const uidIdx = html.indexOf(`roRndUid=${item.roRndUid}`);
      if (uidIdx === -1) continue;

      // uid 뒤 600자 범위에서 td data-title 패턴 찾기
      const chunk = html.slice(uidIdx, uidIdx + 600);

      const ministryMatch = chunk.match(
        /data-title="부처명"[^>]*>([^<]+)</
      );
      if (ministryMatch) item.ministry = ministryMatch[1].trim();

      const startMatch = chunk.match(
        /data-title="접수일"[^>]*>(\d{4}\.\d{2}\.\d{2})/
      );
      if (startMatch) item.startDate = parseDate(startMatch[1]);

      const endMatch = chunk.match(
        /data-title="마감일"[^>]*>(\d{4}\.\d{2}\.\d{2})/
      );
      if (endMatch) item.endDate = parseDate(endMatch[1]);
    }

    console.log(`[ntis] 목록에서 ${items.length}건 발견`);
  } catch (err) {
    console.error("[ntis] 목록 페이지 요청 실패:", err);
  }

  return items;
}

/** 상세 페이지에서 추가 정보 파싱 */
async function fetchDetail(
  item: NtisListItem
): Promise<ScrapedProject | null> {
  const url = `${BASE_URL}/rndgate/eg/un/ra/view.do?roRndUid=${item.roRndUid}`;

  try {
    const { data: html } = await axios.get(url, {
      headers: HEADERS,
      timeout: 10000,
    });

    // 상세 페이지에서 li > span 패턴으로 필드 추출
    // 예: <li><span>부처명 : </span>과학기술정보통신부</li>
    const fieldPattern =
      /<li>\s*<span>([^<]+)<\/span>\s*([\s\S]*?)(?=<\/li>)/g;
    const fields: Record<string, string> = {};
    let m;

    while ((m = fieldPattern.exec(html)) !== null) {
      const label = m[1].replace(/\s*:\s*$/, "").trim();
      const value = cleanHtml(m[2]);
      if (label && value) fields[label] = value;
    }

    // 부처명 (상세에서 더 정확한 값 가능)
    const ministry =
      fields["부처명"] || item.ministry || "과학기술정보통신부";

    // 접수일/마감일 (상세에서 더 정확한 값 가능)
    const startDate =
      (fields["접수일"] ? parseDate(fields["접수일"]) : undefined) ||
      item.startDate;
    const endDate =
      (fields["마감일"] ? parseDate(fields["마감일"]) : undefined) ||
      item.endDate;

    // 사업명
    const programName = fields["사업명"] || "";

    // 공고금액
    const fundingAmount = fields["공고금액"] || undefined;

    // 설명 조합
    const description = programName
      ? `${programName} - ${item.title}`
      : item.title;

    return {
      title: item.title,
      description: description.slice(0, 500),
      category: inferCategory(item.title),
      source_site: "ntis",
      source_url: url,
      external_id: item.roRndUid,
      start_date: startDate,
      end_date: endDate,
      ministry,
      funding_amount: fundingAmount,
      fields: [inferCategory(item.title)],
      how_to_apply: "범부처통합연구지원시스템(IRIS) 온라인 접수",
      apply_url: "https://www.iris.go.kr/",
    };
  } catch (err) {
    console.error(`[ntis] 상세 파싱 실패 (${item.roRndUid}):`, err);

    // 상세 실패 시 목록 정보만으로 생성
    return {
      title: item.title,
      description: item.title,
      category: inferCategory(item.title),
      source_site: "ntis",
      source_url: url,
      external_id: item.roRndUid,
      start_date: item.startDate,
      end_date: item.endDate,
      ministry: item.ministry || "과학기술정보통신부",
      fields: [inferCategory(item.title)],
      how_to_apply: "범부처통합연구지원시스템(IRIS) 온라인 접수",
      apply_url: "https://www.iris.go.kr/",
    };
  }
}

export async function scrapeNtis(): Promise<ScrapedProject[]> {
  const items = await fetchList();
  const results: ScrapedProject[] = [];

  for (const item of items) {
    const project = await fetchDetail(item);
    if (project) {
      results.push(project);
      console.log(`[ntis] ✓ ${project.title.slice(0, 50)}`);
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`[ntis] 총 ${results.length}건 수집 완료`);
  return results;
}
