import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { authApi, bookingsApi, sessionsApi } from "./api/client.js";
import { DashboardShell } from "./components/layout.jsx";
import { EmptyState, LoadingOverlay, Toast } from "./components/ui.jsx";
import { AdminDashboard, ADMIN_TABS } from "./pages/AdminDashboard.jsx";
import { CreatorDashboard, UserDashboard } from "./pages/Dashboards.jsx";
import { CatalogPage, SessionDetail } from "./pages/PublicPages.jsx";
import { getStoredAuth, localDatetimeToIso } from "./utils/format.js";
import "./styles.css";

const USER_TABS = ["Overview", "My Bookings", "Profile"];
const CREATOR_TABS = ["Overview", "My Sessions", "Bookings", "Profile"];

function App() {
  const [auth, setAuth] = useState(getStoredAuth());
  const [route, setRoute] = useState(window.location.pathname);
  const [activeTab, setActiveTab] = useState("Overview");
  const [bookingFilter, setBookingFilter] = useState("all");
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [creatorBookings, setCreatorBookings] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminSessions, setAdminSessions] = useState([]);
  const [adminBookings, setAdminBookings] = useState([]);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [viewingSession, setViewingSession] = useState(null);

  const token = auth?.token;
  const currentTabs = auth?.user.role === "admin" ? ADMIN_TABS : auth?.user.role === "creator" ? CREATOR_TABS : USER_TABS;
  const sessionById = useMemo(() => new Map(sessions.map((session) => [Number(session.id), session])), [sessions]);
  const isDashboardRoute = route === "/dashboard" || route === "/creator" || route === "/admin";

  function navigate(path) {
    window.history.pushState({}, "", path);
    setRoute(path);
  }

  function saveAuth(payload) {
    localStorage.setItem("auth", JSON.stringify(payload));
    setAuth(payload);
  }

  function logout() {
    localStorage.removeItem("auth");
    setAuth(null);
    setBookings([]);
    setCreatorBookings([]);
    setAdminUsers([]);
    setAdminSessions([]);
    setAdminBookings([]);
    setEditingSession(null);
    setViewingSession(null);
    setActiveTab("Overview");
    navigate("/");
  }

  async function loadSessions() {
    setSessions(await sessionsApi.list(token));
  }

  async function loadDashboardData() {
    if (!auth) return;
    setDataLoading(true);
    try {
      if (auth.user.role === "user") {
        const [catalog, userBookings] = await Promise.all([sessionsApi.list(token), bookingsApi.mine(token)]);
        setSessions(catalog);
        setBookings(userBookings);
      } else {
        const [creatorSessions, overview] = await Promise.all([sessionsApi.mine(token), bookingsApi.creator(token)]);
        setSessions(creatorSessions);
        setCreatorBookings(overview);
      }
    } catch (error) {
      setToast(error.message);
    } finally {
      setDataLoading(false);
    }
  }

  async function loadAdminData() {
    if (!auth || auth.user.role !== "admin") return;
    setDataLoading(true);
    try {
      const [users, allSessions, allBookings] = await Promise.all([authApi.adminUsers(token), sessionsApi.adminList(token), bookingsApi.adminList(token)]);
      setAdminUsers(users);
      setAdminSessions(allSessions);
      setAdminBookings(allBookings);
    } catch (error) {
      setToast(error.message);
    } finally {
      setDataLoading(false);
    }
  }

  async function googleLogin() {
    try {
      const data = await authApi.googleUrl(token);
      window.location.href = data.url;
    } catch (error) {
      setToast(error.message);
    }
  }

  async function completeOAuth() {
    const code = new URLSearchParams(window.location.search).get("code");
    if (!code) return;
    setLoading(true);
    try {
      const payload = await authApi.googleCallback(token, code);
      saveAuth(payload);
      window.history.replaceState({}, "", "/dashboard");
      setRoute("/dashboard");
    } catch (error) {
      setToast(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function bookSession(sessionId) {
    if (!auth) {
      setToast("Log in as a user to book a session.");
      return;
    }
    if (auth.user.role !== "user") {
      setToast("Switch to user role before booking.");
      return;
    }
    try {
      await bookingsApi.create(token, sessionId);
      setToast("Session booked.");
      setActiveTab("My Bookings");
      navigate("/dashboard");
    } catch (error) {
      setToast(error.message);
    }
  }

  async function cancelBooking(id) {
    try {
      await bookingsApi.cancel(token, id);
      setToast("Booking cancelled.");
      await loadDashboardData();
    } catch (error) {
      setToast(error.message);
    }
  }

  async function saveProfile(event, roleOverride) {
    event?.preventDefault();
    const formElement = event?.currentTarget;
    const form = formElement ? new FormData(formElement) : null;
    try {
      const payload = await authApi.updateProfile(token, {
        name: form?.get("name") ?? auth.user.name,
        avatar: form?.get("avatar") ?? auth.user.avatar,
        role: roleOverride ?? form?.get("role") ?? auth.user.role,
      });
      saveAuth(payload);
      setActiveTab("Overview");
      navigate(payload.user.role === "admin" ? "/admin" : payload.user.role === "creator" ? "/creator" : "/dashboard");
      setToast(roleOverride ? `Switched to ${roleOverride}.` : "Profile updated.");
    } catch (error) {
      setToast(error.message);
    }
  }

  async function saveSession(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = Object.fromEntries(form.entries());
    payload.starts_at = localDatetimeToIso(payload.starts_at);
    payload.is_active = payload.is_active === "true";

    if (!payload.title?.trim() || !payload.description?.trim() || !payload.category?.trim()) {
      setToast("Session title, description, and category are required.");
      return;
    }
    if (Number(payload.price) < 0 || Number(payload.duration_minutes) < 15 || Number(payload.capacity) < 1) {
      setToast("Check price, duration, and capacity values.");
      return;
    }

    try {
      if (editingSession) {
        await sessionsApi.update(token, editingSession.id, payload);
        setToast("Session updated.");
      } else {
        await sessionsApi.create(token, payload);
        setToast("Session created.");
      }
      formElement.reset();
      setEditingSession(null);
      setViewingSession(null);
      if (route === "/admin") {
        await loadAdminData();
      } else {
        await loadDashboardData();
      }
    } catch (error) {
      setToast(error.message);
    }
  }

  async function deleteSession(id) {
    try {
      await sessionsApi.remove(token, id);
      setToast("Session deleted.");
      setViewingSession(null);
      if (route === "/admin") {
        await loadAdminData();
      } else {
        await loadDashboardData();
      }
    } catch (error) {
      setToast(error.message);
    }
  }

  async function toggleSessionStatus(session) {
    try {
      await sessionsApi.update(token, session.id, { is_active: !session.is_active });
      setToast(session.is_active ? "Session deactivated." : "Session activated.");
      await loadAdminData();
    } catch (error) {
      setToast(error.message);
    }
  }

  async function updateUserRole(userId, role) {
    try {
      await authApi.updateUser(token, { user_id: userId, role });
      setToast("User role updated.");
      await loadAdminData();
    } catch (error) {
      setToast(error.message);
    }
  }

  async function toggleUserBlock(user) {
    try {
      await authApi.updateUser(token, { user_id: user.id, is_blocked: !user.is_blocked });
      setToast(user.is_blocked ? "User unblocked." : "User blocked.");
      await loadAdminData();
    } catch (error) {
      setToast(error.message);
    }
  }

  async function deleteUser(userId) {
    try {
      await authApi.deleteUser(token, userId);
      setToast("User deleted.");
      await loadAdminData();
    } catch (error) {
      setToast(error.message);
    }
  }

  async function updateBookingStatus(id, status) {
    try {
      await bookingsApi.update(token, id, { status });
      setToast("Booking updated.");
      await loadAdminData();
    } catch (error) {
      setToast(error.message);
    }
  }

  async function deleteBooking(id) {
    try {
      await bookingsApi.remove(token, id);
      setToast("Booking deleted.");
      await loadAdminData();
    } catch (error) {
      setToast(error.message);
    }
  }

  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (route === "/auth/callback") completeOAuth();
    if (route === "/" || route.startsWith("/session")) {
      setDataLoading(true);
      loadSessions().catch((error) => setToast(error.message)).finally(() => setDataLoading(false));
    }
    if (route === "/dashboard" || route === "/creator") loadDashboardData();
    if (route === "/admin") loadAdminData();
  }, [route, token]);

  useEffect(() => {
    if (route.startsWith("/session/") && sessions.length) {
      const id = Number(route.split("/").pop());
      setSelected(sessions.find((item) => Number(item.id) === id));
    }
  }, [route, sessions]);

  return (
    <main className="min-h-screen text-slate-100">
      {toast && <Toast message={toast} />}
      {loading && <LoadingOverlay />}

      {route === "/" && (
        <CatalogPage
          sessions={sessions}
          loading={dataLoading}
          auth={auth}
          onGoogleLogin={googleLogin}
          onSwitchRole={(role) => saveProfile(null, role)}
          onLogout={logout}
          onNavigate={navigate}
        />
      )}

      {route.startsWith("/session/") && (
        <SessionDetail
          session={selected}
          loading={dataLoading}
          auth={auth}
          onBook={bookSession}
          onNavigate={navigate}
          onGoogleLogin={googleLogin}
          onSwitchRole={(role) => saveProfile(null, role)}
          onLogout={logout}
        />
      )}

      {isDashboardRoute && !auth && (
        <CatalogPage
          sessions={sessions}
          loading={dataLoading}
          auth={auth}
          onGoogleLogin={googleLogin}
          onSwitchRole={(role) => saveProfile(null, role)}
          onLogout={logout}
          onNavigate={navigate}
        />
      )}

      {route === "/admin" && auth && auth.user.role !== "admin" && (
        <DashboardShell
          auth={auth}
          tabs={currentTabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onNavigate={navigate}
          onLogout={logout}
        >
          <EmptyState
            title="Admin access required"
            body="Use an admin account to manage users, sessions, and bookings from this panel."
          />
        </DashboardShell>
      )}

      {isDashboardRoute && auth && (route !== "/admin" || auth.user.role === "admin") && (
        <DashboardShell
          auth={auth}
          tabs={currentTabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onNavigate={navigate}
          onLogout={logout}
        >
          {auth.user.role === "admin" ? (
            <AdminDashboard
              activeTab={activeTab}
              auth={auth}
              users={adminUsers}
              sessions={adminSessions}
              bookings={adminBookings}
              loading={dataLoading}
              editingSession={editingSession}
              setEditingSession={setEditingSession}
              onSaveSession={saveSession}
              onUserRoleChange={updateUserRole}
              onToggleUserBlock={toggleUserBlock}
              onDeleteUser={deleteUser}
              onEditSession={setEditingSession}
              onToggleSessionStatus={toggleSessionStatus}
              onDeleteSession={deleteSession}
              onBookingStatusChange={updateBookingStatus}
              onDeleteBooking={deleteBooking}
            />
          ) : auth.user.role === "user" ? (
            <UserDashboard
              activeTab={activeTab}
              auth={auth}
              bookings={bookings}
              sessionById={sessionById}
              loading={dataLoading}
              filter={bookingFilter}
              setFilter={setBookingFilter}
              onCancel={cancelBooking}
              onSaveProfile={saveProfile}
              onSwitchRole={() => saveProfile(null, "creator")}
              onViewSession={(id) => navigate(`/session/${id}`)}
            />
          ) : (
            <CreatorDashboard
              activeTab={activeTab}
              auth={auth}
              sessions={sessions}
              bookings={creatorBookings}
              loading={dataLoading}
              filter={bookingFilter}
              setFilter={setBookingFilter}
              editingSession={editingSession}
              setEditingSession={setEditingSession}
              viewingSession={viewingSession}
              setViewingSession={setViewingSession}
              onSaveSession={saveSession}
              onDeleteSession={deleteSession}
              onSaveProfile={saveProfile}
              onSwitchRole={() => saveProfile(null, "user")}
            />
          )}
        </DashboardShell>
      )}
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
