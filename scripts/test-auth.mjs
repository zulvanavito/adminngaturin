// Script untuk menguji Auth Admin API secara langsung
const SRK = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpdW9wb3Nqd3FybHd3eGZlcW9kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM4NzcxNywiZXhwIjoyMDg3OTYzNzE3fQ.AEvLDvMr2lyi7u2w1QoJN8nOgu_gSCDp2ivVmbeKdcM";

async function test() {
  // Test 1: getUserById
  const r1 = await fetch(
    "https://xiuoposjwqrlwwxfeqod.supabase.co/auth/v1/admin/users/47d4b145-2e02-4e10-a26b-d3fdd2b016dd",
    { headers: { apikey: SRK, Authorization: `Bearer ${SRK}` } }
  );
  console.log("getUserById:", r1.status, await r1.json());

  // Test 2: Supabase SQL via pg endpoint
  const r2 = await fetch(
    "https://xiuoposjwqrlwwxfeqod.supabase.co/rest/v1/rpc/get_auth_users_email",
    {
      method: "POST",
      headers: { apikey: SRK, Authorization: `Bearer ${SRK}`, "Content-Type": "application/json" },
      body: "{}",
    }
  );
  console.log("RPC get_auth_users_email:", r2.status, await r2.text());
}

test();
