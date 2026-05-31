export function getStoredAuth() {
  try {
    return JSON.parse(localStorage.getItem("auth")) || null;
  } catch {
    return null;
  }
}

export function formatDate(value) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

export function timezoneLabel() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "Local time";
}

export function toDatetimeLocalValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function localDatetimeToIso(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

export function money(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function bookingStatus(booking) {
  if (booking.status === "cancelled") return "cancelled";
  return new Date(booking.starts_at) < new Date() ? "completed" : "active";
}

export function sessionPrice(sessions, id) {
  return Number(sessions.find((session) => Number(session.id) === Number(id))?.price || 0);
}
