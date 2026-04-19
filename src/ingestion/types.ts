export type DealType = "BULK" | "BLOCK" | "DISCLOSURE";
export type Exchange = "NSE" | "BSE";
export type Side = "BUY" | "SELL" | "NA";

export type NormalizedEvent = {
  dedupeKey: string;
  occurredOn: string;
  exchange: Exchange;
  type: DealType;
  symbol: string;
  isin: string | null;
  side: Side;
  qty: number | null;
  price: number | null;
  notionalInr: number;
  party: string | null;
  title: string | null;
  pctVsPriorClose?: number;
  rawPayload: unknown;
  sourceRef: string;
};
