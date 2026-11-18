
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const REMEMBER_ME_KEY = "edutrack-remember-me";
const AUTH_STORAGE_KEY = `sb-${
  new URL(supabaseUrl).hostname.split(".")[0]
}-auth-token`;

// Select the appropriate storage based on the user's preference
const authStorage = {
  getItem(key) {
    const rememberMe =
      localStorage.getItem(REMEMBER_ME_KEY) === "true";

    if (rememberMe) {
      const localValue = localStorage.getItem(key);

      if (localValue !== null) return localValue;

      // Migrate an existing session if necessary
      const sessionValue = sessionStorage.getItem(key);

      if (sessionValue !== null) {
        localStorage.setItem(key, sessionValue);
        sessionStorage.removeItem(key);
      }

      return sessionValue;
    }

    const sessionValue = sessionStorage.getItem(key);

    if (sessionValue !== null) return sessionValue;

    // Preserve existing sessions from the previous configuration
    const localValue = localStorage.getItem(key);

    if (localValue !== null) {
      sessionStorage.setItem(key, localValue);
      localStorage.removeItem(key);
    }

    return localValue;
  },

  setItem(key, value) {
    const rememberMe =
      localStorage.getItem(REMEMBER_ME_KEY) === "true";

    if (rememberMe) {
      localStorage.setItem(key, value);
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, value);
      localStorage.removeItem(key);
    }
  },

  removeItem(key) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};

export const clearLocalAuthSession = () => {
  authStorage.removeItem(AUTH_STORAGE_KEY);
};

// Called before signing in
export const setRememberMePreference = (rememberMe) => {
  localStorage.setItem(
    REMEMBER_ME_KEY,
    rememberMe ? "true" : "false"
  );
};

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: authStorage,
      storageKey: AUTH_STORAGE_KEY,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
