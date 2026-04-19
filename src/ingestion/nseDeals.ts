import { parseNseDisplayDate } from "@/lib/dates";
import { sha256Hex } from "@/lib/dedupe";

import { fetchJson } from "./http";
import { createNseCookieHeader, nseHeaders } from "./nseClient";
import type { NormalizedEvent } from "./types";

type NseLargeDealRow = {
  date: string;
  symbol: string;
  name?: string;
  clientName?: string;
  buySell: string;
  qty: string;
  watp: string;
  remarks?: string;
};

type NseLargeDealSnapshot = {
  as_on_date: string;
  BULK_DEALS_DATA?: NseLargeDealRow[];
  BLOCK_DEALS_DATA?: NseLargeDealRow[];
};

function sideFromNse(s: string): "BUY" | "SELL" | "NA" {
  const u = s.toUpperCase();
  if (u === "BUY") return "BUY";
  if (u === "SELL") return "SELL";
  return "NA";
}

function normalizeRow(
  row: NseLargeDealRow,
  kind: "BULK" | "BLOCK",
  sourceUrl: string,
): NormalizedEvent {
  const qty = Number(row.qty);
  const price = Number(row.watp);
  const notional = Number.isFinite(qty) && Number.isFinite(price) ? qty * price : 0;
  const occurredOn = parseNseDisplayDate(row.date);
  const party = row.clientName?.trim() || null;
  const dedupeKey = sha256Hex([
    "NSE",
    kind,
    occurredOn,
    row.symbol,
    party ?? "",
    row.buySell,
    row.qty,
    row.watp,
  ]);
  return {
    dedupeKey,
    occurredOn,
    exchange: "NSE",
    type: kind,
    symbol: row.symbol,
    isin: null,
    side: sideFromNse(row.buySell),
    qty: Number.isFinite(qty) ? qty : null,
    price: Number.isFinite(price) ? price : null,
    notionalInr: notional,
    party,
    title: null,
    rawPayload: row,
    sourceRef: sourceUrl,
  };
}

export async function fetchNseLargeDealSnapshot(): Promise<NormalizedEvent[]> {
  const cookie = await createNseCookieHeader();
  const url = "https://www.nseindia.com/api/snapshot-capital-market-largedeal";
  const data = await fetchJson<NseLargeDealSnapshot>(url, {
    headers: nseHeaders(cookie),
    retries: 4,
  });
  const out: NormalizedEvent[] = [];
  const bulk = data.BULK_DEALS_DATA ?? [];
  const block = data.BLOCK_DEALS_DATA ?? [];
  for (const r of bulk) out.push(normalizeRow(r, "BULK", url));
  for (const r of block) out.push(normalizeRow(r, "BLOCK", url));
  return out;
}
