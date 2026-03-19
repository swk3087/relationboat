# Android ↔ Server Compatibility Checklist

- Package/applicationId: `kr.kro.relationboat.app`
- Base URL: `https://relationboat.kro.kr/api/v1`
- Storage mode values: `LOCAL_ONLY`, `SYNC`
- Daily memo editable window: today + tomorrow only in local UI, but server response remains source of truth.
- Relationship path depth range: `0..8`
- Folder isolation: person records are always tied to a `folderId`.
- Search fields: name, memo, phone number, category.
- Tombstone policy: `updatedAt` + nullable `deletedAt` on folders, people, relationships, and daily memos.
- Conflict policy: initial `last-write-wins`.
- Google sign-in only appears in sync mode.
- Enums that must stay aligned with the server: storage mode, memo color, path depth bounds, and any future relationship category normalization.

## Notes

- The public OpenAPI document under `/server` was not present in this repository snapshot, and the production base URL blocked direct schema fetches during scaffolding, so DTO names and endpoints were aligned to the requested resource semantics and should be verified against the authoritative server contract before shipping.
