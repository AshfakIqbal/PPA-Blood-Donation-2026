/**
 * ============================================================================
 * PPA KALUGAMUWA CENTRAL COLLEGE - ANNUAL BLOOD DONATION CAMP 2026
 * Write-Only Google Apps Script Collector for Public Registration Form
 * Inkspire Prints & Dimension
 * ============================================================================
 *
 * SECURITY MODEL (OPTION A — MAXIMUM SECURITY):
 * - This Web App is STRICTLY WRITE-ONLY (append new donor registrations only).
 * - Public GET requests NEVER return donor data.
 * - Delete / Wipe / Admin actions are completely disabled on the web endpoint.
 * - Coordinators view, search, filter, print, and export donor records directly
 *   inside the private "KCC Blood Donation 2026" Google Sheet (protected by
 *   Google Sign-In + 2-Factor Authentication).
 *
 * SETUP / UPDATE INSTRUCTIONS:
 * 1. Open Google Sheet "KCC Blood Donation 2026" -> Extensions > Apps Script
 * 2. Paste this entire script and Save (Ctrl + S)
 * 3. Click Deploy > Manage deployments > Edit (pencil icon) >
 *    Version: "New version" -> Deploy (keeps the existing Web App URL active!)
 *    - Execute as: "Me"
 *    - Who has access: "Anyone" (Required for public form POST only)
 * ============================================================================
 */

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
 * Prevent spreadsheet formula injection (=, +, -, @) and enforce sane lengths
 */
function sanitizeCell(value, maxLen) {
  let s = String(value == null ? "" : value).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "").trim();
  if (maxLen && s.length > maxLen) {
    s = s.substring(0, maxLen);
  }
  if (/^[=+\-@\t\r]/.test(s)) {
    s = "'" + s;
  }
  return s;
}

/**
 * Handle POST request from Public Registration Form (STRICTLY APPEND-ONLY)
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); // Prevent concurrent duplicate Pass IDs
  } catch (err) {
    return createJsonResponse({ status: "error", message: "Server busy, please retry in a moment" });
  }

  try {
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

    // Block all administrative or destructive actions on the public endpoint
    if (data && data.action && String(data.action).trim() !== "" && String(data.action).trim() !== "register") {
      return createJsonResponse({
        status: "error",
        message: "Administrative actions are disabled on the public endpoint. Manage records directly inside Google Sheets."
      });
    }

    const name = sanitizeCell(data.name, 120);
    const contactRaw = String(data.contact || "").replace(/[\r\n]/g, "").trim().substring(0, 40);

    if (!name || !contactRaw) {
      return createJsonResponse({
        status: "error",
        message: "Missing required donor fields (name and contact)."
      });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }
    setupSheet(sheet);

    const now = new Date();
    const lkTime = Utilities.formatDate(now, "Asia/Colombo", "yyyy-MM-dd HH:mm:ss");

    // Scan existing rows to guarantee unique sequential Pass IDs
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

    const whatsappRaw = String(data.whatsapp || contactRaw).replace(/[\r\n]/g, "").trim().substring(0, 40);

    sheet.appendRow([
      lkTime,
      assignedPassId,
      name,
      sanitizeCell(data.gender || "N/A", 40),
      sanitizeCell(data.age || "N/A", 10),
      sanitizeCell(data.dob || "N/A", 20),
      "'" + contactRaw,   // Leading quote preserves leading zero & neutralizes formulas
      "'" + whatsappRaw,  // Leading quote preserves leading zero & neutralizes formulas
      sanitizeCell(data.address || "N/A", 200),
      sanitizeCell(data.bloodGroup || "Not Sure", 60),
      sanitizeCell(data.slot || "Morning", 80),
      sanitizeCell(data.lang || "en", 10),
      "Pending Verification"
    ]);

    return createJsonResponse({
      status: "success",
      message: "Donor registration recorded in Google Sheet",
      passId: assignedPassId,
      seq: nextNum
    });

  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: "Registration processing error."
    });
  } finally {
    try {
      lock.releaseLock();
    } catch (err) {
      // ignore
    }
  }
}

/**
 * Handle GET request — STRICTLY READ-PROTECTED (never returns donor records)
 */
function doGet() {
  return createJsonResponse({
    status: "ok",
    mode: "write-only",
    message: "Public registration collector active. Access to donor records is restricted to authorized Google Sheet owners."
  });
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
