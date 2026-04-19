"use client";

import type { InferSelectModel } from "drizzle-orm";
import { Fragment, useState } from "react";

import type { dealEvents } from "@/db/schema";

export type DealRow = Omit<InferSelectModel<typeof dealEvents>, "rawPayload"> & {
  rawPayload?: unknown;
};

function fmt(n: number | null | undefined) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function DealTable({ rows }: { rows: DealRow[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-600">
          <tr>
            <th className="px-2 py-2" aria-label="expand" />
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Ex</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">Symbol</th>
            <th className="px-3 py-2">Party</th>
            <th className="px-3 py-2">Side</th>
            <th className="px-3 py-2 text-right">Qty</th>
            <th className="px-3 py-2 text-right">Price</th>
            <th className="px-3 py-2 text-right">Notional ₹</th>
            <th className="px-3 py-2 text-right">% vs prior*</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.map((r) => (
            <Fragment key={r.id}>
              <tr className="hover:bg-zinc-50/80">
                <td className="px-2 py-2">
                  <button
                    type="button"
                    className="rounded border border-zinc-300 px-1.5 py-0.5 text-xs text-zinc-700 hover:bg-zinc-100"
                    aria-expanded={open === r.id}
                    onClick={() => setOpen(open === r.id ? null : r.id)}
                  >
                    {open === r.id ? "−" : "+"}
                  </button>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-zinc-800">
                  {r.occurredOn}
                </td>
                <td className="px-3 py-2">{r.exchange}</td>
                <td className="px-3 py-2">
                  <span
                    className={
                      r.type === "BULK"
                        ? "rounded bg-sky-100 px-1.5 py-0.5 text-xs font-medium text-sky-900"
                        : r.type === "BLOCK"
                          ? "rounded bg-violet-100 px-1.5 py-0.5 text-xs font-medium text-violet-900"
                          : "rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900"
                    }
                  >
                    {r.type}
                  </span>
                </td>
                <td className="px-3 py-2 font-medium">{r.symbol}</td>
                <td className="max-w-[220px] truncate px-3 py-2 text-zinc-700">
                  {r.party ?? "—"}
                </td>
                <td className="px-3 py-2">{r.side}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt(r.qty)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt(r.price)}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {fmt(r.notionalInr)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-zinc-600">
                  {r.pctVsPriorClose === null || r.pctVsPriorClose === undefined
                    ? "—"
                    : `${fmt(r.pctVsPriorClose)}%`}
                </td>
              </tr>
              {open === r.id ? (
                <tr className="bg-zinc-50">
                  <td colSpan={11} className="px-4 py-3 text-xs text-zinc-800">
                    <p className="font-semibold text-zinc-600">Provenance</p>
                    <p className="mt-1 break-all">
                      <span className="text-zinc-500">sourceRef:</span> {r.sourceRef}
                    </p>
                    {r.title ? (
                      <p className="mt-2">
                        <span className="text-zinc-500">title:</span> {r.title}
                      </p>
                    ) : null}
                    <p className="mt-2 font-semibold text-zinc-600">Raw payload</p>
                    <pre className="mt-1 max-h-64 overflow-auto rounded border border-zinc-200 bg-white p-2 text-[11px] leading-snug">
                      {JSON.stringify(r.rawPayload ?? {}, null, 2)}
                    </pre>
                  </td>
                </tr>
              ) : null}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
