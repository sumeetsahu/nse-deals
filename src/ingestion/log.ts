export function logInfo(msg: string, extra?: Record<string, unknown>) {
  console.log(
    `[ingest] ${msg}`,
    extra && Object.keys(extra).length ? JSON.stringify(extra) : "",
  );
}

export function logWarn(msg: string, extra?: Record<string, unknown>) {
  console.warn(
    `[ingest] ${msg}`,
    extra && Object.keys(extra).length ? JSON.stringify(extra) : "",
  );
}
