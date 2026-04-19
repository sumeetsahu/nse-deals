import { sleep } from "@/lib/dates";

import { fetchJson } from "./http";
import { logWarn } from "./log";
import { createNseCookieHeader, nseHeaders } from "./nseClient";
import type { NormalizedEvent } from "./types";

type NseQuote = {
  priceInfo?: { previousClose?: number };
};

export async function attachNsePctVsPriorClose(
  events: NormalizedEvent[],
  delayMs: number,
): Promise<NormalizedEvent[]> {
  const nseSyms = new Set(
    events
      .filter((e) => e.exchange === "NSE" && e.type !== "DISCLOSURE" && e.price)
      .map((e) => e.symbol),
  );
  if (!nseSyms.size) return events;
  const cookie = await createNseCookieHeader();
  const prevBySymbol = new Map<string, number>();

  for (const sym of nseSyms) {
    try {
      const url = `https://www.nseindia.com/api/quote-equity?symbol=${encodeURIComponent(sym)}`;
      const q = await fetchJson<NseQuote>(url, {
        headers: nseHeaders(cookie),
        retries: 2,
        baseDelayMs: 250,
      });
      const pc = q.priceInfo?.previousClose;
      if (typeof pc === "number" && Number.isFinite(pc) && pc > 0) {
        prevBySymbol.set(sym, pc);
      }
    } catch (e) {
      logWarn("quote-equity failed", { sym, err: String(e) });
    }
    await sleep(delayMs);
  }

  return events.map((e) => {
    if (e.exchange !== "NSE" || e.type === "DISCLOSURE" || !e.price) return e;
    const pc = prevBySymbol.get(e.symbol);
    if (!pc) return e;
    const pct = ((e.price / pc) - 1) * 100;
    return { ...e, pctVsPriorClose: Math.round(pct * 100) / 100 };
  });
}
