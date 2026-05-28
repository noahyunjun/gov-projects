/**
 * 공공데이터포털 (data.go.kr) API 연동
 *
 * 중소벤처기업부_정부지원사업 공고정보 API 활용
 * API 키는 data.go.kr에서 발급 필요
 *
 * 주요 API:
 * - 중소벤처기업부_지원사업 공고정보 조회 서비스
 *   https://www.data.go.kr/data/15109124/openapi.do
 */

import axios from "axios";
import type { ScrapedProject, ProjectCategory } from "@/types";

const API_BASE =
  "https://apis.data.go.kr/1160100/service/GetBsnsAncmInfoSVC";

function inferCategory(title: string, field?: string): ProjectCategory {
  const t = `${title} ${field || ""}`.toLowerCase();
  if (/전력|에너지|스마트그리드|마이크로그리드|전력거래|전력중개|vpp|수요반응|ems|bems|fems|hems|ami|배전.*자동|배전.*지능|전기차.*충전|v2g|ess|신재생.*모니터|계통|전력.*실증|에너지.*실증|에너지.*신산업|re100|탄소중립|디지털.*트윈|ppa|전력.*데이터|에너지.*데이터|전력.*플랫폼|에너지.*플랫폼|에너지.*관리|전력.*예측|수요예측|발전량.*예측|태양광|풍력|수소/.test(t)) return "전기/에너지";
  if (/ai|인공지능|데이터|클라우드|디지털/.test(t)) return "AI/데이터";
  if (/창업|스타트업|벤처/.test(t)) return "창업지원";
  if (/인재|교육|양성|훈련/.test(t)) return "인력양성";
  if (/r&d|연구|기술개발/.test(t)) return "R&D";
  return "중소기업";
}

function formatDate(raw: string): string | undefined {
  if (!raw) return undefined;
  const cleaned = raw.replace(/[^0-9]/g, "");
  if (cleaned.length >= 8) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
  }
  return undefined;
}

export async function scrapeDataGoKr(): Promise<ScrapedProject[]> {
  const apiKey = process.env.DATA_GO_KR_API_KEY;
  if (!apiKey) {
    console.log(
      "[data.go.kr] API 키가 설정되지 않았습니다. .env에 DATA_GO_KR_API_KEY를 설정하세요."
    );
    return [];
  }

  const results: ScrapedProject[] = [];

  try {
    // 지원사업 공고 목록 조회
    const { data } = await axios.get(`${API_BASE}/getBsnsAncmList`, {
      params: {
        serviceKey: apiKey,
        pageNo: 1,
        numOfRows: 100,
        resultType: "json",
      },
      timeout: 15000,
    });

    const items = data?.response?.body?.items?.item;
    if (!Array.isArray(items)) {
      console.log("[data.go.kr] No items returned");
      return [];
    }

    for (const item of items) {
      const title = item.bsnsAncmNm || item.pblancNm || "";
      if (!title) continue;

      const externalId = item.bsnsAncmId || item.pblancId || `dgk_${Date.now()}`;

      results.push({
        title,
        description: item.bsnsAncmCn || title,
        category: inferCategory(title, item.indutyNm),
        source_site: "data_go_kr",
        source_url: item.dtlPageUrl || undefined,
        external_id: String(externalId),
        start_date: formatDate(item.reqstBeginDt || item.rcptBgnde || ""),
        end_date: formatDate(item.reqstEndDt || item.rcptEndde || ""),
        ministry: item.jrsdInsttNm || item.pblancInsttNm || undefined,
        executing_agency: item.excInsttNm || undefined,
        funding_amount: item.sprtAmt
          ? `${Number(item.sprtAmt).toLocaleString()}원`
          : undefined,
        fields: item.indutyNm ? [item.indutyNm] : undefined,
        how_to_apply: item.reqstMthd || "공고문 참조",
        apply_url: item.dtlPageUrl || undefined,
      });
    }
  } catch (err) {
    console.error("[data.go.kr] API Error:", err);
  }

  return results;
}
