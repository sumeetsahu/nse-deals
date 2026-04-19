import { and, desc, eq, gte, isNotNull, like, lte, sql, sum } from "drizzle-orm";

import { getDb } from "./client";
import { dealEvents } from "./schema";

export type DealFilters = {
  from?: string;
  to?: string;
  exchange?: "NSE" | "BSE";
  type?: "BULK" | "BLOCK" | "DISCLOSURE";
  symbol?: string;
  party?: string;
  minNotional?: number;
  limit?: number;
  offset?: number;
};

export async function queryDeals(f: DealFilters) {
  const db = getDb();
  const conds = [];
  if (f.from) conds.push(gte(dealEvents.occurredOn, f.from));
  if (f.to) conds.push(lte(dealEvents.occurredOn, f.to));
  if (f.exchange) {
    conds.push(eq(dealEvents.exchange, f.exchange));
  }
  if (f.type) {
    conds.push(eq(dealEvents.type, f.type));
  }
  if (f.symbol?.trim()) {
    conds.push(like(dealEvents.symbol, `%${f.symbol.trim()}%`));
  }
  if (f.party?.trim()) {
    conds.push(like(dealEvents.party, `%${f.party.trim()}%`));
  }
  if (typeof f.minNotional === "number" && Number.isFinite(f.minNotional)) {
    conds.push(gte(dealEvents.notionalInr, f.minNotional));
  }
  const where = conds.length ? and(...conds) : undefined;
  const limit = Math.min(Math.max(f.limit ?? 200, 1), 2000);
  const offset = Math.max(f.offset ?? 0, 0);

  const rows = await db
    .select()
    .from(dealEvents)
    .where(where)
    .orderBy(desc(dealEvents.occurredOn), desc(dealEvents.notionalInr))
    .limit(limit)
    .offset(offset);

  const [{ c }] = await db
    .select({ c: sql<number>`count(*)` })
    .from(dealEvents)
    .where(where);

  return { rows, total: Number(c) };
}

export async function summary(from: string, to: string) {
  const db = getDb();
  const base = and(gte(dealEvents.occurredOn, from), lte(dealEvents.occurredOn, to));

  const byType = await db
    .select({
      type: dealEvents.type,
      count: sql<number>`count(*)`,
      notional: sql<number>`coalesce(${sum(dealEvents.notionalInr)},0)`,
    })
    .from(dealEvents)
    .where(base)
    .groupBy(dealEvents.type);

  const topSymbols = await db
    .select({
      symbol: dealEvents.symbol,
      notional: sql<number>`coalesce(${sum(dealEvents.notionalInr)},0)`,
    })
    .from(dealEvents)
    .where(base)
    .groupBy(dealEvents.symbol)
    .orderBy(desc(sum(dealEvents.notionalInr)))
    .limit(5);

  const topParties = await db
    .select({
      party: dealEvents.party,
      notional: sql<number>`coalesce(${sum(dealEvents.notionalInr)},0)`,
    })
    .from(dealEvents)
    .where(and(base, isNotNull(dealEvents.party)))
    .groupBy(dealEvents.party)
    .orderBy(desc(sum(dealEvents.notionalInr)))
    .limit(5);

  return { byType, topSymbols, topParties };
}

export async function partyProfile(party: string, from: string, to: string) {
  const db = getDb();
  const base = and(
    gte(dealEvents.occurredOn, from),
    lte(dealEvents.occurredOn, to),
    eq(dealEvents.party, party),
  );

  const totals = await db
    .select({
      buys: sql<number>`coalesce(sum(case when ${dealEvents.side}='BUY' then ${dealEvents.notionalInr} else 0 end),0)`,
      sells: sql<number>`coalesce(sum(case when ${dealEvents.side}='SELL' then ${dealEvents.notionalInr} else 0 end),0)`,
      rows: sql<number>`count(*)`,
    })
    .from(dealEvents)
    .where(base);

  const bySymbol = await db
    .select({
      symbol: dealEvents.symbol,
      notional: sql<number>`coalesce(${sum(dealEvents.notionalInr)},0)`,
    })
    .from(dealEvents)
    .where(base)
    .groupBy(dealEvents.symbol)
    .orderBy(desc(sum(dealEvents.notionalInr)))
    .limit(50);

  const recent = await db
    .select()
    .from(dealEvents)
    .where(base)
    .orderBy(desc(dealEvents.occurredOn))
    .limit(30);

  return { totals: totals[0], bySymbol, recent };
}
