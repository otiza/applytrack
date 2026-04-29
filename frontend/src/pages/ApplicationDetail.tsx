import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authRequest } from '../auth';

// ─── Types ────────────────────────────────────────────────────────────────────

type ApplicationStatus = 'WISHLIST' | 'APPLIED' | 'INTERVIEW' | 'TECHNICAL_TEST' | 'OFFER' | 'REJECTED';
type ApplicationPriority = 'LOW' | 'MEDIUM' | 'HIGH';

type Application = {
  id: string;
  jobTitle: string;
  companyId: string;
  location?: string | null;
  salaryRange?: string | null;
  contractType?: string | null;
  status: ApplicationStatus;
  priority: ApplicationPriority;
  applicationDate?: string | null;
  interviewDate?: string | null;
  notes?: string | null;
  recruiterName?: string | null;
  recruiterEmail?: string | null;
  jobPostUrl?: string | null;
  cvDocument?: { id: string; name: string; originalFileName: string } | null;
  createdAt: string;
  updatedAt: string;
  company: { id: string; name: string; website?: string | null; location?: string | null };
};

type Note = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  applicationId: string | null;
  userId: string;
};

// ─── Styling maps ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<ApplicationStatus, { badge: string; dot: string; label: string }> = {
  WISHLIST:       { badge: 'bg-slate-100 text-slate-700',   dot: 'bg-slate-400',   label: 'Wishlist'       },
  APPLIED:        { badge: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500',    label: 'Applied'        },
  INTERVIEW:      { badge: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500',  label: 'Interview'      },
  TECHNICAL_TEST: { badge: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-500',   label: 'Technical Test' },
  OFFER:          { badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', label: 'Offer'         },
  REJECTED:       { badge: 'bg-rose-100 text-rose-700',     dot: 'bg-rose-500',    label: 'Rejected'       }
};

const PRIORITY_STYLES: Record<ApplicationPriority, string> = {
  LOW:    'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH:   'bg-rose-100 text-rose-700'
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso?: string | null, fallback = '—') {
  if (!iso) return fallback;
  return new Date(iso).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="w-36 shrink-0 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</dt>
      <dd className="text-sm text-slate-700">{value}</dd>
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-100 ${className ?? ''}`} />;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [application, setApplication] = useState<Application | null>(null);
  const [appLoading, setAppLoading] = useState(true);
  const [appError, setAppError] = useState<string | null>(null);

  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [notesError, setNotesError] = useState<string | null>(null);

  const [noteContent, setNoteContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load application
  useEffect(() => {
    if (!id) return;
    setAppLoading(true);
    setAppError(null);
    authRequest<{ application: Application }>(`/api/applications/${id}`)
      .then((res) => setApplication(res.application))
      .catch((err) => setAppError(err instanceof Error ? err.message : 'Failed to load application.'))
      .finally(() => setAppLoading(false));
  }, [id]);

  // Load notes
  useEffect(() => {
    if (!id) return;
    setNotesLoading(true);
    setNotesError(null);
    authRequest<{ notes: Note[] }>(`/api/applications/${id}/notes`)
      .then((res) => setNotes(res.notes))
      .catch((err) => setNotesError(err instanceof Error ? err.message : 'Failed to load notes.'))
      .finally(() => setNotesLoading(false));
  }, [id]);

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    const content = noteContent.trim();
    if (!content || !id) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await authRequest<{ note: Note }>(`/api/applications/${id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ content })
      });
      setNotes((prev) => [res.note, ...prev]);
      setNoteContent('');
      textareaRef.current?.focus();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to add note.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteNote(noteId: string) {
    setDeletingId(noteId);
    try {
      await authRequest(`/api/notes/${noteId}`, { method: 'DELETE' });
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (err) {
      setNotesError(err instanceof Error ? err.message : 'Failed to delete note.');
    } finally {
      setDeletingId(null);
    }
  }

  // ── Loading state ──
  if (appLoading) {
    return (
      <section className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </section>
    );
  }

  // ── Error / not found ──
  if (appError || !application) {
    return (
      <section className="space-y-4">
        <Link to="/applications" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Back to applications
        </Link>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {appError ?? 'Application not found.'}
        </div>
      </section>
    );
  }

  const statusStyle = STATUS_STYLES[application.status];

  return (
    <section className="space-y-6">

      {/* ── Back nav ── */}
      <Link
        to="/applications"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-800"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Back to applications
      </Link>

      {/* ── Header card ── */}
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusStyle.badge}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
                {statusStyle.label}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${PRIORITY_STYLES[application.priority]}`}>
                {application.priority} priority
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-bold leading-tight text-ink sm:text-3xl">{application.jobTitle}</h1>
            <p className="mt-1 text-base text-slate-600">{application.company.name}</p>
          </div>
          <button
            onClick={() => navigate('/applications')}
            className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            Edit application
          </button>
        </div>
      </div>

      {/* ── Details grid ── */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Application details */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Application details</h2>
          <dl className="space-y-3">
            <DetailRow label="Company"         value={application.company.name} />
            <DetailRow label="Location"        value={application.location} />
            <DetailRow label="Contract"        value={application.contractType} />
            <DetailRow label="Salary range"    value={application.salaryRange} />
            <DetailRow label="CV"              value={application.cvDocument?.name ?? null} />
            <DetailRow label="Applied"         value={formatDate(application.applicationDate)} />
            <DetailRow label="Interview"       value={formatDate(application.interviewDate)} />
            <DetailRow label="Added"           value={formatDate(application.createdAt)} />
          </dl>
        </div>

        {/* Recruiter + links */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Recruiter & links</h2>
          <dl className="space-y-3">
            <DetailRow label="Recruiter"      value={application.recruiterName} />
            <DetailRow label="Email"          value={application.recruiterEmail} />
            <DetailRow label="Company site"   value={application.company.website} />
            <DetailRow label="Company city"   value={application.company.location} />
          </dl>
          {application.jobPostUrl ? (
            <a
              href={application.jobPostUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              View job post
            </a>
          ) : null}
          {application.notes ? (
            <div className="mt-4">
              <dt className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Application notes</dt>
              <dd className="whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">{application.notes}</dd>
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Notes section ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
          Notes
          {notes.length > 0 ? (
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">{notes.length}</span>
          ) : null}
        </h2>

        {/* Add note form */}
        <form onSubmit={handleAddNote} className="mb-6">
          <textarea
            ref={textareaRef}
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Add a note… (e.g. great culture fit, follow up by Friday)"
            rows={3}
            maxLength={2000}
            disabled={submitting}
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60"
          />
          {submitError ? (
            <p className="mt-1.5 text-xs text-rose-600">{submitError}</p>
          ) : null}
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400">{noteContent.length}/2000</span>
            <button
              type="submit"
              disabled={submitting || noteContent.trim().length === 0}
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Add note'}
            </button>
          </div>
        </form>

        {/* Notes error */}
        {notesError ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{notesError}</div>
        ) : null}

        {/* Notes loading */}
        {notesLoading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : notes.length === 0 ? (
          /* Empty state */
          <div className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
            <svg className="h-6 w-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.032 2.032 0 1 1 2.871 2.871L7.622 19.489l-4.243.707.707-4.243L16.862 4.487z" />
            </svg>
            <p className="text-sm text-slate-500">No notes yet. Add your first note above.</p>
          </div>
        ) : (
          /* Timeline */
          <ol className="relative border-l border-slate-200 pl-5">
            {notes.map((note) => (
              <li key={note.id} className="group mb-6 last:mb-0">
                {/* Timeline dot */}
                <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-brand-400" />

                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 transition group-hover:border-slate-200 group-hover:bg-white group-hover:shadow-sm">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <time className="text-xs text-slate-400" dateTime={note.createdAt}>
                      {formatRelative(note.createdAt)}
                      <span className="mx-1.5 opacity-40">·</span>
                      {new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </time>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      disabled={deletingId === note.id}
                      aria-label="Delete note"
                      className="shrink-0 rounded-lg p-1 text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {deletingId === note.id ? (
                        <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                      ) : (
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{note.content}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
