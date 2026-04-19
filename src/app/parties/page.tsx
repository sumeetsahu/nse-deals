import Link from "next/link";

import { Disclaimer } from "@/components/Disclaimer";
import { getDb } from "@/db/client";
import { dealEvents } from "@/db/schema";
import { defaultDateRange } from "@/lib/range";
import { and, desc, gte, isNotNull, like, lte, sql, sum } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function PartiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const { from, to } = defaultDateRange();
  const db = getDb();
  const base = and(
    gte(dealEvents.occurredOn, from),
    lte(dealEvents.occurredOn, to),
    isNotNull(dealEvents.party),
  );
  const where = q?.trim()
    ? and(base, like(dealEvents.party, `%${q.trim()}%`))
    : base;
  const rows = await db
    .select({
      party: dealEvents.party,
      notional: sql<number>`coalesce(${sum(dealEvents.notionalInr)},0)`,
      deals: sql<number>`count(*)`,
    })
    .from(dealEvents)
    .where(where)
    .groupBy(dealEvents.party)
    .orderBy(desc(sum(dealEvents.notionalInr)))
    .limit(40);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Parties</h1>
        <p className="mt-1 max-w-3xl text-sm text-zinc-600">
          Aggregated client names from bulk/block prints in the selected window (
          {from} → {to}, UTC). Disclosure rows typically have no party.
        </p>
      </div>
      <Disclaimer />
      <form className="flex max-w-md gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search party…"
          className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white"
        >
          Search
        </button>
      </form>
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-600">
            <tr>
              <th className="px-3 py-2">Party</th>
              <th className="px-3 py-2 text-right">Deals</th>
              <th className="px-3 py-2 text-right">Notional ₹</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((r) => (
              <tr key={r.party ?? ""} className="hover:bg-zinc-50/80">
                <td className="px-3 py-2">
                  <Link
                    className="font-medium text-sky-800 hover:underline"
                    href={`/parties/${encodeURIComponent(r.party ?? "")}?from=${from}&to=${to}`}
                  >
                    {r.party}
                  </Link>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{r.deals}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {Number(r.notional).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
