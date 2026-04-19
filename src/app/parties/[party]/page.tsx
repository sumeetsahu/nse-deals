import Link from "next/link";

import { Disclaimer } from "@/components/Disclaimer";
import { DealTable } from "@/components/DealTable";
import { partyProfile } from "@/db/queries";

export const dynamic = "force-dynamic";

export default async function PartyPage({
  params,
  searchParams,
}: {
  params: Promise<{ party: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { party } = await params;
  const sp = await searchParams;
  const name = decodeURIComponent(party);
  if (!sp.from || !sp.to) {
    return (
      <p className="text-sm text-red-700">
        Missing <code>from</code> and <code>to</code> query parameters. Open this
        profile from the{" "}
        <Link href="/parties" className="text-sky-800 underline">
          Parties
        </Link>{" "}
        list.
      </p>
    );
  }
  const data = await partyProfile(name, sp.from, sp.to);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Party profile
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Window {sp.from} → {sp.to} (UTC)
        </p>
      </div>
      <Disclaimer />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-zinc-500">Buy notional ₹</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {Number(data.totals?.buys ?? 0).toLocaleString("en-IN", {
              maximumFractionDigits: 0,
            })}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-zinc-500">Sell notional ₹</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {Number(data.totals?.sells ?? 0).toLocaleString("en-IN", {
              maximumFractionDigits: 0,
            })}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-zinc-500">Rows</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {data.totals?.rows ?? 0}
          </p>
        </div>
      </div>
      <div>
        <h2 className="text-lg font-semibold">By symbol</h2>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {data.bySymbol.map((s) => (
            <li
              key={s.symbol}
              className="flex items-center justify-between rounded border border-zinc-200 bg-white px-3 py-2 text-sm"
            >
              <span className="font-medium">{s.symbol}</span>
              <span className="tabular-nums text-zinc-700">
                ₹{Number(s.notional).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="text-lg font-semibold">Recent prints</h2>
        <div className="mt-2">
          <DealTable rows={data.recent} />
        </div>
      </div>
    </div>
  );
}
