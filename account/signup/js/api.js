const API_BASE = ENV.api; 

// ฟังก์ชันส่งข้อมูลไป API /customers
function handleSignUp(formData) {
  const payload = {
    email: formData.email,
    password: formData.password,
    first_name: formData.firstName,
    last_name: formData.lastName,
    phone: formData.phone,
  };

  return fetch(`${API_BASE}/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then(async (res) => {
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create customer");
      }
      return res.json();
    })
    .catch((err) => {
      console.error("Error creating customer:", err);
      throw err;
    });
}

// ให้เรียก handleSignUp() จาก global scope
window.handleSignUp = handleSignUp;
