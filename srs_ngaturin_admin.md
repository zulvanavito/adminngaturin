# Software Requirements Specification (SRS)
## Ngaturin Admin System & Headless Blog CMS

* **Document Version**: 1.0.0
* **Date**: 2026-05-18
* **Authors**: Zulvan Avito (Lead Product Owner) & AI System Architect
* **Format Standard**: IEEE Std 830-1998

---

## 1. Introduction

### 1.1 Purpose
Dokumen ini menspesifikasikan seluruh kebutuhan perangkat lunak (*software requirements*) untuk pembangunan **Ngaturin Admin System & Headless Blog CMS**. Dokumen ini ditujukan sebagai acuan mutlak bagi tim pengembang (*developers*), penguji (*QA/testers*), dan arsitek sistem dalam mengimplementasikan proyek admin terpisah ini.

### 1.2 Scope
Sistem yang dikembangkan adalah portal administratif terisolasi yang terhubung ke instansi Supabase (PostgreSQL) yang sama dengan aplikasi pengguna (*User App*). Sistem ini menyediakan kendali penuh atas manajemen pengguna, modifikasi gamifikasi, rekonsiliasi billing Midtrans, penulisan artikel panduan keuangan melalui editor Markdown, dan pencatatan log audit sistem. 
Aplikasi admin ini **tidak** menyediakan fitur pencatatan transaksi harian mandiri untuk pengguna, melainkan berfokus pada agregasi data operasional dan administratif.

### 1.3 Definitions, Acronyms, and Abbreviations
* **SRS**: Software Requirements Specification
* **PRD**: Product Requirement Document
* **RLS**: Row Level Security (Kebijakan keamanan di PostgreSQL Supabase)
* **JWT**: JSON Web Token (Token otentikasi stateless)
* **ISR**: Incremental Static Regeneration (Strategi caching halaman dinamis Next.js)
* **PDPA / UU PDP**: Undang-Undang Pelindungan Data Pribadi (Regulasi privasi Indonesia)
* **Snap API**: Antarmuka pembayaran berorientasi popover dari Midtrans
* **Core API**: Antarmuka pembayaran server-to-server dari Midtrans (untuk refund/void)
* **WYSIWYG**: *What You See Is What You Get* (Editor teks kaya)

---

## 2. Overall Description

### 2.1 Product Perspective
Ngaturin Admin System dirancang sebagai aplikasi web modern satu halaman (*Single Page Application* / SPA) yang dideploy di subdomain terpisah (contoh: `admin.ngaturin.com`). Proyek ini terpisah secara repositori dari aplikasi pengguna utama namun berbagi **sumber data tunggal** (*Shared Database Model*) di Supabase.

```
+-----------------------------------------------------------+
|                      Supabase Engine                      |
|                                                           |
|  +--------------------+             +------------------+  |
|  | Auth (Standard API)|             | Auth (Admin API) |  |
|  +---------^----------+             +--------^---------+  |
|            |                                 |            |
|  +---------v----------+             +--------v---------+  |
|  | DB (RLS Enabled)   |             | DB (Bypass RLS)  |  |
|  +---------^----------+             +--------^---------+  |
+------------|---------------------------------|------------+
             |                                 |
+------------v----------+             +--------v------------+
|  User App (Standard)  |             |  Admin App (Secured)|
|  - Auth Token Klien   |             |  - Service Role Key |
+-----------------------+             +---------------------+
```

### 2.2 Product Functions
Fungsi utama yang didukung oleh perangkat lunak ini meliputi:
1. **Executive Dashboard Analytics**: Agregasi real-time performa MRR, ARR, MAU, serta visualisasi grafik pertumbuhan.
2. **User Profiles Management**: Koreksi data dasar, penangguhan (*Soft Delete*), dan pembersihan total data (*Hard Delete / Right to be Forgotten*).
3. **Gamification Adjustment Tool**: Penyesuaian XP secara manual dan manajemen visual cetak biru lencana (*Badge CRUD*).
4. **Billing & Midtrans Audit**: Sinkronisasi status invoice, override masa aktif premium manual, dan pemicu refund instan.
5. **Headless Blog CMS**: Penulisan artikel rich markdown, manajemen media dengan storage bucket Supabase, dan auto-revalidation halaman blog pengguna.
6. **Operations Audit Logging**: Pencatatan otomatis aktivitas administrator.

### 2.3 User Classes and Characteristics
* **Super Admin**: Akses penuh ke seluruh sistem, termasuk tindakan sensitif seperti pemicu *Hard Delete* (UU PDP), override langganan, *Refund* Midtrans, pembatalan langganan, dan pembuatan peran moderator baru.
* **Moderator**: Hak akses terbatas. Hanya diizinkan meninjau direktori pengguna, mengelola artikel blog (tulis/edit/publish), memantau log audit, dan melihat dashboard analitik. Tidak diizinkan melakukan refund pembayaran, memicu hard delete akun, atau mengubah nilai XP secara manual.

### 2.4 Operating Environment
* **Platform Sisi Klien**: Aplikasi web responsif yang berjalan secara optimal pada browser modern (Google Chrome v110+, Apple Safari v16+, Mozilla Firefox v110+).
* **Runtime Sisi Server**: Node.js v18.x atau v20.x berjalan di atas arsitektur Serverless Vercel.
* **Data Store**: PostgreSQL versi 15 (Supabase Cloud).

### 2.5 Design and Implementation Constraints
* **RLS Non-Interference**: Modifikasi skema basis data di Admin App tidak boleh merusak kebijakan Row Level Security (RLS) milik User App.
* **Server-Side Key Isolation**: *Supabase Service Role Key* wajib tersimpan secara terisolasi di sisi server (`process.env.SUPABASE_SERVICE_ROLE_KEY`) dan dilarang keras bocor ke bundel Javascript sisi klien.
* **Vercel React Best Practices Compliance**: Seluruh penulisan kode React dan Next.js (termasuk *data fetching*, manajemen *state*, dan optimasi *bundle size*) **wajib mematuhi** panduan standar performa tinggi Vercel yang telah didefinisikan pada dokumen `.agents/skills/vercel-react-best-practices/SKILL.md`. Pelanggaran terhadap *waterfall network requests* (`async-`), performa sisi server (`server-`), dan ukuran *bundle* (`bundle-`) tidak dapat ditoleransi. Pengelolaan asinkron state wajib menggunakan **TanStack Query**, dan tabel data kompleks wajib dirender dengan **TanStack Table**.

### 2.6 Software Folder Directory Structure (Next.js 16 Gold Standard)
Untuk menjamin kerapian kode, modularitas sistem, dan kemudahan pemeliharaan (*maintainability*), Admin System wajib diimplementasikan menggunakan struktur direktori terpadu berikut:

```text
ngaturin-admin/
├── app/
│   ├── layout.tsx          # Main Root Layout (HTML structure, Fonts, Providers)
│   ├── page.tsx            # Root redirect (Checks Auth -> redirects to login or dashboard)
│   ├── (auth)/             # Route Group: Autentikasi Admin (Login)
│   │   ├── login/
│   │   │   └── page.tsx    # Halaman Login UI
│   │   └── layout.tsx      # Layout bersih khusus login (tanpa sidebar navigasi)
│   ├── (dashboard)/        # Route Group: Seluruh Panel Admin Terproteksi
│   │   ├── layout.tsx      # Master Layout dengan Sidebar Wise-Cyan & Header
│   │   ├── page.tsx        # Dashboard Main Summary (/dashboard)
│   │   ├── users/          # Manajemen Pengguna & XP (/users)
│   │   │   └── page.tsx    # Render langsung data via RSC (Server Component)
│   │   ├── billing/        # Audit & Konsol Refund Midtrans (/billing)
│   │   │   └── page.tsx
│   │   └── blog/           # Headless Blog CMS (/blog)
│   │       ├── page.tsx    # Daftar Artikel (Drafts & Published)
│   │       └── new/        # Form Tulis Artikel Baru (Editor Markdown)
│   │           └── page.tsx
│   ├── api/                # API Routes (Hanya untuk integrasi khusus & unggahan media)
│   │   ├── billing/
│   │   │   └── refund/     # POST /api/billing/refund (Core API Midtrans)
│   │   └── blog/
│   │       └── media/      # GET /api/blog/media/presigned-url (Cloudflare R2 keys)
│   └── actions/            # React 19 Server Actions (Logika Mutasi Data)
│       ├── user-actions.ts # 'use server' -> adjustXp(), suspendUser()
│       ├── blog-actions.ts # 'use server' -> publishPost(), saveDraft()
│       └── auth-actions.ts # 'use server' -> loginAdmin(), logoutAdmin()
├── components/             # Reusable UI & Layout Components
│   ├── ui/                 # Shadcn primitives (button, table, card, dialog, toast)
│   ├── dashboard/          # Recharts widgets (Tren MRR, Retensi Pengguna)
│   ├── users/              # Dialog Detail Pengguna, Form XP Modifier
│   ├── blog/               # WYSIWYG Editor (TipTap/MDX), Box Unggah Sampul
│   └── shared/             # Sidebar, Header Navigasi, Breadcrumbs
├── lib/                    # Konfigurasi & Inisialisasi SDK Klien
│   ├── supabase/           # Supabase SSR clients (server, client, middleware)
│   ├── midtrans.ts         # Konfigurasi Midtrans Core API Client
│   ├── r2.ts               # AWS S3 SDK Client untuk Cloudflare R2
│   └── utils.ts            # HSL color helpers, cached currency formatters
├── types/                  # Global Type Safety (TypeScript Declarations)
│   ├── index.ts
│   ├── user.ts             # Tipe data User Profile & Gamification
│   ├── blog.ts             # Tipe data Artikel Blog & Storage Media
│   └── billing.ts          # Tipe data Subscription logs & Refund invoices
├── public/                 # Static Assets (Logo, Ikon, Default Avatar)
├── next.config.ts          # Konfigurasi Next.js
└── tailwind.config.ts      # Tailwind setup dengan HSL Palettes & Aksen Wise Cyan
```

---

## 3. Specific Requirements

### 3.1 External Interface Requirements

#### 3.1.1 User Interfaces
* **Visual Theme**: Kepatuhan penuh terhadap *Wise Cyan Theme* (Warna dasar: `#0e0f0c` (Near Black), warna aksen utama: `#70e6e8` (Cyan)).
* **Layout Grid Density**: Komponen tabel data berdensitas tinggi dengan batas kartu beradius `16px` (tidak menggunakan padding longgar seperti layout aplikasi pengguna).
* **Responsive Layout**: Menggunakan sidebar kolapsibel pada layar lebar (>992px) yang bertransisi menjadi panel navigasi bottom bar/sheet pada layar seluler (<768px).

#### 3.1.2 Software Interfaces
* **TanStack Query & Table**: Digunakan secara ekstensif untuk *data fetching*, manajemen *state* asinkron (menggantikan Zustand untuk urusan data server), dan pembuatan *data grid* (tabel) yang kaya fitur dan berkinerja tinggi.
* **Supabase JS Client (`@supabase/supabase-js`)**: Untuk interaksi database CRUD (bypass RLS menggunakan Service Role Key) dan pemicu Admin Auth API.
* **Midtrans Node SDK (`midtrans-client`)**: Antarmuka API Core/Snap untuk pelacakan transaksi dan eksekusi pengembalian dana (*refund*).
* **Yahoo Finance API (`yahoo-finance2`)**: Untuk memverifikasi simbol instrumen investasi saat admin mendaftarkan aset baru.

#### 3.1.3 Communications Interfaces
* **Security Protocol**: Semua lalu lintas data wajib dikirim melalui protokol aman HTTPS dengan TLS versi minimal 1.2 (direkomendasikan TLS 1.3).
* **REST APIs Payload**: Seluruh payload pertukaran data API dikirim dalam format JSON berkode UTF-8.

---

## 4. System Features (Kebutuhan Fitur Sistem)

### SF-1: Analytics and Dashboard Aggregations

#### Kebutuhan Fungsional:
Sistem harus mengagregasi data finansial dan pengguna secara berkala tanpa membebani performa database transaksional.

#### Alur Kerja Teknis:
```
[Admin Request] -> [Next.js Route] -> [Trigger Cached DB View] -> [Return JSON] -> [Render Recharts]
```

#### API Specification: `GET /api/admin/analytics/summary`
* **Request Header**: `Authorization: Bearer <JWT_ADMIN_TOKEN>`
* **Response Payload (Success - 200 OK)**:
```json
{
  "total_users": 15420,
  "monthly_active_users": 8940,
  "conversion_rate": 5.4,
  "mrr": 134100000,
  "arr": 1609200000,
  "timestamp": "2026-05-18T21:49:18Z"
}
```

---

### SF-2: User Directory, Soft/Hard Delete, and XP Adjustments

#### Kebutuhan Fungsional:
Menyediakan fitur manajemen data profil pengguna dengan kepatuhan UU PDP (Hak Dihapus / Right to be Forgotten).

#### Alur Kerja Hard Delete (FR-2.7):
```
[Admin Trigger Hard Delete] 
         |
         v
[API Call to auth.admin.deleteUser(user_id)]
         |
         v
[PostgreSQL Database: Cascade Action Triggered]
         |
         v
[Wipe: profiles -> wallets -> transactions -> goals -> investments]
         |
         v
[Success Response & Insert Row to admin_audit_logs]
```

#### API Specification: `POST /api/admin/users/xp-adjust`
* **Request Payload**:
```json
{
  "target_user_id": "c1f73620-e254-4bd5-b2fb-30084f70dc0d",
  "xp_amount": 150,
  "reason": "Kompensasi kendala pemrosesan transaksi tagihan otomatis"
}
```
* **Response Payload (Success - 200 OK)**:
```json
{
  "success": true,
  "new_level": 5,
  "new_xp": 75,
  "audit_log_id": "8c2a9390-d4fb-4b53-83be-1a0cf83b7f14"
}
```

---

### SF-3: Midtrans Payment Sync & Refund Console

#### Kebutuhan Fungsional:
Rekonsiliasi status pembayaran dan penanganan kegagalan transaksi langganan.

#### API Specification: `POST /api/admin/billing/refund`
* **Request Payload**:
```json
{
  "order_id": "SUBS-PLUS-ab82cf19",
  "refund_amount": 15000,
  "reason": "Pembatalan langganan atas permintaan pengguna"
}
```
* **Processing**: Server memverifikasi kecocokan order ID di tabel `subscriptions`, kemudian melakukan panggilan API Core Midtrans `refund` menggunakan `serverKey`. Setelah sukses, status diubah menjadi `'cancel'` dan langganan dihentikan secara permanen.

---

### SF-4: Gamification Badge CRUD

#### Kebutuhan Fungsional:
Memungkinkan penyesuaian target pencapaian dan penambahan lencana gamifikasi tanpa modifikasi kode manual.

#### Database Constraint Rules:
* Tipe pencapaian wajib terdaftar dalam enum: `'TRANSACTION_COUNT'`, `'STREAK_DAYS'`, `'GOAL_COMPLETED'`, `'DEBT_SETTLED'`.
* Hadiah XP (*XP Reward*) minimal bernilai `10 XP` dan maksimal `10000 XP`.

---

### SF-5: Headless Blog Markdown Editor & ISR User Page Delivery

#### Kebutuhan Fungsional:
Sistem authoring artikel panduan produktivitas dan finansial.

#### SF-5.1: Media Upload Pipeline (Cloudflare R2 + S3-Compatible API)
Untuk efisiensi penyimpanan, skalabilitas tinggi, dan **bebas biaya bandwidth keluar (Zero Egress Fees)**, media/gambar blog diunggah langsung ke **Cloudflare R2** menggunakan pola *Presigned Upload URL* (bukan diunggah melalui server admin untuk menghemat memori serverless).

##### Alur Kerja Unggah Media:
```
[Admin Client Editor] -> (1. Request Presigned URL) -> [Admin Backend API]
                                                           |
                                                (2. Generate S3-Sign with R2 Keys)
                                                           |
                                                           v
[Admin Client Editor] <- (3. Return Upload URL & CDN URL) --+
         |
         +---------> (4. Direct HTTPS PUT File Payload) ---> [Cloudflare R2 Bucket]
         |
         v
[Admin Client Editor] -> (5. Embed CDN Link to Markdown) -> [Post Draft Saved]
```

##### API Specification: `GET /api/admin/blog/media/presigned-url`
* **Query Parameters**:
  * `filename`: `laporan-keuangan.jpg`
  * `contentType`: `image/jpeg`
* **Response Payload (Success - 200 OK)**:
```json
{
  "upload_url": "https://<account-id>.r2.cloudflarestorage.com/ngaturin-blog/blog/laporan-keuangan-1715.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&...",
  "cdn_url": "https://cdn.ngaturin.com/blog/laporan-keuangan-1715.jpg"
}
```

##### Deskripsi Proses:
1. Admin menyeret atau memilih gambar di WYSIWYG editor.
2. Admin Client memanggil `GET /api/admin/blog/media/presigned-url`.
3. Admin Backend menggunakan pustaka `@aws-sdk/client-s3` dan `@aws-sdk/s3-request-presigner` yang dikonfigurasi dengan Kunci Kredensial R2 untuk membuat tautan unggah sementara bertanda-tangan (aktif selama 5 menit).
4. Admin Client melakukan aksi `PUT` biner langsung ke `upload_url`.
5. Setelah unggah sukses (Response 200 dari Cloudflare R2), editor otomatis menyematkan `cdn_url` ke dalam konten Markdown. Tautan `cdn_url` ini dihubungkan langsung dengan fitur **Cloudflare Edge Cache** untuk pemuatan gambar di sisi pembaca dalam hitungan milidetik secara gratis.

#### SF-5.2: Alur Kerja Penyebaran Konten Blog:
1. Admin menulis konten menggunakan komponen WYSIWYG editor di Admin App.
2. Saat menekan tombol **Publish**, Admin App mengirim request ke `POST /api/admin/blog/publish`.
3. Server memicu database insert ke `public.blog_posts` dan memanggil Webhook On-Demand Revalidation Next.js di User App (`/api/revalidate?secret=...&path=/blog`).
4. Halaman blog pengguna langsung ter-update secara instan tanpa perlu rebuild ulang proyek User App.

---

## 5. Non-functional Requirements

### 5.1 Security Requirements
1. **Otorisasi JWT Berlapis**: Kunci enkripsi token verifikasi wajib menggunakan algoritma enkripsi minimum `HS256`.
2. **Access Control Checks**: Middleware wajib memverifikasi nilai dari properti `role` dari tabel `user_profiles` dengan aturan:
```typescript
if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'moderator')) {
  return new Response(JSON.stringify({ error: "Access Denied: Admin role required" }), { status: 403 });
}
```
3. **Database Security Policy**: Kunci token `service_role` Supabase wajib dijaga secara ketat dan dilarang keras digunakan di luar modul backend API terenkripsi.

### 5.2 Performance Requirements
1. **Dashboard Loading Time**: Halaman data visualisasi analitik admin wajib dimuat dalam waktu kurang dari **2.0 detik** dengan koneksi internet standar (3G/4G).
2. **Batch Query Processing**: Operasi penarikan riwayat transaksi massal untuk ekspor PDF/Excel dibatasi maksimal **1000 baris per eksekusi** untuk menghindari degradasi performa PostgreSQL.

### 5.3 Reliability and Availability
* **Uptime Target**: Admin System dirancang untuk mencapai ketersediaan layanan (*uptime*) minimum **99.9%** per bulan.
* **Graceful Degradation**: Jika koneksi eksternal (Midtrans / Yahoo Finance) terputus, sistem harus tetap berjalan normal dengan menampilkan pesan penundaan sinkronisasi tanpa menyebabkan crash pada antarmuka utama.

### 5.4 Compliance with Personal Data Protection (UU PDP)
Untuk memenuhi ketentuan hukum Undang-Undang Pelindungan Data Pribadi (UU PDP) Indonesia:
1. **Hak Dihapus (Hard Delete)**: Sistem wajib menyediakan tombol pembersihan total data riil pengguna secara instan dari seluruh tabel relasional.
2. **Data Minimization**: Log aktivitas administratif hanya mencatat ID pengguna yang mengalami mutasi tanpa mencantumkan teks email atau nama lengkap secara terang-terangan (menghindari kebocoran PII - *Personally Identifiable Information*).
