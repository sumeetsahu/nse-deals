import { sleep } from "@/lib/dates";
import { logWarn } from "./log";

export type FetchJsonOpts = {
  headers?: Record<string, string>;
  retries?: number;
  baseDelayMs?: number;
};

export async function fetchJson<T>(
  url: string,
  init: RequestInit & FetchJsonOpts = {},
): Promise<T> {
  const { retries = 3, baseDelayMs = 400, headers, ...rest } = init;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        ...rest,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
          Accept: "application/json, text/plain, */*",
          ...headers,
        },
      });
      if (res.status === 429 || res.status >= 500) {
        throw new Error(`HTTP ${res.status} for ${url}`);
      }
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`HTTP ${res.status} for ${url}: ${t.slice(0, 200)}`);
      }
      return (await res.json()) as T;
    } catch (e) {
      lastErr = e;
      const wait = baseDelayMs * 2 ** attempt + Math.floor(Math.random() * 200);
      if (attempt < retries) {
        logWarn("fetch retry", { url, attempt, wait, err: String(e) });
        await sleep(wait);
      }
    }
  }
  throw lastErr;
}

export async function fetchText(
  url: string,
  init: RequestInit & FetchJsonOpts = {},
): Promise<string> {
  const { retries = 2, baseDelayMs = 400, headers, ...rest } = init;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        ...rest,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
          ...headers,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      lastErr = e;
      await sleep(baseDelayMs * 2 ** attempt);
    }
  }
  throw lastErr;
}
