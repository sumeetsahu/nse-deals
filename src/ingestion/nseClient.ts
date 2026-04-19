const NSE_ORIGIN = "https://www.nseindia.com";

function cookieHeaderFromResponse(res: Response): string {
  const anyHeaders = res.headers as unknown as {
    getSetCookie?: () => string[];
  };
  const parts = anyHeaders.getSetCookie?.() ?? [];
  if (parts.length) {
    return parts.map((c) => c.split(";")[0]).join("; ");
  }
  const single = res.headers.get("set-cookie");
  if (!single) return "";
  return single
    .split(/,(?=[^;]+?=)/)
    .map((c) => c.trim().split(";")[0])
    .join("; ");
}

export async function createNseCookieHeader(): Promise<string> {
  const res = await fetch(`${NSE_ORIGIN}/`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  return cookieHeaderFromResponse(res);
}

export function nseHeaders(cookie: string): Record<string, string> {
  return {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    Referer: `${NSE_ORIGIN}/`,
    Origin: NSE_ORIGIN,
    ...(cookie ? { Cookie: cookie } : {}),
  };
}
