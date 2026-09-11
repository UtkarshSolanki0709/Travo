// Type declarations for Deno runtime and URL imports
// This allows VS Code's TypeScript language server to resolve Deno globals
// and URL imports without red squiggly errors, while remaining 100% compatible
// with Supabase Edge Functions / Deno CLI deployment.

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export * from "@supabase/supabase-js";
}

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};
