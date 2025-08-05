(function () {
      const passwordInput = document.getElementById("password");
      const toggleBtn = document.querySelector(".toggle-password");
      const passwordRules = document.getElementById("passwordRules");

      function validatePassword(value) {
        const hasLower = /[a-z]/.test(value);
        const hasUpper = /[A-Z]/.test(value);
        const hasNumber = /[0-9]/.test(value);
        const hasSpecial = /[^A-Za-z0-9]/.test(value);
        const lengthOK = value.length >= 8;
        const passedCount = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

        // toggle valid classes
        toggleValidity("rule-length", lengthOK);
        toggleValidity("rule-lower", hasLower);
        toggleValidity("rule-upper", hasUpper);
        toggleValidity("rule-number", hasNumber);
        toggleValidity("rule-special", hasSpecial);

        // border color change
        passwordRules.style.borderLeft = lengthOK && passedCount >= 3 ? "4px solid var(--color-green)" : "4px solid var(--color-red)";

        return lengthOK && passedCount >= 3;
      }

      function toggleValidity(id, isValid) {
        const el = document.getElementById(id);
        if (el) {
          el.classList.toggle("valid", isValid);
        }
      }

      function togglePasswordVisibility() {
        const type = passwordInput.type === "password" ? "text" : "password";
        passwordInput.type = type;
        toggleBtn.setAttribute("aria-pressed", type === "text");
        toggleBtn.textContent = type === "text" ? "🙈" : "👁️";
        toggleBtn.title = type === "text" ? "Hide password" : "Show password";
      }

      passwordInput.addEventListener("input", () => {
        passwordRules.style.display = passwordInput.value.length ? "block" : "none";
        const isValid = validatePassword(passwordInput.value);
        passwordInput.style.borderColor = isValid ? "var(--color-green)" : "var(--color-red)";
      });

      toggleBtn.addEventListener("click", togglePasswordVisibility);

      document.getElementById("signupForm").addEventListener("submit", (e) => {
        if (!validatePassword(passwordInput.value)) {
          e.preventDefault();
          alert("Password does not meet the criteria.");
          passwordInput.focus();
        }
      });
    })();
/// go to Home
    function goToHome() {
    window.location.href = '/';
  }
