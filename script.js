(() => {
  "use strict";

  // Event Date: Sunday, 06 Dec 2026 at 09:00 AM Sri Lanka Time (UTC+05:30)
  const EVENT_TIMESTAMP = new Date("2026-12-06T09:00:00+05:30").getTime();

  const currentLang = document.documentElement.lang || "en";

  /* ==========================================================================
     1. LANGUAGE OPENER MODAL INTERACTION
     ========================================================================== */
  const langOpener = document.getElementById("langOpener");
  const btnChooseEn = document.getElementById("btnChooseEn");
  const bgAudio = document.getElementById("bgAudio");
  const audioBtn = document.getElementById("audioBtn");
  const audioText = document.getElementById("audioText");
  let isPlaying = false;

  function startAudioIfPossible() {
    if (bgAudio && !isPlaying) {
      bgAudio.volume = 0.3;
      bgAudio.play().then(() => {
        isPlaying = true;
        if (audioBtn) audioBtn.classList.add("is-playing");
        if (audioText) {
          audioText.textContent = currentLang === "ta" ? "இசை ஒலி" : (currentLang === "si" ? "වාදනය වේ" : "Playing");
        }
      }).catch(() => {
        isPlaying = false;
      });
    }
  }

  // Dismiss opener when English is clicked
  if (btnChooseEn && langOpener) {
    btnChooseEn.addEventListener("click", () => {
      langOpener.classList.add("is-hidden");
      sessionStorage.setItem("kcc_lang_opened", "true");
      startAudioIfPossible();
    });
  }

  // Check if opener was already dismissed in this session
  if (sessionStorage.getItem("kcc_lang_opened") === "true") {
    if (langOpener) {
      langOpener.classList.add("is-hidden");
    }
  }

  /* ==========================================================================
     2. AUDIO TOGGLE (TOP BAR BUTTON)
     ========================================================================== */
  if (audioBtn && bgAudio) {
    bgAudio.volume = 0.3;

    audioBtn.addEventListener("click", () => {
      if (!isPlaying) {
        bgAudio.play().then(() => {
          isPlaying = true;
          audioBtn.classList.add("is-playing");
          audioText.textContent = currentLang === "ta" ? "இசை ஒலி" : (currentLang === "si" ? "වාදනය වේ" : "Playing");
        }).catch(() => {
          isPlaying = false;
        });
      } else {
        bgAudio.pause();
        isPlaying = false;
        audioBtn.classList.remove("is-playing");
        audioText.textContent = currentLang === "ta" ? "இசை" : (currentLang === "si" ? "සංගීතය" : "Music");
      }
    });
  }

  /* ==========================================================================
     3. SCROLL REVEAL ANIMATIONS (INTERSECTION OBSERVER)
     ========================================================================== */
  const revealElements = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: "0px 0px -30px 0px"
    });

    revealElements.forEach((el) => observer.observe(el));
  } else {
    revealElements.forEach((el) => el.classList.add("is-revealed"));
  }

  /* ==========================================================================
     4. MOBILE FLOATING ACTION BAR ON SCROLL
     ========================================================================== */
  const mobileFloatBar = document.getElementById("mobileFloatBar");
  if (mobileFloatBar) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 380) {
        mobileFloatBar.classList.add("is-visible");
      } else {
        mobileFloatBar.classList.remove("is-visible");
      }
    }, { passive: true });
  }

  /* ==========================================================================
     5. COUNTDOWN TIMER
     ========================================================================== */
  const daysEl = document.getElementById("days");
  const hoursEl = document.getElementById("hours");
  const minutesEl = document.getElementById("minutes");
  const secondsEl = document.getElementById("seconds");

  function pad(n, len = 2) {
    return String(n).padStart(len, "0");
  }

  function updateCountdown() {
    const diff = EVENT_TIMESTAMP - Date.now();
    if (diff <= 0) {
      if (daysEl) daysEl.textContent = "000";
      if (hoursEl) hoursEl.textContent = "00";
      if (minutesEl) minutesEl.textContent = "00";
      if (secondsEl) secondsEl.textContent = "00";
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const d = Math.floor(totalSeconds / 86400);
    const h = Math.floor((totalSeconds % 86400) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    if (daysEl) daysEl.textContent = pad(d, 3);
    if (hoursEl) hoursEl.textContent = pad(h);
    if (minutesEl) minutesEl.textContent = pad(m);
    if (secondsEl) secondsEl.textContent = pad(s);
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  /* ==========================================================================
     6. DOB & REAL-TIME AGE CALCULATION
     ========================================================================== */
  const dobInput = document.getElementById("dob");
  const ageBadge = document.getElementById("ageBadge");

  function calculateAge(dobStr) {
    if (!dobStr) return null;
    const dob = new Date(dobStr);
    const eventDate = new Date("2026-12-06");
    let age = eventDate.getFullYear() - dob.getFullYear();
    const m = eventDate.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && eventDate.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }

  function updateAge() {
    if (!dobInput || !ageBadge) return;
    const age = calculateAge(dobInput.value);
    const prefix = currentLang === "ta" ? "வயது: " : (currentLang === "si" ? "වයස: " : "Age: ");
    const suffix = currentLang === "ta" ? " ஆண்டுகள்" : (currentLang === "si" ? " වසර" : " Yrs");

    if (age !== null && !isNaN(age)) {
      ageBadge.textContent = `${prefix}${age}${suffix}`;
    } else {
      ageBadge.textContent = `${prefix}—`;
    }
  }

  if (dobInput) {
    dobInput.addEventListener("input", updateAge);
    dobInput.addEventListener("change", updateAge);
    updateAge();
  }

  /* ==========================================================================
     7. SAME AS CONTACT PHONE CHECKBOX
     ========================================================================== */
  const contactInput = document.getElementById("contactNumber");
  const whatsappInput = document.getElementById("whatsappNumber");
  const samePhone = document.getElementById("samePhone");

  if (samePhone && contactInput && whatsappInput) {
    samePhone.addEventListener("change", () => {
      if (samePhone.checked) {
        whatsappInput.value = contactInput.value;
        clearError("wrap-whatsapp", "whatsappError");
      }
    });

    contactInput.addEventListener("input", () => {
      if (samePhone.checked) {
        whatsappInput.value = contactInput.value;
        clearError("wrap-whatsapp", "whatsappError");
      }
    });
  }

  /* ==========================================================================
     8. FORM VALIDATION & SMOOTH MOBILE SCROLL-TO-ERROR
     ========================================================================== */
  const form = document.getElementById("donorForm");
  const pledgeCheck = document.getElementById("pledgeCheck");
  const pledgeContainer = document.getElementById("pledgeContainer");
  const fullName = document.getElementById("fullName");
  const address = document.getElementById("address");
  const bloodGroup = document.getElementById("bloodGroup");
  const timeSlot = document.getElementById("timeSlot");

  const pledgeError = document.getElementById("pledgeError");
  const nameError = document.getElementById("nameError");
  const dobError = document.getElementById("dobError");
  const contactError = document.getElementById("contactError");
  const whatsappError = document.getElementById("whatsappError");
  const addressError = document.getElementById("addressError");

  const submitNotice = document.getElementById("submitNotice");
  const btnSubmitForm = document.getElementById("btnSubmitForm") || document.getElementById("btnSubmitWhatsApp");

  function getGender() {
    const r = document.querySelector('input[name="gender"]:checked');
    if (r) return r.value;
    return currentLang === "ta" ? "ஆண்" : (currentLang === "si" ? "පුරුෂ" : "Male");
  }

  function setError(wrapId, errorId, show) {
    const wrap = document.getElementById(wrapId);
    const err = document.getElementById(errorId);
    if (show) {
      if (wrap) wrap.classList.add("has-error");
      if (err) err.classList.add("visible");
    } else {
      if (wrap) wrap.classList.remove("has-error");
      if (err) err.classList.remove("visible");
    }
  }

  function clearError(wrapId, errorId) {
    setError(wrapId, errorId, false);
  }

  if (fullName) fullName.addEventListener("input", () => clearError("wrap-fullName", "nameError"));
  if (dobInput) dobInput.addEventListener("input", () => clearError("wrap-dob", "dobError"));
  if (contactInput) contactInput.addEventListener("input", () => clearError("wrap-contact", "contactError"));
  if (whatsappInput) whatsappInput.addEventListener("input", () => clearError("wrap-whatsapp", "whatsappError"));
  if (address) address.addEventListener("input", () => clearError("wrap-address", "addressError"));
  if (pledgeCheck) {
    pledgeCheck.addEventListener("change", () => {
      if (pledgeCheck.checked) {
        if (pledgeContainer) pledgeContainer.classList.remove("is-unchecked");
        if (pledgeError) pledgeError.classList.remove("visible");
      }
    });
  }

  function validate() {
    let valid = true;
    let firstErrorElement = null;

    // Pledge
    if (!pledgeCheck.checked) {
      if (pledgeContainer) pledgeContainer.classList.add("is-unchecked");
      if (pledgeError) pledgeError.classList.add("visible");
      if (!firstErrorElement) firstErrorElement = pledgeContainer;
      valid = false;
    } else {
      if (pledgeContainer) pledgeContainer.classList.remove("is-unchecked");
      if (pledgeError) pledgeError.classList.remove("visible");
    }

    // Name
    if (!fullName.value.trim()) {
      setError("wrap-fullName", "nameError", true);
      if (!firstErrorElement) firstErrorElement = fullName;
      valid = false;
    } else {
      setError("wrap-fullName", "nameError", false);
    }

    // DOB (Age 18-60)
    const age = calculateAge(dobInput.value);
    if (!dobInput.value || isNaN(age) || age < 18 || age > 65) {
      setError("wrap-dob", "dobError", true);
      if (!firstErrorElement) firstErrorElement = dobInput;
      valid = false;
    } else {
      setError("wrap-dob", "dobError", false);
    }

    // Contact
    if (!contactInput.value.trim() || contactInput.value.trim().length < 9) {
      setError("wrap-contact", "contactError", true);
      if (!firstErrorElement) firstErrorElement = contactInput;
      valid = false;
    } else {
      setError("wrap-contact", "contactError", false);
    }

    // WhatsApp
    if (!whatsappInput.value.trim() || whatsappInput.value.trim().length < 9) {
      setError("wrap-whatsapp", "whatsappError", true);
      if (!firstErrorElement) firstErrorElement = whatsappInput;
      valid = false;
    } else {
      setError("wrap-whatsapp", "whatsappError", false);
    }

    // Address
    if (!address.value.trim()) {
      setError("wrap-address", "addressError", true);
      if (!firstErrorElement) firstErrorElement = address;
      valid = false;
    } else {
      setError("wrap-address", "addressError", false);
    }

    // Smooth scroll to first error field
    if (!valid && firstErrorElement) {
      firstErrorElement.scrollIntoView({ behavior: "smooth", block: "center" });
      if (firstErrorElement.focus) {
        firstErrorElement.focus();
      }
    }

    return valid;
  }

  function getFormData() {
    return {
      name: fullName.value.trim(),
      gender: getGender(),
      dob: dobInput.value,
      age: calculateAge(dobInput.value),
      contact: contactInput.value.trim(),
      whatsapp: whatsappInput.value.trim(),
      address: address.value.trim(),
      bloodGroup: bloodGroup.value,
      slot: timeSlot.value
    };
  }

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function resetSubmitButton(submitBtn) {
    if (!submitBtn) return;
    submitBtn.disabled = false;
    submitBtn.style.opacity = "1";
    const defaultLabel = currentLang === "ta"
      ? "பதிவு செய்க (Submit)"
      : (currentLang === "si" ? "ලියාපදිංචි වන්න (Submit)" : "Submit &amp; Get Donor Pass");
    submitBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
      </svg>
      <span>${defaultLabel}</span>
    `;
  }

  // Handle Direct Registration Form Submission to Google Sheet
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!validate()) return;

      const submitBtn = btnSubmitForm || form.querySelector('button[type="submit"]');

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = "0.75";
        submitBtn.innerHTML = `<span>⏳ ${currentLang === "ta" ? "பதிவு செய்யப்படுகிறது..." : (currentLang === "si" ? "ලියාපදිංචි වෙමින්..." : "Submitting...")}</span>`;
      }

      // Show immediate progress feedback notice
      if (submitNotice) {
        submitNotice.style.display = "block";
        submitNotice.className = "submit-notice-box";
        submitNotice.style.background = "";
        submitNotice.style.border = "";
        submitNotice.style.padding = "";
        submitNotice.style.textAlign = "";
        submitNotice.innerHTML = `
          <div class="submit-notice-inner">
            <span class="submit-notice-icon">⏳</span>
            <span class="submit-notice-text">${currentLang === "ta" ? "உங்கள் விபரங்கள் அதிகாரப்பூர்வ பட்டியலில் சேமிக்கப்படுகின்றன..." : (currentLang === "si" ? "ඔබගේ විස්තර නිල ලේඛනයට සුරැකෙමින් පවතී..." : "Saving directly to Official Donor Sheet...")}</span>
          </div>
        `;
        submitNotice.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }

      const data = getFormData();

      // Save donor record directly to Google Sheets (server assigns sequential Pass ID)
      let record = null;
      if (window.DonorRegistry && typeof window.DonorRegistry.saveDonor === "function") {
        try {
          record = await window.DonorRegistry.saveDonor(data, null, currentLang);
        } catch (err) {
          console.warn("Registry save error:", err);
        }
      }

      if (!record || !record.synced) {
        const failHeading = currentLang === "ta"
          ? "இணைய இணைப்புப் பிழை"
          : (currentLang === "si" ? "සම්බන්ධතා දෝෂයකි" : "Connection Issue");
        const failBody = currentLang === "ta"
          ? "உங்கள் பதிவு இன்னும் சேமிக்கப்படவில்லை. உங்கள் இணைய இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்."
          : (currentLang === "si" ? "ඔබගේ විස්තර තවමත් සුරැකී නොමැත. කරුණාකර අන්තර්ජාල සම්බන්ධතාව පරීක්ෂා කර නැවත උත්සාහ කරන්න." : "Your registration could not be saved yet. Please check your internet connection and tap Submit again.");

        if (submitNotice) {
          submitNotice.style.display = "block";
          submitNotice.style.background = "#fef2f2";
          submitNotice.style.border = "2px solid #ef4444";
          submitNotice.style.padding = "16px";
          submitNotice.style.textAlign = "center";
          submitNotice.innerHTML = `
            <strong style="color: #991b1b; display: block; margin-bottom: 4px;">⚠️ ${failHeading}</strong>
            <span style="font-size: 0.88rem; color: #7f1d1d;">${failBody}</span>
          `;
          submitNotice.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        resetSubmitButton(submitBtn);
        return;
      }

      const passId = record.passId;

      // Render Official Donor Pass Confirmation Card
      const headingText = currentLang === "ta"
        ? "பதிவு வெற்றிகரமானது!"
        : (currentLang === "si" ? "ලියාපදිංචිය සාර්ථකයි!" : "Registration Confirmed!");
      const passLabel = currentLang === "ta" ? "அனுமதி அட்டை எண்" : (currentLang === "si" ? "නිල පාස් අංකය" : "Official Pass ID");
      const savedNote = currentLang === "ta"
        ? "உங்கள் விபரங்கள் அதிகாரப்பூர்வ முகாம் பட்டியலில் நேரடியாக சேமிக்கப்பட்டுள்ளன. இந்த அட்டையை Screenshot எடுத்து வைக்கவும்."
        : (currentLang === "si" ? "ඔබගේ විස්තර නිල ලියාපදිංචි ලේඛනයට සාර්ථකව ඇතුළත් කෙරුණි. මෙම පාස් කාඩ්පත Screenshot එකක් ලෙස තබාගන්න." : "Your registration is saved directly in the Official Camp Sheet. Please take a screenshot of this pass for check-in.");
      const anotherText = currentLang === "ta"
        ? "+ மற்றொருவரைப் பதிவு செய்ய"
        : (currentLang === "si" ? "+ වෙනත් අයෙකු ලියාපදිංචි කරන්න" : "+ Register Another Donor");

      if (submitNotice) {
        submitNotice.style.display = "block";
        submitNotice.style.background = "#ecfdf5";
        submitNotice.style.border = "2px solid #10b981";
        submitNotice.style.padding = "22px 18px";
        submitNotice.style.textAlign = "center";
        submitNotice.innerHTML = `
          <div style="font-size: 2rem; margin-bottom: 6px;">🎉</div>
          <h3 style="font-family: var(--font-display); font-size: 1.28rem; font-weight: 800; color: #065f46; margin-bottom: 10px;">
            ${headingText}
          </h3>
          <div style="display: inline-block; background: #8f0e1f; color: #ffffff; padding: 7px 18px; border-radius: 20px; font-family: monospace; font-size: 1.08rem; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(143,14,31,0.25);">
            ${passLabel}: ${escapeHtml(passId)}
          </div>
          <div style="background: #ffffff; border: 1px solid #a7f3d0; border-radius: 10px; padding: 10px 14px; margin: 0 auto 14px; max-width: 380px; text-align: left; font-size: 0.85rem; color: #064e3b; line-height: 1.6;">
            <div><strong>${currentLang === "ta" ? "பெயர்" : (currentLang === "si" ? "නම" : "Name")}:</strong> ${escapeHtml(data.name)}</div>
            <div><strong>${currentLang === "ta" ? "இரத்த வகை" : (currentLang === "si" ? "රුධිර වර්ගය" : "Blood Group")}:</strong> ${escapeHtml(data.bloodGroup)}</div>
            <div><strong>${currentLang === "ta" ? "நேரம்" : (currentLang === "si" ? "වේලාව" : "Time Slot")}:</strong> ${escapeHtml(data.slot)}</div>
          </div>
          <p style="font-size: 0.86rem; color: #065f46; margin-bottom: 14px; font-weight: 600; line-height: 1.45;">
            ${savedNote}
          </p>
          <p style="font-size: 0.78rem; color: #047857; margin-bottom: 14px;">
            📍 College Main Hall, Kalugamuwa Central College • Sunday, 06 Dec 2026
          </p>
          <button type="button" id="btnRegisterAnother" class="btn btn-white" style="font-size: 0.85rem; padding: 8px 16px;">
            ${anotherText}
          </button>
        `;
        const btnAnother = document.getElementById("btnRegisterAnother");
        if (btnAnother) {
          btnAnother.addEventListener("click", () => {
            form.reset();
            updateAge();
            submitNotice.style.display = "none";
            resetSubmitButton(submitBtn);
            if (fullName) fullName.focus();
          });
        }
        submitNotice.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = "0.9";
        submitBtn.innerHTML = `<span>✓ ${currentLang === "ta" ? "பதிவு செய்யப்பட்டது" : (currentLang === "si" ? "ලියාපදිංචි කරන ලදී" : "Registered")} (${escapeHtml(passId)})</span>`;
      }
    });
  }

  /* ==========================================================================
     9. ADD TO CALENDAR (.ICS)
     ========================================================================== */
  const calendarBtn = document.getElementById("calendarBtn");
  if (calendarBtn) {
    calendarBtn.addEventListener("click", () => {
      const summary = currentLang === "ta" 
        ? "இரத்த தான முகாம் 2026 — கழுகமுவ ம.ம.வி பழைய மாணவர் சங்கம்"
        : (currentLang === "si" 
            ? "රුධිර පරිත්‍යාග කඳවුර 2026 — කළුගමුව ම.ම.වි. ආදි ශිෂ්‍ය සංගමය"
            : "PPA KCC Blood Donation Camp 2026");

      const cal = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Inkspire Prints//PPA KCC Blood Donation//EN",
        "BEGIN:VEVENT",
        "UID:kcc-blood-donation-20261206@inkspireprints.lk",
        "DTSTART;TZID=Asia/Colombo:20261206T090000",
        "DTEND;TZID=Asia/Colombo:20261206T150000",
        `SUMMARY:${summary}`,
        "LOCATION:College Main Hall\\, Kalugamuwa Central College\\, Gelioya (https://maps.app.goo.gl/GUvWcV5GCEfPuANm7)",
        "DESCRIPTION:Blood Donation Camp organized by Past Pupils' Association (PPA) of Kalugamuwa Central College. Location: https://maps.app.goo.gl/GUvWcV5GCEfPuANm7",
        "END:VEVENT",
        "END:VCALENDAR"
      ].join("\r\n");

      const blob = new Blob([cal], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "PPA-KCC-Blood-Donation-2026.ics";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  }

})();
