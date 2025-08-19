const BASE_URL = ENV.api;

document.addEventListener("DOMContentLoaded", () => {
  const nameElem = document.getElementById("customerName");
  const emailElem = document.getElementById("customerEmail");
  const phoneElem = document.getElementById("customerPhone");
  const joinElem = document.getElementById("customerJoin");

  const storedCustomerID = localStorage.getItem("customer_id");
  const jwtToken = localStorage.getItem("token");

  if (!jwtToken || !storedCustomerID) {
    window.location.href = "/account/login/";
    return;
  }

  fetch(`${BASE_URL}/customers/${storedCustomerID}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${jwtToken}`,
      "Content-Type": "application/json",
    },
  })
  .then(res => {
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  })
  .then(data => {
    const cus = data.customer;
    console.log("Customer data:", cus); // debug

    nameElem.innerText = `${cus.first_name || ""} ${cus.last_name || ""}`;
    emailElem.innerText = cus.email || "-";
    phoneElem.innerText = cus.phone || "-";
    joinElem.innerText = cus.created_at ? new Date(cus.created_at).toLocaleDateString() : "-";
  })
  .catch(err => {
    console.error("Fetch error:", err);
    localStorage.removeItem("customer_id");
    localStorage.removeItem("token");
    window.location.href = "/account/login/";
  });
});

// ฟังก์ชัน logout
function logout() {
  localStorage.removeItem("customer_id");
  localStorage.removeItem("token");
  window.location.href = "/";
}
