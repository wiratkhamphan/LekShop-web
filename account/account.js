// account.js — ข้อมูลลูกค้า (เวอร์ชันเสริมรายละเอียด + แข็งแรงขึ้น)

// ===== CONFIG =====
const API_CUSTOMER = (id) => (API_BASE ? `${API_BASE}/customers/${id}` : `/api/customers/${id}`);

// ===== HELPERS =====
const $ = (sel) => document.querySelector(sel);
const setText = (el, v, fallback = "-") => { if (el) el.textContent = (v ?? "").toString().trim() || fallback; };
const formatDateTH = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  return isNaN(dt) ? d : dt.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
};

// ===== ELEMENTS =====
const els = {
  // หลักที่คุณมีอยู่แล้ว
  name: $("#customerName"),
  email: $("#customerEmail"),
  phone: $("#customerPhone"),
  join: $("#customerJoin"),
  // รายละเอียดที่เพิ่ม
  code: $("#customerCode"),
  gender: $("#customerGender"),
  dob: $("#customerDOB"),
  line: $("#customerLine"),
  facebook: $("#customerFacebook"),
  ship: $("#shippingAddress"),
  bill: $("#billingAddress"),
  tier: $("#loyaltyTier"),
  points: $("#loyaltyPoints"),
  coupons: $("#couponCount"),
  size: $("#preferredSize"),
  types: $("#preferredTypes"),
  colors: $("#preferredColors"),
  budget: $("#budgetRange"),
  orderCount: $("#orderCount"),
  totalSpent: $("#totalSpent"),
  lastOrderAt: $("#lastOrderAt"),
  orderRate: $("#orderRate"),
};

function logout() {
  localStorage.removeItem("customer_id");
  localStorage.removeItem("token");
  window.location.href = "/";
}
window.logout = logout; 

document.addEventListener("DOMContentLoaded", async () => {
  const id = localStorage.getItem("customer_id");
  const token = localStorage.getItem("token");
  

  // ถ้าต้องการบังคับล็อกอิน ให้ uncomment 2 บรรทัดถัดไป
  if (!id || !token) { window.location.href = "/account/login/"; return; }

  // โชว์สถานะกำลังโหลดคร่าว ๆ
  Object.values(els).forEach((el) => el && (el.textContent = "กำลังโหลด…"));

  try {
    const res = await fetch(API_CUSTOMER(id), {
      method: "GET",
      headers: { Authorization: token ? `Bearer ${token}` : "" },
      credentials: "include",
    });

    if (res.status === 401 || res.status === 403) {
      // logout(); return; // เปิดใช้ถ้าต้อง redirect
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const body = await res.json();
    const cus = body.customer || body; // รองรับทั้ง data.customer หรือ body ตรง ๆ

    // พื้นฐาน
    const fullName = `${cus.first_name || ""} ${cus.last_name || ""}`.trim();
    setText(els.name, fullName);
    setText(els.email, cus.email);
    setText(els.phone, cus.phone);
    setText(els.join, formatDateTH(cus.created_at || cus.joined_at));
    setText(els.code, cus.customer_code);

    // ส่วนบุคคล/การติดต่อ
    setText(els.gender, cus.gender);
    setText(els.dob, formatDateTH(cus.dob));
    setText(els.line, cus.line_id);
    setText(els.facebook, cus.facebook);

    // ที่อยู่
    setText(els.ship, cus.shipping_address);
    setText(els.bill, cus.billing_address);

    // สมาชิก/แต้ม
    setText(els.tier, cus.loyalty_tier);
    setText(els.points, cus.loyalty_points);
    setText(els.coupons, cus.coupon_count);

    // ความชอบ
    const prefTypes = Array.isArray(cus.pref_types) ? cus.pref_types.join(", ") : cus.pref_types;
    const prefColors = Array.isArray(cus.pref_colors) ? cus.pref_colors.join(", ") : cus.pref_colors;
    setText(els.size, cus.pref_size);
    setText(els.types, prefTypes);
    setText(els.colors, prefColors);
    setText(els.budget, cus.pref_budget_range);

    // สถิติคำสั่งซื้อ
    setText(els.orderCount, cus.order_count);
    setText(els.totalSpent, THB(cus.total_spent));
    setText(els.lastOrderAt, formatDateTH(cus.last_order_at));
    const s = Number(cus.order_success || 0), cxl = Number(cus.order_cancel || 0), total = s + cxl;
    setText(els.orderRate, total ? `${Math.round((s / total) * 100)}% สำเร็จ (${s}/${total})` : "-");

    // อัปเดต Avatar เป็นอักษรย่อ (ถ้ามี)
    const avatar = document.querySelector(".prof-avatar");
    if (avatar && fullName) {
      const initials = fullName.split(" ").map(w => w[0]?.toUpperCase() || "").join("").slice(0,2);
      if (initials) avatar.textContent = initials;
    }
  } catch (err) {
    console.error("Fetch customer error:", err);
    // เปิดใช้ถ้าต้องการเคลียร์ session แล้วเด้งออก
    // logout();
  }
});
