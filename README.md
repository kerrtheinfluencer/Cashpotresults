# CashPotJA — Jamaica's Fastest Cash Pot Results

A fast, mobile-first Cash Pot results website for Jamaica. Updated 6 times daily after every Supreme Ventures draw.

## Features

- **Live results** — Updated after every draw (6x daily)
- **Full history** — 690+ days of verified results from May 2024
- **Number meanings** — Complete Afiyu Kent chart with keywords
- **Statistics** — Hot/cold numbers, frequency analysis, gap tracking
- **Push notifications** — Get alerted when new numbers drop
- **PWA** — Add to home screen, works offline
- **SEO optimized** — Schema.org structured data, sitemap, meta tags
- **Auto-update** — GitHub Actions scrapes Supreme Ventures every 30 mins during draw hours

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

## Custom Domain

To use a custom domain like `cashpotja.com`:
1. Add a `CNAME` file with your domain
2. Configure DNS: CNAME record pointing to `YOUR-USERNAME.github.io`
3. Enable HTTPS in GitHub Pages settings

## Updating Results

### Manual
Edit `js/data.js` and add new entries to the `ALL_DATA` array:
```javascript
{ date:"2026-03-22", draws:[EB, MOR, MID, MA, DT, EVE] },
```

### Automatic
The GitHub Actions workflow (`.github/workflows/fetch-results.yml`) runs every 30 minutes during draw hours and attempts to scrape the latest results from Supreme Ventures. You may need to customize the scraping logic based on the current structure of their website.

## Tech Stack

- Pure HTML/CSS/JS — no build tools, no framework dependencies
- Service Worker for offline support
- Web Push API for notifications
- GitHub Actions for auto-updates

## Disclaimer

CashPotJA is not affiliated with Supreme Ventures Limited. Results are for informational purposes only. Players must be 18+.
