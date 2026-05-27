import { UsersTable } from "@/components/users/users-table";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Direktori Pengguna | Ngaturin Admin System",
  description: "Manajemen data pengguna dan penyesuaian gamifikasi",
};

export default function UsersPage() {
  return (
    <div className="flex-1 p-8">
      <div className="mb-8">
        <h1 className="text-[40px] font-black leading-[0.85] text-[#0e0f0c] mb-2" style={{ fontFeatureSettings: '"calt" 1' }}>
          Direktori Pengguna
        </h1>
        <p className="text-[#868685] text-[18px] font-medium max-w-2xl" style={{ fontFeatureSettings: '"calt" 1' }}>
          Kelola profil pengguna, sesuaikan nilai XP, ubah peran, dan tinjau status keaktifan akun secara langsung dengan TanStack Query & Table.
        </p>
      </div>

      <UsersTable />
    </div>
  );
}
