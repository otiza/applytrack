import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../context/AuthContext';

export default function AppShell({ onLogout }: { onLogout?: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <Header onMobileMenu={() => setMobileOpen((s) => !s)} onLogout={onLogout} user={user} />

      <div className="mx-auto flex h-full max-w-7xl">
        <Sidebar className="hidden lg:block" />

        {/* Mobile sidebar overlay */}
        {mobileOpen ? (
          <div className="fixed inset-0 z-40 flex lg:hidden">
            <div className="w-72">
              <Sidebar className="block" />
            </div>
            <button
              aria-label="Close navigation menu"
              className="flex-1 bg-black/20"
              onClick={() => setMobileOpen(false)}
            />
          </div>
        ) : null}

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
