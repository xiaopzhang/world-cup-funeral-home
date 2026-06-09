# World Cup Funeral Home

An English-only satirical football memorial app for creating and sharing tombstones for eliminated World Cup teams.

## Production Stack

- Next.js App Router, TypeScript, Tailwind CSS
- Supabase Postgres for teams, tombstones, tributes, interactions, reports, sync logs, and audit events
- Vercel Analytics and Vercel Cron
- football-data.org v4 as the low-cost primary World Cup match provider
- DeepSeek chat completions for original, automatically refreshed football meme copy

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
FOOTBALL_DATA_API_TOKEN=
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=
MEME_REFRESH_MODEL=
MEME_REFRESH_MAX_ITEMS_PER_TEAM=
MEME_REFRESH_HOT_TEAM_LIMIT=
ADMIN_PASSWORD=
CRON_SECRET=
```

Run `supabase/schema.sql` and `supabase/seed.sql` before enabling production traffic. Without Supabase env vars, the app falls back to local demo data so development preview still works.

## World Cup Sync

Vercel Cron calls `/api/cron/sync-world-cup` daily by default because the current Vercel Hobby plan only allows daily cron jobs. During the World Cup, upgrade to Vercel Pro and change `vercel.json` to `*/30 * * * *`, or use an external scheduler to call the same endpoint every 30 minutes. When `CRON_SECRET` is configured in Vercel, Cron sends `Authorization: Bearer <CRON_SECRET>`. Manual sync is also possible with:

```bash
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://world-cup-funeral-home.tickletickle.space/api/cron/sync-world-cup
```

The sync pipeline stores provider match summaries, records sync runs, applies deterministic elimination rules, and writes rollbackable team status events. If provider data is incomplete, the sync run records an error instead of publishing a guessed status.

## Meme Content Sync

Vercel Cron also calls `/api/cron/sync-meme-content` daily. This route uses DeepSeek to generate original English causes of death and epitaphs for high-priority teams first, then validates every line locally before publishing it to `cause_library` or `epitaph_library`.

Required:

```bash
DEEPSEEK_API_KEY=
CRON_SECRET=
```

Optional:

```bash
DEEPSEEK_BASE_URL=https://api.deepseek.com
MEME_REFRESH_MODEL=deepseek-chat
MEME_REFRESH_MAX_ITEMS_PER_TEAM=3
MEME_REFRESH_HOT_TEAM_LIMIT=8
```

Manual sync for one team:

```bash
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  "https://world-cup-funeral-home.tickletickle.space/api/cron/sync-meme-content?team=brazil"
```

Generated content is rejected before publishing if it contains links, handles, slurs, real-person attacks, unsafe political references, overlong text, off-topic copy, or near-duplicates. Admins can disable active content from `/admin` without deleting audit history.

## Admin

Visit `/admin` and enter `ADMIN_PASSWORD` to inspect team status, sync runs, reports, status events, and active content. Admin API endpoints require the same password in `x-admin-password`.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
