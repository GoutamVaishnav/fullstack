import React from "react";
import { ActivityItem, Avatar, Badge, EmptyState, FilterTabs, LoadingSpinner, MiniMetric, Panel, ResponsiveTable, StatCard } from "../components/ui.jsx";
import { bookingStatus, formatDate, money, sessionPrice, toDatetimeLocalValue, timezoneLabel } from "../utils/format.js";

export function UserDashboard(props) {
  const { activeTab, auth, bookings, sessionById, loading, filter, setFilter, onCancel, onSaveProfile, onSwitchRole, onViewSession } = props;
  const enriched = bookings.map((booking) => ({ ...booking, session: sessionById.get(Number(booking.session_id)), computedStatus: bookingStatus(booking) }));
  const active = enriched.filter((booking) => booking.computedStatus === "active");
  const completed = enriched.filter((booking) => booking.computedStatus === "completed");
  const cancelled = enriched.filter((booking) => booking.computedStatus === "cancelled");
  const filtered = filter === "all" ? enriched : enriched.filter((booking) => booking.computedStatus === filter);

  if (loading) return <LoadingSpinner label="Loading dashboard" />;
  if (activeTab === "My Bookings") return <BookingsPanel bookings={filtered} filter={filter} setFilter={setFilter} onCancel={onCancel} onViewSession={onViewSession} />;
  if (activeTab === "Profile") return <UserProfile auth={auth} onSave={onSaveProfile} onSwitchRole={onSwitchRole} />;

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Bookings" value={bookings.length} />
        <StatCard label="Active Bookings" value={active.length} />
        <StatCard label="Completed Sessions" value={completed.length} />
        <StatCard label="Cancelled Bookings" value={cancelled.length} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Upcoming Sessions" subtitle="Your next active bookings.">
          {active.length === 0 ? <EmptyState title="No upcoming sessions" body="Book a session from the catalog to see it here." /> : <div className="grid gap-3">{active.slice(0, 5).map((booking) => <UpcomingItem key={booking.id} booking={booking} onView={() => onViewSession(booking.session_id)} />)}</div>}
        </Panel>
        <Panel title="Recent Activity" subtitle="Latest five bookings.">
          {enriched.length === 0 ? <EmptyState title="No activity yet" body="Your booking history will appear here." /> : <div className="grid gap-3">{enriched.slice(0, 5).map((booking) => <ActivityItem key={booking.id} title={booking.session_title} meta={formatDate(booking.created_at)} status={booking.computedStatus} />)}</div>}
        </Panel>
      </div>
    </div>
  );
}

export function CreatorDashboard(props) {
  const { activeTab, auth, sessions, bookings, loading, filter, setFilter, editingSession, setEditingSession, viewingSession, setViewingSession, onSaveSession, onDeleteSession, onSaveProfile, onSwitchRole } = props;
  const enrichedBookings = bookings.map((booking) => ({ ...booking, computedStatus: bookingStatus(booking) }));
  const filteredBookings = filter === "all" ? enrichedBookings : enrichedBookings.filter((booking) => booking.computedStatus === filter);
  const activeSessions = sessions.filter((session) => session.is_active);
  const revenue = enrichedBookings.filter((booking) => booking.computedStatus !== "cancelled").reduce((sum, booking) => sum + sessionPrice(sessions, booking.session_id), 0);
  const totalStudents = new Set(enrichedBookings.map((booking) => booking.user_email)).size;

  if (loading) return <LoadingSpinner label="Loading creator dashboard" />;
  if (activeTab === "My Sessions") return <SessionsPanel sessions={sessions} bookings={bookings} editingSession={editingSession} setEditingSession={setEditingSession} viewingSession={viewingSession} setViewingSession={setViewingSession} onSaveSession={onSaveSession} onDeleteSession={onDeleteSession} />;
  if (activeTab === "Bookings") return <CreatorBookingsPanel bookings={filteredBookings} filter={filter} setFilter={setFilter} sessions={sessions} />;
  if (activeTab === "Profile") return <CreatorProfile auth={auth} sessions={sessions} revenue={revenue} totalStudents={totalStudents} onSave={onSaveProfile} onSwitchRole={onSwitchRole} />;

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Sessions" value={sessions.length} />
        <StatCard label="Active Sessions" value={activeSessions.length} />
        <StatCard label="Total Bookings" value={bookings.length} />
        <StatCard label="Total Revenue" value={money(revenue)} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Revenue Analytics" subtitle="Revenue is calculated from non-cancelled bookings.">
          <RevenueChart sessions={sessions} bookings={enrichedBookings} />
        </Panel>
        <Panel title="Recent Bookings" subtitle="Latest student reservations.">
          {enrichedBookings.length === 0 ? <EmptyState title="No bookings yet" body="Bookings will appear when users reserve your sessions." /> : <div className="grid gap-3">{enrichedBookings.slice(0, 5).map((booking) => <ActivityItem key={booking.id} title={booking.session_title} meta={booking.user_email} status={booking.computedStatus} />)}</div>}
        </Panel>
      </div>
    </div>
  );
}

function SessionsPanel({ sessions, bookings, editingSession, setEditingSession, viewingSession, setViewingSession, onSaveSession, onDeleteSession }) {
  const selectedSession = viewingSession && sessions.find((session) => Number(session.id) === Number(viewingSession.id));
  return (
    <div className="grid gap-5">
      {selectedSession && (
        <CreatorSessionDetail
          session={selectedSession}
          bookings={bookings}
          onClose={() => setViewingSession(null)}
          onEdit={() => {
            setEditingSession(selectedSession);
            setViewingSession(null);
          }}
        />
      )}
      <Panel title={editingSession ? "Edit Session" : "Create Session"} subtitle="Publish and manage your marketplace inventory.">
        <SessionForm key={editingSession?.id || "new"} session={editingSession} onSubmit={onSaveSession} onCancel={() => setEditingSession(null)} />
      </Panel>
      <Panel title="Session Table" subtitle="View details, update sessions, and track spots left.">
        <SessionTable sessions={sessions} bookings={bookings} onView={setViewingSession} onEdit={setEditingSession} onDelete={onDeleteSession} />
      </Panel>
    </div>
  );
}

function CreatorSessionDetail({ session, bookings, onClose, onEdit }) {
  const booked = bookings.filter((booking) => Number(booking.session_id) === Number(session.id) && bookingStatus(booking) !== "cancelled").length;
  const capacity = Number(session.capacity || 20);
  return (
    <Panel title="Hosted Session Details" subtitle="Only the creator who owns this session can see and update this view.">
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div>
          <Badge tone={session.is_active ? "active" : "cancelled"}>{session.is_active ? "Active" : "Inactive"}</Badge>
          <h3 className="mt-3 text-2xl font-semibold text-white">{session.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">{session.description}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <MiniMetric label={`Scheduled Date & Time (${timezoneLabel()})`} value={formatDate(session.starts_at)} />
            <MiniMetric label="Category" value={session.category} />
            <MiniMetric label="Duration" value={`${session.duration_minutes} min`} />
            <MiniMetric label="Price" value={money(session.price)} />
            <MiniMetric label="Max Capacity" value={capacity} />
            <MiniMetric label="Booked Students" value={booked} />
            <MiniMetric label="Spots Left" value={Math.max(capacity - booked, 0)} />
            <MiniMetric label="Status" value={session.is_active ? "Active" : "Inactive"} />
          </div>
          {session.meeting_link && <a className="mt-4 block break-all text-sm font-semibold text-primary" href={session.meeting_link} target="_blank" rel="noreferrer">{session.meeting_link}</a>}
          <div className="mt-5 flex gap-3">
            <button className="btn-primary" onClick={onEdit}>Update This Session</button>
            <button className="btn-ghost" onClick={onClose}>Close Details</button>
          </div>
        </div>
        <div className="min-h-56 overflow-hidden rounded-lg border border-white/10 bg-black/20">
          {session.image_url ? <img className="h-full w-full object-cover" src={session.image_url} alt="" /> : <div className="grid h-full place-items-center text-sm text-slate-500">No image uploaded</div>}
        </div>
      </div>
    </Panel>
  );
}

export function SessionForm({ session, onSubmit, onCancel }) {
  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
      <label className="grid gap-2 text-sm text-slate-300 md:col-span-2">Session Title *<input className="field" name="title" defaultValue={session?.title || ""} required /></label>
      <label className="grid gap-2 text-sm text-slate-300 md:col-span-2">Description *<textarea className="field min-h-28" name="description" defaultValue={session?.description || ""} required /></label>
      <label className="grid gap-2 text-sm text-slate-300">Category *<input className="field" name="category" defaultValue={session?.category || "Meditation"} required /></label>
      <label className="grid gap-2 text-sm text-slate-300">Price *<input className="field" name="price" type="number" min="0" step="0.01" defaultValue={session?.price || "0"} required /></label>
      <label className="grid gap-2 text-sm text-slate-300">Duration (minutes) *<input className="field" name="duration_minutes" type="number" min="15" defaultValue={session?.duration_minutes || 60} required /></label>
      <label className="grid gap-2 text-sm text-slate-300">Scheduled Date & Time *<input className="field" name="starts_at" type="datetime-local" defaultValue={toDatetimeLocalValue(session?.starts_at)} required /><span className="text-xs text-slate-500">Stored safely in UTC, shown in your local timezone.</span></label>
      <label className="grid gap-2 text-sm text-slate-300">Max Capacity *<input className="field" name="capacity" type="number" min="1" defaultValue={session?.capacity || 20} required /></label>
      <label className="grid gap-2 text-sm text-slate-300">Status (Active/Inactive)<select className="field" name="is_active" defaultValue={String(session?.is_active ?? true)}><option value="true">Active</option><option value="false">Inactive</option></select></label>
      <label className="grid gap-2 text-sm text-slate-300 md:col-span-2">Session Image URL<input className="field" name="image_url" type="url" defaultValue={session?.image_url || ""} placeholder="https://example.com/session.jpg" /></label>
      <label className="grid gap-2 text-sm text-slate-300 md:col-span-2">Meeting Link (optional)<input className="field" name="meeting_link" type="url" defaultValue={session?.meeting_link || ""} placeholder="https://meet.google.com/..." /></label>
      <div className="flex gap-3 md:col-span-2">
        <button className="btn-primary" type="submit">{session ? "Save Changes" : "Create Session"}</button>
        {session && <button className="btn-ghost" type="button" onClick={onCancel}>Cancel Edit</button>}
      </div>
    </form>
  );
}

function SessionTable({ sessions, bookings, onView, onEdit, onDelete }) {
  if (sessions.length === 0) return <EmptyState title="No sessions created" body="Use the create session form to publish your first session." />;
  return (
    <ResponsiveTable headers={["Title", "Schedule", "Duration", "Price", "Capacity", "Spots Left", "Status", "View", "Edit", "Delete"]}>
      {sessions.map((session) => {
        const booked = bookings.filter((booking) => Number(booking.session_id) === Number(session.id) && bookingStatus(booking) !== "cancelled").length;
        const capacity = Number(session.capacity || 20);
        return (
          <tr key={session.id} className="border-t border-white/10">
            <td className="table-cell font-medium text-white">{session.title}</td>
            <td className="table-cell">{formatDate(session.starts_at)}</td>
            <td className="table-cell">{session.duration_minutes} min</td>
            <td className="table-cell">{money(session.price)}</td>
            <td className="table-cell">{capacity}</td>
            <td className="table-cell">{Math.max(capacity - booked, 0)}</td>
            <td className="table-cell"><Badge tone={session.is_active ? "active" : "cancelled"}>{session.is_active ? "active" : "inactive"}</Badge></td>
            <td className="table-cell"><button className="btn-ghost min-h-8 px-3 py-1 text-xs" onClick={() => onView(session)}>View</button></td>
            <td className="table-cell"><button className="btn-ghost min-h-8 px-3 py-1 text-xs" onClick={() => onEdit(session)}>Edit</button></td>
            <td className="table-cell"><button className="btn-ghost min-h-8 px-3 py-1 text-xs" onClick={() => onDelete(session.id)}>Delete</button></td>
          </tr>
        );
      })}
    </ResponsiveTable>
  );
}

function BookingsPanel({ bookings, filter, setFilter, onCancel, onViewSession }) {
  return (
    <Panel title="My Bookings" subtitle="Filter and manage your reservations.">
      <FilterTabs value={filter} onChange={setFilter} options={["all", "active", "completed", "cancelled"]} />
      <BookingTable bookings={bookings} onCancel={onCancel} onViewSession={onViewSession} />
    </Panel>
  );
}

function BookingTable({ bookings, onCancel, onViewSession }) {
  if (bookings.length === 0) return <EmptyState title="No bookings found" body="Try another filter or book your first session." />;
  return (
    <ResponsiveTable headers={["Session", "Date", "Duration", "Price", "Status", "Action"]}>
      {bookings.map((booking) => (
        <tr key={booking.id} className="border-t border-white/10">
          <td className="table-cell font-medium text-white">{booking.session_title}</td>
          <td className="table-cell">{formatDate(booking.starts_at)}</td>
          <td className="table-cell">{booking.session?.duration_minutes || "-"} min</td>
          <td className="table-cell">{money(booking.session?.price)}</td>
          <td className="table-cell"><Badge tone={booking.computedStatus}>{booking.computedStatus}</Badge></td>
          <td className="table-cell"><button className="btn-ghost min-h-8 px-3 py-1 text-xs" onClick={() => onViewSession(booking.session_id)}>View</button></td>
        </tr>
      ))}
    </ResponsiveTable>
  );
}

function CreatorBookingsPanel({ bookings, filter, setFilter, sessions }) {
  return (
    <Panel title="Bookings" subtitle="All reservations across your sessions.">
      <FilterTabs value={filter} onChange={setFilter} options={["all", "active", "completed", "cancelled"]} />
      {bookings.length === 0 ? <EmptyState title="No bookings found" body="Try a different filter or wait for new reservations." /> : (
        <ResponsiveTable headers={["User Email", "Session Name", "Booking Date", "Price", "Status"]}>
          {bookings.map((booking) => (
            <tr key={booking.id} className="border-t border-white/10">
              <td className="table-cell">{booking.user_email}</td>
              <td className="table-cell font-medium text-white">{booking.session_title}</td>
              <td className="table-cell">{formatDate(booking.created_at)}</td>
              <td className="table-cell">{money(sessionPrice(sessions, booking.session_id))}</td>
              <td className="table-cell"><Badge tone={booking.computedStatus}>{booking.computedStatus}</Badge></td>
            </tr>
          ))}
        </ResponsiveTable>
      )}
    </Panel>
  );
}

function UserProfile({ auth, onSave, onSwitchRole }) {
  return <ProfilePanel auth={auth} badge="User" stats={[["Role", auth.user.role], ["Member Since", formatDate(auth.user.member_since)], ["Email", auth.user.email || "Not available"]]} onSave={onSave} switchLabel="Switch to Creator" onSwitch={onSwitchRole} />;
}

function CreatorProfile({ auth, sessions, revenue, totalStudents, onSave, onSwitchRole }) {
  return <ProfilePanel auth={auth} badge="Creator" stats={[["Sessions Created", sessions.length], ["Total Revenue", money(revenue)], ["Total Students", totalStudents]]} onSave={onSave} switchLabel="Switch to User" onSwitch={onSwitchRole} />;
}

function ProfilePanel({ auth, badge, stats, onSave, switchLabel, onSwitch }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
      <Panel title="Profile" subtitle="Identity and account details.">
        <div className="flex items-center gap-4">
          <Avatar user={auth.user} size="lg" />
          <div className="min-w-0">
            <div className="flex items-center gap-2"><h2 className="truncate text-xl font-semibold text-white">{auth.user.name}</h2><Badge tone="active">{badge}</Badge></div>
            <p className="truncate text-sm text-slate-400">{auth.user.email}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3">{stats.map(([label, value]) => <MiniMetric key={label} label={label} value={value} />)}</div>
        <button className="btn-ghost mt-6 w-full" onClick={onSwitch}>{switchLabel}</button>
      </Panel>
      <Panel title="Edit Profile" subtitle="Update your display name and avatar.">
        <form className="grid gap-4" onSubmit={onSave}>
          <label className="grid gap-2 text-sm text-slate-300">Name<input className="field" name="name" defaultValue={auth.user.name} required /></label>
          <label className="grid gap-2 text-sm text-slate-300">Avatar URL<input className="field" name="avatar" defaultValue={auth.user.avatar || ""} /></label>
          <input type="hidden" name="role" value={auth.user.role} />
          <button className="btn-primary w-fit">Save Changes</button>
        </form>
      </Panel>
    </div>
  );
}

function RevenueChart({ sessions, bookings }) {
  const points = sessions.slice(-6).map((session) => {
    const value = bookings.filter((booking) => Number(booking.session_id) === Number(session.id) && booking.computedStatus !== "cancelled").length * Number(session.price || 0);
    return { label: session.title, value };
  });
  const max = Math.max(...points.map((point) => point.value), 1);
  if (points.length === 0) return <EmptyState title="No revenue yet" body="Revenue analytics will appear after you create sessions." />;
  return (
    <div className="flex h-72 items-end gap-3 rounded-lg border border-white/10 bg-black/20 p-4">
      {points.map((point) => (
        <div className="flex min-w-0 flex-1 flex-col items-center gap-3" key={point.label}>
          <div className="w-full rounded-t-lg bg-gradient-to-t from-primary to-cyan-300 shadow-glow" style={{ height: `${Math.max((point.value / max) * 210, 8)}px` }} />
          <span className="w-full truncate text-center text-xs text-slate-500">{point.label}</span>
        </div>
      ))}
    </div>
  );
}

function UpcomingItem({ booking, onView }) {
  return <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-white">{booking.session_title}</p><p className="text-sm text-slate-500">{formatDate(booking.starts_at)} - {money(booking.session?.price)}</p></div><button className="btn-ghost min-h-9 px-3 py-1 text-xs" onClick={onView}>View Details</button></div>;
}
