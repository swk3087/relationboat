# RelationBoat Server

Fastify + TypeScript + Prisma + PostgreSQL backend scaffold for `relationboat.kro.kr`.

## Highlights
- API prefix fixed at `/api/v1`.
- Default runtime port is `4000` for both local and domain binding.
- Single-user backend: every API request is mapped to one configured owner account.
- Folder-scoped people, relationships, path search, daily memo, settings, font upload, and full export APIs.
- VCF/vCard import API: `POST /api/v1/folders/{folderId}/contacts/import`.
- OpenAPI contract maintained in `openapi.yaml` for Android DTO generation.

## Search/index strategy
- Prisma schema adds B-tree indexes for `folders.userId`, `people(folderId, name)`, `people(folderId, phone)`, `relationship_edges(folderId, fromPersonId)`, `relationship_edges(folderId, toPersonId)`, and relationship category lookup.
- For production PostgreSQL search quality, enable `pg_trgm` and add trigram GIN indexes for `people.memo`, `relationship_edges.title`, and `relationship_edges.memo` in a follow-up migration.

## Run locally
```bash
cd server
cp .env.example .env
npm install
npx prisma generate
npm run dev
```

## Single-user mode

- `SINGLE_USER_EMAIL` 기준으로 단일 사용자 레코드를 자동 생성/재사용합니다.
- `SINGLE_USER_NAME`은 표시용 이름입니다.
- 별도 Google OAuth, JWT 로그인, refresh token 발급 없이 모든 API가 같은 사용자 데이터에 접근합니다.
