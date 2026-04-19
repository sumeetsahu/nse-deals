import { summary } from "@/db/queries";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const from = u.searchParams.get("from");
  const to = u.searchParams.get("to");
  if (!from || !to) {
    return Response.json({ error: "from and to (YYYY-MM-DD) are required" }, { status: 400 });
  }
  const data = await summary(from, to);
  return Response.json(data);
}
