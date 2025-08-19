// ✅ Toggle Password Visibility
function togglePassword(icon) {
  const passwordInput = document.getElementById("password");
  const isPassword = passwordInput.type === "password";
  passwordInput.type = isPassword ? "text" : "password";
  icon.textContent = isPassword ? "🙈" : "👁️";
}

// ✅ Event: Enter เพื่อเข้าสู่ระบบ
document.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    login();
  }
});

// ✅ ฟังก์ชันเข้าสู่ระบบ
async function login() {
  const loginBtn = document.getElementById("loginBtn");
  const employeeInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");

  const email = employeeInput.value.trim();
  const password = passwordInput.value.trim();

  employeeInput.classList.remove("input-error");
  passwordInput.classList.remove("input-error");
  document.getElementById("emailError").style.display = "none";
  document.getElementById("passwordError").style.display = "none";

  let isValid = true;
  if (!email) {
    employeeInput.classList.add("input-error");
    document.getElementById("emailError").style.display = "block";
    isValid = false;
  }
  if (!password) {
    passwordInput.classList.add("input-error");
    document.getElementById("passwordError").style.display = "block";
    isValid = false;
  }
  if (!isValid) {
    Swal.fire({
      icon: 'warning',
      title: 'กรุณากรอกข้อมูลให้ครบ',
      text: 'ต้องกรอกทั้ง Email และ Password',
    });
    return;
  }

  loginBtn.disabled = true;

  try {
    const BASE_URL = ENV.api;
    const res = await fetch(BASE_URL + "/LoginCustomer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("customer_id", data.customer.customer_id);
      localStorage.setItem("token", data.token);
      Swal.fire({
        icon: 'success',
        title: 'เข้าสู่ระบบสำเร็จ',
        text: 'กำลังเข้าสู่ระบบ...',
        showConfirmButton: false,
        timer: 1500
      }).then(() => {
        window.location.href = "/account/";
      });
    } else {
      employeeInput.classList.add("input-error");
      passwordInput.classList.add("input-error");
      Swal.fire({
        icon: 'error',
        title: 'เข้าสู่ระบบไม่สำเร็จ',
        text: data?.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
      });
    }

  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้',
    });
  } finally {
    loginBtn.disabled = false;
  }
}
