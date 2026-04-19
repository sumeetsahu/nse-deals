import { formatYyyymmdd, sleep } from "@/lib/dates";
import { sha256Hex } from "@/lib/dedupe";

import { fetchJson } from "./http";
import { disclosureKeywordsFromEnv } from "./nseAnnouncements";
import type { NormalizedEvent } from "./types";

type BseAnnRow = {
  NEWSID: string;
  SCRIP_CD: number;
  NEWSSUB: string;
  DT_TM: string;
  SLONGNAME?: string;
  HEADLINE?: string;
  CATEGORYNAME?: string;
  NSURL?: string;
  TotalPageCnt?: number;
};

type BseAnnResponse = {
  Table?: BseAnnRow[];
  Table1?: unknown;
};

function symbolFromBseRow(row: BseAnnRow): string {
  const u = row.NSURL ?? "";
  const m = /\/stock-share-price\/[^/]+\/([^/]+)\/\d+\/?$/.exec(u);
  if (m) return m[1].toUpperCase();
  return `S${row.SCRIP_CD}`;
}

function occurredIso(row: BseAnnRow): string {
  const raw = row.DT_TM || "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return new Date().toISOString().slice(0, 10);
}

function matches(text: string, keywords: string[]): boolean {
  const hay = text.toLowerCase();
  return keywords.some((k) => hay.includes(k.toLowerCase()));
}

export async function fetchBseDisclosures(
  from: Date,
  to: Date,
  opts?: { maxPages?: number },
): Promise<NormalizedEvent[]> {
  const keywords = disclosureKeywordsFromEnv();
  const maxPages = opts?.maxPages ?? Number(process.env.BSE_MAX_PAGES ?? 25);
  const fromS = formatYyyymmdd(from);
  const toS = formatYyyymmdd(to);
  const base =
    "https://api.bseindia.com/BseIndiaAPI/api/AnnGetData/w" +
    `?strCat=-1&strType=C&strScrip=&strSearch=P&strPrevDate=${fromS}&strToDate=${toS}`;

  const headers = {
    Referer: "https://www.bseindia.com/",
    Origin: "https://www.bseindia.com",
    Accept: "application/json, text/plain, */*",
  };

  const out: NormalizedEvent[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= maxPages) {
    const url = `${base}&Pageno=${page}`;
    let data: BseAnnResponse;
    try {
      data = await fetchJson<BseAnnResponse>(url, { headers, retries: 3 });
    } catch {
      break;
    }
    const table = data.Table ?? [];
    if (!table.length) break;
    totalPages = table[0].TotalPageCnt ?? page;
    for (const row of table) {
      const blob = [
        row.NEWSSUB,
        row.HEADLINE,
        row.CATEGORYNAME,
        row.SLONGNAME,
      ]
        .filter(Boolean)
        .join(" | ");
      if (!matches(blob, keywords)) continue;
      const occurredOn = occurredIso(row);
      const title = (row.HEADLINE || row.NEWSSUB || "Disclosure").slice(0, 500);
      const dedupeKey = sha256Hex([
        "BSE",
        "DISCLOSURE",
        row.NEWSID,
        occurredOn,
        String(row.SCRIP_CD),
      ]);
      out.push({
        dedupeKey,
        occurredOn,
        exchange: "BSE",
        type: "DISCLOSURE",
        symbol: symbolFromBseRow(row),
        isin: null,
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
    page += 1;
    await sleep(120);
  }
  return out;
}
