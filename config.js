// ============================================================
//  FAMILY TRACKER PRO — CONFIG FILE
//  ✅ Sirf yahan apna Google Apps Script URL paste karo
//  ✅ Baaki sab automatically kaam karega
// ============================================================

const FT_CONFIG = {

  // ─────────────────────────────────────────────
  // 🔗 GOOGLE APPS SCRIPT URL — YAHAN PASTE KARO
  // Deploy karne ke baad milti hai yeh URL
  // Format: https://script.google.com/macros/s/XXXXX/exec
  // ─────────────────────────────────────────────
  GAS_URL: "https://script.google.com/macros/s/YOUR_SCRIPT_ID_HERE/exec",

  // ─────────────────────────────────────────────
  // 🗺️ MAP STYLE — Default tile layer
  // Options: "osm" | "satellite" | "topo" | "dark"
  // Koi API key nahi chahiye! OpenStreetMap FREE hai
  // ─────────────────────────────────────────────
  MAP_STYLE: "osm",

  // ─────────────────────────────────────────────
  // ⏱️ LOCATION UPDATE INTERVAL (seconds)
  // Kitni der baad location update ho — default 30
  // ─────────────────────────────────────────────
  UPDATE_INTERVAL_SECONDS: 30,

  // ─────────────────────────────────────────────
  // 📍 HOME LOCATION (Geofence ke liye)
  // Apne ghar ki location yahan likhein
  // ─────────────────────────────────────────────
  HOME_LATITUDE:  25.3960,
  HOME_LONGITUDE: 68.3578,
  HOME_RADIUS_METERS: 200,

  // ─────────────────────────────────────────────
  // 👨‍👩‍👧 APP NAME & FAMILY GROUP
  // ─────────────────────────────────────────────
  APP_NAME: "Family Tracker Pro",
  FAMILY_GROUP_NAME: "My Family",

  // ─────────────────────────────────────────────
  // 🌙 DEFAULT THEME: "dark" ya "light"
  // ─────────────────────────────────────────────
  DEFAULT_THEME: "dark",

  // ─────────────────────────────────────────────
  // 🔔 NOTIFICATIONS ON/OFF
  // ─────────────────────────────────────────────
  ENABLE_NOTIFICATIONS: true,

  // ─────────────────────────────────────────────
  // 🛡️ GEOFENCE ALERT ON/OFF
  // ─────────────────────────────────────────────
  ENABLE_GEOFENCE_ALERTS: true,

  // ─────────────────────────────────────────────
  // 🔒 SESSION TIMEOUT (days)
  // ─────────────────────────────────────────────
  SESSION_TIMEOUT_DAYS: 30,

  // ─────────────────────────────────────────────
  // 📊 HISTORY: Kitne records store hon max
  // ─────────────────────────────────────────────
  MAX_HISTORY_RECORDS: 500,

};

// ============================================================
// ❌ YAHAN KE NEECHE KUCH CHANGE MAT KARO
// ============================================================
(function applyConfig() {
  // GAS URL validate
  if (!FT_CONFIG.GAS_URL || FT_CONFIG.GAS_URL.includes("YOUR_SCRIPT_ID")) {
    console.warn("[FamilyTracker] ⚠️ GAS URL set nahi ki — Settings se add karein");
  } else {
    localStorage.setItem('gasUrl', FT_CONFIG.GAS_URL);
    console.log("[FamilyTracker] ✅ GAS URL config se load hui:", FT_CONFIG.GAS_URL);
  }

  localStorage.setItem('theme', FT_CONFIG.DEFAULT_THEME);

  localStorage.setItem('appSettings', JSON.stringify({
    updateInterval:      FT_CONFIG.UPDATE_INTERVAL_SECONDS,
    highAccuracy:        true,
    shareLocation:       true,
    geoNotif:            FT_CONFIG.ENABLE_GEOFENCE_ALERTS,
    notifications:       FT_CONFIG.ENABLE_NOTIFICATIONS,
    maxHistory:          FT_CONFIG.MAX_HISTORY_RECORDS,
    sessionDays:         FT_CONFIG.SESSION_TIMEOUT_DAYS,
    homeLatitude:        FT_CONFIG.HOME_LATITUDE,
    homeLongitude:       FT_CONFIG.HOME_LONGITUDE,
    homeRadius:          FT_CONFIG.HOME_RADIUS_METERS,
    familyGroup:         FT_CONFIG.FAMILY_GROUP_NAME,
    appName:             FT_CONFIG.APP_NAME,
  }));

  console.log("[FamilyTracker] ✅ Config apply ho gayi");
})();
