import * as cheerio from "cheerio";

import { sleep } from "@/lib/dates";
import { sha256Hex } from "@/lib/dedupe";
import { logWarn } from "./log";
import type { NormalizedEvent } from "./types";

const PAGE =
  "https://www.bseindia.com/markets/equity/EQReports/BulknBlockDeals.aspx";

function parseDdMmYyyy(s: string): string {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s.trim());
  if (!m) return new Date().toISOString().slice(0, 10);
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function sideFromBse(s: string): "BUY" | "SELL" | "NA" {
  const u = s.trim().toUpperCase();
  if (u.startsWith("BUY")) return "BUY";
  if (u.startsWith("SEL")) return "SELL";
  return "NA";
}

/** Attempt ASP.NET postback; often blocked from cloud IPs (HTTP 404). */
export async function fetchBseBulkBlockDeals(
  fromDdMmYyyy: string,
  toDdMmYyyy: string,
  dealType: "1" | "2",
): Promise<NormalizedEvent[]> {
  const browserHeaders: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    Referer: PAGE,
    Origin: "https://www.bseindia.com",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
  };

  const getRes = await fetch(PAGE, { headers: browserHeaders });
  const html = await getRes.text();
  if (!getRes.ok) {
    logWarn("BSE bulk GET failed", { status: getRes.status });
    return [];
  }

  const $ = cheerio.load(html);
  const vs = $("#__VIEWSTATE").attr("value") ?? "";
  const vg = $("#__VIEWSTATEGENERATOR").attr("value") ?? "";
  const ev = $("#__EVENTVALIDATION").attr("value") ?? "";
  if (!vs || !ev) {
    logWarn("BSE bulk missing viewstate");
    return [];
  }

  const body = new URLSearchParams({
    __VIEWSTATE: vs,
    __VIEWSTATEGENERATOR: vg,
    __EVENTVALIDATION: ev,
    __EVENTTARGET: "",
    __EVENTARGUMENT: "",
    "ctl00$ContentPlaceHolder1$rblDT": dealType,
    "ctl00$ContentPlaceHolder1$txtDate": fromDdMmYyyy,
    "ctl00$ContentPlaceHolder1$txtToDate": toDdMmYyyy,
    "ctl00$ContentPlaceHolder1$btnSubmit": "Submit",
  });

  await sleep(300 + Math.floor(Math.random() * 200));

  const postRes = await fetch(PAGE, {
    method: "POST",
    headers: {
      ...browserHeaders,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });
  if (!postRes.ok) {
    logWarn("BSE bulk POST not ok", {
      status: postRes.status,
      hint: "Some networks block automated POST to BSE; NSE deals still ingest.",
    });
    return [];
  }
  const html2 = await postRes.text();
  const $2 = cheerio.load(html2);
  const container = $2("#ContentPlaceHolder1_divData1");
  if (!container.length) return [];

  const out: NormalizedEvent[] = [];
  const kind: "BULK" | "BLOCK" = dealType === "1" ? "BULK" : "BLOCK";

  container.find("table").each((_, tbl) => {
    const rows = $2(tbl).find("tr");
    rows.each((i, tr) => {
      if (i === 0) return;
      const cells = $2(tr)
        .find("td")
        .map((_, td) => $2(td).text().trim())
        .get();
      if (cells.length < 6) return;
      const [dateRaw, scrip, client, , bs, qtyRaw, priceRaw] = cells;
      if (!scrip || !client) return;
      const qty = Number(String(qtyRaw).replace(/,/g, ""));
      const price = Number(String(priceRaw).replace(/,/g, ""));
      const notional =
        Number.isFinite(qty) && Number.isFinite(price) ? qty * price : 0;
      const occurredOn = parseDdMmYyyy(dateRaw || fromDdMmYyyy);
      const symbol = scrip.split(" ")[0]?.toUpperCase() || "UNKNOWN";
      const party = client;
      const dedupeKey = sha256Hex([
        "BSE",
        kind,
        occurredOn,
        symbol,
        party,
        bs,
        String(qty),
        String(price),
      ]);
      out.push({
        dedupeKey,
        occurredOn,
        exchange: "BSE",
        type: kind,
        symbol,
        isin: null,
        side: sideFromBse(bs),
        qty: Number.isFinite(qty) ? qty : null,
        price: Number.isFinite(price) ? price : null,
        notionalInr: notional,
        party,
        title: null,
        rawPayload: { cells },
        sourceRef: PAGE,
      });
    });
  });

  return out;
}
