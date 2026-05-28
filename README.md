# 국가 과제 대시보드 (Gov Projects Dashboard)

정부 R&D, 창업지원, AI·데이터, 중소기업 관련 국가 과제를 한눈에 확인할 수 있는 웹 대시보드입니다.

## 주요 기능

- **카드 뷰**: 과제별 모집 상태, D-day, 지원금액 한눈에 확인
- **달력 뷰**: 모집 시작/마감일을 달력에서 시각적으로 확인
- **상세 모달**: 신청 자격, 신청 방법, 신청 사이트 링크까지 원스톱 확인
- **필터 & 검색**: 상태별, 카테고리별, 키워드 필터링
- **자동 수집**: 매일 아침 6시 Vercel Cron으로 자동 스크래핑

## 데이터 소스

| 소스 | 방식 | 내용 |
|------|------|------|
| 기업마당 (bizinfo.go.kr) | 스크래핑 | 중소기업 지원사업 전체 |
| NTIS (ntis.go.kr) | 스크래핑 | 국가 R&D 과제 공고 |
| K-Startup (k-startup.go.kr) | 스크래핑 | 창업 지원사업 |
| 공공데이터포털 (data.go.kr) | API | 정부지원사업 공고정보 |

## 기술 스택

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS 4
- **Backend**: Next.js API Routes (Serverless)
- **Database**: Supabase (PostgreSQL)
- **Scraping**: Cheerio + Axios
- **Deploy**: Vercel + Vercel Cron Jobs

---

## 시작하기

### 1. 프로젝트 클론 및 설치

```bash
git clone <your-repo>
cd gov-projects
npm install
```

### 2. Supabase 설정

1. [supabase.com](https://supabase.com)에서 새 프로젝트 생성
2. SQL Editor에서 `supabase/schema.sql` 실행
3. Settings > API에서 URL과 키 복사

### 3. 환경변수 설정

`.env.example`을 `.env.local`로 복사 후 값 입력:

```bash
cp .env.example .env.local
```

```env
# Supabase (필수)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# 공공데이터 API (선택 - data.go.kr에서 발급)
DATA_GO_KR_API_KEY=your-key

# Cron 보안 (선택)
CRON_SECRET=any-random-string
```

### 4. 공공데이터 API 키 발급 (선택)

1. [data.go.kr](https://www.data.go.kr) 회원가입
2. "중소벤처기업부_지원사업 공고정보" 검색
3. API 활용 신청 → 발급된 키를 `DATA_GO_KR_API_KEY`에 입력

### 5. 로컬 실행

```bash
npm run dev
```

http://localhost:3000 에서 확인

### 6. 초기 데이터 수집 (수동)

```bash
# 터미널에서 직접 실행
curl -X POST http://localhost:3000/api/scrape

# 또는 CRON_SECRET 설정했다면
curl -X GET http://localhost:3000/api/scrape \
  -H "Authorization: Bearer your-cron-secret"
```

---

## Vercel 배포

### 1. Vercel에 연결

```bash
npx vercel
```

### 2. 환경변수 설정

Vercel Dashboard > Settings > Environment Variables에 `.env.local`의 값들 입력

### 3. Cron Job 자동 설정

`vercel.json`에 이미 설정되어 있어 배포하면 자동 활성화:

```json
{
  "crons": [{
    "path": "/api/scrape",
    "schedule": "0 6 * * *"
  }]
}
```

> 매일 UTC 06:00 (한국 시간 15:00)에 실행됩니다.
> 한국 아침 6시에 맞추려면 `"0 21 * * *"` (UTC 21:00)으로 변경하세요.

---

## 프로젝트 구조

```
gov-projects/
├── vercel.json              # Cron 스케줄 설정
├── supabase/
│   └── schema.sql           # DB 스키마
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   └── api/
│   │       ├── scrape/route.ts     # 스크래핑 트리거
│   │       └── projects/route.ts   # 과제 목록 API
│   ├── components/
│   │   ├── Dashboard.tsx           # 메인 대시보드
│   │   ├── ProjectCard.tsx         # 과제 카드
│   │   ├── CalendarView.tsx        # 달력 뷰
│   │   └── ProjectModal.tsx        # 상세 모달
│   ├── lib/
│   │   ├── supabase.ts             # Supabase 클라이언트
│   │   ├── hooks.ts                # React 커스텀 훅
│   │   ├── utils.ts                # 유틸 함수
│   │   └── scrapers/
│   │       ├── index.ts            # 스크래퍼 통합
│   │       ├── bizinfo.ts          # 기업마당
│   │       ├── ntis.ts             # NTIS
│   │       ├── kstartup.ts         # K-Startup
│   │       └── data-go-kr.ts       # 공공데이터 API
│   └── types/
│       └── index.ts
```

---

## 향후 확장 아이디어

- [ ] 북마크 / 관심 과제 저장
- [ ] 이메일 알림 (새 과제 등록, 마감 임박)
- [ ] IITP 전용 스크래퍼 추가
- [ ] 사용자 인증 (Supabase Auth)
- [ ] 과제 검색 고도화 (분야별, 금액별, 기관별)
- [ ] 다크/라이트 모드 전환
- [ ] PWA 지원 (모바일 앱처럼 사용)
