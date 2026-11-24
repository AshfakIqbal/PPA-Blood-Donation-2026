/**
 * PPA KALUGAMUWA CENTRAL COLLEGE - ANNUAL BLOOD DONATION CAMP 2026
 * Donor Registry & Data Collection Configuration Module
 * Inkspire Prints & Dimension
 */

(() => {
  "use strict";

  const STORAGE_KEY = "kcc_blood_donors_master";
  const CONFIG_KEY = "kcc_donor_cloud_config";
  const COUNTER_KEY = "kcc_donor_pass_seq";
  const DEFAULT_PIN = "Kcc@PPA2026";
  const ALT_PIN = "kcc2026";

  /**
   * GLOBAL GOOGLE APPS SCRIPT WEB APP URL
   * This is the master webhook deployed from Google Sheets.
   * Every mobile and desktop visitor automatically syncs to this URL.
   */
  const GLOBAL_GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbx0f5X2wlqmcfE4KqJzF5LaDks3KTm0L5t-2IAMkQW1zH8X5WA8aBI88K3Aapp02uQn/exec";

  // Default cloud configuration
  const defaultCloudConfig = {
    googleSheetUrl: GLOBAL_GOOGLE_SHEET_URL,
    adminPin: DEFAULT_PIN,
    targetDonors: 100
  };

  function getCloudConfig() {
    let cfg = { ...defaultCloudConfig };
    try {
      const saved = localStorage.getItem(CONFIG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          if (parsed.adminPin) cfg.adminPin = parsed.adminPin;
          if (parsed.targetDonors) cfg.targetDonors = parsed.targetDonors;
        }
      }
    } catch (e) {
      // ignore
    }
    // GLOBAL_GOOGLE_SHEET_URL is always the master authoritative cloud endpoint
    if (GLOBAL_GOOGLE_SHEET_URL && GLOBAL_GOOGLE_SHEET_URL.startsWith("http")) {
      cfg.googleSheetUrl = GLOBAL_GOOGLE_SHEET_URL;
    }
    return cfg;
  }

  function setCloudConfig(newConfig) {
    try {
      const merged = { ...getCloudConfig(), ...newConfig };
      localStorage.setItem(CONFIG_KEY, JSON.stringify(merged));
      return merged;
    } catch (e) {
      return getCloudConfig();
    }
  }

  function getAllDonors() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          return list;
        }
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

  function clearAllDonors() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(COUNTER_KEY);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Save a donor record locally and push to Google Sheets Web App.
   * Google Apps Script server assigns the GUARANTEED sequential Pass ID.
   */
  async function saveDonor(formData, clientPassId, lang = "en") {
    const lkTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Colombo" });
    
    // Initial record draft
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

    // Push to Google Sheets Cloud Webhook
    if (config.googleSheetUrl && config.googleSheetUrl.startsWith("http")) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s max wait

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
              // Adopt the server-assigned guaranteed unique Pass ID
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

    // Save into local master registry (prepend so newest is first)
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

  function deleteDonor(passId) {
    const donors = getAllDonors();
    const filtered = donors.filter(d => d.passId !== passId);
    saveAllDonors(filtered);
    return filtered;
  }

  function calculateStats(donors = getAllDonors()) {
    const total = donors.length;
    let male = 0;
    let female = 0;
    const bloodGroups = {};
    const slots = {};

    donors.forEach(d => {
      // Gender
      const g = (d.gender || "").toLowerCase();
      if (g.includes("female") || g.includes("ස්ත්‍රී") || g.includes("பெண்")) {
        female++;
      } else {
        male++;
      }

      // Blood Group
      const bg = d.bloodGroup || "Unknown";
      let shortBg = bg;
      if (bg.includes("AB+")) shortBg = "AB+";
      else if (bg.includes("AB-")) shortBg = "AB-";
      else if (bg.includes("A+")) shortBg = "A+";
      else if (bg.includes("A-")) shortBg = "A-";
      else if (bg.includes("B+")) shortBg = "B+";
      else if (bg.includes("B-")) shortBg = "B-";
      else if (bg.includes("O+")) shortBg = "O+";
      else if (bg.includes("O-")) shortBg = "O-";
      else shortBg = "Not Sure";

      bloodGroups[shortBg] = (bloodGroups[shortBg] || 0) + 1;

      // Slot
      let s = "Morning";
      if (d.slot && d.slot.includes("11:30")) s = "Midday";
      else if (d.slot && d.slot.includes("01:30")) s = "Afternoon";
      slots[s] = (slots[s] || 0) + 1;
    });

    return { total, male, female, bloodGroups, slots };
  }

  /**
   * Export donors to CSV with UTF-8 BOM so Tamil & Sinhala characters open correctly in Excel
   */
  function exportToCSV(donors = getAllDonors()) {
    if (!donors.length) {
      alert("No donor records to export.");
      return;
    }

    const headers = [
      "Pass ID",
      "Full Name",
      "Gender",
      "Age",
      "Date of Birth",
      "Contact Phone",
      "WhatsApp Number",
      "Address / Town",
      "Blood Group",
      "Preferred Slot",
      "Registered Date (LK)",
      "Language"
    ];

    const rows = donors.map(d => [
      `"${(d.passId || "").replace(/"/g, '""')}"`,
      `"${(d.name || "").replace(/"/g, '""')}"`,
      `"${(d.gender || "").replace(/"/g, '""')}"`,
      `"${d.age || ""}"`,
      `"${d.dob || ""}"`,
      `="${d.contact || ""}"`, // Excel prefix to keep leading zeros
      `="${d.whatsapp || ""}"`,
      `"${(d.address || "").replace(/"/g, '""')}"`,
      `"${(d.bloodGroup || "").replace(/"/g, '""')}"`,
      `"${(d.slot || "").replace(/"/g, '""')}"`,
      `"${(d.registeredAt || "").replace(/"/g, '""')}"`,
      `"${d.lang || "en"}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute("href", url);
    link.setAttribute("download", `KCC_Blood_Donors_PPA_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Expose globally
  window.DonorRegistry = {
    DEFAULT_PIN,
    GLOBAL_GOOGLE_SHEET_URL,
    getCloudConfig,
    setCloudConfig,
    getAllDonors,
    saveAllDonors,
    saveDonor,
    deleteDonor,
    clearAllDonors,
    calculateStats,
    exportToCSV,
    getNextPassId
  };
})();
