import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { authRequest } from '../auth';

// ─── Types ────────────────────────────────────────────────────────────────────

type ApplicationStatus = 'WISHLIST' | 'APPLIED' | 'INTERVIEW' | 'TECHNICAL_TEST' | 'OFFER' | 'REJECTED';
type ApplicationPriority = 'LOW' | 'MEDIUM' | 'HIGH';

type ApplicationSummary = {
  id: string;
  jobTitle: string;
  status: ApplicationStatus;
  priority: ApplicationPriority;
  interviewDate?: string | null;
  createdAt: string;
  company: { id: string; name: string };
};

type DashboardStats = {
  totalApplications: number;
  totalCompanies: number;
  byStatus: { status: ApplicationStatus; count: number }[];
  byPriority: { priority: ApplicationPriority; count: number }[];
  upcomingInterviews: ApplicationSummary[];
  recentApplications: ApplicationSummary[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_META: Record<ApplicationStatus, { label: string; color: string }> = {
  WISHLIST:       { label: 'Wishlist',       color: '#94a3b8' },
  APPLIED:        { label: 'Applied',        color: '#38bdf8' },
  INTERVIEW:      { label: 'Interview',      color: '#a78bfa' },
  TECHNICAL_TEST: { label: 'Technical Test', color: '#fb923c' },
  OFFER:          { label: 'Offer',          color: '#34d399' },
  REJECTED:       { label: 'Rejected',       color: '#f87171' }
};

const PRIORITY_META: Record<ApplicationPriority, { label: string; color: string; badge: string }> = {
  LOW:    { label: 'Low',    color: '#94a3b8', badge: 'bg-slate-100 text-slate-600' },
  MEDIUM: { label: 'Medium', color: '#fbbf24', badge: 'bg-amber-100 text-amber-700' },
  HIGH:   { label: 'High',   color: '#f87171', badge: 'bg-rose-100 text-rose-700'   }
};

const STATUS_ORDER: ApplicationStatus[] = [
  'WISHLIST', 'APPLIED', 'INTERVIEW', 'TECHNICAL_TEST', 'OFFER', 'REJECTED'
];

// ─── Small helpers ────────────────────────────────────────────────────────────

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// ─── Stat card ────────────────────────────────────────────────────────────────

type StatCardProps = {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
};

function StatCard({ label, value, sub, icon, accent }: StatCardProps) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
        <p className="mt-1 text-3xl font-bold leading-none text-ink">{value}</p>
        {sub ? <p className="mt-1.5 text-xs text-slate-500">{sub}</p> : null}
      </div>
    </div>
  );
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
      {label ? <p className="mb-1 text-xs font-semibold text-slate-500">{label}</p> : null}
      <p className="text-sm font-bold text-ink">{payload[0].value} application{payload[0].value === 1 ? '' : 's'}</p>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-100 ${className ?? ''}`} />;
}

// ─── Empty placeholder ────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
      <svg className="h-7 w-7 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5M3.75 6h16.5M3.75 18h16.5" />
      </svg>
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await authRequest<DashboardStats>('/api/dashboard/stats');
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  // Derive a few useful numbers
  const offersCount = stats?.byStatus.find((s) => s.status === 'OFFER')?.count ?? 0;
  const interviewCount = stats?.upcomingInterviews.length ?? 0;

  // Build ordered status bar data (fill zeroes for missing statuses)
  const statusBarData = STATUS_ORDER.map((status) => ({
    name: STATUS_META[status].label,
    count: stats?.byStatus.find((s) => s.status === status)?.count ?? 0,
    color: STATUS_META[status].color
  }));

  // Build priority pie data
  const priorityPieData = (['HIGH', 'MEDIUM', 'LOW'] as ApplicationPriority[])
    .map((priority) => ({
      name: PRIORITY_META[priority].label,
      value: stats?.byPriority.find((p) => p.priority === priority)?.count ?? 0,
      color: PRIORITY_META[priority].color
    }))
    .filter((d) => d.value > 0);

  return (
    <section className="space-y-6">

      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">Overview</p>
        <h1 className="mt-1 text-3xl font-bold text-ink">Dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          A live snapshot of your job search — applications, pipeline health, and upcoming interviews.
        </p>
      </div>

      {/* Error banner */}
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      {/* ── Stat cards ── */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total applications"
            value={stats?.totalApplications ?? 0}
            sub="across all stages"
            accent="bg-brand-50 text-brand-600"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M5 8h14M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
              </svg>
            }
          />
          <StatCard
            label="Companies tracked"
            value={stats?.totalCompanies ?? 0}
            sub="in your workspace"
            accent="bg-violet-50 text-violet-600"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6M9 12h6M9 17.25h6" />
              </svg>
            }
          />
          <StatCard
            label="Upcoming interviews"
            value={interviewCount}
            sub={interviewCount > 0 ? `next: ${formatDate(stats?.upcomingInterviews[0]?.interviewDate)}` : 'none scheduled'}
            accent="bg-amber-50 text-amber-600"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5" />
              </svg>
            }
          />
          <StatCard
            label="Offers"
            value={offersCount}
            sub={offersCount > 0 ? 'congratulations!' : 'keep pushing'}
            accent="bg-emerald-50 text-emerald-600"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>
      )}

      {/* ── Charts row ── */}
      {loading ? (
        <div className="grid gap-4 lg:grid-cols-5">
          <Skeleton className="h-80 lg:col-span-3" />
          <Skeleton className="h-80 lg:col-span-2" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-5">

          {/* Applications by status — bar chart */}
          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Applications by stage</p>
              <h2 className="mt-1 text-base font-semibold text-ink">Pipeline breakdown</h2>
            </div>
            {stats && stats.totalApplications > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={statusBarData} barCategoryGap="30%" margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc', radius: 8 }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {statusBarData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-1 items-center">
                <EmptyState message="No applications yet. Add your first application to see stage breakdown." />
              </div>
            )}
          </div>

          {/* Applications by priority — pie chart */}
          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Applications by priority</p>
              <h2 className="mt-1 text-base font-semibold text-ink">Priority split</h2>
            </div>
            {priorityPieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={priorityPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {priorityPieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value as number} application${(value as number) === 1 ? '' : 's'}`]}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <ul className="mt-2 space-y-2">
                  {priorityPieData.map((entry) => (
                    <li key={entry.name} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: entry.color }} />
                        <span className="text-slate-600">{entry.name}</span>
                      </span>
                      <span className="font-semibold text-ink">{entry.value}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="flex flex-1 items-center">
                <EmptyState message="No applications yet." />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Bottom row: recent + interviews ── */}
      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">

          {/* Recent applications */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Latest added</p>
              <h2 className="mt-1 text-base font-semibold text-ink">Recent applications</h2>
            </div>
            {stats && stats.recentApplications.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {stats.recentApplications.map((app) => (
                  <li key={app.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <div
                      className="mt-1 h-2 w-2 shrink-0 rounded-full"
                      style={{ background: STATUS_META[app.status]?.color ?? '#94a3b8' }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{app.jobTitle}</p>
                      <p className="truncate text-xs text-slate-500">{app.company.name}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PRIORITY_META[app.priority].badge}`}>
                        {PRIORITY_META[app.priority].label}
                      </span>
                      <p className="mt-1 text-xs text-slate-400">{formatRelative(app.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState message="No applications yet. Start tracking your job search!" />
            )}
          </div>

          {/* Upcoming interviews */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Scheduled</p>
              <h2 className="mt-1 text-base font-semibold text-ink">Upcoming interviews</h2>
            </div>
            {stats && stats.upcomingInterviews.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {stats.upcomingInterviews.map((app) => {
                  const daysUntil = app.interviewDate
                    ? Math.ceil((new Date(app.interviewDate).getTime() - Date.now()) / 86_400_000)
                    : null;
                  return (
                    <li key={app.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl border border-violet-100 bg-violet-50">
                        <span className="text-xs font-bold leading-none text-violet-700">
                          {app.interviewDate ? new Date(app.interviewDate).toLocaleDateString(undefined, { month: 'short' }) : '—'}
                        </span>
                        <span className="text-base font-bold leading-tight text-violet-800">
                          {app.interviewDate ? new Date(app.interviewDate).getDate() : '—'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{app.jobTitle}</p>
                        <p className="truncate text-xs text-slate-500">{app.company.name}</p>
                      </div>
                      {daysUntil !== null ? (
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          daysUntil === 0
                            ? 'bg-rose-100 text-rose-700'
                            : daysUntil <= 3
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}>
                          {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `in ${daysUntil}d`}
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState message="No upcoming interviews. Set an interview date on any application." />
            )}
          </div>
        </div>
      )}
    </section>
  );
}

