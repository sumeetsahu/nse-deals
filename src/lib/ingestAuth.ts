export function getIngestToken(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice("Bearer ".length).trim();
  const h = req.headers.get("x-cron-secret");
  if (h) return h.trim();
  const u = new URL(req.url);
  return u.searchParams.get("cron_secret");
}

export function ingestAuthorized(req: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const got = getIngestToken(req);
  return Boolean(got && got === expected);
}
