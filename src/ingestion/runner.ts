import { eachUtcDay, formatDdMmYyyySlash, sleep } from "@/lib/dates";
import { getDb } from "@/db/client";
import { dealEvents } from "@/db/schema";

import { fetchBseBulkBlockDeals } from "./bseBulkBlock";
import { fetchBseDisclosures } from "./bseDisclosures";
import {
  disclosureKeywordsFromEnv,
  fetchNseDisclosuresForDay,
} from "./nseAnnouncements";
import { fetchNseLargeDealSnapshot } from "./nseDeals";
import { attachNsePctVsPriorClose } from "./marketEnrichment";
import { logInfo } from "./log";
import type { NormalizedEvent } from "./types";

function lookbackRange(days: number): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date(
    Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()),
  );
  from.setUTCDate(from.getUTCDate() - days);
  return { from, to };
}

export type IngestResult = {
  inserted: number;
  skipped: number;
  totals: { nseDeals: number; nseDisclosure: number; bseDisclosure: number; bseDeals: number };
};

export async function runIngestion(): Promise<IngestResult> {
  const lookback = Number(process.env.INGEST_LOOKBACK_DAYS ?? 7);
  const { from, to } = lookbackRange(lookback);
  const keywords = disclosureKeywordsFromEnv();
  const quoteDelay = Number(process.env.INGEST_QUOTE_DELAY_MS ?? 280);

  const events: NormalizedEvent[] = [];

  logInfo("NSE large deals snapshot");
  const nseSnap = await fetchNseLargeDealSnapshot();
  events.push(...nseSnap);

  logInfo("NSE corporate disclosures", { days: lookback });
  for (const day of eachUtcDay(from, to)) {
    events.push(...(await fetchNseDisclosuresForDay(day, keywords)));
  }

  logInfo("BSE corporate disclosures");
  events.push(...(await fetchBseDisclosures(from, to)));

  logInfo("BSE bulk/block (best-effort)");
  const bseFrom = formatDdMmYyyySlash(from);
  const bseTo = formatDdMmYyyySlash(to);
  const bseBulk = await fetchBseBulkBlockDeals(bseFrom, bseTo, "1");
  await sleep(1500);
  const bseBlock = await fetchBseBulkBlockDeals(bseFrom, bseTo, "2");
  events.push(...bseBulk, ...bseBlock);

  logInfo("NSE quote enrichment");
  const enriched = await attachNsePctVsPriorClose(events, quoteDelay);

  const db = getDb();
  let inserted = 0;
  let skipped = 0;
  const now = new Date();

  const rows = enriched.map((e) => ({
    dedupeKey: e.dedupeKey,
    occurredOn: e.occurredOn,
    exchange: e.exchange,
    type: e.type,
    symbol: e.symbol,
    isin: e.isin,
    side: e.side,
    qty: e.qty,
    price: e.price,
    notionalInr: e.notionalInr,
    party: e.party,
    title: e.title,
    pctVsPriorClose: e.pctVsPriorClose ?? null,
    rawPayload: JSON.stringify(e.rawPayload),
    sourceRef: e.sourceRef,
    ingestedAt: now,
  }));

  for (const chunk of chunkArray(rows, 200)) {
    const res = await db
      .insert(dealEvents)
      .values(chunk)
      .onConflictDoNothing({ target: dealEvents.dedupeKey })
      .returning({ id: dealEvents.id });
    inserted += res.length;
    skipped += chunk.length - res.length;
  }

  const totals = {
    nseDeals: nseSnap.length,
    nseDisclosure: enriched.filter((e) => e.exchange === "NSE" && e.type === "DISCLOSURE").length,
    bseDisclosure: enriched.filter((e) => e.exchange === "BSE" && e.type === "DISCLOSURE").length,
    bseDeals: bseBulk.length + bseBlock.length,
  };

  logInfo("ingest complete", { inserted, skipped, totals });
  return { inserted, skipped, totals };
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
