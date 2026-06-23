const API_BASE_URL = "http://localhost:3001/api";

async function request(path, { token, method = "GET", body, headers = {} } = {}) {
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...(body && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    const error = new Error(payload?.message || "Request failed");
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export const api = {
  me: (token) => request("/auth/me", { token }),
  login: (body) => request("/auth/login", { method: "POST", body }),
  register: (body) => request("/auth/register", { method: "POST", body }),
  updateMe: (token, body) => request("/auth/me", { token, method: "PATCH", body }),
  updatePassword: (token, body) => request("/auth/me/password", { token, method: "PATCH", body }),
  dashboard: (token) => request("/dashboard", { token }),
  tasks: (token) => request("/tasks", { token }),
  createTask: (token, body) => request("/tasks", { token, method: "POST", body }),
  updateTask: (token, id, body) => request(`/tasks/${id}`, { token, method: "PATCH", body }),
  updateTaskStatus: (token, id, status) => request(`/tasks/${id}/status`, { token, method: "PATCH", body: { status } }),
  deleteTask: (token, id) => request(`/tasks/${id}`, { token, method: "DELETE" }),
  habits: (token) => request("/habits", { token }),
  createHabit: (token, body) => request("/habits", { token, method: "POST", body }),
  updateHabit: (token, id, body) => request(`/habits/${id}`, { token, method: "PATCH", body }),
  toggleHabit: (token, id) => request(`/habits/${id}/check-in`, { token, method: "POST" }),
  deleteHabit: (token, id) => request(`/habits/${id}`, { token, method: "DELETE" }),
  studies: (token) => request("/studies", { token }),
  createStudy: (token, body) => request("/studies", { token, method: "POST", body }),
  updateStudy: (token, id, body) => request(`/studies/${id}`, { token, method: "PATCH", body }),
  deleteStudy: (token, id) => request(`/studies/${id}`, { token, method: "DELETE" }),
  communities: (token) => request("/communities", { token }),
  joinCommunity: (token, id) => request(`/communities/${id}/join`, { token, method: "POST" }),
  leaveCommunity: (token, id) => request(`/communities/${id}/leave`, { token, method: "DELETE" }),
  files: (token) => request("/files", { token }),
  uploadFile: (token, formData) => request("/files/upload", { token, method: "POST", body: formData }),
  deleteFile: (token, id) => request(`/files/${id}`, { token, method: "DELETE" }),
};
