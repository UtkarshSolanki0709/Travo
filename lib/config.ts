// Central build-time configuration with one-time validation.
// Expo inlines EXPO_PUBLIC_* values at build time, so every check below runs
// once during module init — never per request. A value that is present but
// malformed fails fast at startup with a clear message instead of producing
// broken or attacker-shaped request URLs later; a missing value keeps the
// existing per-consumer behavior (callers already guard or throw).

// https://host[:port][/path] — rejects non-https schemes, embedded
// credentials, and whitespace/control characters. Deliberately regex-based
// (no URL global): Hermes polyfill load order is not guaranteed before this
// module evaluates.
const HTTPS_URL_RE =
  /^https:\/\/[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?(?::\d{1,5})?(?:[/?#][^\s]*)?$/;

function validatedHttpsUrl(name: string, raw: string | undefined): string | undefined {
  if (raw && !HTTPS_URL_RE.test(raw)) {
    throw new Error(`[config] ${name} must be a valid https URL: ${raw}`);
  }
  return raw;
}

function validatedToken(
  name: string,
  raw: string | undefined,
  pattern: RegExp,
): string | undefined {
  if (raw && !pattern.test(raw)) {
    throw new Error(`[config] ${name} has an unexpected format: ${raw}`);
  }
  return raw;
}

export const config = {
  supabaseUrl: validatedHttpsUrl(
    "EXPO_PUBLIC_SUPABASE_URL",
    process.env.EXPO_PUBLIC_SUPABASE_URL,
  ),
  supabaseAnonKey:
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_KEY,
  cloudinaryCloudName: validatedToken(
    "EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME",
    process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME,
    /^[A-Za-z0-9_-]+$/,
  ),
  cloudinaryUploadPreset: process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
  geoapifyKey: process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY,
  backendUrl: validatedHttpsUrl(
    "EXPO_PUBLIC_BACKEND_URL",
    process.env.EXPO_PUBLIC_BACKEND_URL,
  ),
} as const;

if (__DEV__ && config.geoapifyKey && !/^[a-f0-9]{32}$/i.test(config.geoapifyKey)) {
  console.warn(
    "[config] EXPO_PUBLIC_GEOAPIFY_API_KEY does not look like a 32-char hex key",
  );
}
