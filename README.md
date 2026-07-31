# 🚀 AjoProject - Platform Top-Up Pulsa & API Gateway System

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-18.x-green?logo=node.js)
![Express](https://img.shields.io/badge/Express-5.x-blue?logo=express)
![React](https://img.shields.io/badge/React-19.x-61dafb?logo=react)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel)
![Swagger](https://img.shields.io/badge/Swagger-OpenAPI_3.0-green?logo=swagger)

**AjoProject** adalah ekosistem aplikasi pengelolaan dan pemrosesan transaksi top-up pulsa, paket data, dan e-wallet dengan arsitektur microservice modern.

</div>

---

## 📑 Daftar Isi

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🎯 Core Features
- ✅ **Multi-Role Authentication** - Admin, Operator, and Manager access levels
- ✅ **Real-time Transaction Processing** - Instant top-up with provider simulation
- ✅ **Provider Gateway Simulator** - Simulates Telkomsel, Indosat, XL, Axis, PLN, DANA, OVO, GoPay
- ✅ **Comprehensive Logging** - Full request/response audit trail
- ✅ **Interactive API Documentation** - Swagger UI for API exploration
- ✅ **Cloud Database** - Supabase PostgreSQL for persistent storage

### 📊 Dashboard Features
- ✅ **Real-time Analytics** - Transaction metrics and success rates
- ✅ **Provider Status Monitoring** - Active/Maintenance status tracking
- ✅ **Transaction History** - Searchable and filterable transaction logs
- ✅ **Commission Tracking** - Automatic commission calculation

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                           │
├─────────────────────────────────────────────────────────────┤
│  AjoTopup (ASP.NET MVC)    │    AjoAPI Dashboard (React)    │
│  - Transaction Portal      │    - Admin Dashboard           │
│  - User Management         │    - Real-time Analytics       │
│  - Product Catalog         │    - Provider Monitoring       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                      │
├─────────────────────────────────────────────────────────────┤
│                    AjoAPI (Express.js)                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │  REST API       │  │  Swagger UI     │  │  Provider   │ │
│  │  Endpoints      │  │  Documentation  │  │  Simulator  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATABASE LAYER                          │
├─────────────────────────────────────────────────────────────┤
│               Supabase PostgreSQL (Cloud)                    │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Products  │  │ Transactions│  │  Providers │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 18.x+ | Runtime environment |
| **Express** | 5.x | REST API framework |
| **PostgreSQL** | 14+ | Database (via Supabase) |
| **pg** | 8.x | PostgreSQL client |

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19.x | UI library |
| **Vite** | 8.x | Build tool |
| **Lucide React** | 1.27+ | Icons |
| **Tailwind CSS** | 3.x | Styling |

### API Documentation
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Swagger UI** | 5.9.0 | Interactive API docs |
| **OpenAPI** | 3.0.0 | API specification |

### Deployment
| Technology | Purpose |
|-----------|---------|
| **Vercel** | Serverless hosting |
| **Supabase** | Cloud database |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **Supabase Account** (for cloud database)

### 1️⃣ Clone Repository

```bash
git clone https://github.com/RimuruTempestCkCK/AjoProject.git
cd AjoProject
```

### 2️⃣ Setup AjoAPI

```bash
cd AjoAPI

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
DATABASE_URL=your_supabase_connection_string
EOF

# Run development server
npm run api
```

**Access Points:**
- 🌐 **Dashboard UI**: http://localhost:5000
- 📚 **Swagger UI**: http://localhost:5000/api/docs
- 🔌 **API Endpoints**: http://localhost:5000/api/*

### 3️⃣ Setup AjoTopup (Optional)

```bash
cd ../AjoTopup

# Open in Visual Studio
# Open AjoTopup.sln file

# Update connection string in Web.config
# Run with F5
```

---

## 📚 API Documentation

### 🌟 Swagger UI

Interactive API documentation is available at:
```
http://localhost:5000/api/docs
```

**Features:**
- ✅ Try It Out - Test endpoints directly from browser
- ✅ Request/Response schemas
- ✅ Authentication examples
- ✅ Error response documentation

### 📖 Available Endpoints

#### Health Check
```http
GET /api/health
```
Returns service health status and database connectivity.

#### Products
```http
GET /api/products
```
Returns list of all available products (Pulsa, PLN, E-Wallet).

**Response:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "code": "TSEL10",
      "name": "Telkomsel 10.000",
      "provider": "Telkomsel",
      "category": "PULSA",
      "price": 10500,
      "commission": 250,
      "isActive": true
    }
  ]
}
```

#### Providers
```http
GET /api/providers
```
Returns list of all payment providers.

#### Toggle Provider Status
```http
POST /api/provider/toggle
Content-Type: application/json

{
  "providerCode": "TSEL"
}
```
Toggle provider between ACTIVE and MAINTENANCE status.

#### Create Transaction
```http
POST /api/transaction
Content-Type: application/json

{
  "productCode": "TSEL10",
  "destination": "081234567890",
  "createdBy": "operator1"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "Transaction processed successfully",
  "data": {
    "trxId": "TRX2026072900001",
    "productCode": "TSEL10",
    "productName": "Telkomsel 10.000",
    "destination": "081234567890",
    "amount": 10500,
    "commission": 250,
    "status": "SUCCESS",
    "serialNumber": "SN89210982310",
    "requestDate": "2026-07-29T10:00:00.000Z",
    "responseDate": "2026-07-29T10:00:00.300Z",
    "responseTime": 300
  }
}
```

#### Get Transactions
```http
GET /api/transaction?pageNumber=1&pageSize=10&status=SUCCESS
```

**Query Parameters:**
- `pageNumber` - Page number (default: 1)
- `pageSize` - Items per page (default: 10)
- `status` - Filter by status (SUCCESS, FAILED, PENDING)
- `productCode` - Filter by product code

#### Get Transaction Details
```http
GET /api/transaction/:id
```
Returns transaction details with complete audit logs.

#### Get Statistics
```http
GET /api/stats
```
Returns real-time transaction statistics.

#### Get API Logs
```http
GET /api/logs
```
Returns last 50 API request/response logs.

---

## ☁️ Deployment

### Vercel Deployment

#### 1. Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

```
DATABASE_URL=your_supabase_connection_string
```

#### 2. Deploy

```bash
# Login to Vercel
npx vercel login

# Deploy to production
npx vercel --prod
```

#### 3. Configuration

The `vercel.json` is already configured:
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server.js"
    },
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

### Supabase Setup

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Run SQL migrations from `Database_Setup_Supabase.sql`
4. Copy connection string to Vercel environment variables

---

## 📁 Project Structure

```
AjoProject/
│
├── AjoAPI/                          # Node.js API Engine & Dashboard
│   ├── server.js                    # Express API server (main entry point)
│   ├── swagger.js                   # OpenAPI 3.0 specification
│   ├── src/                         # React dashboard source
│   ├── api/                         # Vercel serverless functions
│   ├── dist/                        # Built React app
│   ├── package.json                 # Dependencies
│   ├── vercel.json                  # Vercel configuration
│   └── .env.example                 # Environment template
│
├── AjoTopup/                        # ASP.NET MVC Portal
│   ├── Controllers/                 # MVC controllers
│   ├── Models/                      # Data models
│   ├── Views/                       # Razor views
│   ├── Database_Setup.sql           # SQL Server setup
│   └── Database_Setup_Supabase.sql  # PostgreSQL setup
│
├── DEPLOYMENT_GUIDE.md             # Deployment instructions
├── PROJECT_FIX_SUMMARY.md          # Issue resolution log
└── README.md                       # This file
```

---

## 🔧 Development

### Available Scripts

```bash
# Run API server only
npm run api

# Run React dev server only
npm run ui

# Run both concurrently
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### API Testing

Use the interactive Swagger UI at `/api/docs` or test with curl:

```bash
# Health check
curl http://localhost:5000/api/health

# Get products
curl http://localhost:5000/api/products

# Create transaction
curl -X POST http://localhost:5000/api/transaction \
  -H "Content-Type: application/json" \
  -d '{"productCode":"TSEL10","destination":"081234567890"}'
```

---

## 🐛 Troubleshooting

### Common Issues

**1. Port already in use**
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process
taskkill /PID <process_id> /F
```

**2. Database connection failed**
- Verify `DATABASE_URL` in `.env`
- Check Supabase project status
- Ensure IP whitelist allows your address

**3. Swagger UI not loading**
```bash
# Kill all node processes
taskkill //F //IM node.exe //T

# Restart server
npm run api
```

---

## 📊 Performance

- **Response Time**: ~250ms average
- **Success Rate**: 90% (simulated)
- **Database**: Supabase PostgreSQL (99.9% uptime)
- **Deployment**: Vercel Serverless (auto-scaling)

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📧 Contact

**Project Link**: https://github.com/RimuruTempestCkCK/AjoProject

**Documentation**:
- [Swagger UI](http://localhost:5000/api/docs) - Interactive API docs
- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Deployment instructions
- [Project Fix Summary](PROJECT_FIX_SUMMARY.md) - Issue resolutions

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

Made with ❤️ by RimuruTempestCkCK

</div>

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
