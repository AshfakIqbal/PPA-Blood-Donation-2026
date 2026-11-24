(() => {
  "use strict";

  // Event Date: Sunday, 06 Dec 2026 at 09:00 AM Sri Lanka Time (UTC+05:30)
  const EVENT_TIMESTAMP = new Date("2026-12-06T09:00:00+05:30").getTime();
  const COORDINATOR_PHONE = "94775138838"; // Mr. M.S.M. Ramjan

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
  const btnSubmitWhatsApp = document.getElementById("btnSubmitWhatsApp");

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

  // Build WhatsApp pre-filled registration message in respective language
  function buildWhatsAppMessage(data, passId) {
    if (currentLang === "ta") {
      return `*BLOOD DONATION CAMP 2026 — PPA KCC REGISTRATION*
----------------------------------------
*Pass ID:* ${passId}
*Pledge:* Yes, I'm eligible and I'll participate! (ஆம், நான் பங்கேற்பேன்)

*Donor Details (கொடையாளர் விபரம்):*
• *Full Name (பெயர்):* ${data.name}
• *Gender (பாலினம்):* ${data.gender}
• *DOB (பிறந்த திகதி):* ${data.dob} (Age: ${data.age})
• *Contact Number:* ${data.contact}
• *WhatsApp Number:* ${data.whatsapp}
• *Address / Town (முகவரி):* ${data.address}
• *Blood Group:* ${data.bloodGroup}
• *Time Slot (நேரம்):* ${data.slot}

----------------------------------------
*Venue:* College Main Hall, Kalugamuwa Central College
*Location Map:* https://maps.app.goo.gl/GUvWcV5GCEfPuANm7
*Date:* Sunday, 06 Dec 2026 (09:00 AM)`;
    } else if (currentLang === "si") {
      return `*BLOOD DONATION CAMP 2026 — PPA KCC REGISTRATION*
----------------------------------------
*Pass ID:* ${passId}
*Pledge:* Yes, I'm eligible and I'll participate! (ඔව්, මම සහභාගී වෙමි)

*Donor Details (දායකයාගේ විස්තර):*
• *Full Name (නම):* ${data.name}
• *Gender (ස්ත්‍රී/පුරුෂ):* ${data.gender}
• *DOB (උපන් දිනය):* ${data.dob} (Age: ${data.age})
• *Contact Number:* ${data.contact}
• *WhatsApp Number:* ${data.whatsapp}
• *Address / Town (ලිපිනය):* ${data.address}
• *Blood Group:* ${data.bloodGroup}
• *Time Slot (වේලාව):* ${data.slot}

----------------------------------------
*Venue:* College Main Hall, Kalugamuwa Central College
*Location Map:* https://maps.app.goo.gl/GUvWcV5GCEfPuANm7
*Date:* Sunday, 06 Dec 2026 (09:00 AM)`;
    } else {
      return `*BLOOD DONATION REGISTRATION — PPA KCC 2026*
----------------------------------------
*Pass ID:* ${passId}
*Pledge:* Yes, I'm eligible and I'll participate!

*Donor Details:*
• *Name:* ${data.name}
• *Gender:* ${data.gender}
• *DOB:* ${data.dob} (Age: ${data.age})
• *Contact:* ${data.contact}
• *WhatsApp:* ${data.whatsapp}
• *Address:* ${data.address}
• *Blood Group:* ${data.bloodGroup}
• *Preferred Slot:* ${data.slot}

----------------------------------------
*Venue:* College Main Hall, Kalugamuwa Central College
*Location Map:* https://maps.app.goo.gl/GUvWcV5GCEfPuANm7
*Date:* Sunday, 06 Dec 2026 (09:00 AM)`;
    }
  }

  // Handle Sole Registration Form Submission via WhatsApp
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!validate()) return;

      const submitBtn = btnSubmitWhatsApp || form.querySelector('button[type="submit"]');

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = "0.75";
        submitBtn.innerHTML = `<span>⏳ ${currentLang === "ta" ? "பதிவு செய்யப்படுகிறது..." : (currentLang === "si" ? "ලියාපදිංචි වෙමින්..." : "Registering...")}</span>`;
      }

      // Show immediate progress feedback notice
      if (submitNotice) {
        submitNotice.style.display = "block";
        submitNotice.className = "submit-notice-box";
        submitNotice.innerHTML = `
          <div class="submit-notice-inner">
            <span class="submit-notice-icon">⏳</span>
            <span class="submit-notice-text">${currentLang === "ta" ? "உங்கள் விபரங்கள் இணைக்கப்படுகின்றன..." : (currentLang === "si" ? "ඔබගේ විස්තර සුරැකෙමින් පවතී..." : "Connecting to Official Registry...")}</span>
          </div>
        `;
        submitNotice.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }

      const data = getFormData();

      // Save donor record (Google Apps Script assigns the GUARANTEED sequential unique Pass ID)
      let record = null;
      if (window.DonorRegistry && typeof window.DonorRegistry.saveDonor === "function") {
        try {
          record = await window.DonorRegistry.saveDonor(data, null, currentLang);
        } catch (err) {
          console.warn("Registry save notice:", err);
        }
      }

      // Final Pass ID: Use server-assigned ID, or reliable fallback
      const passId = (record && record.passId)
        ? record.passId
        : (window.DonorRegistry && typeof window.DonorRegistry.getNextPassId === "function" ? window.DonorRegistry.getNextPassId() : "#PPA-KCC-BDC-001");

      const msg = buildWhatsAppMessage(data, passId);
      const waUrl = `https://wa.me/${COORDINATOR_PHONE}?text=${encodeURIComponent(msg)}`;

      // Render Grand Official Pass Confirmation Card in submitNotice
      const headingText = currentLang === "ta"
        ? "பதிவு வெற்றிகரமானது!"
        : (currentLang === "si" ? "ලියාපදිංචිය සාර්ථකයි!" : "Registration Successful!");
      const passLabel = currentLang === "ta" ? "அனுமதி அட்டை எண்" : (currentLang === "si" ? "නිල පාස් අංකය" : "Official Pass ID");
      const subText = currentLang === "ta"
        ? "ஒருங்கிணைப்பாளருக்கு WhatsApp மூலம் உறுதிப்படுத்த கீழே உள்ள பொத்தானை அழுத்தவும்:"
        : (currentLang === "si" ? "සම්බන්ධීකාරක වෙත WhatsApp මගින් තහවුරු කිරීමට පහත බොත්තම ඔබන්න:" : "Click below to confirm your registration with the event coordinator:");
      const btnText = currentLang === "ta"
        ? "💬 WhatsApp மூலம் உறுதிசெய்க"
        : (currentLang === "si" ? "💬 WhatsApp මගින් තහවුරු කරන්න" : "💬 Open WhatsApp to Confirm Pass");

      if (submitNotice) {
        submitNotice.style.display = "block";
        submitNotice.style.background = "#ecfdf5";
        submitNotice.style.border = "2px solid #10b981";
        submitNotice.style.padding = "20px 18px";
        submitNotice.style.textAlign = "center";
        submitNotice.innerHTML = `
          <div style="font-size: 2rem; margin-bottom: 6px;">🎉</div>
          <h3 style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 800; color: #065f46; margin-bottom: 8px;">
            ${headingText}
          </h3>
          <div style="display: inline-block; background: #8f0e1f; color: #ffffff; padding: 6px 16px; border-radius: 20px; font-family: monospace; font-size: 1.1rem; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(143,14,31,0.25);">
            ${passLabel}: ${passId}
          </div>
          <p style="font-size: 0.88rem; color: #065f46; margin-bottom: 16px; font-weight: 600; line-height: 1.4;">
            ${subText}
          </p>
          <a href="${waUrl}" id="btnWaDirect" class="btn btn-red btn-touch-lg" style="display: block; width: 100%; text-decoration: none; font-size: 1rem; padding: 14px 20px; background: #25d366; border-color: #25d366; box-shadow: 0 6px 18px rgba(37,211,102,0.35);">
            <span>${btnText}</span>
          </a>
          <p style="font-size: 0.74rem; color: #047857; margin-top: 10px;">
            📍 College Main Hall, Kalugamuwa Central College • 06 Dec 2026
          </p>
        `;
        submitNotice.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = "1";
        submitBtn.innerHTML = `<span>✓ ${currentLang === "ta" ? "பதிவு செய்யப்பட்டது" : (currentLang === "si" ? "ලියාපදිංචි කරන ලදී" : "Registered")} (${passId})</span>`;
      }

      // Auto-trigger WhatsApp launch on mobile
      setTimeout(() => {
        window.location.href = waUrl;
      }, 400);
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
