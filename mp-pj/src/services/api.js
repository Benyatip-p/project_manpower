// --- types ไม่ต้องมีเพราะเราใช้ JS ---
// อ่าน token จาก localStorage แล้วแนบเป็น Authorization header
const BASE = "/api";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getUserRequests() {
  const res = await fetch(`${BASE}/user/requests`, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      ...authHeaders(),
    },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`GET /user/requests ${res.status}: ${t}`);
  }
  const body = await res.json();  // { success, data: [...] }
  return body?.data || [];
}

export async function getUserRequestById(id) {
  const res = await fetch(`${BASE}/user/requests/${id}`, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache", // ป้องกันการ cache
      ...authHeaders(),
    },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`GET /user/requests/${id} ${res.status}: ${t}`);
  }
  const body = await res.json();  // { success, data: {...} }
  return body?.data || null;
}

// ฟังก์ชันอนุมัติ/ปฏิเสธคำขอ
export async function decideManpowerRequest(id, action, notes = "") {
  const res = await fetch(`${BASE}/user/requests/${id}/decide`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ action, notes }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`POST /user/requests/${id}/decide ${res.status}: ${t}`);
  }
  return await res.json();
}

// ฟังก์ชันดึงข้อมูล Dashboard
export async function getDashboardOverview() {
  const res = await fetch(`${BASE}/dashboard/overview`, {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`GET /dashboard/overview ${res.status}: ${t}`);
  }
  return await res.json();
}

// ฟังก์ชันดึงรายชื่อพนักงานทั้งหมด (Admin)
export async function getEmployees() {
  const res = await fetch(`${BASE}/admin/employees`, {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`GET /admin/employees ${res.status}: ${t}`);
  }
  return await res.json();
}

// ฟังก์ชันเพิ่มพนักงานใหม่ (Admin)
export async function createEmployee(employeeData) {
  const res = await fetch(`${BASE}/admin/employees`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(employeeData),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`POST /admin/employees ${res.status}: ${t}`);
  }
  return await res.json();
}

// ฟังก์ชันแก้ไขข้อมูลพนักงาน (Admin)
export async function updateEmployee(employeeId, employeeData) {
  const res = await fetch(`${BASE}/admin/employees/${employeeId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(employeeData),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`PUT /admin/employees/${employeeId} ${res.status}: ${t}`);
  }
  return await res.json();
}

// ฟังก์ชันลบพนักงาน (Admin)
export async function deleteEmployee(employeeId) {
  const res = await fetch(`${BASE}/admin/employees/${employeeId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`DELETE /admin/employees/${employeeId} ${res.status}: ${t}`);
  }
  return await res.json();
}
