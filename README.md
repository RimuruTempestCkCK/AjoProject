# 🚀 AjoProject - Platform Top-Up Pulsa & API Gateway System

**AjoProject** adalah ekosistem aplikasi pengelolaan dan pemrosesan transaksi top-up pulsa, paket data, dan e-wallet. Proyek ini terdiri dari dua modul utama: portal web manajemen transaksi berbasis **ASP.NET MVC** ([AjoTopup](file:///C:/Users/Maxtop/Downloads/AjoProject/AjoTopup)) dan engine API gateway modern berbasis **Node.js Express & React** ([AjoAPI](file:///C:/Users/Maxtop/Downloads/AjoProject/AjoAPI)).

---

## 📑 Daftar Isi

- [Struktur Proyek](#-struktur-proyek)
- [Fitur Utama](#-fitur-utama)
- [Teknologi yang Digunakan](#-teknologi-yang-digunakan)
- [🗄️ Arsitektur Integrasi & Database Supabase](#️-arsitektur-integrasi--database-supabase)
- [Panduan Memulai & Cara Menjalankan](#-panduan-memulai--cara-menjalankan)
  - [1. Menjalankan AjoAPI (Node.js API Engine & Dashboard)](#1-menjalankan-ajoapi-nodejs-api-engine--dashboard)
  - [2. Menjalankan AjoTopup (ASP.NET MVC Portal)](#2-menjalankan-ajotopup-aspnet-mvc-portal)
- [Panduan Deployment AjoAPI ke Vercel](#-panduan-deployment-ajoapi-ke-vercel)
- [Dokumentasi Terkait](#-dokumentasi-terkait)

---

## 📁 Struktur Proyek

```text
AjoProject/
├── AjoTopup/                        # Web Portal (ASP.NET MVC 5 / .NET C#)
│   ├── Controllers/                 # Controller MVC (Transaction, Product, Account, Provider)
│   ├── Models/                      # Model Data & ViewModel
│   ├── Views/                       # Halaman UI Razor (.cshtml)
│   ├── Database_Setup.sql           # Schema & Initial Seed SQL Server (Lokal)
│   └── Database_Setup_Supabase.sql  # Schema & Initial Seed PostgreSQL (Supabase Cloud)
│   └── AjoTopup.sln                 # Visual Studio Solution File
│
├── AjoAPI/                          # API Engine & Dashboard (Node.js Express + React Vite)
│   ├── server.js                    # Express REST API Engine (Endpoints & Provider Simulator)
│   ├── src/                         # React Admin Dashboard UI
│   ├── api/                         # Vercel Serverless Function Handlers
│   └── package.json                 # Node.js Dependencies & Scripts
│
├── AJOTOPUP_DOKUMENTASI_LENGKAP.md # Panduan Arsitektur & Spesifikasi Detail
└── DESIGN.md                        # Panduan Desain & UI/UX System
```

---

## ✨ Fitur Utama

- 🔐 **Multi-Role Authentication**: Akses khusus untuk Admin, Operator, dan Manager.
- 📱 **Manajemen Produk Master**: Pengelolaan kode produk, harga jual, komisi, dan status aktif/non-aktif.
- 🔄 **Pemrosesan Transaksi Real-time**: Pembentukan ID transaksi unik, validasi format nomor tujuan, serta simulasi pemrosesan provider.
- 🌐 **Provider Gateway Simulator**: Simulasi integrasi dengan provider telekomunikasi (Telkomsel, Indosat, XL, Axis, PLN, DANA, OVO, GoPay) beserta pemantauan status maintenance & latensi.
- 📊 **Logging & Trace System**: Pencatatan lengkap request/response API (MVC to API & API to Provider) untuk kemudahan auditing dan debugging.
- 📈 **Dashboard Analytics**: Grafis ringkasan performa transaksi, rasio sukses/gagal, dan total komisi.

---

## 🛠️ Teknologi yang Digunakan

### **AjoTopup (Web Portal)**
- **Framework**: ASP.NET MVC 5 (.NET Framework 4.7.2+)
- **Language**: C#
- **Database**: SQL Server 2016+ (Environment Lokal)
- **Frontend**: HTML5, CSS3, Bootstrap 4, jQuery

### **AjoAPI (API Gateway & Simulator)**
- **Engine**: Node.js & Express.js (REST API)
- **Frontend Admin**: React 19, Vite, Lucide React
- **Deployment Ready**: Vercel Serverless Functions
- **Database Cloud Target**: Supabase (PostgreSQL Cloud)

---

## 🗄️ Arsitektur Integrasi & Database Supabase

### ❓ Mengapa Perlu Database Supabase untuk Deployment Vercel?
Di server lokal (`localhost`), `AjoAPI` menggunakan variabel JavaScript (In-Memory Store) di memori RAM. Namun di **Vercel**, server berjalan sebagai **Serverless Functions** yang bisa mati/restart sewaktu-waktu. 

Oleh karena itu, **Supabase PostgreSQL** digunakan sebagai tempat penyimpanan data cloud permanen agar data transaksi, produk, dan provider tidak hilang saat serverless function Vercel restart.

### 🔄 Alur Komunikasi Data Transaksi

```text
[ User / Admin ]
       │
       ▼
 [ AjoTopup (Web Portal) ]
       │
       │ (1) Kirim HTTP POST /api/transaction
       ▼
 [ AjoAPI (Vercel Serverless Function) ]
       │
       ├── (2) Cek & Simulasi Respon Provider (Telkomsel/Indosat/dll)
       │
       │ (3) Simpan & Update Data Transaksi ke Database
       ▼
 [ Supabase PostgreSQL (Cloud Database) ]
```

---

### 📋 Alur Integrasi Step-by-Step ke Supabase

#### Step 1: Membuat Project & Database di Supabase
1. Daftar/Login ke [Supabase.com](https://supabase.com).
2. Klik **New Project**, beri nama `AjoAPI-DB`, tentukan password database, dan pilih region terdekat (misal Singapore).
3. Setelah project siap, masuk ke **Project Settings -> Database** dan salin **Connection String (URI)** atau **API Keys (URL & Anon Key)**.

#### Step 2: Membuat Tabel & Seed Data di Supabase (SQL Editor)
1. Buka file [Database_Setup_Supabase.sql](file:///C:/Users/Maxtop/Downloads/AjoProject/Database_Setup_Supabase.sql) yang sudah saya siapkan khusus untuk Supabase (PostgreSQL).
2. Copy seluruh isi file tersebut.
3. Buka tab **SQL Editor** di Dashboard Supabase, paste kodenya, lalu klik tombol **Run**. Kueri ini akan otomatis membuat seluruh tabel (`Users`, `Roles`, `Products`, `Transactions`, `Providers`, `SystemSettings`, dll), view analitik, serta data sampel awal secara otomatis!


```sql
-- 1. Tabel Produk
CREATE TABLE products (
  code VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  price INT NOT NULL,
  commission INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- 2. Tabel Providers
CREATE TABLE providers (
  code VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  balance BIGINT DEFAULT 0,
  avg_latency_ms INT DEFAULT 0
);

-- 3. Tabel Transaksi
CREATE TABLE transactions (
  trx_id VARCHAR(50) PRIMARY KEY,
  product_code VARCHAR(50) REFERENCES products(code),
  product_name VARCHAR(100),
  destination VARCHAR(20) NOT NULL,
  amount INT NOT NULL,
  commission INT NOT NULL,
  status VARCHAR(20) NOT NULL,
  provider_status VARCHAR(20),
  provider_message TEXT,
  serial_number VARCHAR(100),
  request_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  response_date TIMESTAMP WITH TIME ZONE,
  response_time INT,
  created_by VARCHAR(50)
);

-- 4. Tabel API Logs
CREATE TABLE api_logs (
  id SERIAL PRIMARY KEY,
  trx_id VARCHAR(50),
  log_type VARCHAR(50),
  url VARCHAR(255),
  req_body TEXT,
  status_code INT,
  res_body TEXT,
  exec_time INT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Step 3: Menghubungkan AjoAPI ke Supabase
Di folder `AjoAPI`, install driver postgres / client library:
```bash
cd AjoAPI
npm install pg dotenv
```
Atau menggunakan official client:
```bash
npm install @supabase/supabase-js
```

Di Vercel Dashboard, masukkan Environment Variable:
* `DATABASE_URL` = `postgres://postgres.[project-ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`

---

## 🚀 Panduan Memulai & Cara Menjalankan

### 1. Menjalankan AjoAPI (Node.js API Engine & Dashboard)

#### Prasyarat:
- Node.js (v18.x atau versi lebih baru)
- npm

#### Langkah-langkah:
```bash
# 1. Masuk ke direktori AjoAPI
cd AjoAPI

# 2. Install dependensi
npm install

# 3. Jalankan server API & UI secara concurrent (Mode Development)
npm run dev
```
* **API Engine**: Berjalan di `http://localhost:5000`
* **Dashboard UI**: Berjalan di `http://localhost:5173`

---

### 2. Menjalankan AjoTopup (ASP.NET MVC Portal)

#### Prasyarat:
- Visual Studio 2019 / 2022 Community Edition
- SQL Server & SQL Server Management Studio (SSMS)

#### Langkah-langkah:
1. **Setup Database**:
   - Buka SSMS, jalankan skrip `AjoTopup/Database_Setup.sql` untuk membuat database dan tabel yang dibutuhkan.
2. **Buka Proyek**:
   - Buka file `AjoTopup/AjoTopup.sln` di Visual Studio.
3. **Konfigurasi Connection String**:
   - Sesuaikan `Web.config` pada bagian `<connectionStrings>` dengan nama server SQL Server lokal Anda.
4. **Jalankan Aplikasi**:
   - Tekan **F5** atau klik ikon **IIS Express** di Visual Studio.

---

## ☁️ Panduan Deployment AjoAPI ke Vercel

`AjoAPI` dirancang agar mudah di-deploy ke **Vercel** sebagai serverless API gateway.

### 1. File Konfigurasi `vercel.json`
Buat file `vercel.json` di dalam folder `AjoAPI`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

### 2. Set Up Environment Variables di Vercel
Tambahkan Variable `DATABASE_URL` (Connection String Supabase PostgreSQL) di Vercel Dashboard pada menu **Project Settings -> Environment Variables**.

### 3. Command Deployment
```bash
cd AjoAPI
npx vercel
```

---

## 📚 Dokumentasi Terkait

- 📖 [Dokumentasi Lengkap AjoTopup](file:///C:/Users/Maxtop/Downloads/AjoProject/AJOTOPUP_DOKUMENTASI_LENGKAP.md): Penjelasan rinci arsitektur, skema database, alur transaksi, dan API spec.
- 🎨 [Panduan Desain (DESIGN.md)](file:///C:/Users/Maxtop/Downloads/AjoProject/DESIGN.md): Dokumentasi UI/UX dan design system.
