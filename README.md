# 디스키온 Love

매일 대화하고 싶은 나만의 AI 컴패니언 채팅 앱입니다. 캐릭터(페르소나)를 고르고, 대화를 나누며 호감도를 쌓아가는 형태의 웹앱입니다.

## 주요 기능

- **캐릭터 선택**: 성격이 다른 4명의 AI 컴패니언(하은, 소이, 리안, 다인) 중 선택
- **실시간 채팅**: Claude API를 활용한 페르소나 기반 대화
- **호감도 시스템**: 대화를 나눌수록 호감도가 올라가고, 단계(처음 만남 → 친해지는 중 → 썸타는 사이 → 연인 → 찐사랑)에 따라 대화 분위기가 달라짐
- **대화 저장**: 브라우저 로컬스토리지에 캐릭터별 대화 기록과 호감도가 저장되어 새로고침해도 유지됨
- **AI 프로필 사진**: Replicate(FLUX)를 이용해 캐릭터별 프로필 사진을 생성하고 로컬스토리지에 캐싱
- **영상통화 화면**: 캐릭터 사진이 전체 화면을 채우는 페이스타임 스타일 화면 + 내 카메라 PIP + 실시간 자막(채팅)
- **카카오 로그인**: 카카오 계정으로 로그인해야 서비스 이용 가능 (Auth.js + Kakao Provider)
- **데모 모드**: `ANTHROPIC_API_KEY`가 없어도 데모 응답으로 UI/흐름을 바로 확인 가능

## 기술 스택

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4
- Auth.js (`next-auth@5`) + Kakao Provider — 로그인
- Anthropic SDK (`@anthropic-ai/sdk`) — 채팅
- Replicate API (FLUX Schnell) — 캐릭터 프로필 사진 생성

## 시작하기

```bash
npm install
cp .env.example .env.local
# .env.local 에 ANTHROPIC_API_KEY, REPLICATE_API_TOKEN, AUTH_SECRET, KAKAO_CLIENT_ID/SECRET 입력
npm run dev
```

### 카카오 로그인 설정

1. https://developers.kakao.com/console/app 에서 앱 생성
2. "카카오 로그인" 활성화 (제품 설정)
3. Redirect URI 등록: `http://localhost:3000/api/auth/callback/kakao` (개발), `https://<배포도메인>/api/auth/callback/kakao` (배포)
4. 앱 요약 정보의 REST API 키 → `KAKAO_CLIENT_ID`, 카카오 로그인 > 보안 탭의 Client Secret → `KAKAO_CLIENT_SECRET`
5. `AUTH_SECRET`은 `npx auth secret` 또는 `openssl rand -base64 32`로 생성

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속.

## 프로젝트 구조

```
dskion-love/
├── auth.ts                          # Auth.js 설정 (Kakao Provider)
├── app/
│   ├── page.tsx                    # 로그인 게이트 → 캐릭터 선택 / 채팅 화면 전환
│   ├── layout.tsx
│   └── api/
│       ├── auth/[...nextauth]/route.ts # Auth.js 핸들러
│       ├── chat/route.ts           # Claude API 연동 채팅 엔드포인트
│       └── generate-avatar/route.ts # Replicate 연동 프로필 사진 생성 엔드포인트
├── components/
│   ├── LoginScreen.tsx    # 카카오 로그인 화면
│   ├── AppShell.tsx       # 로그인 이후 캐릭터 선택 ↔ 채팅 라우팅
│   ├── PersonaSelect.tsx  # 캐릭터 선택 화면
│   ├── PersonaCard.tsx    # 캐릭터 카드 (사진 생성 버튼 포함)
│   ├── ChatScreen.tsx     # 채팅 화면
│   ├── VideoCallScreen.tsx # 영상통화 스타일 화면
│   ├── MessageBubble.tsx
│   ├── AvatarImage.tsx    # 프로필 사진/이모지 폴백 렌더링
│   └── AffectionBar.tsx   # 호감도 게이지
├── lib/
│   ├── actions.ts         # 로그인/로그아웃 서버 액션
│   ├── personas.ts        # 캐릭터 정의, 시스템 프롬프트, 아바타 이미지 프롬프트
│   ├── storage.ts         # 로컬스토리지 저장/로드 (대화, 아바타)
│   ├── useAvatar.ts        # 아바타 생성/로드 훅
│   └── types.ts
└── .env.example
```

## 안전 가이드라인

- 이 앱의 시스템 프롬프트는 선정적/노골적인 성적 표현, 미성년자 관련 콘텐츠, 폭력적/불법적 내용을 생성하지 않도록 명시적으로 제한되어 있습니다.
- 프로필 사진 생성 프롬프트에도 tasteful/sfw/fully clothed 등 안전 문구와 negative prompt(nsfw, 노출, 미성년자 등 금지)를 항상 포함합니다.
- 모든 캐릭터와 사진은 AI가 생성한 가상의 인물이며 실존 인물이 아닙니다.
