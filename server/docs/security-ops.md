# RelationBoat Server Security and Operations Rules

## Folder scope enforcement
- Every folder-owned query must call `assertFolderOwnership(userId, folderId)` before accessing `people` or `relationship_edges`.
- Person and relationship detail handlers must additionally confirm the target row belongs to the same folder with `assertPersonInFolder` or `assertRelationshipInFolder`.
- Pathway search loads **only** nodes and edges that already match the requested `folderId`, preventing cross-folder graph traversal.

## Ownership validation
- Every `/api/v1/**` route is handled as the same configured single user.
- The resolved `userId` is the root ownership key for folders, daily memos, settings, sync accounts, and exports.
- Export payloads are filtered exclusively by `userId` and embed only folder-scoped records owned by that user.

## Single-user account bootstrap
- The backend automatically creates or reuses one owner account from `SINGLE_USER_EMAIL`.
- `SINGLE_USER_NAME` is used as the display name for that owner account.
- A `settings` row is also ensured for the same user so app settings always resolve.

## Export encryption
- Current `GET /export/full` responses are returned as JSON over HTTPS and are marked `not_applied_server_side` in the payload.
- If encrypted archives are required later, add password-based ZIP/AES export generation before storing or sharing files outside the API.

## Font upload validation
- Only `.ttf` and `.otf` uploads are accepted.
- MIME type and file extension are both validated before storing the file.
- Font uploads are stored under `uploads/fonts` so reverse proxies can serve them from `https://relationboat.kro.kr/uploads/fonts/*`.

## Reverse proxy notes
- Forward `/api/` and `/uploads/` to the Fastify container.
- Terminate TLS at the reverse proxy for `relationboat.kro.kr` and expose the public backend as `https://relationboat.kro.kr` even if the Fastify container listens on port `4000` internally.
- Allow CORS from the public client origin `https://app.relationboat.kro.kr`.
