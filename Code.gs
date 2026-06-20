// ============================================================
// FAMILY TRACKER PRO - Google Apps Script Backend
// Deploy as Web App: Execute as Me, Anyone can access
// ============================================================

const SHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const ss = SpreadsheetApp.getActiveSpreadsheet();

// Sheet names
const SHEETS = {
  USERS: 'Users',
  LIVE_LOCATION: 'LiveLocation',
  GEOFENCE: 'Geofences',
  SOS: 'SOS',
  HISTORY: 'LocationHistory',
  SESSIONS: 'Sessions',
  NOTIFICATIONS: 'Notifications'
};

// Initialize all sheets if not exist
function initializeSheets() {
  const sheetDefs = {
    [SHEETS.USERS]: ['UserID','Name','Mobile','Email','PasswordHash','Role','Status','CreatedDate','ProfilePic','HomeAddress','FamilyGroup'],
    [SHEETS.LIVE_LOCATION]: ['RecordID','UserID','Latitude','Longitude','Accuracy','Speed','Battery','Timestamp','IsOnline'],
    [SHEETS.GEOFENCE]: ['ZoneID','ZoneName','Latitude','Longitude','Radius','CreatedBy','Color','Active'],
    [SHEETS.SOS]: ['SOSID','UserID','Latitude','Longitude','Timestamp','Status','Message'],
    [SHEETS.HISTORY]: ['HistoryID','UserID','Latitude','Longitude','Speed','Timestamp','Date'],
    [SHEETS.SESSIONS]: ['SessionID','UserID','Token','CreatedAt','ExpiresAt','Active'],
    [SHEETS.NOTIFICATIONS]: ['NotifID','UserID','Type','Message','Timestamp','Read']
  };

  Object.entries(sheetDefs).forEach(([name, headers]) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1a73e8').setFontColor('#ffffff');
    }
  });
  return { success: true, message: 'Sheets initialized' };
}

// ============================================================
// REQUEST HANDLER — GET + POST dono support
// ============================================================
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    let params = {};

    // GET parameters (primary — CORS friendly)
    if (e && e.parameter) {
      params = Object.assign({}, e.parameter);
    }

    // POST JSON body (fallback)
    if (e && e.postData && e.postData.contents) {
      try {
        const postParams = JSON.parse(e.postData.contents);
        params = Object.assign({}, postParams, params); // GET overrides POST
      } catch(parseErr) {}
    }

    const action = params.action;
    if (!action) {
      return ContentService.createTextOutput(
        JSON.stringify({ error: 'No action specified', received: JSON.stringify(params).substring(0,100) })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    let result = {};

    switch (action) {
      case 'init': result = initializeSheets(); break;
      case 'register': result = registerUser(params); break;
      case 'login': result = loginUser(params); break;
      case 'logout': result = logoutUser(params); break;
      case 'getMembers': result = getMembers(params); break;
      case 'updateLocation': result = updateLocation(params); break;
      case 'getLocations': result = getLocations(params); break;
      case 'getHistory': result = getLocationHistory(params); break;
      case 'addGeofence': result = addGeofence(params); break;
      case 'getGeofences': result = getGeofences(params); break;
      case 'deleteGeofence': result = deleteGeofence(params); break;
      case 'sendSOS': result = sendSOS(params); break;
      case 'getSOSAlerts': result = getSOSAlerts(params); break;
      case 'resolveSOSAlert': result = resolveSOSAlert(params); break;
      case 'saveHistory': result = saveHistoryRecord(params); break;
      case 'addMember': result = addMember(params); break;
      case 'deleteMember': result = deleteMember(params); break;
      case 'updateProfile': result = updateProfile(params); break;
      case 'getNotifications': result = getNotifications(params); break;
      case 'markNotifRead': result = markNotifRead(params); break;
      case 'getReports': result = getReports(params); break;
      default: result = { error: 'Unknown action: ' + action };
    }

    output.setContent(JSON.stringify(result));
  } catch (err) {
    output.setContent(JSON.stringify({ error: err.toString(), stack: err.stack }));
  }

  return output;
}

// ============================================================
// AUTH FUNCTIONS
// ============================================================
function hashPassword(password) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,
    password + 'FamilyTrackerSalt2024').map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
}

function generateToken() {
  return Utilities.getUuid() + '-' + new Date().getTime();
}

function validateSession(token) {
  if (!token) return null;
  const sheet = ss.getSheetByName(SHEETS.SESSIONS);
  const data = sheet.getDataRange().getValues();
  const now = new Date();
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === token && data[i][4] === true && new Date(data[i][4]) > now) {
      // Extend session
      return data[i][1]; // UserID
    }
    if (data[i][2] === token && data[i][5] == true) {
      return data[i][1];
    }
  }
  // Also check by token match with active=TRUE
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === token && data[i][5] == true) {
      return data[i][1];
    }
  }
  return null;
}

function registerUser(params) {
  const { name, mobile, email, password, role } = params;
  if (!name || !password || (!mobile && !email)) return { error: 'Missing required fields' };

  const sheet = ss.getSheetByName(SHEETS.USERS);
  const data = sheet.getDataRange().getValues();

  // Check duplicate
  for (let i = 1; i < data.length; i++) {
    if ((mobile && data[i][2] === mobile) || (email && data[i][3] === email)) {
      return { error: 'User already exists with this mobile/email' };
    }
  }

  // First user = Super Admin
  const isFirst = data.length <= 1;
  const userID = 'USR-' + Utilities.getUuid().substring(0, 8).toUpperCase();
  const hash = hashPassword(password);
  const now = new Date().toISOString();

  sheet.appendRow([
    userID, name, mobile || '', email || '', hash,
    isFirst ? 'superadmin' : (role || 'member'),
    'active', now, '', '', 'FamilyGroup1'
  ]);

  return { success: true, userID, message: isFirst ? 'Super Admin created' : 'Member registered' };
}

function loginUser(params) {
  const { identifier, password } = params;
  if (!identifier || !password) return { error: 'Missing credentials' };

  const sheet = ss.getSheetByName(SHEETS.USERS);
  const data = sheet.getDataRange().getValues();
  const hash = hashPassword(password);

  let user = null;
  for (let i = 1; i < data.length; i++) {
    const rowMobile = String(data[i][2]).trim();
    const rowEmail  = String(data[i][3]).trim();
    const rowHash   = String(data[i][4]).trim();
    const rowStatus = String(data[i][6]).trim().toLowerCase();
    const id = String(identifier).trim();

    const identifierMatch = (rowMobile === id || rowEmail === id);
    if (!identifierMatch) continue;

    // Support both: hashed password AND plain text password (manually added users)
    const passwordMatch = (rowHash === hash) || (rowHash === password);
    if (!passwordMatch) {
      return { error: 'Invalid credentials — wrong password' };
    }

    if (rowStatus !== 'active') return { error: 'Account is disabled' };

    // If plain text password found, auto-hash it for security
    if (rowHash === password) {
      sheet.getRange(i + 1, 5).setValue(hash);
    }

    user = {
      userID: data[i][0], name: data[i][1], mobile: data[i][2],
      email: data[i][3], role: data[i][5], status: data[i][6], profilePic: data[i][8]
    };
    break;
  }

  if (!user) return { error: 'Invalid credentials — user not found' };

  const token = generateToken();
  const sessionSheet = ss.getSheetByName(SHEETS.SESSIONS);
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  sessionSheet.appendRow(['SES-' + Utilities.getUuid().substring(0,8), user.userID, token, new Date().toISOString(), expires, true]);

  return { success: true, token, user };
}

function logoutUser(params) {
  const { token } = params;
  const sheet = ss.getSheetByName(SHEETS.SESSIONS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === token) {
      sheet.getRange(i + 1, 6).setValue(false);
      return { success: true };
    }
  }
  return { success: true };
}

// ============================================================
// MEMBER FUNCTIONS
// ============================================================
function getMembers(params) {
  const { token } = params;
  const sheet = ss.getSheetByName(SHEETS.USERS);
  const data = sheet.getDataRange().getValues();
  const members = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      members.push({
        userID: data[i][0], name: data[i][1], mobile: data[i][2],
        email: data[i][3], role: data[i][5], status: data[i][6],
        profilePic: data[i][8], homeAddress: data[i][9]
      });
    }
  }
  return { success: true, members };
}

function addMember(params) {
  return registerUser({ ...params, role: 'member' });
}

function deleteMember(params) {
  const { userID, token } = params;
  const sheet = ss.getSheetByName(SHEETS.USERS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userID) {
      sheet.getRange(i + 1, 7).setValue('deleted');
      return { success: true };
    }
  }
  return { error: 'User not found' };
}

function updateProfile(params) {
  const { token, userID, name, email, mobile, homeAddress } = params;
  const sheet = ss.getSheetByName(SHEETS.USERS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userID) {
      if (name) sheet.getRange(i+1, 2).setValue(name);
      if (mobile) sheet.getRange(i+1, 3).setValue(mobile);
      if (email) sheet.getRange(i+1, 4).setValue(email);
      if (homeAddress) sheet.getRange(i+1, 10).setValue(homeAddress);
      return { success: true };
    }
  }
  return { error: 'User not found' };
}

// ============================================================
// LOCATION FUNCTIONS
// ============================================================
function updateLocation(params) {
  const { userID, latitude, longitude, accuracy, speed, battery } = params;
  const sheet = ss.getSheetByName(SHEETS.LIVE_LOCATION);
  const data = sheet.getDataRange().getValues();
  const now = new Date().toISOString();

  const newSpeed = parseFloat(speed) || 0;
  const newBat   = parseFloat(battery) || 100;
  const newAcc   = parseFloat(accuracy) || 0;

  // Update existing row
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim() === String(userID).trim()) {
      const prevSpeed = parseFloat(data[i][5]) || 0;

      // Speed preservation: if GPS sends 0 but was moving, keep last known speed
      // Only reset to 0 if 3 consecutive 0s come in (truly parked)
      const prevZeroFlag = data[i][8] === 'zero1' ? 1 : data[i][8] === 'zero2' ? 2 : 0;
      let finalSpeed = newSpeed;
      let zeroFlag   = true; // isOnline flag column

      if (newSpeed === 0 && prevSpeed > 0) {
        if (prevZeroFlag < 2) {
          finalSpeed = prevSpeed; // keep last known speed
          zeroFlag   = 'zero' + (prevZeroFlag + 1);
        } else {
          finalSpeed = 0;         // truly stopped after 3 zeros
          zeroFlag   = true;
        }
      }

      sheet.getRange(i+1, 3, 1, 7).setValues([[
        parseFloat(latitude), parseFloat(longitude),
        newAcc, finalSpeed, newBat, now, zeroFlag
      ]]);

      // Auto-save to history
      storeHistory(userID, latitude, longitude, finalSpeed, newAcc, newBat, now);
      return { success: true, speed: finalSpeed };
    }
  }

  // New entry
  const recID = 'LOC-' + Utilities.getUuid().substring(0,8);
  sheet.appendRow([recID, userID, parseFloat(latitude), parseFloat(longitude),
    newAcc, newSpeed, newBat, now, true]);
  storeHistory(userID, latitude, longitude, newSpeed, newAcc, newBat, now);
  return { success: true };
}

function storeHistory(userID, lat, lng, speed, accuracy, battery, timestamp) {
  const sheet = ss.getSheetByName(SHEETS.HISTORY);
  const today = new Date().toISOString().split('T')[0];
  const histID = 'HIS-' + Utilities.getUuid().substring(0,8);
  sheet.appendRow([histID, userID, parseFloat(lat), parseFloat(lng),
    parseFloat(speed)||0, timestamp, today,
    parseFloat(accuracy)||0, parseFloat(battery)||100]);
}

// Called from frontend batch history save
function saveHistoryRecord(params) {
  const { userID, latitude, longitude, speed, accuracy, battery, timestamp, date } = params;
  if (!userID || !latitude || !longitude) return { error: 'Missing params' };
  const sheet = ss.getSheetByName(SHEETS.HISTORY);
  const histID = 'HIS-' + Utilities.getUuid().substring(0,8);
  const today  = date || new Date().toISOString().split('T')[0];
  sheet.appendRow([histID, userID, parseFloat(latitude), parseFloat(longitude),
    parseFloat(speed)||0, timestamp || new Date().toISOString(), today,
    parseFloat(accuracy)||0, parseFloat(battery)||100]);
  return { success: true };
}

function getLocations(params) {
  const sheet = ss.getSheetByName(SHEETS.LIVE_LOCATION);
  const userSheet = ss.getSheetByName(SHEETS.USERS);
  const locData = sheet.getDataRange().getValues();
  const userData = userSheet.getDataRange().getValues();

  const userMap = {};
  for (let i = 1; i < userData.length; i++) {
    if (userData[i][6] === 'active') {
      userMap[userData[i][0]] = { name: userData[i][1], role: userData[i][5], profilePic: userData[i][8] };
    }
  }

  const locations = [];
  const now = new Date();
  for (let i = 1; i < locData.length; i++) {
    if (!locData[i][1]) continue;
    const uid = locData[i][1];
    const lastSeen = new Date(locData[i][7]);
    const minsAgo = (now - lastSeen) / 60000;
    // Online if seen in last 2 minutes
    const isOnline = minsAgo < 2 && locData[i][8] !== false;

    locations.push({
      recordID:  locData[i][0],
      userID:    uid,
      name:      userMap[uid] ? userMap[uid].name : 'Unknown',
      role:      userMap[uid] ? userMap[uid].role : '',
      latitude:  parseFloat(locData[i][2]) || 0,
      longitude: parseFloat(locData[i][3]) || 0,
      accuracy:  parseFloat(locData[i][4]) || 0,
      speed:     parseFloat(locData[i][5]) || 0,   // always number
      battery:   parseFloat(locData[i][6]) || 0,
      timestamp: locData[i][7],
      isOnline,
      minsAgo:   Math.round(minsAgo)
    });
  }
  return { success: true, locations };
}

function getLocationHistory(params) {
  const { userID, date, limit } = params;
  const sheet = ss.getSheetByName(SHEETS.HISTORY);
  const data = sheet.getDataRange().getValues();
  const results = [];

  for (let i = 1; i < data.length; i++) {
    if (userID && data[i][1] !== userID) continue;
    if (date && data[i][6] !== date) continue;
    results.push({
      historyID: data[i][0], userID: data[i][1],
      latitude: data[i][2], longitude: data[i][3],
      speed: data[i][4], timestamp: data[i][5], date: data[i][6]
    });
  }

  const limited = limit ? results.slice(-parseInt(limit)) : results.slice(-500);
  return { success: true, history: limited };
}

// ============================================================
// GEOFENCE FUNCTIONS
// ============================================================
function addGeofence(params) {
  const { token, name, latitude, longitude, radius, color, createdBy } = params;
  const sheet = ss.getSheetByName(SHEETS.GEOFENCE);
  const zoneID = 'GEO-' + Utilities.getUuid().substring(0,8);
  sheet.appendRow([zoneID, name, latitude, longitude, radius || 200, createdBy || 'admin', color || '#4285f4', true]);
  return { success: true, zoneID };
}

function getGeofences(params) {
  const sheet = ss.getSheetByName(SHEETS.GEOFENCE);
  const data = sheet.getDataRange().getValues();
  const zones = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][7] != false) {
      zones.push({
        zoneID: data[i][0], name: data[i][1],
        latitude: data[i][2], longitude: data[i][3],
        radius: data[i][4], createdBy: data[i][5],
        color: data[i][6], active: data[i][7]
      });
    }
  }
  return { success: true, zones };
}

function deleteGeofence(params) {
  const { zoneID } = params;
  const sheet = ss.getSheetByName(SHEETS.GEOFENCE);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === zoneID) {
      sheet.getRange(i+1, 8).setValue(false);
      return { success: true };
    }
  }
  return { error: 'Zone not found' };
}

// ============================================================
// SOS FUNCTIONS
// ============================================================
function sendSOS(params) {
  const { userID, latitude, longitude, message } = params;
  const sheet = ss.getSheetByName(SHEETS.SOS);
  const sosID = 'SOS-' + Utilities.getUuid().substring(0,8);
  const now = new Date().toISOString();
  sheet.appendRow([sosID, userID, latitude, longitude, now, 'active', message || 'Emergency!']);

  // Add notification for all members
  addNotificationAll('sos', `🆘 SOS Alert from a family member! Location shared.`);
  return { success: true, sosID };
}

function getSOSAlerts(params) {
  const sheet = ss.getSheetByName(SHEETS.SOS);
  const userSheet = ss.getSheetByName(SHEETS.USERS);
  const sosData = sheet.getDataRange().getValues();
  const userData = userSheet.getDataRange().getValues();
  const userMap = {};
  for (let i = 1; i < userData.length; i++) userMap[userData[i][0]] = userData[i][1];

  const alerts = [];
  for (let i = 1; i < sosData.length; i++) {
    if (sosData[i][0]) {
      alerts.push({
        sosID: sosData[i][0], userID: sosData[i][1],
        name: userMap[sosData[i][1]] || 'Unknown',
        latitude: sosData[i][2], longitude: sosData[i][3],
        timestamp: sosData[i][4], status: sosData[i][5], message: sosData[i][6]
      });
    }
  }
  return { success: true, alerts: alerts.reverse() };
}

function resolveSOSAlert(params) {
  const { sosID } = params;
  const sheet = ss.getSheetByName(SHEETS.SOS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === sosID) {
      sheet.getRange(i+1, 6).setValue('resolved');
      return { success: true };
    }
  }
  return { error: 'Alert not found' };
}

// ============================================================
// NOTIFICATIONS
// ============================================================
function addNotificationAll(type, message) {
  const userSheet = ss.getSheetByName(SHEETS.USERS);
  const notifSheet = ss.getSheetByName(SHEETS.NOTIFICATIONS);
  const users = userSheet.getDataRange().getValues();
  const now = new Date().toISOString();
  for (let i = 1; i < users.length; i++) {
    if (users[i][6] === 'active') {
      notifSheet.appendRow(['NTF-' + Utilities.getUuid().substring(0,8), users[i][0], type, message, now, false]);
    }
  }
}

function getNotifications(params) {
  const { userID } = params;
  const sheet = ss.getSheetByName(SHEETS.NOTIFICATIONS);
  const data = sheet.getDataRange().getValues();
  const notifs = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === userID) {
      notifs.push({
        notifID: data[i][0], type: data[i][2],
        message: data[i][3], timestamp: data[i][4], read: data[i][5]
      });
    }
  }
  return { success: true, notifications: notifs.reverse().slice(0,50) };
}

function markNotifRead(params) {
  const { notifID } = params;
  const sheet = ss.getSheetByName(SHEETS.NOTIFICATIONS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === notifID) {
      sheet.getRange(i+1, 6).setValue(true);
      return { success: true };
    }
  }
  return { error: 'Not found' };
}

function getReports(params) {
  const { userID, fromDate, toDate } = params;
  const sheet = ss.getSheetByName(SHEETS.HISTORY);
  const data = sheet.getDataRange().getValues();
  const report = {};

  for (let i = 1; i < data.length; i++) {
    if (userID && data[i][1] !== userID) continue;
    const date = data[i][6];
    if (fromDate && date < fromDate) continue;
    if (toDate && date > toDate) continue;
    if (!report[date]) report[date] = { date, points: 0, maxSpeed: 0 };
    report[date].points++;
    if (parseFloat(data[i][4]) > report[date].maxSpeed) report[date].maxSpeed = parseFloat(data[i][4]);
  }

  return { success: true, report: Object.values(report).sort((a,b) => b.date.localeCompare(a.date)) };
}
