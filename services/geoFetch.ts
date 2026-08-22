// Shared Geoapify REST client.
// SSRF guard: the request URL is assembled here from a constant origin and a
// path whitelist — callers pass structured params, never a raw URL, so tainted
// data can only ever land inside an encoded query-string value.
const ORIGIN = "https://api.geoapify.com";

export const fetchGeoapify = async (
  path: string,
  params: Record<string, string | number>,
  timeout = 10000,
): Promise<Response> => {
  if (!/^[a-z0-9/_\-.]+$/.test(path)) {
    throw new Error(`Blocked geoapify path: ${path}`);
  }
  const qs = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  const url = `${ORIGIN}/${path}?${qs}`;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
};
