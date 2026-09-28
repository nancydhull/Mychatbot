# Dhull Cosmetic Shop

An AI beauty concierge for Dhull Cosmetic Shop, with streaming replies in English, Hindi, and Hinglish.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the shared API server
- `pnpm --filter @workspace/dhull-cosmetic-shop run dev` — run the Dhull Cosmetic Shop web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `GROQ_API_KEY` — server-side Groq credential for `/api/chat`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/dhull-cosmetic-shop/src/App.tsx` — chat UI, streaming client, session memory
- `artifacts/dhull-cosmetic-shop/src/config/shop-data.js` — editable shop identity and WhatsApp settings
- `artifacts/dhull-cosmetic-shop/api/chat.ts` — Vercel-compatible serverless chat function
- `artifacts/api-server/src/lib/chat.ts` — Replit preview API implementation

## Architecture decisions

- Groq is called only from server-side handlers; the browser receives streamed text over `/api/chat`.
- The client sends the latest 10 non-empty messages for each request and keeps the visible conversation in `sessionStorage`.
- `shop-data.js` is the easy-to-edit source for user-facing shop details; the local preview API mirrors the same values for its system prompt.

## Product

- Rose-gold beauty brand landing state with floating chat entry
- Responsive full chat window with quick replies, typing state, retry handling, WhatsApp CTA, and bilingual prompt
- Streaming AI replies via Groq model `llama-3.3-70b-versatile`
- In-memory per-IP rate limiting for the API route

## User preferences

- Shop details are placeholders and should be edited in `shop-data.js`.

## Gotchas

- The Vercel deployment root should be `artifacts/dhull-cosmetic-shop` so Vercel sees both `api/chat.ts` and the Vite package.
- The WhatsApp number is a placeholder in `shop-data.js` and should be replaced before publishing.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
