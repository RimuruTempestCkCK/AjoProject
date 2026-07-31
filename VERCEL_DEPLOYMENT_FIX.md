# Vercel Deployment Fix - React Frontend

## 🎯 Masalah

Ketika mengakses https://ajo-project.vercel.app, muncul error "Not Found".
Namun https://ajo-project.vercel.app/api/health bisa diakses.

**Penyebab:** Konfigurasi Vercel salah - hanya melayani API endpoint, React frontend tidak di-deploy.

## ✅ Solusi

### 1. Update vercel.json

**Sebelum (salah):**
```json
{
  "builds": [{"src": "server.js", "use": "@vercel/node"}],
  "routes": [{"src": "/(.*)", "dest": "server.js"}]
}
```

**Sesudah (benar):**
```json
{
  "builds": [
    {"src": "server.js", "use": "@vercel/node"},
    {"src": "dist/**", "use": "@vercel/static"}
  ],
  "routes": [
    {"src": "/api/(.*)", "dest": "server.js"},
    {"src": "/assets/(.*)", "dest": "/assets/$1"},
    {"src": "/(.*)", "dest": "/index.html"}
  ]
}
```

### 2. Build React App

```bash
cd AjoAPI
npm run build
```

Output:
```
dist/index.html                   0.45 kB │ gzip:  0.29 kB
dist/assets/index-CZ98PcGH.css    0.62 kB │ gzip:  0.39 kB
dist/assets/index-BNxlb_dk.js   210.08 kB │ gzip: 64.73 kB
✓ built in 1.26s
```

### 3. Commit & Push to GitHub

```bash
cd C:\Users\Maxtop\Downloads\AjoProject
git add AjoAPI/src/App.jsx AjoAPI/vercel.json
git commit -m "fix: update Vercel configuration for React frontend deployment"
git push origin main
```

### 4. Redeploy di Vercel

1. Buka Vercel Dashboard: https://vercel.com/dashboard
2. Pilih project "ajo-project"
3. Klik "Deployments" tab
4. Klik "Redeploy" atau push trigger otomatis dari GitHub
5. Tunggu deployment selesai (~1-2 menit)
6. Test akses:
   - https://ajo-project.vercel.app (React Frontend)
   - https://ajo-project.vercel.app/api/health (Backend API)

## 📊 Deployment Routes

| URL Pattern | Handler | Description |
|------------|---------|-------------|
| `/api/*` | server.js | Backend API endpoints |
| `/assets/*` | dist/assets | React bundled JS & CSS |
| `/*` | dist/index.html | React SPA frontend |

## 🧪 Testing

### Test 1: React Frontend
```bash
curl https://ajo-project.vercel.app
# Should return HTML with React app
```

### Test 2: Backend API
```bash
curl https://ajo-project.vercel.app/api/health
# Should return: {"status":"UP","database":"ONLINE"...}
```

### Test 3: Full Stack
1. Buka https://ajo-project.vercel.app di browser
2. Dashboard React akan muncul
3. Klik tab "Live Integration Monitor"
4. Harusnya menampilkan real-time data dari Supabase

## 📁 Files Modified

| File | Changes |
|------|---------|
| AjoAPI/vercel.json | Added @vercel/static build, proper routing |
| AjoAPI/src/App.jsx | Updated API_BASE to use dynamic URL |

## 🔄 Build Process

Vercel akan:
1. **Install dependencies** - `npm install`
2. **Build React app** - `npm run build` (vite build)
3. **Build server.js** - `@vercel/node` builder
4. **Deploy** - Static files + serverless function

## 🐛 Troubleshooting

### Problem: Build fails on Vercel
**Solution:**
1. Check build logs in Vercel dashboard
2. Ensure package.json has correct build script
3. Verify node_modules is in .gitignore

### Problem: React app shows blank page
**Solution:**
1. Open browser console (F12)
2. Check for JavaScript errors
3. Verify API_BASE is correct in App.jsx
4. Test API endpoint directly

### Problem: API endpoints not working
**Solution:**
1. Check server.js logs in Vercel
2. Verify DATABASE_URL environment variable
3. Test health endpoint: /api/health

## 📝 Environment Variables (Vercel)

Ensure these are set in Vercel Dashboard:
```
DATABASE_URL=postgres://postgres.svrhiymecinpkclxagwi:AjoTopup12345!@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
PORT=5000
```

## ✅ Verification Checklist

- [ ] vercel.json has correct routing
- [ ] React app built successfully (`npm run build`)
- [ ] dist/ folder contains index.html and assets/
- [ ] Changes committed to GitHub
- [ ] Redeploy triggered on Vercel
- [ ] https://ajo-project.vercel.app loads React app
- [ ] https://ajo-project.vercel.app/api/health returns UP
- [ ] React dashboard displays data

---

**Status:** ✅ Ready for deployment
**Commit:** 1e8c25b
**Changes:** vercel.json + App.jsx
