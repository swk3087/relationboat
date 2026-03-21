# RelationBoat Client (Web Node.js)

`/android` 기능을 웹으로 이전하기 위해 만든 `/client` Node.js 서버형 클라이언트입니다.

## 핵심 조건 반영

- 클라이언트 서버 포트: `5000`
- 권장 앱 도메인: `app.relationboat.kro.kr`
- 백엔드 API 기본 주소: `https://relationboat.kro.kr/api/v1` (Caddy/TLS 운영 기준)
- 로컬 저장소 비사용: `localStorage`, `IndexedDB` 저장 없음
- 인증 세션: 서버 메모리 + HttpOnly 쿠키

## 화면 구성 (Native 앱처럼 분리)

- `/login` : Firebase Google 로그인
- `/folders` : 폴더 생성/목록
- `/people` : 사람 생성/검색
- `/relationships` : 관계 생성/검색/경로 조회
- `/memos` : 날짜별 메모
- `/settings` : 서버 설정(sync 고정)
- `/contacts` : VCF 업로드

## 실행

```bash
cd client
npm install
npm run dev
```

- `.env` 없이 실행하면 `localhost:5000`으로 접속한 요청은 `http://localhost:4000/api/v1` 백엔드로 프록시합니다.
- Caddy 뒤에서 `https://app.relationboat.kro.kr`로 들어온 요청은 `https://relationboat.kro.kr/api/v1`를 자동으로 사용합니다.
- 운영에서 주소를 강제로 고정하려면 그때만 `APP_DOMAIN`, `BACKEND_BASE_URL`을 설정하면 됩니다.

## Firebase + Google 로그인 연결 방법

1. Firebase 프로젝트 생성
- [Firebase Console](https://console.firebase.google.com/)에서 프로젝트 생성

2. 웹 앱 등록
- Firebase 프로젝트에 Web App 등록 후 설정값 확인
- `client/.env`에 아래 값 입력
  - `FIREBASE_API_KEY`
  - `FIREBASE_AUTH_DOMAIN`
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_STORAGE_BUCKET`
  - `FIREBASE_MESSAGING_SENDER_ID`
  - `FIREBASE_APP_ID`

3. Firebase Authentication 설정
- Authentication > Sign-in method > Google 활성화
- Authorized domains에 아래 도메인 추가
  - `app.relationboat.kro.kr`
  - `localhost`

4. 백엔드 Google 검증 설정 (`/server`)
- `server/.env`에 동일 프로젝트의 Google OAuth Client ID 설정
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
- 백엔드는 `/api/v1/auth/google`에서 Firebase Google 팝업 결과에 포함된 Google ID token을 검증

5. 포트/도메인 확인
- 운영 클라이언트: `https://app.relationboat.kro.kr`
- 운영 백엔드: `https://relationboat.kro.kr`
- 로컬 개발 시에만 내부 포트(`5000`, `4000`)를 직접 사용

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
- `COOKIE_SECURE=false` (운영에서는 `true` 권장)
