export function Disclaimer() {
  return (
    <aside
      className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
      role="note"
    >
      <p className="font-semibold">Important limitations</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>
          <strong>Not realized profit:</strong> where shown, % move uses the
          exchange&apos;s latest <em>previous close</em> from a live quote call
          as a rough proxy, not the close on the deal date and not your cost
          basis.
        </li>
        <li>
          <strong>Disclosures are not &quot;illegal insider trading&quot;:</strong>{" "}
          rows come from public announcement text matched to configurable
          keywords (SEBI/PIT/SAST-style language).
        </li>
        <li>
          <strong>Prospecting:</strong> public prints are not suitability,
          performance, or endorsement. AMC marketing rules still apply.
        </li>
      </ul>
    </aside>
  );
}
