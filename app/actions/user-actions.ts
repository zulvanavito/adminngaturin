"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { UserProfile } from "@/components/users/users-table";

interface AuthUserRPC {
  id: string;
  email: string | null;
  full_name: string | null;
}

interface ProfileRecord {
  user_id: string;
  role: string | null;
  created_at: string;
}

export async function getUsersList(): Promise<UserProfile[]> {
  const supabase = createAdminClient();

  // 1. Ambil data secara paralel untuk menghindari waterfall (Vercel async-parallel best practice)
  const [authRes, profilesRes] = await Promise.all([
    supabase.rpc("get_auth_users_email" as never),
    supabase.from("user_profiles").select("user_id, role, created_at")
  ]);

  const { data: authUsersRaw, error: authError } = authRes;
  const { data: profilesRaw, error: profileError } = profilesRes;

  if (authError) {
    console.error("Error fetching auth users:", authError);
    throw new Error("Gagal mengambil data autentikasi pengguna");
  }

  if (profileError) {
    console.error("Error fetching profiles:", profileError);
    throw new Error("Gagal mengambil data profil pengguna");
  }

  // Cast secara aman via unknown
  const authUsers = authUsersRaw as unknown as AuthUserRPC[];
  const profiles = profilesRaw as unknown as ProfileRecord[];

  // 3. Buat mapping profil berdasarkan user_id (O(1) lookup)
  const profileMap = new Map<string, ProfileRecord>();
  (profiles || []).forEach((p: ProfileRecord) => profileMap.set(p.user_id, p));

  // 4. Gabungkan data auth + profil
  const users: UserProfile[] = (authUsers || []).map((auth: AuthUserRPC) => {
    const profile = profileMap.get(auth.id);

    return {
      id: auth.id,
      email: auth.email || "Email tidak tersedia",
      full_name: auth.full_name || "Pengguna Tanpa Nama",
      role: (profile?.role as UserProfile["role"]) || "user",
      level: 1,
      xp: 0,
      status: "active" as const,
    };
  });

  return users;
}
