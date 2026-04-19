import { partyProfile } from "@/db/queries";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ party: string }> },
) {
  const u = new URL(req.url);
  const from = u.searchParams.get("from");
  const to = u.searchParams.get("to");
  if (!from || !to) {
    return Response.json({ error: "from and to are required" }, { status: 400 });
  }
  const { party } = await ctx.params;
  const name = decodeURIComponent(party);
  const data = await partyProfile(name, from, to);
  return Response.json({
    party: name,
    ...data,
    recent: data.recent.map((r) => ({
      ...r,
      rawPayload: (() => {
        try {
          return JSON.parse(r.rawPayload as string);
        } catch {
          return r.rawPayload;
        }
      })(),
    })),
  });
}
