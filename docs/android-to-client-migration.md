# Android -> Client Migration Map

## Summary

Android 앱에서 사용하던 핵심 기능을 `/client` 웹(Node.js) 구조로 이전했습니다.

## Feature Mapping

- `RelationshipScreen` -> `/people`, `/relationships`
- `DailyMemoScreen` -> `/memos`
- `SettingsScreen` -> `/settings`
- Google 로그인 -> `/login` (Firebase Web SDK + backend `/auth/google`)
- 연락처 파일 가져오기(추가 요구) -> `/contacts` + backend `POST /folders/:folderId/contacts/import`

## Storage Policy

- Android의 Room/DataStore 기반 로컬 저장을 사용하지 않음
- 클라이언트는 세션 쿠키 외 데이터 영속 저장소를 사용하지 않음
- 모든 업무 데이터는 backend API를 통해 서버 DB에만 저장

## Runtime Ports

- Server API: `4000`
- Client app: `5000`
