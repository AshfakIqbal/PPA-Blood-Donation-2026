/**
 * PPA KALUGAMUWA CENTRAL COLLEGE - ANNUAL BLOOD DONATION CAMP 2026
 * Public Donor Registration Collector Module
 * Inkspire Prints & Dimension
 */

(() => {
  "use strict";

  const STORAGE_KEY = "kcc_blood_donors_master";
  const COUNTER_KEY = "kcc_donor_pass_seq";

  /**
   * GLOBAL GOOGLE APPS SCRIPT WEB APP URL (Write-Only Public Collector)
   * Every mobile and desktop registration submits here and appends to the
   * private "KCC Blood Donation 2026" Google Sheet.
   */
  const GLOBAL_GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbx0f5X2wlqmcfE4KqJzF5LaDks3KTm0L5t-2IAMkQW1zH8X5WA8aBI88K3Aapp02uQn/exec";

  function getCloudConfig() {
    return {
      googleSheetUrl: GLOBAL_GOOGLE_SHEET_URL
    };
  }

  function getAllDonors() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) return list;
      }
    } catch (e) {
      // ignore
    }
    return [];
  }

  function saveAllDonors(donors) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(donors));
      return true;
    } catch (e) {
      console.error("Storage error:", e);
      return false;
    }
  }

  /**
   * Generate next sequential Pass ID fallback starting from #PPA-KCC-BDC-001
   */
  function getNextPassId() {
    let maxNum = 0;
    try {
      const donors = getAllDonors();
      for (const d of donors) {
        if (d && d.passId) {
          const m = d.passId.match(/BDC-(\d+)/i);
          if (m) {
            const num = parseInt(m[1], 10);
            if (!isNaN(num) && num < 10000 && num > maxNum) {
              maxNum = num;
            }
          }
        }
      }
      const savedSeq = parseInt(localStorage.getItem(COUNTER_KEY) || "0", 10);
      if (!isNaN(savedSeq) && savedSeq < 10000 && savedSeq > maxNum) {
        maxNum = savedSeq;
      }
    } catch (e) {
      // ignore
    }

    const nextNum = maxNum + 1;
    try {
      localStorage.setItem(COUNTER_KEY, String(nextNum));
    } catch (e) {
      // ignore
    }

    const padded = String(nextNum).padStart(3, "0");
    return `#PPA-KCC-BDC-${padded}`;
  }

  /**
   * Save a donor record locally and push to the write-only Google Sheets collector.
   * Google Apps Script server assigns the GUARANTEED sequential Pass ID.
   */
  async function saveDonor(formData, clientPassId, lang = "en") {
    const lkTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Colombo" });

    let record = {
      passId: clientPassId || getNextPassId(),
      name: formData.name || "N/A",
      gender: formData.gender || "Male",
      dob: formData.dob || "",
      age: formData.age || "",
      contact: formData.contact || "",
      whatsapp: formData.whatsapp || formData.contact || "",
      address: formData.address || "",
      bloodGroup: formData.bloodGroup || "Not Sure / Test on-site",
      slot: formData.slot || "Morning (09:00 AM – 11:30 AM)",
      timestamp: new Date().toISOString(),
      registeredAt: lkTime,
      lang: lang,
      synced: false
    };

    const config = getCloudConfig();

    if (config.googleSheetUrl && config.googleSheetUrl.startsWith("http")) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(config.googleSheetUrl, {
          method: "POST",
          redirect: "follow",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify(record),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          try {
            const json = await res.json();
            if (json && json.status === "success" && json.passId) {
              record.passId = json.passId;
              record.synced = true;
            }
          } catch (jsonErr) {
            record.synced = true;
          }
        }
      } catch (err) {
        console.warn("Cloud sync queued (offline/slow network):", err);
      }
    }

    const donors = getAllDonors();
    const existingIndex = donors.findIndex(d => d.passId === record.passId);
    if (existingIndex >= 0) {
      donors[existingIndex] = { ...donors[existingIndex], ...record };
    } else {
      donors.unshift(record);
    }
    saveAllDonors(donors);

    return record;
  }

  window.DonorRegistry = {
    GLOBAL_GOOGLE_SHEET_URL,
    getCloudConfig,
    getAllDonors,
    saveAllDonors,
    saveDonor,
    getNextPassId
  };
})();
