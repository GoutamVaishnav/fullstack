import React, { useMemo, useState } from "react";
import { Avatar, Badge, EmptyState, FilterTabs, LoadingSpinner, Panel, ResponsiveTable, StatCard } from "../components/ui.jsx";
import { bookingStatus, formatDate, money, sessionPrice } from "../utils/format.js";
import { SessionForm } from "./Dashboards.jsx";

const ADMIN_TABS = ["Overview", "Users", "Sessions", "Bookings", "Profile"];

export { ADMIN_TABS };

export function AdminDashboard(props) {
  const { activeTab, auth, users, sessions, bookings, loading, editingSession, setEditingSession, onSaveSession, onUserRoleChange, onToggleUserBlock, onDeleteUser, onEditSession, onToggleSessionStatus, onDeleteSession, onBookingStatusChange, onDeleteBooking } = props;
  const [filter, setFilter] = useState("all");
  const [selectedSession, setSelectedSession] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const enrichedBookings = useMemo(() => bookings.map((booking) => ({ ...booking, computedStatus: bookingStatus(booking) })), [bookings]);
  const filteredBookings = filter === "all" ? enrichedBookings : enrichedBookings.filter((booking) => booking.computedStatus === filter);
  const revenue = enrichedBookings.filter((booking) => booking.computedStatus !== "cancelled").reduce((sum, booking) => sum + sessionPrice(sessions, booking.session_id), 0);
  const selectedSessionBookings = selectedSession ? enrichedBookings.filter((booking) => Number(booking.session_id) === Number(selectedSession.id)) : [];
  const creators = users.filter((user) => user.role === "creator");

  function askConfirm(title, body, action) {
    setConfirm({ title, body, action });
  }

  async function runConfirm() {
    if (!confirm) return;
    await confirm.action();
    setConfirm(null);
  }

  if (loading) return <LoadingSpinner label="Loading admin dashboard" />;
  if (activeTab === "Users") return (
    <>
      <AdminUsers users={users} bookings={bookings} onUserRoleChange={onUserRoleChange} onToggleUserBlock={onToggleUserBlock} onDeleteUser={(user) => askConfirm("Delete user?", `This will remove ${user.email} from the platform.`, () => onDeleteUser(user.id))} />
      {confirm && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} onConfirm={runConfirm} />}
    </>
  );
  if (activeTab === "Profile") return <AdminProfile auth={auth} />;
  if (activeTab === "Sessions") return (
    <>
    <div className="grid gap-5">
      {editingSession && (
        <Panel title="Edit Any Session" subtitle="Admin can update sessions from any creator.">
          <SessionForm session={editingSession} onSubmit={onSaveSession} onCancel={() => setEditingSession(null)} />
        </Panel>
      )}
      {selectedSession && (
        <AdminSessionDetail
          session={selectedSession}
          bookings={selectedSessionBookings}
          onClose={() => setSelectedSession(null)}
          onEditSession={onEditSession}
          onBookingStatusChange={onBookingStatusChange}
          onDeleteBooking={onDeleteBooking}
        />
      )}
      <AdminSessions
        sessions={sessions}
        bookings={bookings}
        onViewSession={setSelectedSession}
        onEditSession={onEditSession}
        onToggleSessionStatus={onToggleSessionStatus}
        onDeleteSession={(session) => askConfirm("Delete session?", `This will remove "${session.title}" from marketplace and creator dashboards.`, () => onDeleteSession(session.id))}
      />
    </div>
    {confirm && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} onConfirm={runConfirm} />}
    </>
  );
  if (activeTab === "Bookings") return (
    <>
      <AdminBookings bookings={filteredBookings} sessions={sessions} filter={filter} setFilter={setFilter} onBookingStatusChange={onBookingStatusChange} onDeleteBooking={(booking) => askConfirm("Delete booking?", `This will delete booking #${booking.id}.`, () => onDeleteBooking(booking.id))} />
      {confirm && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} onConfirm={runConfirm} />}
    </>
  );

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Users" value={users.length} />
        <StatCard label="Total Creators" value={creators.length} />
        <StatCard label="Total Sessions" value={sessions.length} />
        <StatCard label="Total Bookings" value={bookings.length} />
        <StatCard label="Total Revenue" value={money(revenue)} />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Recent Users" subtitle="Latest registered accounts.">
          {users.length === 0 ? <EmptyState title="No users" body="Users will appear after login." /> : users.slice(0, 6).map((user) => <AdminRow key={user.id} title={user.name} meta={user.email} badge={user.role} />)}
        </Panel>
        <Panel title="Recent Bookings" subtitle="Latest reservations across the platform.">
          {bookings.length === 0 ? <EmptyState title="No bookings" body="Bookings will appear here." /> : enrichedBookings.slice(0, 6).map((booking) => <AdminRow key={booking.id} title={booking.session_title} meta={booking.user_email} badge={booking.computedStatus} />)}
        </Panel>
      </div>
      <Panel title="Top Creators" subtitle="Creators ranked by active booking revenue.">
        {creators.length === 0 ? <EmptyState title="No creators" body="Creators will appear after users switch role." /> : creators.slice(0, 6).map((creator) => {
          const creatorSessions = sessions.filter((session) => String(session.creator_id) === String(creator.id));
          const creatorRevenue = enrichedBookings.filter((booking) => creatorSessions.some((session) => Number(session.id) === Number(booking.session_id)) && booking.computedStatus !== "cancelled").reduce((sum, booking) => sum + sessionPrice(sessions, booking.session_id), 0);
          return <AdminRow key={creator.id} title={creator.name} meta={`${creatorSessions.length} sessions | ${money(creatorRevenue)}`} badge={creator.status || "active"} />;
        })}
      </Panel>
    </div>
  );
}

function AdminUsers({ users, bookings, onUserRoleChange, onToggleUserBlock, onDeleteUser }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const filteredUsers = users.filter((user) => {
    const matchesQuery = `${user.name} ${user.email}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === "all" || (statusFilter === "blocked" ? user.is_blocked : !user.is_blocked);
    return matchesQuery && matchesStatus;
  });
  return (
    <Panel title="All Users" subtitle="Manage user, creator, and admin roles.">
      <AdminToolbar query={query} setQuery={setQuery} placeholder="Search users..." filter={statusFilter} setFilter={setStatusFilter} options={["all", "active", "blocked"]} />
      {filteredUsers.length === 0 ? <EmptyState title="No users found" body="Try another search or filter." /> : (
        <ResponsiveTable headers={["User", "Email", "Role", "Join Date", "Total Bookings", "Status", "Change Role", "Actions"]}>
          {filteredUsers.map((user) => {
            const totalBookings = bookings.filter((booking) => String(booking.user_id) === String(user.id)).length;
            return (
            <tr key={user.id} className="border-t border-white/10">
              <td className="table-cell">
                <div className="flex items-center gap-3">
                  <Avatar user={user} />
                  <span className="font-medium text-white">{user.name}</span>
                </div>
              </td>
              <td className="table-cell">{user.email}</td>
              <td className="table-cell"><Badge tone={user.role === "admin" ? "completed" : "active"}>{user.role}</Badge></td>
              <td className="table-cell">{formatDate(user.member_since)}</td>
              <td className="table-cell">{totalBookings}</td>
              <td className="table-cell"><Badge tone={user.is_blocked ? "cancelled" : "active"}>{user.is_blocked ? "blocked" : "active"}</Badge></td>
              <td className="table-cell">
                <select className="field max-w-36" value={user.role} onChange={(event) => onUserRoleChange(user.id, event.target.value)}>
                  <option value="user">User</option>
                  <option value="creator">Creator</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td className="table-cell">
                <div className="flex flex-wrap gap-2">
                  <button className="btn-ghost min-h-8 px-3 py-1 text-xs" onClick={() => onToggleUserBlock(user)}>{user.is_blocked ? "Unblock" : "Block"}</button>
                  <button className="btn-ghost min-h-8 px-3 py-1 text-xs" onClick={() => onDeleteUser(user)}>Delete</button>
                </div>
              </td>
            </tr>
            );
          })}
        </ResponsiveTable>
      )}
    </Panel>
  );
}

function AdminSessions({ sessions, bookings, onViewSession, onEditSession, onToggleSessionStatus, onDeleteSession }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const filteredSessions = sessions.filter((session) => {
    const matchesQuery = `${session.title} ${session.creator_name} ${session.category}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? session.is_active : !session.is_active);
    return matchesQuery && matchesStatus;
  });
  return (
    <Panel title="All Sessions" subtitle="View and manage every creator session.">
      <AdminToolbar query={query} setQuery={setQuery} placeholder="Search sessions..." filter={statusFilter} setFilter={setStatusFilter} options={["all", "active", "inactive"]} />
      {filteredSessions.length === 0 ? <EmptyState title="No sessions found" body="Try another search or filter." /> : (
        <ResponsiveTable headers={["Session", "Creator", "Category", "Price", "Capacity", "Booked", "Status", "Created", "Actions"]}>
          {filteredSessions.map((session) => {
            const booked = bookings.filter((booking) => Number(booking.session_id) === Number(session.id) && bookingStatus(booking) !== "cancelled").length;
            return (
              <tr key={session.id} className="border-t border-white/10">
                <td className="table-cell font-medium text-white">{session.title}</td>
                <td className="table-cell">{session.creator_name}</td>
                <td className="table-cell">{session.category || "General"}</td>
                <td className="table-cell">{money(session.price)}</td>
                <td className="table-cell">{session.capacity || 20}</td>
                <td className="table-cell">{booked}</td>
                <td className="table-cell"><Badge tone={session.is_active ? "active" : "cancelled"}>{session.is_active ? "active" : "inactive"}</Badge></td>
                <td className="table-cell">{formatDate(session.created_at || session.starts_at)}</td>
                <td className="table-cell">
                  <div className="flex flex-wrap gap-2">
                    <button className="btn-ghost min-h-8 px-3 py-1 text-xs" onClick={() => onViewSession(session)}>View</button>
                    <button className="btn-ghost min-h-8 px-3 py-1 text-xs" onClick={() => onEditSession(session)}>Edit</button>
                    <button className="btn-ghost min-h-8 px-3 py-1 text-xs" onClick={() => onToggleSessionStatus(session)}>{session.is_active ? "Deactivate" : "Activate"}</button>
                    <button className="btn-ghost min-h-8 px-3 py-1 text-xs" onClick={() => onDeleteSession(session)}>Delete</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </ResponsiveTable>
      )}
    </Panel>
  );
}

function AdminSessionDetail({ session, bookings, onClose, onEditSession, onBookingStatusChange, onDeleteBooking }) {
  return (
    <Panel title="Session Bookings" subtitle="See exactly which users booked this session.">
      <div className="mb-5 grid gap-3 rounded-lg border border-white/10 bg-black/20 p-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminFact label="Session" value={session.title} />
        <AdminFact label="Creator" value={session.creator_name || "Creator"} />
        <AdminFact label="Schedule" value={formatDate(session.starts_at)} />
        <AdminFact label="Price" value={money(session.price)} />
        <AdminFact label="Duration" value={`${session.duration_minutes} min`} />
        <AdminFact label="Capacity" value={session.capacity || 20} />
        <AdminFact label="Total Bookings" value={bookings.length} />
        <AdminFact label="Status" value={session.is_active ? "Active" : "Inactive"} />
      </div>
      <div className="mb-5 flex flex-wrap gap-2">
        <button className="btn-primary min-h-9 px-4 py-2 text-sm" onClick={() => onEditSession(session)}>Update Session</button>
        <button className="btn-ghost min-h-9 px-4 py-2 text-sm" onClick={onClose}>Close Details</button>
      </div>
      {bookings.length === 0 ? <EmptyState title="No users booked this session" body="Bookings for this session will appear here." /> : (
        <ResponsiveTable headers={["User Email", "Booking Date", "Session Date", "Price", "Status", "Action"]}>
          {bookings.map((booking) => (
            <tr key={booking.id} className="border-t border-white/10">
              <td className="table-cell font-medium text-white">{booking.user_email}</td>
              <td className="table-cell">{formatDate(booking.created_at || booking.booked_at)}</td>
              <td className="table-cell">{formatDate(booking.starts_at)}</td>
              <td className="table-cell">{money(session.price)}</td>
              <td className="table-cell"><Badge tone={booking.computedStatus}>{booking.computedStatus}</Badge></td>
              <td className="table-cell">
                <div className="flex flex-wrap gap-2">
                  {booking.status !== "cancelled" ? <button className="btn-ghost min-h-8 px-3 py-1 text-xs" onClick={() => onBookingStatusChange(booking.id, "cancelled")}>Cancel</button> : <button className="btn-ghost min-h-8 px-3 py-1 text-xs" onClick={() => onBookingStatusChange(booking.id, "active")}>Restore</button>}
                  <button className="btn-ghost min-h-8 px-3 py-1 text-xs" onClick={() => onDeleteBooking(booking.id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </ResponsiveTable>
      )}
    </Panel>
  );
}

function AdminFact({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-white">{value || "Not available"}</p>
    </div>
  );
}

function AdminBookings({ bookings, sessions, filter, setFilter, onBookingStatusChange, onDeleteBooking }) {
  return (
    <Panel title="All Bookings" subtitle="Manage bookings across every session.">
      <FilterTabs value={filter} onChange={setFilter} options={["all", "active", "completed", "cancelled"]} />
      {bookings.length === 0 ? <EmptyState title="No bookings found" body="Try another filter." /> : (
        <ResponsiveTable headers={["User Email", "Session", "Date", "Price", "Status", "Action"]}>
          {bookings.map((booking) => (
            <tr key={booking.id} className="border-t border-white/10">
              <td className="table-cell">{booking.user_email}</td>
              <td className="table-cell font-medium text-white">{booking.session_title}</td>
              <td className="table-cell">{formatDate(booking.starts_at)}</td>
              <td className="table-cell">{money(sessionPrice(sessions, booking.session_id))}</td>
              <td className="table-cell"><Badge tone={booking.computedStatus}>{booking.computedStatus}</Badge></td>
              <td className="table-cell">
                <div className="flex flex-wrap gap-2">
                  {booking.status !== "cancelled" ? <button className="btn-ghost min-h-8 px-3 py-1 text-xs" onClick={() => onBookingStatusChange(booking.id, "cancelled")}>Cancel</button> : <button className="btn-ghost min-h-8 px-3 py-1 text-xs" onClick={() => onBookingStatusChange(booking.id, "active")}>Restore</button>}
                  <button className="btn-ghost min-h-8 px-3 py-1 text-xs" onClick={() => onDeleteBooking(booking)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </ResponsiveTable>
      )}
    </Panel>
  );
}

function AdminProfile({ auth }) {
  return (
    <Panel title="Admin Profile" subtitle="Signed-in administrator account.">
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-white/10 bg-black/20 p-5">
        <Avatar user={auth.user} size="lg" />
        <div>
          <h3 className="text-xl font-semibold text-white">{auth.user.name}</h3>
          <p className="mt-1 text-sm text-slate-400">{auth.user.email}</p>
          <div className="mt-3"><Badge tone="completed">Admin</Badge></div>
        </div>
      </div>
    </Panel>
  );
}

function AdminToolbar({ query, setQuery, placeholder, filter, setFilter, options }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <input className="field w-full sm:max-w-xs" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={placeholder} />
      <select className="field w-full sm:max-w-44" value={filter} onChange={(event) => setFilter(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </div>
  );
}

function ConfirmModal({ title, body, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-[#101320] p-5 shadow-glow">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function AdminRow({ title, meta, badge }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 p-4">
      <div className="min-w-0">
        <p className="truncate font-semibold text-white">{title}</p>
        <p className="truncate text-sm text-slate-500">{meta}</p>
      </div>
      <Badge tone={badge === "cancelled" ? "cancelled" : badge === "completed" || badge === "admin" ? "completed" : "active"}>{badge}</Badge>
    </div>
  );
}
