import { Disclaimer } from "@/components/Disclaimer";
import { queryDeals } from "@/db/queries";
import { defaultDateRange } from "@/lib/range";

import { ExplorerClient } from "./ExplorerClient";

export const dynamic = "force-dynamic";

export default async function ExplorerPage() {
  const { from, to } = defaultDateRange();
  const initial = await queryDeals({ from, to, limit: 500 });
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Activity explorer</h1>
        <p className="mt-1 max-w-3xl text-sm text-zinc-600">
          Filter block, bulk, and disclosure rows ingested into your local SQLite
          database. Run <code className="rounded bg-zinc-100 px-1">npm run ingest</code>{" "}
          (or call <code className="rounded bg-zinc-100 px-1">POST /api/ingest</code>)
          before expecting fresh data.
        </p>
      </div>
      <Disclaimer />
      <ExplorerClient
        initialFrom={from}
        initialTo={to}
        initialRows={initial.rows}
        initialTotal={initial.total}
      />
    </div>
  );
}
