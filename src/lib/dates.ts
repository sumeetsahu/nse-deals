const MONTHS: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

/** Parse NSE-style "17-Apr-2026" to ISO date YYYY-MM-DD */
export function parseNseDisplayDate(s: string): string {
  const m = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/.exec(s.trim());
  if (!m) throw new Error(`Bad NSE date: ${s}`);
  const day = Number(m[1]);
  const monKey =
    m[2].charAt(0).toUpperCase() + m[2].slice(1, 3).toLowerCase();
  const mon = MONTHS[monKey];
  if (mon === undefined) throw new Error(`Bad month in NSE date: ${s}`);
  const year = Number(m[3]);
  const d = new Date(Date.UTC(year, mon, day));
  const iso = d.toISOString().slice(0, 10);
  return iso;
}

/** Format Date as DD-MM-YYYY for NSE corporate-announcements API */
export function formatDdMmYyyy(d: Date): string {
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

/** YYYYMMDD for BSE AnnGetData */
export function formatYyyymmdd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export function isoDateUtc(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** dd/mm/yyyy for BSE date pickers */
export function formatDdMmYyyySlash(d: Date): string {
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function eachUtcDay(from: Date, to: Date): Date[] {
  const out: Date[] = [];
  const cur = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));
  while (cur <= end) {
    out.push(new Date(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
