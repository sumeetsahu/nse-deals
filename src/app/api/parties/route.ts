import { and, desc, gte, isNotNull, like, lte, sql, sum } from "drizzle-orm";

import { getDb } from "@/db/client";
import { dealEvents } from "@/db/schema";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const from = u.searchParams.get("from");
  const to = u.searchParams.get("to");
  const q = u.searchParams.get("q");
  if (!from || !to) {
    return Response.json({ error: "from and to are required" }, { status: 400 });
  }
  const db = getDb();
  const base = and(
    gte(dealEvents.occurredOn, from),
    lte(dealEvents.occurredOn, to),
    isNotNull(dealEvents.party),
  );
  const nameCond = q?.trim()
    ? and(base, like(dealEvents.party, `%${q.trim()}%`))
    : base;

  const rows = await db
    .select({
      party: dealEvents.party,
      notional: sql<number>`coalesce(${sum(dealEvents.notionalInr)},0)`,
      deals: sql<number>`count(*)`,
    })
    .from(dealEvents)
    .where(nameCond)
    .groupBy(dealEvents.party)
    .orderBy(desc(sum(dealEvents.notionalInr)))
    .limit(50);

  return Response.json({ rows });
}
