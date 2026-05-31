import React from "react";

export function StatCard({ label, value }) {
  return (
    <div className="glass-panel p-5 transition hover:-translate-y-1 hover:shadow-glow">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{value}</p>
    </div>
  );
}

export function Panel({ title, subtitle, children }) {
  return (
    <section className="glass-panel p-5">
      <SectionHeading title={title} subtitle={subtitle} compact />
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function SectionHeading({ title, subtitle, compact = false }) {
  return (
    <div>
      <h2 className={`${compact ? "text-lg" : "text-2xl"} font-semibold text-white`}>{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}

export function Badge({ tone = "active", children }) {
  const styles = {
    active: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
    completed: "border-primary/30 bg-primary/15 text-violet-200",
    cancelled: "border-rose-400/25 bg-rose-400/10 text-rose-300",
  };
  return <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${styles[tone] || styles.active}`}>{children}</span>;
}

export function EmptyState({ title, body }) {
  return (
    <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.03] p-8 text-center">
      <p className="font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{body}</p>
    </div>
  );
}

export function LoadingSpinner({ label = "Loading" }) {
  return (
    <div className="grid min-h-52 place-items-center">
      <div className="text-center">
        <div className="mx-auto size-10 animate-spin rounded-full border-2 border-white/10 border-t-primary" />
        <p className="mt-3 text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export function LoadingOverlay() {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm"><LoadingSpinner label="Working" /></div>;
}

export function LoadingGrid() {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-72 animate-pulse rounded-lg bg-white/[0.06]" />)}</div>;
}

export function Toast({ message }) {
  return <div className="fixed right-4 top-4 z-50 max-w-sm rounded-lg border border-primary/30 bg-[#101320] px-4 py-3 text-sm text-white shadow-glow">{message}</div>;
}

export function NavButton({ active, compact, children, onClick }) {
  return <button className={`${compact ? "px-2 py-2 text-xs" : "px-3 py-2 text-sm"} rounded-lg text-left font-semibold transition ${active ? "bg-primary text-white shadow-glow" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"}`} onClick={onClick}>{children}</button>;
}

export function Avatar({ user, size = "md" }) {
  const className = size === "lg" ? "size-16 text-xl" : "size-10 text-sm";
  return user.avatar ? <img className={`${className} rounded-lg object-cover`} src={user.avatar} alt="" /> : <div className={`${className} grid place-items-center rounded-lg bg-primary font-bold text-white`}>{(user.name || user.email || "U").slice(0, 1).toUpperCase()}</div>;
}

export function ProfileChip({ user }) {
  return <div className="flex min-w-0 items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3"><Avatar user={user} /><div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{user.name}</p><p className="truncate text-xs text-slate-500">{user.email}</p></div></div>;
}

export function MiniMetric({ label, value }) {
  return <div className="rounded-lg border border-white/10 bg-black/20 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 truncate text-sm font-semibold text-white">{value}</p></div>;
}

export function ActivityItem({ title, meta, status }) {
  return <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 p-4"><div className="min-w-0"><p className="truncate font-semibold text-white">{title}</p><p className="truncate text-sm text-slate-500">{meta}</p></div><Badge tone={status}>{status}</Badge></div>;
}

export function FilterTabs({ value, onChange, options }) {
  return <div className="mb-4 flex flex-wrap gap-2">{options.map((option) => <button key={option} className={`${value === option ? "bg-primary text-white shadow-glow" : "bg-white/[0.05] text-slate-400 hover:bg-white/10"} rounded-lg px-3 py-2 text-sm font-semibold capitalize transition`} onClick={() => onChange(option)}>{option}</button>)}</div>;
}

export function ResponsiveTable({ headers, children }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className="min-w-full divide-y divide-white/10">
        <thead className="bg-white/[0.03]"><tr>{headers.map((header) => <th className="table-head" key={header}>{header}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
