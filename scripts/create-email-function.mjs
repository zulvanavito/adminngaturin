// Membuat fungsi get_auth_users_email langsung di database Supabase
// via koneksi PostgreSQL langsung

import pg from "pg";
const { Client } = pg;

// Supabase direct connection (Session pooler - IPv4 compatible)
const client = new Client({
  connectionString:
    "postgresql://postgres.xiuoposjwqrlwwxfeqod:ngaturin-supabase-key-2026@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres",
  ssl: { rejectUnauthorized: false },
});

const sql = `
CREATE OR REPLACE FUNCTION public.get_auth_users_email()
RETURNS TABLE(id uuid, email text, full_name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT 
    au.id, 
    au.email::text,
    COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', '')::text as full_name
  FROM auth.users au;
$$;

REVOKE EXECUTE ON FUNCTION public.get_auth_users_email() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_auth_users_email() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_auth_users_email() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_auth_users_email() TO service_role;
`;

async function run() {
  try {
    await client.connect();
    console.log("Connected to database!");
    const result = await client.query(sql);
    console.log("Function created successfully!", result);

    // Test the function
    const test = await client.query("SELECT * FROM get_auth_users_email()");
    console.log("Test result:", JSON.stringify(test.rows, null, 2));
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

run();
