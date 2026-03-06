const BASE_URL = process.env.REACT_APP_API_URL || "/api";

class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details || [];
    this.name = "ApiError";
  }
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const config = {
    headers: { "Content-Type": "application/json" },
    ...options,
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new ApiError(
        data.error || `HTTP ${res.status}`,
        res.status,
        data.details || []
      );
    }
    return data;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError("Network error — please check your connection", 0, []);
  }
}

// ── Employees ────────────────────────────────────────────────────────────────
export const employeesApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/employees${qs ? `?${qs}` : ""}`);
  },
  get: (id) => request(`/employees/${id}`),
  create: (body) => request("/employees", { method: "POST", body: JSON.stringify(body) }),
  delete: (id) => request(`/employees/${id}`, { method: "DELETE" }),
  getAttendance: (id, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/employees/${id}/attendance${qs ? `?${qs}` : ""}`);
  },
};

// ── Attendance ───────────────────────────────────────────────────────────────
export const attendanceApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/attendance${qs ? `?${qs}` : ""}`);
  },
  mark: (body) => request("/attendance", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) => request(`/attendance/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id) => request(`/attendance/${id}`, { method: "DELETE" }),
  summary: (date) => request(`/attendance/summary${date ? `?date=${date}` : ""}`),
};

// ── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
  get: () => request("/dashboard"),
};

export { ApiError };
