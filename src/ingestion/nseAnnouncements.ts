import { formatDdMmYyyy, parseNseDisplayDate } from "@/lib/dates";
import { sha256Hex } from "@/lib/dedupe";

import { fetchJson } from "./http";
import { createNseCookieHeader, nseHeaders } from "./nseClient";
import type { NormalizedEvent } from "./types";

type NseCorpRow = {
  symbol: string;
  desc?: string;
  sm_name?: string;
  sm_isin?: string;
  an_dt?: string;
  sort_date?: string;
  attchmntText?: string;
  seq_id?: string;
};

function parseOccurredOn(row: NseCorpRow): string {
  const raw = row.sort_date || row.an_dt || "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw.trim());
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const m2 = /^(\d{1,2}-[A-Za-z]{3}-\d{4})/.exec(raw.trim());
  if (m2) return parseNseDisplayDate(m2[1]);
  return new Date().toISOString().slice(0, 10);
}

export function disclosureKeywordsFromEnv(): string[] {
  const raw =
    process.env.DISCLOSURE_KEYWORDS ??
    "PIT,Prohibition of Insider Trading,insider trading,SEBI (PIT),SAST,substantial acquisition,Acquisition of shares,Disclosure under Regulation 7,Regulation 30";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function matchesDisclosure(text: string, keywords: string[]): boolean {
  const hay = text.toLowerCase();
  return keywords.some((k) => hay.includes(k.toLowerCase()));
}

export async function fetchNseDisclosuresForDay(
  day: Date,
  keywords: string[],
): Promise<NormalizedEvent[]> {
  const cookie = await createNseCookieHeader();
  const from = formatDdMmYyyy(day);
  const url = `https://www.nseindia.com/api/corporate-announcements?index=equities&from_date=${encodeURIComponent(from)}&to_date=${encodeURIComponent(from)}`;
  const raw = await fetchJson<unknown>(url, {
    headers: nseHeaders(cookie),
    retries: 3,
  });
  const rows: NseCorpRow[] = Array.isArray(raw)
    ? (raw as NseCorpRow[])
    : (((raw as { data?: NseCorpRow[] }).data ?? []) as NseCorpRow[]);
  const out: NormalizedEvent[] = [];
  for (const row of rows) {
    const blob = [
      row.desc,
      row.attchmntText,
      row.sm_name,
      row.symbol,
    ]
      .filter(Boolean)
      .join(" | ");
    if (!matchesDisclosure(blob, keywords)) continue;
    const occurredOn = parseOccurredOn(row);
    const title =
      (row.attchmntText || row.desc || row.sm_name || "Disclosure").slice(
        0,
        500,
      );
    const dedupeKey = sha256Hex([
      "NSE",
      "DISCLOSURE",
      row.seq_id ?? "",
      occurredOn,
      row.symbol,
      title,
    ]);
    out.push({
      dedupeKey,
      occurredOn,
      exchange: "NSE",
      type: "DISCLOSURE",
      symbol: row.symbol,
      isin: row.sm_isin ?? null,
      side: "NA",
      qty: null,
      price: null,
      notionalInr: 0,
      party: null,
      title,
      rawPayload: row,
      sourceRef: url,
    });
  }
  return out;
}
