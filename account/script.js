function getElementById() {
  const BASE_URL = ENV.api;

  document.addEventListener("DOMContentLoaded", () => {
    const EmployeeID = document.getElementById("EmployeeID");
    const name = document.getElementById("name");

    const employee_id = localStorage.getItem("employee_id");
    const jwttoken = localStorage.getItem("token");

    // 👉 ถ้าไม่มี JWT token ให้ redirect ไปหน้า login
    // if (!jwttoken) {
    //   window.location.href = "/account/login/";
    //   return;
    // }

    // ✅ เรียก API พร้อมแนบ Authorization header
    fetch(`${BASE_URL}employees/${employee_id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${jwttoken}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Unauthorized");
        }
        return res.json();
      })
      .then((data) => {
        EmployeeID.innerText = data.employee_id || "ไม่พบข้อมูล";
        name.innerText = data.name || "ไม่มีชื่อ";
      })
      .catch(() => {
        // ลบ JWT ที่อาจหมดอายุ/ไม่ถูกต้อง แล้วกลับไป login
        localStorage.removeItem("employee_id");
        localStorage.removeItem("token");
        // window.location.href = "/account/login/";
      });
  });
}

function logout() {
  // ลบข้อมูล session ทั้งหมด
  localStorage.removeItem("employee_id");
  localStorage.removeItem("token");
  window.location.href = "/";
}

getElementById();
