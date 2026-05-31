const API = "";

export async function apiRequest(path, token, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(data?.detail || "Request failed");
  return data;
}

export const authApi = {
  googleUrl: (token) => apiRequest("/api/auth/google/url/", token),
  googleCallback: (token, code) =>
    apiRequest("/api/auth/google/callback/", token, {
      method: "POST",
      body: JSON.stringify({ code }),
    }),
  updateProfile: (token, payload) =>
    apiRequest("/api/auth/me/", token, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  adminUsers: (token) => apiRequest("/api/auth/admin/users/", token),
  updateUser: (token, payload) =>
    apiRequest("/api/auth/admin/users/", token, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteUser: (token, userId) =>
    apiRequest("/api/auth/admin/users/", token, {
      method: "DELETE",
      body: JSON.stringify({ user_id: userId }),
    }),
};

export const sessionsApi = {
  list: (token) => apiRequest("/api/sessions/", token),
  mine: (token) => apiRequest("/api/sessions/mine/", token),
  adminList: (token) => apiRequest("/api/sessions/admin/", token),
  create: (token, payload) =>
    apiRequest("/api/sessions/", token, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (token, id, payload) =>
    apiRequest(`/api/sessions/${id}/`, token, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  remove: (token, id) => apiRequest(`/api/sessions/${id}/`, token, { method: "DELETE" }),
};

export const bookingsApi = {
  mine: (token) => apiRequest("/api/bookings/", token),
  creator: (token) => apiRequest("/api/bookings/creator/", token),
  adminList: (token) => apiRequest("/api/bookings/admin/", token),
  create: (token, sessionId) =>
    apiRequest("/api/bookings/", token, {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId }),
    }),
  cancel: (token, id) =>
    apiRequest(`/api/bookings/${id}/`, token, {
      method: "PATCH",
      body: JSON.stringify({ status: "cancelled" }),
    }),
  update: (token, id, payload) =>
    apiRequest(`/api/bookings/${id}/`, token, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  remove: (token, id) => apiRequest(`/api/bookings/${id}/`, token, { method: "DELETE" }),
};
