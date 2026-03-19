# RelationBoat Server

Fastify + TypeScript + Prisma + PostgreSQL backend scaffold for `relationboat.kro.kr`.

## Highlights
- API prefix fixed at `/api/v1`.
- Google OAuth 2.0 sign-in (`POST /api/v1/auth/google`) with JWT access/refresh token pair.
- Folder-scoped people, relationships, path search, daily memo, settings, font upload, and full export APIs.
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
