import { queryDeals, type DealFilters } from "@/db/queries";

export const runtime = "nodejs";

function pick(
  url: URL,
  key: string,
): string | number | undefined {
  const v = url.searchParams.get(key);
  return v === null || v === "" ? undefined : v;
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const minRaw = u.searchParams.get("minNotional");
  const minNotional =
    minRaw !== null && minRaw !== "" ? Number(minRaw) : undefined;
  const limitRaw = u.searchParams.get("limit");
  const offsetRaw = u.searchParams.get("offset");
  const ex = u.searchParams.get("exchange");
  const tp = u.searchParams.get("type");
  const f: DealFilters = {
    from: pick(u, "from") as string | undefined,
    to: pick(u, "to") as string | undefined,
    exchange:
      ex === "NSE" || ex === "BSE" ? (ex as DealFilters["exchange"]) : undefined,
    type:
      tp === "BULK" || tp === "BLOCK" || tp === "DISCLOSURE"
        ? (tp as DealFilters["type"])
        : undefined,
    symbol: pick(u, "symbol") as string | undefined,
    party: pick(u, "party") as string | undefined,
    minNotional:
      typeof minNotional === "number" && Number.isFinite(minNotional)
        ? minNotional
        : undefined,
    limit: limitRaw ? Number(limitRaw) : undefined,
    offset: offsetRaw ? Number(offsetRaw) : undefined,
  };
  const { rows, total } = await queryDeals(f);
  return Response.json({
    rows: rows.map((r) => ({
      ...r,
      rawPayload: safeJson(r.rawPayload as string),
    })),
    total,
  });
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}
