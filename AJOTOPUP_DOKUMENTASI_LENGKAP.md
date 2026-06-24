# AjoTopup - Dokumentasi Lengkap & Detail

**Versi:** 1.0  
**Status:** Development Guide  
**Last Updated:** Juni 2024

---

## 📋 Table of Contents

1. [Ringkasan Eksekutif](#ringkasan-eksekutif)
2. [Prasyarat Sistem](#prasyarat-sistem)
3. [Gambaran Umum Sistem](#gambaran-umum-sistem)
4. [Arsitektur & Flow](#arsitektur--flow)
5. [Database Design](#database-design)
6. [Struktur Project](#struktur-project)
7. [Setup & Inisialisasi](#setup--inisialisasi)
8. [Fitur Detail & Implementasi](#fitur-detail--implementasi)
9. [API Specification](#api-specification)
10. [Alur Transaksi Detailed](#alur-transaksi-detailed)
11. [Panduan Implementasi Per Module](#panduan-implementasi-per-module)
12. [Checklist Development](#checklist-development)

---

## Ringkasan Eksekutif

### Apa itu AjoTopup?

**AjoTopup** adalah aplikasi web untuk mengelola transaksi top-up pulsa telekomunikasi. Sistem ini menghubungkan operator/admin melalui portal web dengan gateway API yang kemudian mengintegrasikan dengan provider telekomunikasi (dalam tahap development, menggunakan fake provider untuk simulasi).

### Tujuan Pembelajaran

Dengan mengimplementasikan AjoTopup, Anda akan mempelajari:

- **ASP.NET MVC** → User interface dan business logic presentation
- **ASP.NET Web API** → RESTful API design dan implementation
- **SQL Server** → Database design, queries, dan transaction management
- **Arsitektur Gateway** → Integration pattern, request-response handling
- **Logging & Monitoring** → Request/response logging, transaction tracking
- **Authentication & Authorization** → Role-based access control
- **HTTP Client** → External service integration
- **JSON Handling** → Request/response serialization

### Key Features

✅ Multi-role authentication (Admin, Operator, Manager)  
✅ Pulsa product master management  
✅ Transaction processing dengan state tracking  
✅ Real-time transaction history & detail  
✅ Provider integration simulator  
✅ Request/response logging system  
✅ Dashboard dengan analytics  
✅ Transaction filtering & search  

### Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | ASP.NET MVC 5+, HTML5, CSS3, Bootstrap, jQuery |
| **Backend API** | ASP.NET Web API 2+ |
| **Provider Simulator** | ASP.NET Web API |
| **Database** | SQL Server 2016+ |
| **ORM** | Entity Framework 6+ atau Dapper |
| **Logging** | NLog atau Serilog |
| **HTTP Client** | HttpClient (.NET) |

---

## Prasyarat Sistem

### Software Requirements

```
✓ Visual Studio 2019 / 2022 Community Edition (Free)
✓ .NET Framework 4.7.2+ atau .NET 6+
✓ SQL Server 2016 Express (Free)
✓ SQL Server Management Studio (SSMS)
✓ Git
```

### NuGet Packages Yang Dibutuhkan

```
AjoTopup.Web
├── Bootstrap (4.6+)
├── jQuery (3.6+)
├── Entity Framework (6.4+)

AjoTopup.Api
├── Entity Framework (6.4+)
├── NLog (4.7+)
├── Newtonsoft.Json (13+)

AjoTopup.Provider
├── Newtonsoft.Json (13+)

Database
├── Entity Framework Tools
```

### Hardware Requirements

- RAM: Minimum 4GB (8GB recommended)
- Storage: 2GB untuk VS, SQL Server, dan project
- Processor: Intel i5 / i7 atau equivalent

---

## Gambaran Umum Sistem

### Konsep Bisnis

AjoTopup adalah **platform transaksi pulsa** yang berfokus pada:

1. **User Portal** → Operator/Admin input transaksi
2. **API Gateway** → Proses dan validasi transaksi
3. **Provider Integration** → Hubungi provider untuk top-up

### Domain Business

**Yang Disupport:**
- Telkomsel: 5.000, 10.000, 20.000, 50.000
- Indosat: 5.000, 10.000, 20.000
- XL Axiata: 5.000, 10.000, 25.000
- Axis: 5.000, 10.000, 20.000

**Yang Tidak Disupport (v1):**
- Paket data
- Token listrik
- Voucher game
- Transfer e-wallet
- Pembayaran tagihan

### Pengguna & Role

```
┌─────────────────────────────────────────────────────────────────┐
│                          AJOTOPUP USERS                          │
└─────────────────────────────────────────────────────────────────┘

1. ADMIN
   ├── Login & authentication
   ├── Kelola user (CRUD)
   ├── Kelola produk pulsa (CRUD)
   ├── Lihat semua transaksi (global view)
   ├── Akses log request/response
   └── Akses full dashboard

2. OPERATOR / CS (Customer Service)
   ├── Login & authentication
   ├── Input transaksi pulsa
   ├── Cek status transaksi
   ├── Lihat histori transaksi personal
   ├── Export laporan transaksi
   └── Akses dashboard dasar

3. MANAGER
   ├── Login & authentication
   ├── Lihat dashboard analytics
   ├── Lihat laporan transaksi (grouped)
   ├── Analisis performa produk
   ├── Export laporan
   └── View tidak boleh akses manage user/produk
```

---

## Arsitektur & Flow

### Arsitektur Sistem Keseluruhan

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│                         AjoTopup Web Portal                             │
│                       (ASP.NET MVC - Frontend)                          │
│                                                                          │
│  [Login] → [Dashboard] → [Transaksi] → [Histori] → [Detail] → [Logout]│
│                                                                          │
└──────────────────────────┬─────────────────────────────────────────────┘
                           │ HTTP Request/Response
                           │ (JSON Payload)
                           ▼
┌────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│                    AjoTopup API Gateway (Backend)                       │
│                      (ASP.NET Web API)                                  │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │  Controller  │  │  Service     │  │  Repository  │  │ Logging    │ │
│  │  (Endpoints) │→ │  (Business   │→ │  (Database   │→ │ (Requests) │ │
│  │              │  │   Logic)     │  │   Access)    │  │            │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘ │
│                                                                          │
└──────────────────────────┬─────────────────────────────────────────────┘
                           │ HTTP Request/Response
                           │ (JSON Payload)
                           ▼
┌────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│              AjoTopup Provider Simulator (Fake Provider)                │
│                    (ASP.NET Web API)                                    │
│                                                                          │
│  Menerima request → Process (random SUCCESS/FAILED) → Return response   │
│                                                                          │
└────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                     SQL Server Database                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐│
│  │  Users       │ │  Products    │ │ Transactions │ │TransactionLogs   ││
│  │              │ │              │ │              │ │                  ││
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────────┘│
└──────────────────────────────────────────────────────────────────────────┘
```

### System Flow Diagram

```
User opens AjoTopup.Web
       │
       ├─► Not logged in? → Login Page
       │                    (Authenticate against DB)
       │
       └─► Logged in? → Dashboard
                       │
                       ├─► Master Products (Admin only)
                       │   ├─ View all products
                       │   ├─ Add product
                       │   └─ Edit/Delete product
                       │
                       ├─► New Transaction (Operator)
                       │   ├─ Select product
                       │   ├─ Input destination number
                       │   └─ Click "PROCESS"
                       │       │
                       │       └─► Call AjoTopup.Api/transaction
                       │           │
                       │           ├─ Validate product exists
                       │           ├─ Validate phone number
                       │           ├─ Generate TrxId
                       │           ├─ Save to DB (status=PENDING)
                       │           │
                       │           └─ Call AjoTopup.Provider/topup
                       │               │
                       │               ├─ Return SUCCESS
                       │               │  └─ Save SN
                       │               │
                       │               └─ Return FAILED
                       │                  └─ Save error message
                       │
                       │           ├─ Update DB (status=SUCCESS/FAILED)
                       │           └─ Return result to Web
                       │       │
                       │       └─► Show result to user
                       │
                       ├─► History (All users)
                       │   ├─ View all transactions (Admin/Manager global)
                       │   ├─ View personal transactions (Operator)
                       │   ├─ Filter by date, status, product, number
                       │   └─ Search transaction
                       │
                       ├─► Detail (All users)
                       │   ├─ View full transaction detail
                       │   ├─ View request sent to provider
                       │   ├─ View response from provider
                       │   └─ View request/response timestamps
                       │
                       ├─► Dashboard (All users)
                       │   ├─ Total transactions today
                       │   ├─ Success/Failed count
                       │   ├─ Pending transactions
                       │   ├─ Revenue summary
                       │   └─ Top products
                       │
                       └─► Logout
```

---

## Database Design

### Complete Database Schema

#### Tabel 1: Users

```sql
CREATE TABLE Users
(
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Username VARCHAR(50) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    FullName VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NULL,
    PhoneNumber VARCHAR(20) NULL,
    RoleName VARCHAR(20) NOT NULL, -- Admin / Operator / Manager
    IsActive BIT NOT NULL DEFAULT 1,
    LastLoginDate DATETIME NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    CreatedBy VARCHAR(50) NULL,
    UpdatedDate DATETIME NULL,
    UpdatedBy VARCHAR(50) NULL,
    CONSTRAINT CK_RoleName CHECK (RoleName IN ('Admin', 'Operator', 'Manager'))
);

-- Index
CREATE INDEX IDX_Users_Username ON Users(Username);
CREATE INDEX IDX_Users_RoleName ON Users(RoleName);
CREATE INDEX IDX_Users_IsActive ON Users(IsActive);
```

**Sample Data:**
```
Id | Username | PasswordHash | FullName | RoleName | IsActive
1  | admin1   | [hash]       | Admin User | Admin | 1
2  | operator1 | [hash]      | Operator CS | Operator | 1
3  | manager1 | [hash]       | Manager | Manager | 1
```

---

#### Tabel 2: Products

```sql
CREATE TABLE Products
(
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ProductCode VARCHAR(20) NOT NULL UNIQUE,
    ProductName VARCHAR(100) NOT NULL,
    ProviderCode VARCHAR(20) NULL,
    Provider VARCHAR(50) NOT NULL, -- Telkomsel, Indosat, XL, Axis
    Price DECIMAL(18,2) NOT NULL,
    Commission DECIMAL(18,2) NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    CreatedBy VARCHAR(50) NULL,
    UpdatedDate DATETIME NULL,
    UpdatedBy VARCHAR(50) NULL,
    CONSTRAINT CK_Provider CHECK (Provider IN ('Telkomsel', 'Indosat', 'XL', 'Axis')),
    CONSTRAINT CK_Price CHECK (Price > 0)
);

-- Index
CREATE INDEX IDX_Products_ProductCode ON Products(ProductCode);
CREATE INDEX IDX_Products_IsActive ON Products(IsActive);
CREATE INDEX IDX_Products_Provider ON Products(Provider);
```

**Sample Data:**
```
ProductCode | ProductName | Provider | Price
TSEL5       | Telkomsel 5K | Telkomsel | 5000
TSEL10      | Telkomsel 10K | Telkomsel | 10000
ISAT5       | Indosat 5K | Indosat | 5000
XL10        | XL 10K | XL | 10000
AXIS25      | Axis 25K | Axis | 25000
```

---

#### Tabel 3: Transactions

```sql
CREATE TABLE Transactions
(
    Id INT IDENTITY(1,1) PRIMARY KEY,
    TrxId VARCHAR(50) NOT NULL UNIQUE,
    ProductCode VARCHAR(20) NOT NULL,
    Destination VARCHAR(20) NOT NULL,
    Status VARCHAR(20) NOT NULL, -- PENDING / SUCCESS / FAILED
    ProviderStatus VARCHAR(20) NULL, -- Response status dari provider
    ProviderMessage VARCHAR(255) NULL, -- Response message dari provider
    SerialNumber VARCHAR(100) NULL, -- SN dari provider jika sukses
    Amount DECIMAL(18,2) NOT NULL, -- Harga produk saat transaksi
    Commission DECIMAL(18,2) NULL DEFAULT 0,
    RequestDate DATETIME NOT NULL DEFAULT GETDATE(),
    ResponseDate DATETIME NULL,
    ResponseTime INT NULL, -- Milliseconds
    CreatedBy VARCHAR(50) NOT NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedDate DATETIME NULL,
    CONSTRAINT CK_TrxStatus CHECK (Status IN ('PENDING', 'SUCCESS', 'FAILED')),
    CONSTRAINT FK_Transactions_Products FOREIGN KEY (ProductCode) 
        REFERENCES Products(ProductCode),
    CONSTRAINT FK_Transactions_Users FOREIGN KEY (CreatedBy) 
        REFERENCES Users(Username)
);

-- Indexes
CREATE INDEX IDX_Transactions_TrxId ON Transactions(TrxId);
CREATE INDEX IDX_Transactions_Status ON Transactions(Status);
CREATE INDEX IDX_Transactions_CreatedBy ON Transactions(CreatedBy);
CREATE INDEX IDX_Transactions_RequestDate ON Transactions(RequestDate);
CREATE INDEX IDX_Transactions_Destination ON Transactions(Destination);
CREATE INDEX IDX_Transactions_ProductCode ON Transactions(ProductCode);
```

**Sample Data:**
```
TrxId | ProductCode | Destination | Status | RequestDate | CreatedBy
TRX202406240001 | TSEL10 | 081234567890 | SUCCESS | 2024-06-24 10:30:00 | operator1
TRX202406240002 | ISAT5 | 082345678901 | PENDING | 2024-06-24 10:31:00 | operator1
TRX202406240003 | XL10 | 083456789012 | FAILED | 2024-06-24 10:32:00 | operator2
```

---

#### Tabel 4: TransactionLogs

```sql
CREATE TABLE TransactionLogs
(
    Id INT IDENTITY(1,1) PRIMARY KEY,
    TrxId VARCHAR(50) NOT NULL,
    LogType VARCHAR(50) NOT NULL, -- MVC_TO_API / API_TO_PROVIDER / API_RESPONSE
    RequestUrl VARCHAR(255) NULL,
    RequestHeaders NVARCHAR(MAX) NULL,
    RequestBody NVARCHAR(MAX) NOT NULL,
    ResponseStatusCode INT NULL,
    ResponseHeaders NVARCHAR(MAX) NULL,
    ResponseBody NVARCHAR(MAX) NULL,
    ExecutionTime INT NULL, -- Milliseconds
    ErrorMessage NVARCHAR(MAX) NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_TransactionLogs_Transactions FOREIGN KEY (TrxId) 
        REFERENCES Transactions(TrxId),
    CONSTRAINT CK_LogType CHECK (LogType IN ('MVC_TO_API', 'API_TO_PROVIDER', 'API_RESPONSE'))
);

-- Index
CREATE INDEX IDX_TransactionLogs_TrxId ON TransactionLogs(TrxId);
CREATE INDEX IDX_TransactionLogs_LogType ON TransactionLogs(LogType);
CREATE INDEX IDX_TransactionLogs_CreatedDate ON TransactionLogs(CreatedDate);
```

---

#### Tabel 5: Dashboard Summary (Optional - untuk performance)

```sql
CREATE TABLE DailySummary
(
    Id INT IDENTITY(1,1) PRIMARY KEY,
    SummaryDate DATE NOT NULL UNIQUE,
    TotalTransaction INT NOT NULL DEFAULT 0,
    SuccessTransaction INT NOT NULL DEFAULT 0,
    FailedTransaction INT NOT NULL DEFAULT 0,
    PendingTransaction INT NOT NULL DEFAULT 0,
    TotalAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
    TotalCommission DECIMAL(18,2) NOT NULL DEFAULT 0,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedDate DATETIME NULL
);
```

---

### Database Initialization Script

```sql
-- 1. Create Database
CREATE DATABASE AjoTopup;
GO

USE AjoTopup;
GO

-- 2. Create Tables (run the CREATE TABLE statements above)
-- [Insert all CREATE TABLE statements here]

-- 3. Seed Initial Data
INSERT INTO Users VALUES 
    ('admin1', HASHBYTES('SHA2_256', 'Admin123!'), 'Administrator', 'admin@ajotopup.com', '081234567890', 'Admin', 1, NULL, GETDATE(), 'System', NULL, NULL),
    ('operator1', HASHBYTES('SHA2_256', 'Operator123!'), 'Operator 1', 'op1@ajotopup.com', '081234567891', 'Operator', 1, NULL, GETDATE(), 'System', NULL, NULL),
    ('operator2', HASHBYTES('SHA2_256', 'Operator123!'), 'Operator 2', 'op2@ajotopup.com', '081234567892', 'Operator', 1, NULL, GETDATE(), 'System', NULL, NULL),
    ('manager1', HASHBYTES('SHA2_256', 'Manager123!'), 'Manager', 'manager@ajotopup.com', '081234567893', 'Manager', 1, NULL, GETDATE(), 'System', NULL, NULL);

INSERT INTO Products VALUES 
    ('TSEL5', 'Telkomsel 5.000', 'TSEL5', 'Telkomsel', 5000, 100, 1, GETDATE(), 'System', NULL, NULL),
    ('TSEL10', 'Telkomsel 10.000', 'TSEL10', 'Telkomsel', 10000, 250, 1, GETDATE(), 'System', NULL, NULL),
    ('TSEL20', 'Telkomsel 20.000', 'TSEL20', 'Telkomsel', 20000, 500, 1, GETDATE(), 'System', NULL, NULL),
    ('ISAT5', 'Indosat 5.000', 'ISAT5', 'Indosat', 5000, 100, 1, GETDATE(), 'System', NULL, NULL),
    ('ISAT10', 'Indosat 10.000', 'ISAT10', 'Indosat', 10000, 250, 1, GETDATE(), 'System', NULL, NULL),
    ('XL10', 'XL 10.000', 'XL10', 'XL', 10000, 250, 1, GETDATE(), 'System', NULL, NULL),
    ('AXIS25', 'Axis 25.000', 'AXIS25', 'Axis', 25000, 600, 1, GETDATE(), 'System', NULL, NULL);

-- 4. Create Views (optional but useful)
CREATE VIEW vw_TransactionSummary AS
SELECT 
    t.TrxId,
    t.ProductCode,
    p.ProductName,
    p.Provider,
    t.Destination,
    t.Status,
    t.Amount,
    t.SerialNumber,
    t.RequestDate,
    t.ResponseDate,
    DATEDIFF(MILLISECOND, t.RequestDate, ISNULL(t.ResponseDate, GETDATE())) AS ProcessingTime,
    u.FullName AS OperatorName
FROM Transactions t
INNER JOIN Products p ON t.ProductCode = p.ProductCode
INNER JOIN Users u ON t.CreatedBy = u.Username;
```

---

## Struktur Project

### Solution Structure

```
AjoTopup.sln
│
├── AjoTopup.Web (ASP.NET MVC Project)
│   │
│   ├── Controllers/
│   │   ├── AccountController.cs (Login, Logout, Register)
│   │   ├── DashboardController.cs (Dashboard views)
│   │   ├── TransactionController.cs (Input, History, Detail)
│   │   ├── ProductController.cs (Master produk - Admin only)
│   │   ├── AdminController.cs (User management)
│   │   └── BaseController.cs (Custom base untuk auth)
│   │
│   ├── Views/
│   │   ├── Account/ (Login, Register)
│   │   │   ├── Login.cshtml
│   │   │   └── Register.cshtml
│   │   │
│   │   ├── Dashboard/
│   │   │   ├── Index.cshtml (Main dashboard)
│   │   │   └── Summary.cshtml
│   │   │
│   │   ├── Transaction/
│   │   │   ├── Index.cshtml (Transaction form)
│   │   │   ├── History.cshtml (Transaction list)
│   │   │   ├── Detail.cshtml (Transaction detail)
│   │   │   └── _TransactionList.cshtml (Partial view)
│   │   │
│   │   ├── Product/
│   │   │   ├── Index.cshtml (Product list)
│   │   │   ├── Create.cshtml
│   │   │   ├── Edit.cshtml
│   │   │   └── _ProductTable.cshtml (Partial view)
│   │   │
│   │   ├── Admin/
│   │   │   ├── Users.cshtml (User management)
│   │   │   └── _UserForm.cshtml (Partial view)
│   │   │
│   │   ├── Shared/
│   │   │   ├── _Layout.cshtml (Master layout)
│   │   │   ├── _Sidebar.cshtml (Navigation)
│   │   │   ├── _Alert.cshtml (Alert messages)
│   │   │   └── Error.cshtml (Error page)
│   │   │
│   │   └── _ViewStart.cshtml
│   │
│   ├── Models/
│   │   ├── ViewModels/
│   │   │   ├── LoginViewModel.cs
│   │   │   ├── TransactionViewModel.cs
│   │   │   ├── ProductViewModel.cs
│   │   │   ├── DashboardViewModel.cs
│   │   │   └── UserViewModel.cs
│   │   │
│   │   ├── DTOs/
│   │   │   ├── UserDTO.cs
│   │   │   ├── ProductDTO.cs
│   │   │   ├── TransactionDTO.cs
│   │   │   └── ResponseDTO.cs
│   │   │
│   │   └── Entities/
│   │       └── [Database entities - generated by EF]
│   │
│   ├── Services/
│   │   ├── IAuthService.cs
│   │   ├── AuthService.cs
│   │   ├── ITransactionService.cs
│   │   ├── TransactionService.cs
│   │   ├── IProductService.cs
│   │   ├── ProductService.cs
│   │   └── HttpClientService.cs (API calls)
│   │
│   ├── Helpers/
│   │   ├── AuthorizeAttribute.cs (Custom authorization)
│   │   ├── ValidationHelper.cs
│   │   ├── FormatHelper.cs (Formatting utilities)
│   │   └── Constants.cs
│   │
│   ├── App_Start/
│   │   ├── RouteConfig.cs
│   │   ├── BundleConfig.cs
│   │   └── FilterConfig.cs
│   │
│   ├── Content/
│   │   ├── css/
│   │   │   ├── bootstrap.min.css
│   │   │   └── custom.css
│   │   ├── js/
│   │   │   ├── jquery.min.js
│   │   │   └── custom.js
│   │   └── images/
│   │
│   ├── Web.config
│   └── Global.asax
│
├── AjoTopup.Api (ASP.NET Web API Project)
│   │
│   ├── Controllers/
│   │   ├── TransactionController.cs (Main endpoint)
│   │   │   └── POST /api/transaction (Input transaksi)
│   │   │   └── GET /api/transaction/{id} (Detail transaksi)
│   │   │   └── GET /api/transaction (History)
│   │   │
│   │   └── ProviderController.cs (Internal - call dari API)
│   │       └── POST /api/provider/topup (Call provider)
│   │
│   ├── Services/
│   │   ├── ITransactionService.cs
│   │   ├── TransactionService.cs (Business logic)
│   │   ├── IProviderService.cs
│   │   ├── ProviderService.cs (Call fake provider)
│   │   ├── IValidationService.cs
│   │   ├── ValidationService.cs
│   │   ├── ILoggingService.cs
│   │   └── LoggingService.cs
│   │
│   ├── Repositories/
│   │   ├── IRepository.cs (Generic interface)
│   │   ├── Repository.cs (Generic base)
│   │   ├── ITransactionRepository.cs
│   │   ├── TransactionRepository.cs
│   │   ├── IProductRepository.cs
│   │   ├── ProductRepository.cs
│   │   ├── IUserRepository.cs
│   │   └── UserRepository.cs
│   │
│   ├── Models/
│   │   ├── DTOs/
│   │   │   ├── Request/
│   │   │   │   ├── TransactionRequestDTO.cs
│   │   │   │   └── ProviderRequestDTO.cs
│   │   │   │
│   │   │   ├── Response/
│   │   │   │   ├── TransactionResponseDTO.cs
│   │   │   │   ├── ProviderResponseDTO.cs
│   │   │   │   └── ApiResponseDTO.cs
│   │   │   │
│   │   │   └── Entities/
│   │   │       └── [Database entities]
│   │   │
│   │   └── Constants.cs
│   │
│   ├── Helpers/
│   │   ├── IdGenerator.cs (Generate TrxId)
│   │   ├── ValidationHelper.cs
│   │   ├── ErrorHandler.cs
│   │   └── AppSettings.cs
│   │
│   ├── Middleware/
│   │   └── ExceptionHandlingMiddleware.cs
│   │
│   ├── Web.config
│   └── Global.asax
│
├── AjoTopup.Provider (ASP.NET Web API - Fake Provider)
│   │
│   ├── Controllers/
│   │   └── TopupController.cs
│   │       └── POST /api/topup (Receive topup request)
│   │
│   ├── Models/
│   │   ├── TopupRequestDTO.cs
│   │   └── TopupResponseDTO.cs
│   │
│   ├── Services/
│   │   ├── ISimulatorService.cs
│   │   └── SimulatorService.cs (Generate random response)
│   │
│   ├── Web.config
│   └── Global.asax
│
└── Database/
    ├── Scripts/
    │   ├── 001_CreateTables.sql
    │   ├── 002_CreateIndexes.sql
    │   ├── 003_SeedData.sql
    │   ├── 004_CreateViews.sql
    │   └── 005_CreateStoredProcedures.sql
    │
    └── Migrations/
        └── [Entity Framework migrations]
```

---

## Setup & Inisialisasi

### Step 1: Create Solution

```powershell
# Di Visual Studio
File → New → Project → Visual C# → ASP.NET Web Application

# Atau via Package Manager Console
dotnet new sln -n AjoTopup
```

### Step 2: Create Projects

```powershell
# 1. AjoTopup.Web (MVC)
File → Add → New Project → ASP.NET Web Application (MVC Template)

# 2. AjoTopup.Api (Web API)
File → Add → New Project → ASP.NET Web Application (Web API Template)

# 3. AjoTopup.Provider (Web API)
File → Add → New Project → ASP.NET Web Application (Web API Template)

# 4. AjoTopup.Models (Class Library - shared)
File → Add → New Project → Class Library
```

### Step 3: Install NuGet Packages

```powershell
# For AjoTopup.Web
Install-Package EntityFramework -Version 6.4.4
Install-Package Bootstrap -Version 4.6.1
Install-Package jQuery -Version 3.6.0
Install-Package Newtonsoft.Json

# For AjoTopup.Api
Install-Package EntityFramework -Version 6.4.4
Install-Package NLog -Version 4.7.15
Install-Package Newtonsoft.Json
Install-Package Microsoft.AspNet.WebApi.Core

# For AjoTopup.Provider
Install-Package Newtonsoft.Json
Install-Package Microsoft.AspNet.WebApi.Core

# For all projects
Install-Package log4net (atau NLog)
```

### Step 4: Configure Database Connection

**Web.config (AjoTopup.Web & AjoTopup.Api):**
```xml
<configuration>
  <connectionStrings>
    <add name="AjoTopupContext" 
         connectionString="Server=localhost;Database=AjoTopup;Trusted_Connection=true;" 
         providerName="System.Data.SqlClient" />
  </connectionStrings>
</configuration>
```

### Step 5: Create Database & Tables

```powershell
# 1. Open SQL Server Management Studio
# 2. Connect to your SQL Server instance
# 3. Create new database: AjoTopup
# 4. Run initialization script (dari section Database Design di atas)
```

### Step 6: Setup Entity Framework

```csharp
// AjoTopupContext.cs - DbContext class
public class AjoTopupContext : DbContext
{
    public AjoTopupContext() 
        : base("name=AjoTopupContext")
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<Transaction> Transactions { get; set; }
    public DbSet<TransactionLog> TransactionLogs { get; set; }

    protected override void OnModelCreating(DbModelBuilder modelBuilder)
    {
        // Configure entities
        base.OnModelCreating(modelBuilder);
    }
}
```

---

## Fitur Detail & Implementasi

### Fitur 1: Authentication & Authorization

#### 1.1 Login
- **User Input:** Username, Password
- **Validation:** Check database, hash password
- **Output:** Session token, Role information
- **Redirect:** Dashboard (based on role)

#### 1.2 Role-Based Access Control
```csharp
[Authorize(Roles = "Admin")]
public ActionResult ManageUsers() { }

[Authorize(Roles = "Admin,Operator")]
public ActionResult CreateTransaction() { }

[Authorize(Roles = "Admin,Manager,Operator")]
public ActionResult ViewDashboard() { }
```

---

### Fitur 2: Master Product Management

#### 2.1 View Products
- **Access:** Admin only
- **Show:** ProductCode, ProductName, Provider, Price, Status
- **Actions:** Edit, Deactivate, Activate

#### 2.2 Add Product
```
Form Input:
├─ Product Code (Required, Unique)
├─ Product Name (Required)
├─ Provider (Dropdown: Telkomsel, Indosat, XL, Axis)
├─ Price (Required, > 0)
├─ Commission (Optional)
└─ Active (Yes/No)
```

#### 2.3 Edit Product
- **Access:** Admin only
- **Editable:** ProductName, Price, Commission, IsActive
- **Not Editable:** ProductCode (primary key)

---

### Fitur 3: Transaction Processing

#### 3.1 Create Transaction (Operator)
```
Form Input:
├─ Produk (Dropdown - dari database)
├─ Nomor Tujuan (Input - validation: 8-12 digit, starts with 0)
└─ [PROCESS] Button

Process Flow:
1. Validate input
2. Call API
3. Show result
4. Redirect to history
```

#### 3.2 Transaction History
- **Access:** Operator (personal), Admin/Manager (global)
- **Show Columns:** TrxId, Date, Product, Destination, Status, Message
- **Filters:**
  - Date range picker
  - Status filter (PENDING, SUCCESS, FAILED)
  - Product dropdown
  - Destination search
  - Pagination

#### 3.3 Transaction Detail
- **Access:** All authenticated users
- **Show:**
  - Transaction info (TrxId, Product, Destination, Amount)
  - Request to API (timestamp, payload)
  - Request to Provider (timestamp, payload)
  - Response from Provider (timestamp, payload)
  - Final status & message
  - Serial number (if success)

---

### Fitur 4: Dashboard & Analytics

#### 4.1 Dashboard Components
```
┌─────────────────────────────────────────────┐
│          AJOTOPUP DASHBOARD                 │
├─────────────────────────────────────────────┤
│                                              │
│  ┌──────────────────┬──────────────────┐   │
│  │ Total Trx Today  │  Rp. 5.234.500   │   │
│  │ (10 transaksi)   │                  │   │
│  └──────────────────┴──────────────────┘   │
│                                              │
│  ┌──────────────────┬──────────────────┐   │
│  │ Success (80%)    │  Failed (20%)     │   │
│  │  8 transaksi     │  2 transaksi      │   │
│  └──────────────────┴──────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │  Pending Transactions (0)             │  │
│  └──────────────────────────────────────┘  │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │  Top 5 Produk                        │  │
│  │  ├─ Telkomsel 10K (30 transaksi)    │  │
│  │  ├─ Indosat 5K (25 transaksi)       │  │
│  │  ├─ XL 10K (20 transaksi)           │  │
│  │  ├─ Telkomsel 5K (15 transaksi)     │  │
│  │  └─ Axis 25K (10 transaksi)         │  │
│  └──────────────────────────────────────┘  │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │  Chart: Transaksi per jam (24 jam)   │  │
│  │  [Bar Chart]                         │  │
│  └──────────────────────────────────────┘  │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │  Chart: Success vs Failed (Today)    │  │
│  │  [Pie Chart]                         │  │
│  └──────────────────────────────────────┘  │
│                                              │
└─────────────────────────────────────────────┘
```

#### 4.2 Dashboard Queries
```sql
-- Total Today
SELECT COUNT(*) as Total, SUM(Amount) as TotalAmount
FROM Transactions
WHERE CAST(RequestDate AS DATE) = CAST(GETDATE() AS DATE);

-- Success/Failed Count
SELECT Status, COUNT(*) as Count
FROM Transactions
WHERE CAST(RequestDate AS DATE) = CAST(GETDATE() AS DATE)
GROUP BY Status;

-- Top Products
SELECT TOP 5 ProductCode, COUNT(*) as Count
FROM Transactions
WHERE CAST(RequestDate AS DATE) = CAST(GETDATE() AS DATE)
GROUP BY ProductCode
ORDER BY Count DESC;

-- Transactions per hour
SELECT 
    DATEPART(HOUR, RequestDate) as Hour,
    COUNT(*) as Count
FROM Transactions
WHERE CAST(RequestDate AS DATE) = CAST(GETDATE() AS DATE)
GROUP BY DATEPART(HOUR, RequestDate)
ORDER BY Hour;
```

---

### Fitur 5: Logging System

#### 5.1 Request/Response Logging
Setiap transaksi mencatat:
- Request dari MVC ke API
- Request dari API ke Provider
- Response dari Provider
- Timestamp & duration

#### 5.2 Log View (Admin Only)
```
Columns: TrxId, LogType, RequestTime, ResponseTime, StatusCode, Duration
Filter: By TrxId, By LogType, By Date Range
Action: View full request/response payload
```

---

## API Specification

### Base Configuration

```
API Base URL: http://localhost:8080/api (development)
Response Format: JSON
Authentication: Session-based (Web) / Token (future)
```

### Endpoint 1: Create Transaction

**Request:**
```
POST /api/transaction
Content-Type: application/json

{
  "productCode": "TSEL10",
  "destination": "081234567890"
}
```

**Response (Success):**
```json
{
  "statusCode": 200,
  "message": "Transaction created successfully",
  "data": {
    "trxId": "TRX202406240001",
    "productCode": "TSEL10",
    "productName": "Telkomsel 10.000",
    "destination": "081234567890",
    "amount": 10000,
    "status": "SUCCESS",
    "providerMessage": "Topup berhasil",
    "serialNumber": "SN123456789",
    "requestDate": "2024-06-24T10:30:00Z",
    "responseDate": "2024-06-24T10:30:05Z"
  }
}
```

**Response (Validation Error):**
```json
{
  "statusCode": 400,
  "message": "Product not found",
  "data": null,
  "errors": [
    {
      "field": "productCode",
      "message": "Product code 'INVALID' does not exist"
    }
  ]
}
```

**Response (Processing Error):**
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "data": null,
  "errors": [
    {
      "message": "Database connection failed"
    }
  ]
}
```

---

### Endpoint 2: Get Transaction Detail

**Request:**
```
GET /api/transaction/TRX202406240001
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "trxId": "TRX202406240001",
    "productCode": "TSEL10",
    "productName": "Telkomsel 10.000",
    "provider": "Telkomsel",
    "destination": "081234567890",
    "amount": 10000,
    "commission": 250,
    "status": "SUCCESS",
    "providerStatus": "SUCCESS",
    "providerMessage": "Topup berhasil",
    "serialNumber": "SN123456789",
    "requestDate": "2024-06-24T10:30:00Z",
    "responseDate": "2024-06-24T10:30:05Z",
    "processingTime": 5000,
    "createdBy": "operator1",
    "logs": [
      {
        "logId": 1,
        "logType": "MVC_TO_API",
        "requestUrl": "POST /api/transaction",
        "requestBody": "{\"productCode\":\"TSEL10\",\"destination\":\"081234567890\"}",
        "responseStatusCode": 200,
        "responseBody": "{...}",
        "executionTime": 150,
        "createdDate": "2024-06-24T10:30:00Z"
      },
      {
        "logId": 2,
        "logType": "API_TO_PROVIDER",
        "requestUrl": "POST http://localhost:8081/api/topup",
        "requestBody": "{\"trxId\":\"TRX202406240001\",\"productCode\":\"TSEL10\",\"destination\":\"081234567890\"}",
        "responseStatusCode": 200,
        "responseBody": "{\"trxId\":\"TRX202406240001\",\"status\":\"SUCCESS\",\"message\":\"Topup berhasil\",\"sn\":\"SN123456789\"}",
        "executionTime": 4800,
        "createdDate": "2024-06-24T10:30:00Z"
      }
    ]
  }
}
```

---

### Endpoint 3: Get Transaction History

**Request:**
```
GET /api/transaction?status=SUCCESS&productCode=TSEL10&startDate=2024-06-01&endDate=2024-06-30&pageNumber=1&pageSize=10
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "totalRecords": 125,
    "pageNumber": 1,
    "pageSize": 10,
    "totalPages": 13,
    "transactions": [
      {
        "trxId": "TRX202406240001",
        "productCode": "TSEL10",
        "productName": "Telkomsel 10.000",
        "destination": "081234567890",
        "status": "SUCCESS",
        "amount": 10000,
        "requestDate": "2024-06-24T10:30:00Z",
        "providerMessage": "Topup berhasil",
        "serialNumber": "SN123456789"
      },
      // ... more records
    ]
  }
}
```

---

### Endpoint 4: Provider Topup (Internal)

**Request:**
```
POST /api/provider/topup
Content-Type: application/json

{
  "trxId": "TRX202406240001",
  "productCode": "TSEL10",
  "destination": "081234567890"
}
```

**Response (Success):**
```json
{
  "trxId": "TRX202406240001",
  "status": "SUCCESS",
  "message": "Topup berhasil",
  "sn": "SN123456789"
}
```

**Response (Failed):**
```json
{
  "trxId": "TRX202406240001",
  "status": "FAILED",
  "message": "Nomor tujuan tidak valid",
  "sn": null
}
```

---

## Alur Transaksi Detailed

### Complete Transaction Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        AJOTOPUP TRANSACTION FLOW                          │
└──────────────────────────────────────────────────────────────────────────┘

STEP 1: USER SUBMITS FORM
┌─────────────────────────────────────────┐
│  AjoTopup.Web (Browser)                 │
│                                         │
│  Form Input:                            │
│  - Product Code: TSEL10                │
│  - Destination: 081234567890           │
│  - [PROCESS Button]                     │
└────────────┬────────────────────────────┘
             │
             ├─► Client-side validation (JavaScript)
             │   ├─ Check product not empty
             │   ├─ Check destination format (0-9, 8-12 char)
             │   └─ Disable button during process
             │
             └─► Show loading spinner


STEP 2: AJAX CALL TO API
┌─────────────────────────────────────────┐
│  POST /api/transaction                  │
│                                         │
│  Request Headers:                       │
│  - Content-Type: application/json       │
│  - Authorization: Bearer [token]        │
│                                         │
│  Request Body:                          │
│  {                                      │
│    "productCode": "TSEL10",             │
│    "destination": "081234567890"        │
│  }                                      │
└────────────┬────────────────────────────┘
             │
             └─► Log: MVC_TO_API (RequestBody stored)


STEP 3: API VALIDATION & DATABASE INSERT
┌──────────────────────────────────────────────────────────┐
│  AjoTopup.Api (TransactionController)                    │
│                                                           │
│  A. Validate Product                                     │
│     ├─ Check if productCode exists in Products table    │
│     ├─ Check if product IsActive = 1                    │
│     └─ If fail → Return 400 Bad Request                 │
│                                                           │
│  B. Validate Destination                                │
│     ├─ Check format (8-12 digits, starts with 0)       │
│     ├─ Check not null/empty                            │
│     └─ If fail → Return 400 Bad Request                │
│                                                           │
│  C. Generate Transaction ID                             │
│     ├─ Format: TRX + DATE(YYYYMMDD) + SEQUENCE(0001)  │
│     ├─ Example: TRX202406240001                         │
│     └─ Store in memory (to ensure uniqueness)          │
│                                                           │
│  D. Insert to Transactions Table                        │
│     ├─ TrxId: TRX202406240001                          │
│     ├─ ProductCode: TSEL10                             │
│     ├─ Destination: 081234567890                       │
│     ├─ Status: PENDING                                 │
│     ├─ RequestDate: GETDATE()                          │
│     ├─ Amount: 10000 (dari Products table)             │
│     ├─ CreatedBy: operator1 (current user)             │
│     └─ ResponseDate: NULL (will update later)          │
│                                                           │
│  E. Log Database Insert                                 │
│     └─ Write to TransactionLogs                        │
│        (LogType: MVC_TO_API)                           │
└────────────┬──────────────────────────────────────────┘
             │
             └─► Database recorded with PENDING status


STEP 4: CALL TO FAKE PROVIDER
┌───────────────────────────────────────────────────────────┐
│  AjoTopup.Api (ProviderService)                           │
│                                                            │
│  A. Prepare Request                                       │
│     └─ POST to: http://localhost:8081/api/provider/topup │
│        Body:                                              │
│        {                                                  │
│          "trxId": "TRX202406240001",                     │
│          "productCode": "TSEL10",                        │
│          "destination": "081234567890"                  │
│        }                                                  │
│                                                            │
│  B. Send HTTP Request                                    │
│     ├─ Use HttpClient                                   │
│     ├─ Set timeout: 30 seconds                          │
│     └─ Record start time for logging                    │
│                                                            │
│  C. Log Request to Provider                             │
│     └─ Write to TransactionLogs                        │
│        (LogType: API_TO_PROVIDER)                       │
└────────────┬──────────────────────────────────────────┘
             │
             └─► Waiting for provider response


STEP 5: FAKE PROVIDER PROCESSES REQUEST
┌──────────────────────────────────────────┐
│  AjoTopup.Provider (TopupController)     │
│                                          │
│  A. Receive Request                      │
│     └─ Parse JSON body                   │
│                                          │
│  B. Simulate Processing                  │
│     ├─ Generate random number (0-100)   │
│     ├─ If 0-85: SUCCESS                 │
│     └─ If 86-100: FAILED                │
│                                          │
│  C. Generate Response                   │
│                                          │
│     IF SUCCESS:                          │
│     {                                    │
│       "trxId": "TRX202406240001",       │
│       "status": "SUCCESS",              │
│       "message": "Topup berhasil",      │
│       "sn": "SN123456789"               │
│     }                                    │
│                                          │
│     IF FAILED:                           │
│     {                                    │
│       "trxId": "TRX202406240001",       │
│       "status": "FAILED",               │
│       "message": "Nomor tujuan invalid",│
│       "sn": null                        │
│     }                                    │
│                                          │
│  D. Return Response                      │
│     └─ HTTP 200 OK + JSON payload        │
└────────────┬──────────────────────────────┘
             │
             └─► Provider returns response


STEP 6: API RECEIVES & PROCESS RESPONSE
┌──────────────────────────────────────────────────┐
│  AjoTopup.Api (ProviderService)                  │
│                                                   │
│  A. Parse Response                               │
│     ├─ Check StatusCode (200, 400, 500, etc)    │
│     ├─ Parse JSON body                          │
│     └─ Record end time                          │
│                                                   │
│  B. Update Transactions Table                    │
│     ├─ Set Status = SUCCESS (or FAILED)         │
│     ├─ Set ProviderStatus = [from response]     │
│     ├─ Set ProviderMessage = [message]          │
│     ├─ Set SerialNumber = [sn]                  │
│     ├─ Set ResponseDate = GETDATE()             │
│     ├─ Calculate ResponseTime (ms)              │
│     └─ UPDATE WHERE TrxId = 'TRX...'            │
│                                                   │
│  C. Log Provider Response                        │
│     └─ Write to TransactionLogs                 │
│        (LogType: API_RESPONSE)                  │
│        Include full response payload            │
│                                                   │
│  D. Return Response to Web                       │
│     └─ Send JSON response with transaction data │
└────────────┬──────────────────────────────────────┘
             │
             └─► API sends result back to Web


STEP 7: WEB DISPLAYS RESULT
┌─────────────────────────────────────────┐
│  AjoTopup.Web (Browser)                 │
│                                         │
│  A. Receive Response from API           │
│     ├─ Check statusCode                │
│     ├─ Parse transaction data          │
│     └─ Remove loading spinner         │
│                                         │
│  B. Show Result Modal/Page              │
│                                         │
│     SUCCESS CASE:                       │
│     ┌─────────────────────────────────┐│
│     │ ✓ TRANSAKSI BERHASIL            ││
│     │                                  ││
│     │ TrxId: TRX202406240001          ││
│     │ Produk: Telkomsel 10K           ││
│     │ Tujuan: 081234567890            ││
│     │ SN: SN123456789                 ││
│     │ Status: SUCCESS                 ││
│     │                                  ││
│     │ [Lihat Detail] [Transaksi Baru] ││
│     └─────────────────────────────────┘│
│                                         │
│     FAILED CASE:                        │
│     ┌─────────────────────────────────┐│
│     │ ✗ TRANSAKSI GAGAL               ││
│     │                                  ││
│     │ TrxId: TRX202406240002          ││
│     │ Produk: Indosat 5K              ││
│     │ Tujuan: 082345678901            ││
│     │ Error: Nomor tujuan tidak valid ││
│     │ Status: FAILED                  ││
│     │                                  ││
│     │ [Lihat Detail] [Coba Lagi]      ││
│     └─────────────────────────────────┘│
│                                         │
│  C. Auto Redirect (after 5 seconds)     │
│     └─► Go to Transaction History      │
│                                         │
└─────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│               DATABASE STATE AFTER TRANSACTION            │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Transactions Table:                                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │ TrxId: TRX202406240001                          │  │
│  │ Status: SUCCESS                                 │  │
│  │ ProviderMessage: Topup berhasil                │  │
│  │ SerialNumber: SN123456789                       │  │
│  │ RequestDate: 2024-06-24 10:30:00                │  │
│  │ ResponseDate: 2024-06-24 10:30:05               │  │
│  │ ResponseTime: 5000 ms                           │  │
│  └──────────────────────────────────────────────────┘  │
│                                                           │
│  TransactionLogs Table (3 entries):                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 1. MVC_TO_API - Web request payload             │  │
│  │ 2. API_TO_PROVIDER - Provider request payload   │  │
│  │ 3. API_RESPONSE - Provider response payload     │  │
│  └──────────────────────────────────────────────────┘  │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## Panduan Implementasi Per Module

### Module 1: AjoTopup.Web (MVC)

#### 1.1 Setup MVC Project

```csharp
// Global.asax.cs
protected void Application_Start()
{
    AreaRegistration.RegisterAllAreas();
    FilterConfig.RegisterGlobalFilters(GlobalFilters.Filters);
    RouteConfig.RegisterRoutes(RouteTable.Routes);
    BundleConfig.RegisterBundles(BundleTable.Bundles);
}
```

#### 1.2 Create Auth Controller

```csharp
// Controllers/AccountController.cs
public class AccountController : Controller
{
    private IAuthService _authService;

    public ActionResult Login()
    {
        return View();
    }

    [HttpPost]
    public ActionResult Login(LoginViewModel model)
    {
        if (!ModelState.IsValid)
            return View(model);

        var user = _authService.Authenticate(model.Username, model.Password);
        
        if (user != null)
        {
            // Create session
            Session["UserId"] = user.Id;
            Session["Username"] = user.Username;
            Session["Role"] = user.RoleName;
            Session["FullName"] = user.FullName;

            return RedirectToAction("Index", "Dashboard");
        }

        ModelState.AddModelError("", "Invalid username or password");
        return View(model);
    }

    public ActionResult Logout()
    {
        Session.Clear();
        return RedirectToAction("Login");
    }
}
```

#### 1.3 Create Transaction Controller

```csharp
// Controllers/TransactionController.cs
[Authorize] // Custom attribute
public class TransactionController : Controller
{
    private ITransactionService _transactionService;
    private HttpClientService _httpClientService;

    [HttpGet]
    public ActionResult Index()
    {
        return View();
    }

    [HttpPost]
    public async Task<JsonResult> Create(TransactionViewModel model)
    {
        try
        {
            var request = new TransactionRequestDTO
            {
                ProductCode = model.ProductCode,
                Destination = model.Destination
            };

            // Call API
            var response = await _httpClientService.PostAsync<TransactionResponseDTO>(
                "http://localhost:8080/api/transaction", 
                request
            );

            if (response.StatusCode == 200)
            {
                return Json(new { success = true, data = response.Data });
            }

            return Json(new { success = false, message = response.Message });
        }
        catch (Exception ex)
        {
            return Json(new { success = false, message = ex.Message });
        }
    }

    public ActionResult History()
    {
        // Get current user
        var username = Session["Username"].ToString();
        var role = Session["Role"].ToString();

        // Fetch transactions
        var transactions = _transactionService.GetTransactions(username, role);
        
        return View(transactions);
    }

    public ActionResult Detail(string id)
    {
        var transaction = _transactionService.GetTransactionDetail(id);
        return View(transaction);
    }
}
```

#### 1.4 Create Views

**Views/Account/Login.cshtml:**
```html
@model LoginViewModel

@{
    ViewBag.Title = "Login";
    Layout = null;
}

<!DOCTYPE html>
<html>
<head>
    <title>AjoTopup - Login</title>
    <link rel="stylesheet" href="~/Content/css/bootstrap.min.css" />
</head>
<body>
    <div class="container">
        <div class="row justify-content-center mt-5">
            <div class="col-md-5">
                <div class="card">
                    <div class="card-body">
                        <h3 class="card-title text-center mb-4">AjoTopup Login</h3>
                        
                        @using (Html.BeginForm("Login", "Account", FormMethod.Post))
                        {
                            <div class="form-group">
                                <label>Username</label>
                                @Html.TextBoxFor(m => m.Username, new { @class = "form-control" })
                            </div>

                            <div class="form-group">
                                <label>Password</label>
                                @Html.PasswordFor(m => m.Password, new { @class = "form-control" })
                            </div>

                            <button type="submit" class="btn btn-primary btn-block">Login</button>
                        }

                        @if (!ViewData.ModelState.IsValid)
                        {
                            <div class="alert alert-danger mt-3">
                                @Html.ValidationSummary()
                            </div>
                        }
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
```

**Views/Dashboard/Index.cshtml:**
```html
@model DashboardViewModel

@{
    ViewBag.Title = "Dashboard";
    Layout = "~/Views/Shared/_Layout.cshtml";
}

<div class="container-fluid">
    <h2>Dashboard</h2>

    <div class="row mt-4">
        <div class="col-md-3">
            <div class="card text-center">
                <div class="card-body">
                    <h5>Total Transaksi Hari Ini</h5>
                    <h3>@Model.TotalTransactions</h3>
                    <p class="text-muted">Rp. @Model.TotalAmount.ToString("N0")</p>
                </div>
            </div>
        </div>

        <div class="col-md-3">
            <div class="card text-center text-success">
                <div class="card-body">
                    <h5>Sukses</h5>
                    <h3>@Model.SuccessCount</h3>
                    <p class="text-muted">@Model.SuccessPercentage%</p>
                </div>
            </div>
        </div>

        <div class="col-md-3">
            <div class="card text-center text-danger">
                <div class="card-body">
                    <h5>Gagal</h5>
                    <h3>@Model.FailedCount</h3>
                    <p class="text-muted">@Model.FailedPercentage%</p>
                </div>
            </div>
        </div>

        <div class="col-md-3">
            <div class="card text-center text-warning">
                <div class="card-body">
                    <h5>Pending</h5>
                    <h3>@Model.PendingCount</h3>
                </div>
            </div>
        </div>
    </div>

    <div class="row mt-4">
        <div class="col-md-12">
            <div class="card">
                <div class="card-header">
                    <h5>Top 5 Produk</h5>
                </div>
                <div class="card-body">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Produk</th>
                                <th>Jumlah Transaksi</th>
                                <th>Persentase</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach (var product in Model.TopProducts)
                            {
                                <tr>
                                    <td>@product.ProductName</td>
                                    <td>@product.Count</td>
                                    <td>@product.Percentage%</td>
                                </tr>
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>
```

---

### Module 2: AjoTopup.Api (Backend)

#### 2.1 Create DbContext

```csharp
// Models/AjoTopupContext.cs
public class AjoTopupContext : DbContext
{
    public AjoTopupContext() : base("name=AjoTopupContext")
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<Transaction> Transactions { get; set; }
    public DbSet<TransactionLog> TransactionLogs { get; set; }

    protected override void OnModelCreating(DbModelBuilder modelBuilder)
    {
        // Configure primary keys
        modelBuilder.Entity<User>().HasKey(u => u.Id);
        modelBuilder.Entity<Product>().HasKey(p => p.Id);
        modelBuilder.Entity<Transaction>().HasKey(t => t.Id);
        modelBuilder.Entity<TransactionLog>().HasKey(tl => tl.Id);

        // Configure relationships
        modelBuilder.Entity<Transaction>()
            .HasRequired(t => t.Product)
            .WithMany()
            .HasForeignKey(t => t.ProductCode);

        base.OnModelCreating(modelBuilder);
    }
}
```

#### 2.2 Create Service Layer

```csharp
// Services/ITransactionService.cs
public interface ITransactionService
{
    Task<TransactionResponseDTO> ProcessTransaction(TransactionRequestDTO request, string username);
    Task<TransactionResponseDTO> GetTransactionDetail(string trxId);
    Task<List<TransactionResponseDTO>> GetTransactionHistory(string username, string role, int page, int pageSize);
}

// Services/TransactionService.cs
public class TransactionService : ITransactionService
{
    private ITransactionRepository _repository;
    private IProductRepository _productRepository;
    private IProviderService _providerService;
    private ILoggingService _loggingService;
    private IValidationService _validationService;

    public async Task<TransactionResponseDTO> ProcessTransaction(
        TransactionRequestDTO request, 
        string username)
    {
        using (var transaction = _repository.BeginTransaction())
        {
            try
            {
                // 1. Validate
                var validationResult = await _validationService.ValidateTransaction(request);
                if (!validationResult.IsValid)
                    throw new ValidationException(validationResult.Message);

                // 2. Get Product
                var product = await _productRepository.GetByCodeAsync(request.ProductCode);
                if (product == null || !product.IsActive)
                    throw new InvalidOperationException("Product not found or inactive");

                // 3. Generate TrxId
                var trxId = GenerateTrxId();

                // 4. Save Transaction as PENDING
                var trx = new Transaction
                {
                    TrxId = trxId,
                    ProductCode = request.ProductCode,
                    Destination = request.Destination,
                    Status = "PENDING",
                    Amount = product.Price,
                    RequestDate = DateTime.Now,
                    CreatedBy = username
                };

                await _repository.AddAsync(trx);
                await _repository.SaveAsync();

                // Log: MVC_TO_API
                await _loggingService.LogAsync(trxId, "MVC_TO_API", 
                    JsonConvert.SerializeObject(request));

                // 5. Call Provider
                var providerRequest = new ProviderRequestDTO
                {
                    TrxId = trxId,
                    ProductCode = request.ProductCode,
                    Destination = request.Destination
                };

                var stopwatch = Stopwatch.StartNew();
                var providerResponse = await _providerService.CallProviderAsync(providerRequest);
                stopwatch.Stop();

                // Log: API_TO_PROVIDER & API_RESPONSE
                await _loggingService.LogAsync(trxId, "API_TO_PROVIDER", 
                    JsonConvert.SerializeObject(providerRequest));
                await _loggingService.LogAsync(trxId, "API_RESPONSE", 
                    JsonConvert.SerializeObject(providerResponse));

                // 6. Update Transaction
                trx.Status = providerResponse.Status;
                trx.ProviderStatus = providerResponse.Status;
                trx.ProviderMessage = providerResponse.Message;
                trx.SerialNumber = providerResponse.Sn;
                trx.ResponseDate = DateTime.Now;
                trx.ResponseTime = (int)stopwatch.ElapsedMilliseconds;

                await _repository.UpdateAsync(trx);
                await _repository.SaveAsync();

                transaction.Commit();

                return MapToDTO(trx);
            }
            catch (Exception ex)
            {
                transaction.Rollback();
                await _loggingService.LogErrorAsync(ex);
                throw;
            }
        }
    }

    private string GenerateTrxId()
    {
        var date = DateTime.Now.ToString("yyyyMMdd");
        var sequence = GetTodaySequence() + 1;
        return $"TRX{date}{sequence:D4}";
    }

    private int GetTodaySequence()
    {
        var today = DateTime.Now.Date;
        return _repository.GetAll()
            .Where(t => EntityFunctions.TruncateTime(t.RequestDate) == today)
            .Count();
    }
}
```

#### 2.3 Create API Controller

```csharp
// Controllers/TransactionController.cs
[RoutePrefix("api/transaction")]
public class TransactionController : ApiController
{
    private ITransactionService _service;

    [HttpPost]
    [Route("")]
    public async Task<IHttpActionResult> Create(TransactionRequestDTO request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var username = User.Identity.Name;
            var response = await _service.ProcessTransaction(request, username);

            return Ok(new 
            { 
                statusCode = 200, 
                message = "Success", 
                data = response 
            });
        }
        catch (ValidationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            return InternalServerError(ex);
        }
    }

    [HttpGet]
    [Route("{id}")]
    public async Task<IHttpActionResult> GetDetail(string id)
    {
        var transaction = await _service.GetTransactionDetail(id);
        if (transaction == null)
            return NotFound();

        return Ok(new 
        { 
            statusCode = 200, 
            message = "Success", 
            data = transaction 
        });
    }

    [HttpGet]
    [Route("")]
    public async Task<IHttpActionResult> GetHistory(
        [FromUri] string status = null,
        [FromUri] string productCode = null,
        [FromUri] DateTime? startDate = null,
        [FromUri] DateTime? endDate = null,
        [FromUri] int pageNumber = 1,
        [FromUri] int pageSize = 10)
    {
        var username = User.Identity.Name;
        var role = User.IsInRole("Admin") ? "Admin" : "Operator";

        var transactions = await _service.GetTransactionHistory(username, role, pageNumber, pageSize);

        return Ok(new 
        { 
            statusCode = 200, 
            message = "Success", 
            data = transactions 
        });
    }
}
```

---

### Module 3: AjoTopup.Provider (Fake Provider)

#### 3.1 Create Simulator Service

```csharp
// Services/SimulatorService.cs
public class SimulatorService
{
    private Random _random = new Random();

    public TopupResponseDTO SimulateTopup(TopupRequestDTO request)
    {
        // Simulate random success/failure (85% success, 15% failure)
        var randomNumber = _random.Next(0, 100);
        var isSuccess = randomNumber < 85;

        if (isSuccess)
        {
            return new TopupResponseDTO
            {
                TrxId = request.TrxId,
                Status = "SUCCESS",
                Message = "Topup berhasil",
                Sn = GenerateSerialNumber()
            };
        }
        else
        {
            var failureReasons = new[]
            {
                "Nomor tujuan tidak valid",
                "Saldo provider tidak cukup",
                "Timeout dari operator",
                "Duplicate transaction"
            };

            return new TopupResponseDTO
            {
                TrxId = request.TrxId,
                Status = "FAILED",
                Message = failureReasons[_random.Next(failureReasons.Length)],
                Sn = null
            };
        }
    }

    private string GenerateSerialNumber()
    {
        return "SN" + _random.Next(100000000, 999999999).ToString();
    }
}
```

#### 3.2 Create Provider Controller

```csharp
// Controllers/TopupController.cs
[RoutePrefix("api")]
public class TopupController : ApiController
{
    private SimulatorService _simulatorService = new SimulatorService();

    [HttpPost]
    [Route("topup")]
    public IHttpActionResult Topup(TopupRequestDTO request)
    {
        // Simulate network delay (100-1000ms)
        var delay = new Random().Next(100, 1000);
        System.Threading.Thread.Sleep(delay);

        var response = _simulatorService.SimulateTopup(request);
        return Ok(response);
    }
}
```

---

## Checklist Development

### Phase 1: Setup & Infrastructure ✓

- [ ] Create Visual Studio Solution
- [ ] Create 3 Web API Projects
- [ ] Install NuGet packages
- [ ] Configure database connection
- [ ] Create SQL Server database
- [ ] Run database initialization script
- [ ] Verify Entity Framework connection
- [ ] Setup Git repository

### Phase 2: Database & Models ✓

- [ ] Create Users table & entity
- [ ] Create Products table & entity
- [ ] Create Transactions table & entity
- [ ] Create TransactionLogs table & entity
- [ ] Create database indexes
- [ ] Seed initial data
- [ ] Create DbContext class
- [ ] Create DTOs & ViewModels
- [ ] Create Entity Framework migrations

### Phase 3: Authentication & Authorization ✓

- [ ] Create AccountController
- [ ] Create Login view
- [ ] Implement password hashing
- [ ] Create session management
- [ ] Implement role-based access control
- [ ] Create custom Authorize attribute
- [ ] Create Logout functionality
- [ ] Test login with different roles

### Phase 4: Master Data Management ✓

- [ ] Create ProductController (Admin)
- [ ] Create Product list view
- [ ] Create Add product form
- [ ] Create Edit product form
- [ ] Implement product validation
- [ ] Create product service layer
- [ ] Test CRUD operations

### Phase 5: Transaction Processing ✓

- [ ] Create TransactionController (Web)
- [ ] Create transaction form view
- [ ] Create TransactionController (API)
- [ ] Create transaction service layer
- [ ] Create validation service
- [ ] Implement TrxId generation
- [ ] Create provider service (API call)
- [ ] Implement transaction logging
- [ ] Test transaction flow end-to-end

### Phase 6: Fake Provider ✓

- [ ] Create AjoTopup.Provider project
- [ ] Create TopupController
- [ ] Create SimulatorService
- [ ] Implement random success/failure
- [ ] Generate serial numbers
- [ ] Test provider endpoints
- [ ] Simulate network delays

### Phase 7: History & Detail Views ✓

- [ ] Create transaction history view
- [ ] Implement filtering (date, status, product)
- [ ] Implement pagination
- [ ] Create transaction detail view
- [ ] Display request/response logs
- [ ] Format JSON for display
- [ ] Add copy-to-clipboard feature

### Phase 8: Dashboard & Analytics ✓

- [ ] Create DashboardController
- [ ] Create dashboard view
- [ ] Implement summary statistics
- [ ] Create top products query
- [ ] Create transactions per hour query
- [ ] Add charts (Bootstrap charts or Chart.js)
- [ ] Test dashboard with sample data

### Phase 9: Logging System ✓

- [ ] Create TransactionLog repository
- [ ] Implement request logging
- [ ] Implement response logging
- [ ] Create logging service
- [ ] Add error logging
- [ ] Create log viewer (Admin)
- [ ] Test logging in transaction flow

### Phase 10: User Management (Admin) ✓

- [ ] Create AdminController
- [ ] Create user list view
- [ ] Create add user form
- [ ] Create edit user form
- [ ] Implement user validation
- [ ] Add password change functionality
- [ ] Implement user activation/deactivation
- [ ] Test role-based permissions

### Phase 11: API Documentation ✓

- [ ] Document all endpoints
- [ ] Create request/response examples
- [ ] Document error codes
- [ ] Create API usage guide
- [ ] Create developer documentation

### Phase 12: Testing & Optimization ✓

- [ ] Unit test services
- [ ] Unit test controllers
- [ ] Integration test database operations
- [ ] End-to-end test transaction flow
- [ ] Test with different roles
- [ ] Performance testing
- [ ] Security testing (SQL injection, XSS, etc)
- [ ] Load testing

### Phase 13: Deployment Preparation ✓

- [ ] Configure production database
- [ ] Setup error logging (NLog/Serilog)
- [ ] Configure mail notifications
- [ ] Create backup strategy
- [ ] Document deployment steps
- [ ] Create installation guide
- [ ] Setup monitoring & alerts

### Phase 14: Documentation ✓

- [ ] Create user manual
- [ ] Create admin guide
- [ ] Create operator guide
- [ ] Create technical documentation
- [ ] Create troubleshooting guide
- [ ] Create FAQ

---

## Tips & Best Practices

### Development Tips

1. **Use interfaces** untuk service layer → mudah untuk testing & mocking
2. **Implement repository pattern** → abstraction untuk data access
3. **Use DTOs** untuk API → jangan expose database entities langsung
4. **Centralize configuration** → connection strings, URLs di config file
5. **Implement proper error handling** → try-catch-finally, validation
6. **Use async/await** → better performance untuk I/O operations
7. **Log extensively** → debugging lebih mudah
8. **Write unit tests** → coverage minimum 70%

### Security Best Practices

1. **Hash passwords** → never store plain text
2. **Validate all inputs** → server-side validation
3. **Prevent SQL injection** → use parameterized queries
4. **Prevent XSS** → encode output
5. **Use HTTPS** → encrypt data in transit
6. **Implement CSRF protection** → for form submissions
7. **Rate limiting** → prevent brute force attacks
8. **Audit logging** → track user actions

### Performance Tips

1. **Use indexes** → on frequently queried columns
2. **Pagination** → don't load all records at once
3. **Caching** → cache frequently accessed data
4. **Async operations** → non-blocking I/O
5. **Database optimization** → optimize queries
6. **Minify CSS/JS** → reduce file sizes
7. **Use CDN** → for static assets

---

## Troubleshooting Guide

### Database Connection Issues

**Problem:** "Cannot open database"  
**Solution:**
1. Verify SQL Server instance is running
2. Check connection string
3. Verify database exists
4. Check user permissions

### Entity Framework Issues

**Problem:** "The object set for entity type X has been disposed"  
**Solution:**
1. Use `using` statement for DbContext
2. Implement Unit of Work pattern
3. Enable lazy loading if needed

### API Call Issues

**Problem:** "HttpClient timeout"  
**Solution:**
1. Increase timeout value
2. Check provider server status
3. Check network connectivity
4. Implement retry logic

---

## Kesimpulan

AjoTopup adalah project yang sempurna untuk mempelajari:
- Full-stack .NET development
- Sistem transaction processing
- API integration
- Database design
- MVC architecture
- Service-oriented design

**Estimated Development Time:**
- Pemula: 3-4 minggu
- Intermediate: 2-3 minggu
- Advanced: 1-2 minggu

**Next Steps untuk Production:**
1. Implement authentication dengan OAuth/OpenID Connect
2. Add real database encryption
3. Implement payment gateway integration
4. Add SMS notification untuk status transaksi
5. Create mobile app (React Native / Flutter)
6. Setup CI/CD pipeline

---

**Good luck with your AjoTopup project! Happy coding! 🚀**

---

*Dokumentasi ini dibuat untuk memudahkan development dengan vibe coding approach. Update dokumentasi jika ada perubahan pada design atau requirements.*
