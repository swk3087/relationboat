# RelationBoat NW (Single Server)

`/nw`는 프론트 화면 + API + 비밀번호 세션을 한 프로세스로 합친 단일 서버 구성입니다.

## 핵심 구성

- 내부 앱 포트: `5000`
- 외부 접속: `443` HTTPS (Caddy reverse proxy)
- 도메인: `app.relationboat.kro.kr` (요청하신 `app.rela...` 실도메인으로 교체 가능)
- API prefix: `/api/v1`
- 웹 인증: `/api/auth/*` 비밀번호 + HttpOnly 쿠키 세션

## 빠른 실행

```bash
cd nw
nvm use 22 # 또는 Node 22+
cp .env.example .env
npm install
npx prisma generate
npm run dev
```

운영 실행:

```bash
cd nw
npm install
npm run build
npm run start
```

## HTTPS (443 -> 5000)

`/nw/Caddyfile` 기준:

1. DNS `A/AAAA`를 `app.relationboat.kro.kr` -> 서버 IP로 설정
2. Caddy에 파일 배치 후 reload
3. Node 앱은 `127.0.0.1:5000`에서 실행
4. 외부는 `https://app.relationboat.kro.kr`로 접속

systemd 예시는 `relationboat-nw.service.example` 참고.

## 체크 포인트

- `/health` 응답 확인
- 로그인: `APP_PASSWORD` 값으로 `/login`
- 주요 화면: `/folders`, `/people`, `/relationships`, `/memos`, `/settings`, `/contacts`
- 업로드: `/uploads/*` 정적 제공
