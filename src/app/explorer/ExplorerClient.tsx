"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import type { DealRow } from "@/components/DealTable";
import { DealTable } from "@/components/DealTable";
import { defaultDateRange } from "@/lib/range";

type Props = {
  initialFrom: string;
  initialTo: string;
  initialRows: DealRow[];
  initialTotal: number;
};

export function ExplorerClient({
  initialFrom,
  initialTo,
  initialRows,
  initialTotal,
}: Props) {
  const def = useMemo(() => defaultDateRange(), []);
  const [from, setFrom] = useState(initialFrom || def.from);
  const [to, setTo] = useState(initialTo || def.to);
  const [exchange, setExchange] = useState("");
  const [type, setType] = useState("");
  const [symbol, setSymbol] = useState("");
  const [party, setParty] = useState("");
  const [minNotional, setMinNotional] = useState("");
  const [rows, setRows] = useState<DealRow[]>(initialRows);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const u = new URL("/api/deals", window.location.origin);
    u.searchParams.set("from", from);
    u.searchParams.set("to", to);
    if (exchange) u.searchParams.set("exchange", exchange);
    if (type) u.searchParams.set("type", type);
    if (symbol.trim()) u.searchParams.set("symbol", symbol.trim());
    if (party.trim()) u.searchParams.set("party", party.trim());
    if (minNotional.trim()) u.searchParams.set("minNotional", minNotional.trim());
    u.searchParams.set("limit", "500");
    const r = await fetch(u.toString());
    if (!r.ok) {
      setErr(await r.text());
      setLoading(false);
      return;
    }
    const j = (await r.json()) as { rows: DealRow[]; total: number };
    setRows(j.rows);
    setTotal(j.total);
    setLoading(false);
  }, [exchange, from, minNotional, party, symbol, to, type]);

  const exportCsv = useCallback(() => {
    const cols = [
      "occurredOn",
      "exchange",
      "type",
      "symbol",
      "party",
      "side",
      "qty",
      "price",
      "notionalInr",
      "pctVsPriorClose",
      "title",
      "sourceRef",
    ] as const;
    const esc = (v: unknown) => {
      const s = v === null || v === undefined ? "" : String(v);
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const lines = [
      cols.join(","),
      ...rows.map((r) =>
        cols
          .map((c) =>
            esc(
              c === "title"
                ? r.title
                : (r as unknown as Record<string, unknown>)[c],
            ),
          )
          .join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `deals-${from}_to_${to}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [from, rows, to]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-medium text-zinc-600">
          From (UTC)
          <input
            className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="text-xs font-medium text-zinc-600">
          To (UTC)
          <input
            className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <label className="text-xs font-medium text-zinc-600">
          Exchange
          <select
            className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
            value={exchange}
            onChange={(e) => setExchange(e.target.value)}
          >
            <option value="">Both</option>
            <option value="NSE">NSE</option>
            <option value="BSE">BSE</option>
          </select>
        </label>
        <label className="text-xs font-medium text-zinc-600">
          Type
          <select
            className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">All</option>
            <option value="BULK">Bulk</option>
            <option value="BLOCK">Block</option>
            <option value="DISCLOSURE">Disclosure</option>
          </select>
        </label>
        <label className="text-xs font-medium text-zinc-600">
          Symbol contains
          <input
            className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
          />
        </label>
        <label className="text-xs font-medium text-zinc-600">
          Party contains
          <input
            className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
            value={party}
            onChange={(e) => setParty(e.target.value)}
          />
        </label>
        <label className="text-xs font-medium text-zinc-600">
          Min notional ₹
          <input
            className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
            value={minNotional}
            onChange={(e) => setMinNotional(e.target.value)}
            inputMode="decimal"
          />
        </label>
        <div className="flex items-end gap-2">
          <button
            type="button"
            className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            onClick={() => void load()}
            disabled={loading}
          >
            {loading ? "Loading…" : "Apply"}
          </button>
          <button
            type="button"
            className="rounded border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            onClick={exportCsv}
            disabled={!rows.length}
          >
            Export CSV
          </button>
        </div>
      </div>
      {err ? (
        <p className="text-sm text-red-700">{err}</p>
      ) : (
        <p className="text-xs text-zinc-500">
          Showing {rows.length} of {total} rows (server limit 500 per request).{" "}
          Party drill-down:{" "}
          <Link className="text-sky-700 underline" href="/parties">
            Parties
          </Link>
          .
        </p>
      )}
      <DealTable rows={rows} />
    </div>
  );
}
