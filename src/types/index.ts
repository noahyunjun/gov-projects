export type ProjectStatus = "open" | "closed" | "upcoming";

export type ProjectCategory =
  | "R&D"
  | "창업지원"
  | "AI/데이터"
  | "중소기업"
  | "인력양성"
  | "전기/에너지";

export type SourceSite =
  | "bizinfo"
  | "ntis"
  | "kstartup"
  | "iitp"
  | "data_go_kr";

export interface Project {
  id: string;
  title: string;
  description: string | null;
  category: ProjectCategory;
  source_site: SourceSite;
  source_url: string | null;
  external_id: string | null;
  start_date: string | null; // YYYY-MM-DD
  end_date: string | null;
  ministry: string | null;
  executing_agency: string | null;
  funding_amount: string | null;
  funding_detail: string | null;
  eligibility: string[] | null;
  how_to_apply: string | null;
  apply_url: string | null;
  fields: string[] | null;
  status: ProjectStatus;
  scraped_at: string;
  updated_at: string;
}

// 스크래퍼가 반환하는 파싱된 과제 데이터
export interface ScrapedProject {
  title: string;
  description?: string;
  category: ProjectCategory;
  source_site: SourceSite;
  source_url?: string;
  external_id: string;
  start_date?: string;
  end_date?: string;
  ministry?: string;
  executing_agency?: string;
  funding_amount?: string;
  funding_detail?: string;
  eligibility?: string[];
  how_to_apply?: string;
  apply_url?: string;
  fields?: string[];
}

export interface ScrapeResult {
  source: SourceSite;
  success: boolean;
  projectsFound: number;
  projectsNew: number;
  projectsUpdated: number;
  error?: string;
}

// 필터 옵션
export interface ProjectFilters {
  status?: ProjectStatus | "all";
  category?: ProjectCategory | "all";
  search?: string;
  ministry?: string;
}
