import React from "react";
import { Avatar, NavButton, ProfileChip } from "./ui.jsx";

export function TopBar({ auth, onGoogleLogin, onSwitchRole, onLogout, onNavigate }) {
  return (
    <header className="sticky top-4 z-20 mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#090B16]/80 px-4 py-3 backdrop-blur-xl">
      <button className="flex items-center gap-3 text-left" onClick={() => onNavigate("/")}>
        <span className="grid size-9 place-items-center rounded-lg bg-primary text-sm font-black">A</span>
        <span className="font-semibold text-white">Ahoum Sessions</span>
      </button>
      <div className="flex min-w-0 items-center gap-2 overflow-x-auto">
        {auth && <button className="btn-ghost" onClick={() => onNavigate(auth.user.role === "admin" ? "/admin" : auth.user.role === "creator" ? "/creator" : "/dashboard")}>Dashboard</button>}
        {auth?.user.role === "user" && <button className="btn-ghost" onClick={() => onSwitchRole("creator")}>Become Creator</button>}
        {auth?.user.role === "creator" && <button className="btn-ghost" onClick={() => onSwitchRole("user")}>User Mode</button>}
        {auth ? <button className="btn-ghost" onClick={onLogout}>Logout</button> : <button className="btn-primary" onClick={onGoogleLogin}>Google Login</button>}
      </div>
    </header>
  );
}

export function DashboardShell({ auth, tabs, activeTab, setActiveTab, onNavigate, onLogout, children }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/10 bg-[#090B16]/95 p-4 backdrop-blur-xl lg:block">
        <button className="mb-8 flex items-center gap-3 text-left" onClick={() => onNavigate("/")}>
          <span className="grid size-10 place-items-center rounded-lg bg-primary text-lg font-black">A</span>
          <span>
            <span className="block text-sm font-semibold text-white">Ahoum</span>
            <span className="block text-xs text-slate-500">Sessions OS</span>
          </span>
        </button>
        <nav className="grid gap-2">
          {tabs.map((tab) => <NavButton key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)}>{tab}</NavButton>)}
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <ProfileChip user={auth.user} />
        </div>
      </aside>
      <section className="min-w-0 lg:col-start-2">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#070914]/85 px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">{auth.user.role} dashboard</p>
              <h1 className="text-xl font-semibold text-white sm:text-2xl">{activeTab}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-ghost hidden sm:inline-flex" onClick={() => onNavigate("/")}>Catalog</button>
              <button className="btn-ghost" onClick={onLogout}>Logout</button>
            </div>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {tabs.map((tab) => <NavButton key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)} compact>{tab}</NavButton>)}
          </nav>
        </header>
        <div className="mx-auto max-w-7xl p-4 sm:p-6">{children}</div>
      </section>
    </div>
  );
}
