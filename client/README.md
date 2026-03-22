# RelationBoat Client (Web Node.js)

`/android` 기능을 웹으로 이전하기 위해 만든 `/client` Node.js 서버형 클라이언트입니다.

## 핵심 조건 반영

- 클라이언트 서버 포트: `5000`
- 권장 앱 도메인: `app.relationboat.kro.kr`
- 백엔드 API 기본 주소: `https://relationboat.kro.kr/api/v1` (Caddy/TLS 운영 기준)
- 로컬 저장소 비사용: `localStorage`, `IndexedDB` 저장 없음
- 인증 세션: 서버 메모리 + HttpOnly 쿠키
- 접근 제어: 단일 사용자 비밀번호 (`APP_PASSWORD`)

## 화면 구성 (Native 앱처럼 분리)

- `/login` : `.env` 비밀번호 입력
- `/folders` : 폴더 생성/목록
- `/people` : 사람 생성/검색
- `/relationships` : 관계 생성/검색/경로 조회
- `/memos` : 날짜별 메모
- `/settings` : 서버 설정(sync 고정)
- `/contacts` : VCF 업로드

## 실행

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

- `.env` 없이 실행하면 시작 시 `APP_PASSWORD` 누락 오류가 발생합니다.
- `localhost:5000`으로 접속한 요청은 `http://localhost:4000/api/v1` 백엔드로 프록시합니다.
- Caddy 뒤에서 `https://app.relationboat.kro.kr`로 들어온 요청은 `https://relationboat.kro.kr/api/v1`를 자동으로 사용합니다.
- 운영에서 주소를 강제로 고정하려면 그때만 `APP_DOMAIN`, `BACKEND_BASE_URL`을 설정하면 됩니다.

## 비밀번호 로그인

1. `client/.env`에 `APP_PASSWORD`를 설정합니다.
2. 클라이언트 서버를 재시작합니다.
3. `/login` 화면에서 같은 비밀번호를 입력하면 앱에 들어갑니다.
4. 인증 상태는 서버 메모리 세션 + HttpOnly 쿠키로만 유지됩니다.

## VCF 업로드

- 화면: `/contacts`
- API: `POST /api/folders/:folderId/contacts/import`
- `.vcf/.vcard` 지원
- 이름 인코딩(quoted-printable, euc-kr, utf-8) 자동 디코딩
- 전화번호와 함께 사람 데이터로 추가

## 환경 변수

`client/.env.example` 참고:

- `PORT=5000`
- `APP_DOMAIN=app.relationboat.kro.kr` (로컬 기본값은 `localhost:5000`)
- `BACKEND_BASE_URL=https://relationboat.kro.kr/api/v1` (로컬 요청은 미설정 시 `http://localhost:4000/api/v1` 자동 선택)
- `APP_PASSWORD=change-me`
- `COOKIE_SECURE=false` (운영에서는 `true` 권장)
