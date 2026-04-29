type User = { id: string; name: string; email: string } | null;

export default function Header({ onMobileMenu, onLogout, user }: { onMobileMenu: () => void; onLogout?: () => void; user?: User }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onMobileMenu}
            className="inline-flex items-center justify-center rounded-md p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
            aria-label="Open navigation menu"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="hidden sm:block">
            <h2 className="text-lg font-semibold text-ink">ApplyTrack</h2>
            <p className="text-xs text-slate-500">Job application CRM</p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center gap-3 sm:flex">
            <button className="rounded-full bg-white px-3 py-1 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50">
              New
            </button>
            <div className="h-8 w-px bg-slate-200" />
            <div className="text-sm text-slate-600">Notifications</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-sm text-slate-700 sm:block">{user?.name ?? ''}</div>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-500 to-sky-500 shadow-sm" />
            {onLogout ? (
              <button
                onClick={onLogout}
                className="ml-1 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700 shadow-sm transition hover:border-brand-200 hover:text-brand-700"
              >
                Logout
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
