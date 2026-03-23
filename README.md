# CashPotJA — Jamaica's Fastest Cash Pot Results

A fast, mobile-first Cash Pot results website for Jamaica. Updated 6 times daily after every Supreme Ventures draw.

## Features

- **Live results** — Updated after every draw (6x daily)
- **Full history** — 690+ days of verified results from May 2024
- **Number meanings** — Complete Afiyu Kent chart with keywords
- **Statistics** — Hot/cold numbers, frequency analysis, gap tracking
- **Push notifications** — Get alerted when new numbers drop
- **PWA** — Add to home screen, works offline
- **Supabase sync** — Live scrapes are persisted to Supabase and reloaded on startup
- **SEO optimized** — Schema.org structured data, sitemap, meta tags

## Deploy to GitHub Pages

1. Create a new repo on GitHub (e.g., `cashpotja`)
2. Push this code:
   ```bash
   git init
   git add -A
   git commit -m "Initial deploy"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/cashpotja.git
   git push -u origin main
   ```
3. Go to **Settings → Pages → Source: Deploy from branch (main)**
4. Your site will be live at `https://YOUR-USERNAME.github.io/cashpotja/`

## Supabase integration (required for automatic persistence)

Create a table that stores one row per slot per day:

```sql
create table if not exists public.cashpot_results (
  result_date date not null,
  slot_idx smallint not null check (slot_idx between 0 and 5),
  number smallint not null check (number between 1 and 36),
  mega_ball boolean not null default false,
  source text,
  fetched_at timestamptz not null default now(),
  primary key (result_date, slot_idx)
);

alter table public.cashpot_results enable row level security;

create policy "allow anon read cashpot results"
  on public.cashpot_results
  for select
  to anon
  using (true);

create policy "allow anon upsert cashpot results"
  on public.cashpot_results
  for insert
  to anon
  with check (true);

create policy "allow anon update cashpot results"
  on public.cashpot_results
  for update
  to anon
  using (true)
  with check (true);
```

Also keep your `push_subscriptions` table and your push-sender job/edge function so users receive notifications when new slots are inserted.

## How the auto-update flow now works

1. Page loads and immediately renders local history.
2. Site pulls recent rows from Supabase (`cashpot_results`) and overlays them.
3. Polling scrapes live result sources.
4. Any detected slot result is upserted back into Supabase.
5. Returning users see persisted results immediately (including yesterday) even if the source site is temporarily down.


## Accuracy guardrails

- The UI now shows a live sync health badge (expected draws vs posted draws for the current Jamaica time window).
- Yesterday is never silently replaced with older data; if yesterday is missing, the site shows a syncing state instead of stale numbers.
- Supabase remains the source of truth overlay for recent results, while scraping continuously fills gaps.
- The last 48 hours are treated as realtime-only windows (static bundled data is ignored there) to prevent stale Saturday/Sunday fallbacks.

## Tech Stack

- Pure HTML/CSS/JS — no build tools, no framework dependencies
- Service Worker for offline support + notification click handling
- Web Push API for notifications
- Supabase REST API for persistence and push subscriptions

## Disclaimer

CashPotJA is not affiliated with Supreme Ventures Limited. Results are for informational purposes only. Players must be 18+.
