# World Cup Funeral Home

An English-only satirical football memorial app for creating and sharing tombstones for eliminated World Cup teams.

## Production Stack

- Next.js App Router, TypeScript, Tailwind CSS
- Supabase Postgres for teams, tombstones, tributes, interactions, reports, sync logs, and audit events
- Vercel Analytics and Vercel Cron
- football-data.org v4 as the low-cost primary World Cup match provider

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
FOOTBALL_DATA_API_TOKEN=
ADMIN_PASSWORD=
CRON_SECRET=
```

Run `supabase/schema.sql` and `supabase/seed.sql` before enabling production traffic. Without Supabase env vars, the app falls back to local demo data so development preview still works.

## World Cup Sync

Vercel Cron calls `/api/cron/sync-world-cup` every 30 minutes. When `CRON_SECRET` is configured in Vercel, Cron sends `Authorization: Bearer <CRON_SECRET>`. Manual sync is also possible with:

```bash
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://world-cup-funeral-home.tickletickle.space/api/cron/sync-world-cup
```

The sync pipeline stores provider match summaries, records sync runs, applies deterministic elimination rules, and writes rollbackable team status events. If provider data is incomplete, the sync run records an error instead of publishing a guessed status.

## Admin

Visit `/admin` and enter `ADMIN_PASSWORD` to inspect team status, sync runs, reports, and status events. Admin API endpoints require the same password in `x-admin-password`.

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
