import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";
import cheerio from "cheerio";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const URL = "https://cashpotresults.info/";

const SLOT_NAMES = [
  "EARLY-BIRD",
  "MORNING",
  "MIDDAY",
  "MID AFTERNOON",
  "DRIVE TIME",
  "EVENING"
];

function getDate(offset = 0) {
  const d = new Date(Date.now() + offset * 86400000);
  return d.toISOString().split("T")[0];
}

async function scrape(offset = 0) {
  const res = await fetch(URL);
  const html = await res.text();
  const text = html.toUpperCase();

  const date = getDate(offset);

  for (let i = 0; i < SLOT_NAMES.length; i++) {
    const slotName = SLOT_NAMES[i];
    const idx = text.indexOf(slotName);

    if (idx === -1) continue;

    const snippet = text.substring(idx, idx + 200);
    const match = snippet.match(/\b([1-9]|[12][0-9]|3[0-6])\b/);

    if (!match) continue;

    const number = parseInt(match[1]);

    await supabase.from("cashpot_results").upsert(
      { draw_date: date, slot: i, number },
      { onConflict: "draw_date,slot" }
    );
  }
}

async function run() {
  await scrape(0);   // today
  await scrape(-1);  // yesterday
}

run();
