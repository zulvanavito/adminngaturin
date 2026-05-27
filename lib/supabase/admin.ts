import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client berwewenang penuh (Admin).
 * Menggunakan SUPABASE_SERVICE_ROLE_KEY sehingga mengabaikan semua aturan RLS.
 * WAJIB digunakan hanya pada lingkungan server (Server Actions / API Routes).
 */
export const createAdminClient = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase environment variables are missing");
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};
