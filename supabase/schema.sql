-- ============================================
-- 국가 과제 대시보드 - Supabase 스키마
-- Supabase SQL Editor에서 실행하세요
-- ============================================

-- 1. 과제 정보 테이블
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),

  -- 기본 정보
  title text not null,
  description text,
  category text not null,           -- 'R&D', '창업지원', 'AI/데이터', '중소기업', '인력양성'
  source_site text not null,        -- 'bizinfo', 'ntis', 'kstartup', 'iitp', 'data_go_kr'
  source_url text,                  -- 원문 공고 URL
  external_id text,                 -- 외부 사이트의 고유 ID (중복 방지)

  -- 모집 기간
  start_date date,
  end_date date,

  -- 주관 기관
  ministry text,                    -- 소관부처 (과학기술정보통신부, 중소벤처기업부 등)
  executing_agency text,            -- 수행기관 (IITP, 창업진흥원, TIPA 등)

  -- 지원 정보
  funding_amount text,              -- 지원금액 (텍스트, "최대 1억원" 등)
  funding_detail text,              -- 지원 상세 설명

  -- 신청 정보
  eligibility text[],               -- 신청 자격 조건 배열
  how_to_apply text,                -- 신청 방법
  apply_url text,                   -- 신청 사이트 URL

  -- 분야 태그
  fields text[],                    -- 관련 분야 태그 배열

  -- 메타
  scraped_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- 중복 방지
  unique(source_site, external_id)
);

-- 2. 인덱스
create index if not exists idx_projects_category on projects (category);
create index if not exists idx_projects_end_date on projects (end_date);
create index if not exists idx_projects_source on projects (source_site);
create index if not exists idx_projects_fields on projects using gin (fields);

-- 3. 스크래핑 로그 테이블
create table if not exists scrape_logs (
  id uuid primary key default gen_random_uuid(),
  source_site text not null,
  started_at timestamptz default now(),
  finished_at timestamptz,
  status text default 'running',   -- 'running', 'success', 'error'
  projects_found int default 0,
  projects_new int default 0,
  projects_updated int default 0,
  error_message text
);

-- 4. 북마크 테이블 (향후 사용자 기능 확장용)
create table if not exists bookmarks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  created_at timestamptz default now()
);

-- 5. updated_at 자동 갱신 트리거
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger projects_updated_at
  before update on projects
  for each row
  execute function update_updated_at();

-- 6. RLS (Row Level Security) - 읽기 공개
alter table projects enable row level security;

create policy "Public read access" on projects
  for select using (true);

create policy "Service role insert" on projects
  for insert with check (true);

create policy "Service role update" on projects
  for update using (true);

alter table scrape_logs enable row level security;

create policy "Public read scrape_logs" on scrape_logs
  for select using (true);

create policy "Service insert scrape_logs" on scrape_logs
  for insert with check (true);

create policy "Service update scrape_logs" on scrape_logs
  for update using (true);
