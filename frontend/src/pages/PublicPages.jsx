import React from "react";
import { TopBar } from "../components/layout.jsx";
import { Badge, EmptyState, LoadingGrid, LoadingSpinner, MiniMetric, SectionHeading } from "../components/ui.jsx";
import { formatDate, money, timezoneLabel } from "../utils/format.js";

export function CatalogPage({ sessions, loading, auth, onGoogleLogin, onDemoLogin, onSwitchRole, onLogout, onNavigate }) {
  return (
    <div className="min-h-screen px-4 pb-10 pt-4 sm:px-6 lg:px-8">
      <TopBar auth={auth} onGoogleLogin={onGoogleLogin} onSwitchRole={onSwitchRole} onLogout={onLogout} onNavigate={onNavigate} />
      <section className="mx-auto grid max-w-7xl gap-6 py-8 lg:grid-cols-[380px_1fr]">
        <aside className="glass-panel h-fit p-6 lg:sticky lg:top-24">
          <p className="text-sm font-semibold text-primary">Sessions Marketplace</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Real creators. Real sessions. Simple booking.</h1>
          <p className="mt-4 text-sm leading-6 text-slate-400">Users can discover and book sessions from every creator. Creators can publish and manage only their own sessions after signing in.</p>
          <div className="mt-6 grid gap-3">
            {!auth && <button className="btn-primary" onClick={onGoogleLogin}>Login with Google</button>}
            {!auth && onDemoLogin && (
              <div className="grid gap-2 sm:grid-cols-3">
                <button className="btn-ghost min-h-10 px-3 py-2 text-xs" onClick={() => onDemoLogin("user")}>Demo User</button>
                <button className="btn-ghost min-h-10 px-3 py-2 text-xs" onClick={() => onDemoLogin("creator")}>Demo Creator</button>
                <button className="btn-ghost min-h-10 px-3 py-2 text-xs" onClick={() => onDemoLogin("admin")}>Demo Admin</button>
              </div>
            )}
            {auth ? (
              <>
                <button className="btn-primary" onClick={() => onNavigate(auth.user.role === "admin" ? "/admin" : auth.user.role === "creator" ? "/creator" : "/dashboard")}>Open Dashboard</button>
                {auth.user.role === "user" && <button className="btn-ghost" onClick={() => onSwitchRole("creator")}>Become Creator</button>}
              </>
            ) : (
              <p className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-500">Login required for booking or creating sessions.</p>
            )}
          </div>
        </aside>
        <section>
          <SectionHeading title="Catalog" subtitle="All sessions come directly from the Sessions API." />
          {loading ? <LoadingGrid /> : sessions.length === 0 ? <EmptyState title="No sessions yet" body="Create one from the creator dashboard and it will appear here." /> : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sessions.map((session) => <SessionCard key={session.id} session={session} onView={() => onNavigate(`/session/${session.id}`)} />)}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}

export function SessionDetail({ session, loading, auth, onBook, onNavigate, onGoogleLogin, onDemoLogin, onSwitchRole, onLogout }) {
  const spotsLeft = Number(session?.capacity || 20);
  return (
    <div className="min-h-screen px-4 pb-10 pt-4 sm:px-6 lg:px-8">
      <TopBar auth={auth} onGoogleLogin={onGoogleLogin} onDemoLogin={onDemoLogin} onSwitchRole={onSwitchRole} onLogout={onLogout} onNavigate={onNavigate} />
      <section className="mx-auto max-w-6xl py-8">
        {loading ? <LoadingSpinner label="Loading session" /> : !session ? <EmptyState title="Session not found" body="Go back to the catalog and choose another session." /> : (
          <div className="glass-panel grid overflow-hidden lg:grid-cols-[1fr_460px]">
            <div className="p-6 sm:p-8">
              <Badge tone={session.is_active ? "active" : "cancelled"}>{session.is_active ? "Active" : "Inactive"}</Badge>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white">{session.title}</h1>
              <p className="mt-4 max-w-2xl text-slate-400">{session.description}</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <MiniMetric label={`Scheduled Date & Time (${timezoneLabel()})`} value={formatDate(session.starts_at)} />
                <MiniMetric label="Category" value={session.category || "General"} />
                <MiniMetric label="Duration" value={`${session.duration_minutes} min`} />
                <MiniMetric label="Price" value={money(session.price)} />
                <MiniMetric label="Max Capacity" value={session.capacity || 20} />
                <MiniMetric label="Spots Left" value={spotsLeft} />
                <MiniMetric label="Host" value={session.creator_name || "Creator"} />
                <MiniMetric label="Status" value={session.is_active ? "Active" : "Inactive"} />
              </div>
              {session.meeting_link && (
                <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Meeting Link</p>
                  <a className="mt-1 block break-all text-sm font-semibold text-primary hover:text-[#8B85FF]" href={session.meeting_link} target="_blank" rel="noreferrer">{session.meeting_link}</a>
                </div>
              )}
              <div className="mt-8 flex flex-wrap gap-3">
                <button className="btn-primary" onClick={() => onBook(session.id)}>Book Now</button>
                <button className="btn-ghost" onClick={() => onNavigate("/")}>Back to Catalog</button>
              </div>
            </div>
            <div className="min-h-80 bg-white/[0.04]">
              {session.image_url ? <img className="h-full w-full object-cover" src={session.image_url} alt="" /> : <div className="flex h-full items-center justify-center text-slate-500">No image uploaded</div>}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function SessionCard({ session, onView }) {
  return (
    <article className="glass-panel overflow-hidden transition hover:-translate-y-1 hover:shadow-glow">
      <div className="aspect-[16/10] bg-white/[0.04]">
        {session.image_url ? <img className="h-full w-full object-cover" src={session.image_url} alt="" /> : <div className="grid h-full place-items-center text-sm text-slate-500">No image</div>}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <Badge tone={session.is_active ? "active" : "cancelled"}>{session.category}</Badge>
          <span className="text-sm font-semibold text-white">{money(session.price)}</span>
        </div>
        <h2 className="mt-4 line-clamp-2 text-lg font-semibold text-white">{session.title}</h2>
        <p className="mt-2 line-clamp-2 text-sm text-slate-400">{session.description}</p>
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span>{formatDate(session.starts_at)}</span>
          <span>{session.duration_minutes} min</span>
        </div>
        <button className="btn-primary mt-4 w-full" onClick={onView}>View Details</button>
      </div>
    </article>
  );
}
