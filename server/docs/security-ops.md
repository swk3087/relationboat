# RelationBoat Server Security and Operations Rules

## Folder scope enforcement
- Every folder-owned query must call `assertFolderOwnership(userId, folderId)` before accessing `people` or `relationship_edges`.
- Person and relationship detail handlers must additionally confirm the target row belongs to the same folder with `assertPersonInFolder` or `assertRelationshipInFolder`.
- Pathway search loads **only** nodes and edges that already match the requested `folderId`, preventing cross-folder graph traversal.

## Ownership validation
- Authentication is mandatory for every `/api/v1/**` route other than `/auth/google` and `/auth/refresh`.
- The authenticated `userId` is the root ownership key for folders, daily memos, settings, sync accounts, and exports.
- Export payloads are filtered exclusively by `userId` and embed only folder-scoped records owned by that user.

## Google OAuth 2.0
- Login requires a Google-issued ID token verified against `GOOGLE_CLIENT_ID`.
- The first release standardizes on **JWT access token + JWT refresh token**.
- Redirect URIs are split between development (`GOOGLE_REDIRECT_URI_DEV`) and production (`GOOGLE_REDIRECT_URI_PROD`).

## Export encryption
- Current `GET /export/full` responses are returned as authenticated JSON over HTTPS and are marked `not_applied_server_side` in the payload.
- If encrypted archives are required later, add password-based ZIP/AES export generation before storing or sharing files outside the API.

## Font upload validation
- Only `.ttf` and `.otf` uploads are accepted.
- MIME type and file extension are both validated before storing the file.
- Font uploads are stored under `uploads/fonts` so reverse proxies can serve them from `https://relationboat.kro.kr:4000/uploads/fonts/*`.

## Reverse proxy notes
- Forward `/api/` and `/uploads/` to the Fastify container.
- Terminate TLS at the reverse proxy for `relationboat.kro.kr` and forward port `4000` to the Fastify service.
- Preserve the `Authorization` header for Google-authenticated API requests.
