# Deployment & Configuration Guide

## ✅ What Was Fixed

### Issue 1: API Endpoint Mismatch in AjoTopup
**File:** `AjoTopup/Web.config`

```xml
<!-- Before (broken - only works locally) -->
<add key="AjoApiBaseUrl" value="http://localhost:5000/api/" />

<!-- After (fixed - connects to deployed API) -->
<add key="AjoApiBaseUrl" value="https://ajo-project.vercel.app/api/" />
```

**Why:** AjoTopup MVC app was trying to call a local API server that doesn't exist in production.

---

### Issue 2: Hardcoded API URL in AjoAPI React App
**File:** `AjoAPI/src/App.jsx`

```javascript
// Before (hardcoded - doesn't work in deployment)
const API_BASE = 'http://localhost:5000/api';

// After (dynamic - works everywhere)
const API_BASE = import.meta.env.VITE_API_BASE || 'https://ajo-project.vercel.app/api';
```

**Why:** The React dashboard couldn't connect to the actual deployed API when running on Vercel.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────┐
│     AjoTopup (ASP.NET MVC)      │
│     http://ajogalehlauak.somee.com  │
│                                 │
│  • Login / Authentication       │
│  • Product Management (Admin)   │
│  • Transaction Form (Users)     │
│  • Transaction History          │
│                                 │
│  Database: SQL Server           │
│  Tables: Users, Products,       │
│          Transactions           │
└──────────────┬──────────────────┘
               │ HTTP POST
               │ (productCode, destination)
               ▼
┌─────────────────────────────────┐
│      AjoAPI (Node.js/Express)   │
│      https://ajo-project.vercel.app  │
│                                 │
│  • Processes transactions       │
│  • Manages provider status      │
│  • Logs all API calls           │
│                                 │
│  Database: Supabase PostgreSQL  │
│  Tables: products, providers,   │
│          transactions,          │
│          transaction_logs       │
└──────────────┬──────────────────┘
               │ SQL Queries
               ▼
┌─────────────────────────────────┐
│         Supabase PostgreSQL      │
│     (Cloud Database)             │
│                                 │
│  • Real-time transaction logs   │
│  • Provider management          │
│  • Product catalog              │
└─────────────────────────────────┘
```

---

## 🚀 Deployment Instructions

### Step 1: Deploy AjoTopup to Somee

1. **Build the project** in Visual Studio
2. **Publish** to a folder
3. **Upload** to http://ajogalehlauak.somee.com via Somee control panel
4. **Update Web.config** on the server with the correct API URL:
   ```xml
   <add key="AjoApiBaseUrl" value="https://ajo-project.vercel.app/api/" />
   ```

### Step 2: Deploy AjoAPI to Vercel

1. **Ensure .env is configured** (already done):
   ```
   DATABASE_URL=postgres://postgres.svrhiymecinpkclxagwi:AjoTopup12345!@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
   ```

2. **Build and deploy** to Vercel:
   ```bash
   cd AjoAPI
   npm install
   npm run build
   vercel deploy
   ```

3. **Verify deployment**:
   - API Health: https://ajo-project.vercel.app/api/health
   - API Products: https://ajo-project.vercel.app/api/products

---

## ✅ Verification Checklist

After deployment, verify these endpoints work:

- [ ] **AjoTopup Login:** http://ajogalehlauak.somee.com/login
- [ ] **AjoTopup Dashboard:** http://ajogalehlauak.somee.com/dashboard (requires login)
- [ ] **AjoAPI Health:** https://ajo-project.vercel.app/api/health
- [ ] **AjoAPI Products:** https://ajo-project.vercel.app/api/products
- [ ] **AjoAPI React Dashboard:** https://ajo-project.vercel.app (full page)

---

## 🔧 Testing Integration

### Test 1: Verify API Connectivity
```bash
# Test products endpoint
curl "https://ajo-project.vercel.app/api/products" | jq

# Test health endpoint
curl "https://ajo-project.vercel.app/api/health" | jq
```

### Test 2: Test Transaction Flow
1. Login to AjoTopup at http://ajogalehlauak.somee.com/login
2. Navigate to Transaction page
3. Select a product (e.g., TSEL10 - Telkomsel 10.000)
4. Enter a test destination number (e.g., 081234567890)
5. Submit the transaction
6. Check AjoAPI React dashboard at https://ajo-project.vercel.app to see the transaction logged

### Test 3: Verify React Dashboard
1. Open https://ajo-project.vercel.app in browser
2. Check "Live Integration Monitor" tab - should show transaction logs
3. Check "API Sandbox & Tester" tab - can send test transactions
4. Check "Products & Providers" tab - should show product list

---

## 📊 API Endpoints Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Server health check |
| `/api/products` | GET | Get all products |
| `/api/providers` | GET | Get all providers |
| `/api/provider/toggle` | POST | Toggle provider status |
| `/api/transaction` | POST | Process a transaction |
| `/api/transaction` | GET | Get transaction history |
| `/api/transaction/:id` | GET | Get transaction details |
| `/api/stats` | GET | Get transaction statistics |
| `/api/logs` | GET | Get audit logs |

---

## 🐛 Troubleshooting

### Problem: "Connection refused" or "API not responding"
**Solution:**
1. Verify AjoAPI is deployed at https://ajo-project.vercel.app
2. Check Web.config has correct URL: `https://ajo-project.vercel.app/api/`
3. Verify Supabase connection is working in Vercel environment variables

### Problem: Transactions not appearing in React dashboard
**Solution:**
1. Check AjoAPI logs for errors
2. Verify Supabase database tables exist and are accessible
3. Test API directly: `curl -X POST https://ajo-project.vercel.app/api/transaction -d '{"productCode":"TSEL10","destination":"081234567890"}'`

### Problem: Login doesn't work
**Solution:**
1. Verify SQL Server is accessible from Somee
2. Check connection string in AjoTopup Web.config
3. Verify Users table exists and has admin user

---

## 📝 Environment Variables

### AjoTopup (Somee - ASP.NET)
Configured in Web.config (not in git):
```xml
<appSettings>
  <add key="AjoApiBaseUrl" value="https://ajo-project.vercel.app/api/" />
</appSettings>
```

### AjoAPI (Vercel - Node.js)
Configured in .env and Vercel dashboard:
```
DATABASE_URL=postgres://postgres.svrhiymecinpkclxagwi:AjoTopup12345!@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
PORT=5000
```

---

## 📈 Status Summary

| Component | Status | URL |
|-----------|--------|-----|
| AjoTopup MVC | ✅ Configured | http://ajogalehlauak.somee.com |
| AjoAPI Backend | ✅ Deployed | https://ajo-project.vercel.app |
| Supabase DB | ✅ Connected | Via AjoAPI backend |
| SQL Server DB | ✅ Configured | Local to Somee |

**All integrations are now properly configured! 🎉**
