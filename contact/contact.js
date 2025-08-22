// contact.js  — cleaned & standalone

// ====== CONFIG ======
const API_BASE = (window.ENV && ENV.api) || "";   // เช่น "https://api.example.com"
const CONTACT_ENDPOINT = API_BASE
  ? API_BASE.replace(/\/+$/, "") + "/contact"
  : "contact.php"; // ถ้าไม่มี ENV.api จะยิงไป contact.php (กรณีใช้ PHP)

// ====== HELPERS ======
const $ = (sel) => document.querySelector(sel);
const setFieldError = (name, msg) => {
  const el = document.querySelector(`.field-error[data-for="${name}"]`);
  if (el) el.textContent = msg || "";
};

// ====== ELEMENTS ======
const form = $("#contact-form");
const ok = $("#form-ok");
const err = $("#form-err");
const submitBtn = $("#submitBtn");
const btnLabel = submitBtn ? submitBtn.querySelector(".btn-label") : null;
const btnSpinner = submitBtn ? submitBtn.querySelector(".btn-spinner") : null;

// ไม่มีฟอร์มก็ไม่ต้องทำอะไร
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (ok) ok.style.display = "none";
    if (err) err.style.display = "none";
    setFieldError("name", "");
    setFieldError("email", "");
    setFieldError("message", "");

    const fd = new FormData(form);

    // honeypot กันบอท (มี input[name=company] ซ่อนอยู่ใน HTML)
    if ((fd.get("company") || "").trim() !== "") return;

    const payload = {
      name: (fd.get("name") || "").trim(),
      email: (fd.get("email") || "").trim(),
      phone: (fd.get("phone") || "").trim(),
      topic: (fd.get("topic") || "").trim(),
      message: (fd.get("message") || "").trim(),
    };

    // validate
    const emailOK = /\S+@\S+\.\S+/.test(payload.email);
    let invalid = false;
    if (!payload.name) {
      setFieldError("name", "กรุณากรอกชื่อ-นามสกุล");
      invalid = true;
    }
    if (!emailOK) {
      setFieldError("email", "รูปแบบอีเมลไม่ถูกต้อง");
      invalid = true;
    }
    if (!payload.message) {
      setFieldError("message", "กรุณากรอกรายละเอียด");
      invalid = true;
    }
    if (invalid) {
      if (err) {
        err.textContent = "กรุณากรอกข้อมูลให้ครบถ้วน";
        err.style.display = "block";
      }
      return;
    }

    // loading state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add("loading");
    }
    if (btnSpinner) btnSpinner.style.display = "inline-block";
    if (btnLabel) btnLabel.textContent = "กำลังส่ง...";

    try {
      const resp = await fetch(CONTACT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await resp.json().catch(() => ({}));
      if (resp.ok) {
        if (ok) {
          ok.textContent = data?.message || "ส่งข้อมูลเรียบร้อย เราจะติดต่อกลับโดยเร็วที่สุด";
          ok.style.display = "block";
        }
        form.reset();
      } else {
        // แสดง error ราย field ถ้ามี
        if (data?.errors) {
          Object.entries(data.errors).forEach(([k, v]) => {
            setFieldError(k, Array.isArray(v) ? v.join(", ") : String(v));
          });
        }
        if (err) {
          err.textContent = data?.message || "ไม่สามารถส่งข้อความได้ กรุณาลองใหม่อีกครั้ง";
          err.style.display = "block";
        }
      }
    } catch {
      if (err) {
        err.textContent = "เครือข่ายขัดข้อง กรุณาลองใหม่อีกครั้ง";
        err.style.display = "block";
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove("loading");
      }
      if (btnSpinner) btnSpinner.style.display = "none";
      if (btnLabel) btnLabel.textContent = "ส่งข้อความ";
    }
  });
}
