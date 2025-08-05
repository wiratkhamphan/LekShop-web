function getElementById() {
  const BASE_URL = ENV.api;

  document.addEventListener("DOMContentLoaded", () => {
    const EmployeeID = document.getElementById("EmployeeID");
    const name = document.getElementById("name");

    const employee_id = localStorage.getItem("employee_id");

    if (!employee_id) {
      // ถ้าไม่มี session -> redirect ไปหน้า login
      window.location.href = "/account/login/";
      return;
    }

    // ✅ เรียก API เพื่อโหลดข้อมูลพนักงาน
    fetch(`${BASE_URL}employees/${employee_id}`)
      .then(res => res.json())
      .then(data => {
        EmployeeID.innerText = data.employee_id || "ไม่พบข้อมูล";
        name.innerText = data.name || "ไม่มีชื่อ";
      })
      .catch(() => {
        EmployeeID.innerText = "ผู้ใช้ระบบ";
        name.innerText = "ไม่ทราบสาขา";
      });
  });
}

  

function logout() {
    // ลบข้อมูลที่เก็บไว้ใน localStorage
    localStorage.removeItem("employee_id");

    // ไปหน้า Login
    window.location.href = "/account/login/";
  }

  getElementById();