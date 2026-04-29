import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { authRequest } from '../auth';

type InterviewItem = {
  id: string;
  jobTitle: string;
  interviewDate: string;
  status: 'WISHLIST' | 'APPLIED' | 'INTERVIEW' | 'TECHNICAL_TEST' | 'OFFER' | 'REJECTED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  company: {
    name: string;
  };
};

const PRIORITY_BADGE: Record<InterviewItem['priority'], string> = {
  LOW: 'bg-slate-100 text-slate-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH: 'bg-rose-100 text-rose-700'
};

function groupByDate(interviews: InterviewItem[]) {
  return interviews.reduce<Record<string, InterviewItem[]>>((acc, interview) => {
    const dateKey = new Date(interview.interviewDate).toISOString().slice(0, 10);
    acc[dateKey] = acc[dateKey] ? [...acc[dateKey], interview] : [interview];
    return acc;
  }, {});
}

export default function Calendar() {
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInterviews() {
      try {
        setLoading(true);
        setError(null);
        const res = await authRequest<{ interviews: InterviewItem[] }>('/api/calendar/interviews');
        setInterviews(res.interviews);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load interview calendar.';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    void loadInterviews();
  }, []);

  const interviewsByDate = useMemo(() => groupByDate(interviews), [interviews]);
  const orderedDates = useMemo(() => Object.keys(interviewsByDate).sort(), [interviewsByDate]);
  const upcoming = useMemo(() => {
    const now = new Date();
    return interviews
      .filter((item) => new Date(item.interviewDate).getTime() >= now.getTime())
      .slice()
      .sort((a, b) => new Date(a.interviewDate).getTime() - new Date(b.interviewDate).getTime())
      .slice(0, 5);
  }, [interviews]);

  if (loading) {
    return (
      <section>
        <div className="flex min-h-96 items-center justify-center">
          <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">Loading interview calendar...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">Calendar</p>
        <h1 className="mt-1 text-3xl font-bold text-ink">Interview Calendar</h1>
        <p className="mt-2 text-sm text-slate-600">Track your scheduled interviews and jump directly to each application.</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      {interviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white p-12 text-center">
          <p className="text-base font-semibold text-slate-700">No interviews scheduled yet.</p>
          <p className="mt-1 text-sm text-slate-500">Set an interview date on an application and it will appear here.</p>
          <Link
            to="/applications"
            className="mt-4 inline-flex rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Go to Applications
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            {orderedDates.map((dateKey) => (
              <section key={dateKey} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </h2>

                <div className="mt-4 grid gap-3">
                  {interviewsByDate[dateKey].map((item) => (
                    <Link
                      key={item.id}
                      to={`/applications/${item.id}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-brand-300 hover:bg-white hover:shadow"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{item.jobTitle}</p>
                          <p className="text-xs text-slate-600">{item.company.name}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {new Date(item.interviewDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${PRIORITY_BADGE[item.priority]}`}>
                          {item.priority}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Upcoming</h2>
            <div className="mt-4 space-y-3">
              {upcoming.length === 0 ? (
                <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">No upcoming interviews.</p>
              ) : (
                upcoming.map((item) => (
                  <Link key={item.id} to={`/applications/${item.id}`} className="block rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 transition hover:border-brand-300 hover:bg-white">
                    <p className="text-sm font-medium text-slate-900">{item.jobTitle}</p>
                    <p className="text-xs text-slate-600">{item.company.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{new Date(item.interviewDate).toLocaleString()}</p>
                  </Link>
                ))
              )}
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
