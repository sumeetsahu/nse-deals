import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const securities = sqliteTable(
  "security",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    exchange: text("exchange").notNull(),
    symbol: text("symbol").notNull(),
    isin: text("isin"),
    name: text("name"),
  },
  (t) => [uniqueIndex("security_exchange_symbol").on(t.exchange, t.symbol)],
);

export const dealEvents = sqliteTable(
  "deal_event",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    dedupeKey: text("dedupe_key").notNull(),
    occurredOn: text("occurred_on").notNull(),
    exchange: text("exchange").notNull(),
    type: text("type").notNull(),
    symbol: text("symbol").notNull(),
    isin: text("isin"),
    side: text("side").notNull(),
    qty: real("qty"),
    price: real("price"),
    notionalInr: real("notional_inr").notNull(),
    party: text("party"),
    title: text("title"),
    pctVsPriorClose: real("pct_vs_prior_close"),
    rawPayload: text("raw_payload").notNull(),
    sourceRef: text("source_ref").notNull(),
    ingestedAt: integer("ingested_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    uniqueIndex("deal_event_dedupe").on(t.dedupeKey),
    index("deal_event_occurred").on(t.occurredOn),
    index("deal_event_exchange_type").on(t.exchange, t.type),
    index("deal_event_party").on(t.party),
    index("deal_event_symbol").on(t.symbol),
  ],
);

export const marketContext = sqliteTable(
  "market_context",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    exchange: text("exchange").notNull(),
    symbol: text("symbol").notNull(),
    sessionDate: text("session_date").notNull(),
    priorClose: real("prior_close").notNull(),
  },
  (t) => [
    uniqueIndex("market_ctx_unique").on(
      t.exchange,
      t.symbol,
      t.sessionDate,
    ),
  ],
);
