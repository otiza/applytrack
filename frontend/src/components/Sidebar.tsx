import React from 'react';
import { NavLink } from 'react-router-dom';

type NavItem = {
  key: string;
  label: string;
  path: string;
  icon?: React.ReactNode;
};

export default function Sidebar({ className }: { className?: string }) {
  const items: NavItem[] = [
    { key: 'dashboard', label: 'Dashboard', path: '/', icon: (<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 13h8V3H3v10zM3 21h8v-6H3v6zM13 21h8V11h-8v10zM13 3v6h8V3h-8z" /></svg>) },
    { key: 'applications', label: 'Applications', path: '/applications', icon: (<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" /></svg>) },
    { key: 'pipeline', label: 'Pipeline', path: '/pipeline', icon: (<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>) },
    { key: 'calendar', label: 'Calendar', path: '/calendar', icon: (<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M8.25 2.25v3M15.75 2.25v3M3 8.25h18M4.5 5.25h15A1.5 1.5 0 0 1 21 6.75v12A1.5 1.5 0 0 1 19.5 20.25h-15A1.5 1.5 0 0 1 3 18.75v-12A1.5 1.5 0 0 1 4.5 5.25z" /></svg>) },
    { key: 'companies', label: 'Companies', path: '/companies', icon: (<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" /></svg>) },
    { key: 'settings', label: 'Settings', path: '/settings', icon: (<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09c.67 0 1.24-.41 1.51-1a1.65 1.65 0 00-.33-1.82L3.31 3.34A2 2 0 016.14.51l.06.06c.49.49 1.29.5 1.82.33.5-.16 1.06-.25 1.62-.25h.09c.56 0 1.12.09 1.62.25.53.16 1.33.16 1.82-.33l.06-.06A2 2 0 0117.69 3.3l-.06.06c-.49.49-.5 1.29-.33 1.82.16.5.25 1.06.25 1.62v.09c0 .56-.09 1.12-.25 1.62-.16.53-.16 1.33.33 1.82l.06.06c.49.49 1.29.5 1.82.33.5-.16 1.06-.25 1.62-.25H21a2 2 0 010 4h-.09c-.67 0-1.24.41-1.51 1z" /></svg>) }
  ];

  return (
    <aside className={`hidden lg:flex lg:w-72 lg:flex-col ${className || ''}`} aria-label="Sidebar">
      <div className="flex h-full flex-col gap-6 overflow-y-auto border-r border-slate-100 bg-white px-4 py-6">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600/10 font-extrabold text-brand-700">AT</div>
          <div>
            <p className="text-sm font-semibold text-ink">ApplyTrack</p>
            <p className="text-xs text-slate-500">Job application CRM</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {items.map((it) => (
            <NavLink
              key={it.key}
              to={it.path}
              className={({ isActive }) =>
                [
                  'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
                  'text-slate-700 hover:bg-slate-50 hover:text-ink',
                  isActive ? 'bg-slate-100 text-ink shadow-sm' : ''
                ].join(' ')
              }
            >
              <span className="inline-flex h-5 w-5 items-center justify-center text-slate-500 transition group-hover:text-ink">{it.icon}</span>
              <span>{it.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex items-center gap-3 px-2">
          <div className="flex-1 text-sm text-slate-500">v0.1 • Light</div>
        </div>
      </div>
    </aside>
  );
}
