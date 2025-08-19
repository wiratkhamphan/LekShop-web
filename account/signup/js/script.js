(function () {
  const form = document.getElementById("signupForm");
  const signupBtn = document.getElementById("signupBtn");

  // ฟังก์ชัน validate password
  const passwordInput = document.getElementById("password");
  const passwordRules = document.getElementById("passwordRules");
  const toggleBtn = document.querySelector(".toggle-password");

  function validatePassword(value) {
    const hasLower = /[a-z]/.test(value);
    const hasUpper = /[A-Z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecial = /[^A-Za-z0-9]/.test(value);
    const lengthOK = value.length >= 8;
    const passedCount = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

    toggleValidity("rule-length", lengthOK);
    toggleValidity("rule-lower", hasLower);
    toggleValidity("rule-upper", hasUpper);
    toggleValidity("rule-number", hasNumber);
    toggleValidity("rule-special", hasSpecial);

    passwordRules.style.borderLeft =
      lengthOK && passedCount >= 3 ? "4px solid var(--color-green)" : "4px solid var(--color-red)";

    return lengthOK && passedCount >= 3;
  }

  function toggleValidity(id, isValid) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle("valid", isValid);
  }

  function togglePasswordVisibility() {
    const type = passwordInput.type === "password" ? "text" : "password";
    passwordInput.type = type;
    toggleBtn.textContent = type === "text" ? "🙈" : "👁️";
    toggleBtn.title = type === "text" ? "Hide password" : "Show password";
  }

  passwordInput.addEventListener("input", () => {
    passwordRules.style.display = passwordInput.value.length ? "block" : "none";
    const isValid = validatePassword(passwordInput.value);
    passwordInput.style.borderColor = isValid ? "var(--color-green)" : "var(--color-red)";
  });

  toggleBtn.addEventListener("click", togglePasswordVisibility);

  // ส่งค่า JSON เมื่อกดปุ่ม Continue
  signupBtn.addEventListener("click", async () => {
    if (!validatePassword(passwordInput.value)) {
      Swal.fire("Error", "Password does not meet the criteria.", "error");
      passwordInput.focus();
      return;
    }

    const formData = {
      email: document.getElementById("email").value,
      password: passwordInput.value,
      firstName: document.getElementById("firstName").value,
      lastName: document.getElementById("lastName").value,
      phone: document.getElementById("phone").value,
    };

    try {
      const result = await handleSignUp(formData); // เรียก global function จาก api.js
      Swal.fire("Success", "Account created successfully!", "success").then(() => {
        window.location.href = "/"; // redirect หลังสมัครสำเร็จ
      });
      form.reset();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  });
})();
