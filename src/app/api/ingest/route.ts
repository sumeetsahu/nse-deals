import { runIngestion } from "@/ingestion/runner";
import { ingestAuthorized } from "@/lib/ingestAuth";

export const runtime = "nodejs";
export const maxDuration = 300;

function guard(req: Request): Response | null {
  if (!process.env.CRON_SECRET) {
    return Response.json(
      { error: "CRON_SECRET is not set in the environment." },
      { status: 500 },
    );
  }
  if (!ingestAuthorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(req: Request) {
  const bad = guard(req);
  if (bad) return bad;
  try {
    const result = await runIngestion();
    return Response.json({ ok: true, result });
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const bad = guard(req);
  if (bad) return bad;
  try {
    const result = await runIngestion();
    return Response.json({ ok: true, result });
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
