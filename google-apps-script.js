/**
 * ============================================================================
 * PPA KALUGAMUWA CENTRAL COLLEGE - ANNUAL BLOOD DONATION CAMP 2026
 * Google Apps Script Webhook for GitHub Pages Data Collection
 * Inkspire Prints & Dimension
 * ============================================================================
 * 
 * 2-MINUTE SETUP INSTRUCTIONS:
 * 1. Open Google Sheets (https://sheets.new) and name it "KCC Blood Donation 2026"
 * 2. In Google Sheets, click "Extensions" > "Apps Script" from the top menu
 * 3. Delete any template code in the editor, and PASTE this entire script
 * 4. Click Save icon (Ctrl + S)
 * 5. Click the blue "Deploy" button (top-right) > "New deployment"
 * 6. Under "Select type" (gear icon), choose "Web app"
 * 7. Fill in the fields:
 *    - Description: "KCC Donor Collection Webhook v2"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone" (CRITICAL: Allows GitHub Pages to submit donors)
 * 8. Click "Deploy", then "Authorize access" (choose your Google account, click "Advanced" > "Go to KCC Blood Donation (unsafe)")
 * 9. Copy the generated "Web App URL" (starts with https://script.google.com/macros/s/...)
 * 10. Update GLOBAL_GOOGLE_SHEET_URL in config.js (and/or paste in admin.html Settings)
 * 
 * Done! Every donor registered on your website will automatically append to your Google Sheet
 * with guaranteed non-duplicating sequential Pass IDs (#PPA-KCC-BDC-001, 002, 003...)!
 * ============================================================================
 */

const ADMIN_PIN = "kcc2026";
const VALID_PINS = ["kcc2026", "Kcc@PPA2026", "kcc@ppa2026"];

function isValidPin(pin) {
  const p = String(pin || "").trim().toLowerCase();
  return VALID_PINS.some(v => v.toLowerCase() === p);
}
const SHEET_NAME = "Donors";

function setupSheet(sheet) {
  if (sheet.getLastRow() === 0) {
    const headers = [
      "Registered Timestamp (LK)",
      "Pass ID",
      "Full Name",
      "Gender",
      "Age",
      "DOB",
      "Contact Phone",
      "WhatsApp Number",
      "Address / Town",
      "Blood Group",
      "Preferred Slot",
      "Language",
      "Medical Check Status"
    ];
    sheet.appendRow(headers);
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#8f0e1f"); // KCC Crimson Red
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    sheet.setRowHeight(1, 36);
  }
}

/**
 * Handle POST request from GitHub Pages registration form or Admin Portal
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); // Wait up to 30s to prevent concurrent duplicate Pass IDs
  } catch (err) {
    return createJsonResponse({ status: "error", message: "Server busy, please retry in a moment" }, e);
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }
    setupSheet(sheet);

    let data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    // Handle Admin Action: Delete a donor by Pass ID
    if (data.action === "deleteDonor") {
      if (!isValidPin(data.pin)) {
        return createJsonResponse({ status: "error", message: "Unauthorized PIN" }, e);
      }
      const passIdToDelete = String(data.passId || "").trim();
      const rows = sheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][1]).trim() === passIdToDelete) {
          sheet.deleteRow(i + 1);
          return createJsonResponse({ status: "success", message: "Donor deleted", passId: passIdToDelete }, e);
        }
      }
      return createJsonResponse({ status: "error", message: "Donor not found" }, e);
    }

    // Handle Admin Action: Clear all donors
    if (data.action === "clearAll") {
      if (!isValidPin(data.pin)) {
        return createJsonResponse({ status: "error", message: "Unauthorized PIN" }, e);
      }
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.deleteRows(2, lastRow - 1);
      }
      return createJsonResponse({ status: "success", message: "All records cleared" }, e);
    }

    const now = new Date();
    const lkTime = Utilities.formatDate(now, "Asia/Colombo", "yyyy-MM-dd HH:mm:ss");

    // SCAN EXISTING SHEET TO FIND TRUE MAXIMUM PASS ID NUMBER (NEVER DUPLICATE)
    let maxNum = 0;
    const allData = sheet.getDataRange().getValues();
    for (let i = 1; i < allData.length; i++) {
      const existingId = String(allData[i][1] || "");
      const match = existingId.match(/BDC-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }

    const nextNum = maxNum + 1;
    const assignedPassId = "#PPA-KCC-BDC-" + Utilities.formatString("%03d", nextNum);

    sheet.appendRow([
      lkTime,
      assignedPassId,
      data.name || "N/A",
      data.gender || "N/A",
      data.age || "N/A",
      data.dob || "N/A",
      "'" + (data.contact || "N/A"), // prefix with ' to preserve leading zero
      "'" + (data.whatsapp || "N/A"),
      data.address || "N/A",
      data.bloodGroup || "Not Sure",
      data.slot || "Morning",
      data.lang || "en",
      "Pending Verification"
    ]);

    return createJsonResponse({
      status: "success",
      message: "Donor registration recorded in Google Sheet",
      passId: assignedPassId,
      seq: nextNum
    }, e);

  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: error.toString()
    }, e);
  } finally {
    try {
      lock.releaseLock();
    } catch (e) {
      // ignore
    }
  }
}

/**
 * Handle GET request from admin.html to fetch registered donors list or perform actions
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      return createJsonResponse({
        status: "success",
        total: 0,
        donors: []
      }, e);
    }

    const pin = (e && e.parameter && e.parameter.pin) || "";
    if (!isValidPin(pin)) {
      return createJsonResponse({
        status: "error",
        message: "Unauthorized: Invalid PIN"
      }, e);
    }

    const action = (e && e.parameter && e.parameter.action) || "getDonors";

    // Handle Delete via GET
    if (action === "delete") {
      const passIdToDelete = String(e.parameter.passId || "").trim();
      const rows = sheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][1]).trim() === passIdToDelete) {
          sheet.deleteRow(i + 1);
          return createJsonResponse({ status: "success", message: "Donor deleted", passId: passIdToDelete }, e);
        }
      }
      return createJsonResponse({ status: "error", message: "Donor not found" }, e);
    }

    // Handle Clear All via GET
    if (action === "clearAll") {
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.deleteRows(2, lastRow - 1);
      }
      return createJsonResponse({ status: "success", message: "All records cleared" }, e);
    }

    // Default: Get All Donors
    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) {
      return createJsonResponse({
        status: "success",
        total: 0,
        donors: []
      }, e);
    }

    const donors = [];
    for (let i = rows.length - 1; i >= 1; i--) { // Reverse order so newest is first
      const r = rows[i];
      donors.push({
        registeredAt: r[0],
        passId: r[1],
        name: r[2],
        gender: r[3],
        age: r[4],
        dob: r[5],
        contact: String(r[6]).replace(/^'/, ''),
        whatsapp: String(r[7]).replace(/^'/, ''),
        address: r[8],
        bloodGroup: r[9],
        slot: r[10],
        lang: r[11],
        status: r[12]
      });
    }

    return createJsonResponse({
      status: "success",
      total: donors.length,
      donors: donors
    }, e);

  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: error.toString()
    }, e);
  }
}

/**
 * Helper to return JSON or JSONP if callback parameter is present
 */
function createJsonResponse(data, e) {
  const jsonStr = JSON.stringify(data);
  const callback = (e && e.parameter && e.parameter.callback) || "";
  if (callback) {
    return ContentService.createTextOutput(callback + "(" + jsonStr + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(jsonStr)
    .setMimeType(ContentService.MimeType.JSON);
}
