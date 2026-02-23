# MyStation — Project Intelligence

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **UI:** React 19 + Tailwind CSS 4
- **Backend:** Supabase (Auth, Postgres, Storage)
- **State:** Zustand
- **Payments:** Stripe
- **Merch:** Printify + Printful
- **Deploy:** Vercel (Hobby plan — 1 concurrent build)
- **Domain:** mystationlive.com

## Database Skills
When working with Supabase/Postgres, follow the best practices in:
`.claude/skills/supabase-postgres.md`

Key rules:
- All RLS policies MUST use `(select auth.uid())` not bare `auth.uid()`
- Always index foreign key columns
- Use cursor pagination, never OFFSET on large tables
- Eliminate N+1 queries — batch with JOINs or ANY()

## Deploy Rules
- ALWAYS use `vercel --prod` (full remote build) — NEVER prebuilt
- ONE build at a time (Hobby plan limit)
- Check `vercel ls` for in-flight builds before deploying
- Verify ALL key pages return 200 after deploy

## File Naming
- macOS screenshots have Unicode no-break space (U+202F) before AM/PM
- NEVER use quoted paths for screenshot files
- ALWAYS use: `cp "$(find /path -name '*partial*' -type f)" /dest`
