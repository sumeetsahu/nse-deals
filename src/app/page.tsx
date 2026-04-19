import Link from "next/link";

import { Disclaimer } from "@/components/Disclaimer";
import { DealTable } from "@/components/DealTable";
import { queryDeals, summary } from "@/db/queries";
import { defaultDateRange } from "@/lib/range";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { from, to } = defaultDateRange();
  const s = await summary(from, to);
  const recent = await queryDeals({ from, to, limit: 12 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">India deals desk</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-600">
          Consolidated <strong>block</strong> and <strong>bulk</strong> prints from
          the NSE large-deals snapshot, plus <strong>disclosure-shaped</strong> rows
          from NSE/BSE announcement feeds using your keyword list. Use the explorer
          for filters and CSV export; use parties for client-name rollups.
        </p>
      </div>
      <Disclaimer />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {s.byType.map((b) => (
          <div
            key={b.type}
            className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {b.type}
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{b.count}</p>
            <p className="mt-1 text-xs text-zinc-500">
              Notional ₹{" "}
              {Number(b.notional).toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}
            </p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Top symbols by notional</h2>
          <p className="text-xs text-zinc-500">
            {from} → {to} (UTC)
          </p>
          <ol className="mt-3 space-y-2 text-sm">
            {s.topSymbols.map((x, i) => (
              <li key={x.symbol} className="flex justify-between gap-4">
                <span className="text-zinc-500">{i + 1}.</span>
                <span className="flex-1 font-medium">{x.symbol}</span>
                <span className="tabular-nums text-zinc-700">
                  ₹
                  {Number(x.notional).toLocaleString("en-IN", {
                    maximumFractionDigits: 0,
                  })}
                </span>
              </li>
            ))}
          </ol>
        </section>
        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Top parties by notional</h2>
          <p className="text-xs text-zinc-500">Bulk / block rows with a client name</p>
          <ol className="mt-3 space-y-2 text-sm">
            {s.topParties.map((x, i) => (
              <li key={x.party ?? ""} className="flex justify-between gap-4">
                <span className="text-zinc-500">{i + 1}.</span>
                <Link
                  className="flex-1 truncate font-medium text-sky-800 hover:underline"
                  href={`/parties/${encodeURIComponent(x.party ?? "")}?from=${from}&to=${to}`}
                >
                  {x.party}
                </Link>
                <span className="tabular-nums text-zinc-700">
                  ₹
                  {Number(x.notional).toLocaleString("en-IN", {
                    maximumFractionDigits: 0,
                  })}
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Latest rows</h2>
          <Link
            href="/explorer"
            className="text-sm font-medium text-sky-800 hover:underline"
          >
            Open explorer →
          </Link>
        </div>
        <DealTable rows={recent.rows} />
      </section>
    </div>
  );
}
