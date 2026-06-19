# Family Tracker Pro — Complete Setup Guide
## مکمل سیٹ اپ گائیڈ

---

## 📁 File Structure / فائل اسٹرکچر

```
family-tracker/
├── index.html          ← Main PWA App
├── sw.js               ← Service Worker (offline support)
├── manifest.json       ← PWA manifest
├── Code.gs             ← Google Apps Script backend
├── icons/              ← App icons (all sizes)
│   ├── icon-72.png
│   ├── icon-192.png
│   ├── icon-512.png
│   └── ...
└── .github/
    └── workflows/
        └── deploy.yml  ← Auto-deploy to GitHub Pages
```

---

## STEP 1: Google Sheets + Apps Script Setup

### 1.1 — Create Google Sheet

1. Go to **https://sheets.google.com** → New spreadsheet
2. Name it: `Family Tracker Pro DB`
3. Note the **Spreadsheet ID** from the URL:
   `https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/edit`

### 1.2 — Create Apps Script

1. In your Google Sheet → **Extensions → Apps Script**
2. Delete any existing code
3. Paste the entire contents of `Code.gs`
4. Click **Save** (💾)
5. Click **Run → initializeSheets** to create all sheets automatically
   - Grant permissions when asked

### 1.3 — Deploy as Web App

1. Click **Deploy → New Deployment**
2. Click the gear icon ⚙️ → Select type: **Web App**
3. Set:
   - **Description**: `Family Tracker API v1`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
4. Click **Deploy**
5. **Copy the Web App URL** — it looks like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```
   ⚠️ Save this URL — you'll need it in the app!

---

## STEP 2: GitHub Pages Hosting

### 2.1 — Create GitHub Repository

1. Go to **https://github.com** → Sign in → **New Repository**
2. Name: `family-tracker` (or any name)
3. Set to **Public**
4. Click **Create repository**

### 2.2 — Upload Files

**Option A — GitHub Web Upload:**
1. Go to your repo → Click **Add file → Upload files**
2. Upload ALL files:
   - `index.html`
   - `sw.js`
   - `manifest.json`
   - Entire `icons/` folder
   - `.github/workflows/deploy.yml`
3. Click **Commit changes**

**Option B — Git Command Line:**
```bash
git init
git add .
git commit -m "Initial deploy: Family Tracker Pro"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/family-tracker.git
git push -u origin main
```

### 2.3 — Enable GitHub Pages

1. Go to repo → **Settings → Pages**
2. Source: **GitHub Actions**
3. Wait 2-3 minutes
4. Your app will be live at:
   ```
   https://YOUR_USERNAME.github.io/family-tracker/
   ```

---

## STEP 3: Google Maps Setup (Optional but Recommended)

### 3.1 — Get API Key

1. Go to **https://console.cloud.google.com**
2. Create a new project or select existing
3. Go to **APIs & Services → Enable APIs**
4. Enable: **Maps JavaScript API**
5. Go to **APIs & Services → Credentials → Create Credentials → API Key**
6. Copy your API key

### 3.2 — Restrict API Key (Security)

1. In Credentials → click your key
2. Application restrictions: **HTTP referrers**
3. Add: `https://YOUR_USERNAME.github.io/*`
4. API restrictions: **Maps JavaScript API only**

---

## STEP 4: First-Time App Configuration

1. Open your app: `https://YOUR_USERNAME.github.io/family-tracker/`
2. Click **Try Demo** to test the app first
3. When ready, click **Register** tab to create your Super Admin account
4. After login → Go to **Settings**
5. Paste your **Google Apps Script URL** → Click Save & Test
6. Paste your **Google Maps API Key** → Click Save & Load Map
7. Enable **Location Sharing** toggle
8. Allow browser **GPS permission** when asked

---

## STEP 5: Install as Android App (PWA)

1. Open Chrome on Android
2. Go to: `https://YOUR_USERNAME.github.io/family-tracker/`
3. Chrome will show **"Add to Home Screen"** banner at bottom
4. OR tap Chrome menu (⋮) → **"Add to Home Screen"**
5. Click **Install**
6. The app appears on home screen with icon!

> ✅ The app will work like a native Android app with offline support.

---

## STEP 6: Add Family Members

### As Super Admin:
1. Go to **Family Members** section
2. Click **Add Member**
3. Fill: Name, Mobile, Email, Password
4. Share the login credentials with that family member
5. They open the same URL and log in

---

## Google Sheets Structure (Auto-Created)

After running `initializeSheets`, your spreadsheet will have these tabs:

| Sheet | Purpose |
|-------|---------|
| **Users** | All family member accounts |
| **LiveLocation** | Current GPS of each member |
| **LocationHistory** | All past location records |
| **Geofences** | Safe zone definitions |
| **SOS** | Emergency alert records |
| **Sessions** | Auth session tokens |
| **Notifications** | Push notification log |

---

## Security Notes / سیکیورٹی

- ✅ Passwords are SHA-256 hashed (never stored plain)
- ✅ Session tokens expire after 30 days
- ✅ Role-based access (Super Admin vs Member)
- ✅ GPS only shared when app is open
- ⚠️ Restrict your Maps API key to your GitHub Pages domain
- ⚠️ Keep your GAS URL private (treat it like a password)

---

## Troubleshooting / مسائل حل

| Problem | Solution |
|---------|----------|
| Map not showing | Add Maps API key in Settings |
| Location not updating | Allow GPS permission in browser |
| Login fails | Check GAS URL in Settings |
| App won't install | Must be on HTTPS (GitHub Pages = HTTPS ✅) |
| GAS returns error | Re-deploy the Apps Script as new deployment |
| Offline not working | Clear browser cache, re-open app |

---

## Features Summary

| Feature | Status |
|---------|--------|
| Live GPS Tracking (30s) | ✅ |
| Google Maps with Markers | ✅ (needs API key) |
| Family Member Management | ✅ |
| Location History | ✅ |
| Geofencing Zones | ✅ |
| SOS Emergency Alerts | ✅ |
| Push Notifications | ✅ |
| PWA + Android Install | ✅ |
| Dark / Light Mode | ✅ |
| Offline Support | ✅ |
| Battery Level Tracking | ✅ |
| Speed Tracking | ✅ |
| Export to CSV | ✅ |
| Reports & Analytics | ✅ |
| Role-Based Access | ✅ |
| Demo Mode (no backend) | ✅ |

---

## Cost: 100% FREE

| Service | Cost |
|---------|------|
| GitHub Pages hosting | FREE |
| Google Apps Script | FREE |
| Google Sheets database | FREE |
| Google Maps API | FREE (28,000 loads/month) |
| PWA on Android | FREE |

---

*Family Tracker Pro — Built for Pakistani families 🇵🇰*
*Hyderabad, Sindh compatible • Urdu/Sindhi family names supported*
