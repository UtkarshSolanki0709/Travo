import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { config } from "@/lib/config";

const supabaseUrl = config.supabaseUrl!;
const supabaseAnonKey = config.supabaseAnonKey!;

const storage = AsyncStorage;

type TokenGetter = () => Promise<string | null>;
let currentTokenGetter: TokenGetter | null = null;

export function setSupabaseTokenGetter(getter: TokenGetter | null) {
  currentTokenGetter = getter;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
  global: {
    fetch: async (url, options = {}) => {
      const headers = new Headers(options.headers);
      if (currentTokenGetter) {
        try {
          const token = await currentTokenGetter();
          if (token) {
            headers.set("Authorization", `Bearer ${token}`);
          }
        } catch (e) {
          console.warn("[Supabase] Failed to retrieve Clerk JWT:", e);
        }
      }
      return fetch(url, { ...options, headers });
    },
  },
});

