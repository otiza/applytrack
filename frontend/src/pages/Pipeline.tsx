import { useEffect, useMemo, useRef, useState } from 'react';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { authRequest } from '../auth';

type ApplicationStatus = 'WISHLIST' | 'APPLIED' | 'INTERVIEW' | 'TECHNICAL_TEST' | 'OFFER' | 'REJECTED';

type Application = {
  id: string;
  jobTitle: string;
  companyId: string;
  location?: string | null;
  salaryRange?: string | null;
  contractType?: string | null;
  status: ApplicationStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  applicationDate?: string | null;
  interviewDate?: string | null;
  notes?: string | null;
  recruiterName?: string | null;
  recruiterEmail?: string | null;
  jobPostUrl?: string | null;
  company: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
};

type ApplicationsResponse = { applications: Application[] };
type StatusPatchResponse = { message: string; application: Application };

type ToastState = {
  kind: 'success' | 'error';
  message: string;
} | null;

const STATUS_COLUMNS: Array<{
  status: ApplicationStatus;
  label: string;
  accent: string;
  header: string;
}> = [
  { status: 'WISHLIST', label: 'Wishlist', accent: 'from-slate-500 to-slate-700', header: 'bg-slate-50 text-slate-700 ring-slate-200' },
  { status: 'APPLIED', label: 'Applied', accent: 'from-blue-500 to-sky-600', header: 'bg-blue-50 text-blue-700 ring-blue-200' },
  { status: 'INTERVIEW', label: 'Interview', accent: 'from-violet-500 to-fuchsia-600', header: 'bg-violet-50 text-violet-700 ring-violet-200' },
  { status: 'TECHNICAL_TEST', label: 'Technical Test', accent: 'from-amber-500 to-orange-600', header: 'bg-amber-50 text-amber-700 ring-amber-200' },
  { status: 'OFFER', label: 'Offer', accent: 'from-emerald-500 to-green-600', header: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  { status: 'REJECTED', label: 'Rejected', accent: 'from-rose-500 to-red-600', header: 'bg-rose-50 text-rose-700 ring-rose-200' }
];

const STATUS_ORDER: ApplicationStatus[] = STATUS_COLUMNS.map((column) => column.status);

const PRIORITY_STYLES: Record<Application['priority'], string> = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH: 'bg-rose-100 text-rose-700'
};

type PipelineCardProps = {
  application: Application;
  disabled?: boolean;
};

function formatDate(value?: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function PipelineCard({ application, disabled }: PipelineCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
    data: { application },
    disabled
  });

  const style = {
    transform: CSS.Translate.toString(transform)
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
        isDragging ? 'opacity-40 ring-2 ring-brand-400' : 'hover:border-brand-200'
      } ${disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-semibold leading-6 text-ink">{application.jobTitle}</p>
          <p className="mt-1 text-sm text-slate-600">{application.company.name}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${PRIORITY_STYLES[application.priority]}`}>
          {application.priority}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
        {application.location ? <span className="rounded-full bg-slate-100 px-2.5 py-1">{application.location}</span> : null}
        {application.contractType ? <span className="rounded-full bg-slate-100 px-2.5 py-1">{application.contractType}</span> : null}
        {application.salaryRange ? <span className="rounded-full bg-slate-100 px-2.5 py-1">{application.salaryRange}</span> : null}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-500">
        <span>{formatDate(application.updatedAt) ? `Updated ${formatDate(application.updatedAt)}` : 'Recently updated'}</span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{application.priority.toLowerCase()}</span>
      </div>
    </article>
  );
}

type PipelineColumnProps = {
  status: ApplicationStatus;
  label: string;
  accent: string;
  header: string;
  applications: Application[];
  activeId: string | null;
  disabled: boolean;
};

function PipelineColumn({ status, label, accent, header, applications, activeId, disabled }: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      className={`flex h-full min-h-[640px] flex-col rounded-3xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm backdrop-blur transition-all duration-200 ${
        isOver ? 'ring-2 ring-brand-400 ring-offset-2 ring-offset-transparent' : ''
      }`}
    >
      <div className={`rounded-2xl bg-gradient-to-r ${accent} p-[1px] shadow-sm`}>
        <div className={`rounded-2xl ${header} px-4 py-3`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em]">{label}</h2>
              <p className="mt-1 text-xs opacity-80">{applications.length} application{applications.length === 1 ? '' : 's'}</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-sm font-semibold text-ink shadow-sm">
              {applications.length}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
        {applications.length === 0 ? (
          <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-8 text-center text-sm text-slate-500">
            Drop cards here
          </div>
        ) : (
          applications.map((application) => (
            <PipelineCard key={application.id} application={application} disabled={disabled && activeId !== application.id} />
          ))
        )}
      </div>
    </section>
  );
}

export default function Pipeline() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    async function loadApplications() {
      setLoading(true);
      setError(null);

      try {
        const response = await authRequest<ApplicationsResponse>('/api/applications');
        setApplications(response.applications);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Failed to load pipeline.');
      } finally {
        setLoading(false);
      }
    }

    void loadApplications();
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        window.clearTimeout(toastTimer.current);
      }
    };
  }, []);

  const activeApplication = useMemo(
    () => applications.find((application) => application.id === activeId) ?? null,
    [applications, activeId]
  );

  const groupedApplications = useMemo(
    () =>
      STATUS_ORDER.reduce<Record<ApplicationStatus, Application[]>>((grouped, status) => {
        grouped[status] = applications
          .filter((application) => application.status === status)
          .slice()
          .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
        return grouped;
      }, {
        WISHLIST: [],
        APPLIED: [],
        INTERVIEW: [],
        TECHNICAL_TEST: [],
        OFFER: [],
        REJECTED: []
      }),
    [applications]
  );

  function showToast(kind: 'success' | 'error', message: string) {
    setToast({ kind, message });
    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current);
    }
    toastTimer.current = window.setTimeout(() => setToast(null), 2400);
  }

  function handleDragStart(event: DragStartEvent) {
    if (pendingId) return;
    setActiveId(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    const draggedId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : null;

    setActiveId(null);

    if (!overId || pendingId) return;
    if (!STATUS_ORDER.includes(overId as ApplicationStatus)) return;

    const draggedApplication = applications.find((application) => application.id === draggedId);
    if (!draggedApplication) return;

    const nextStatus = overId as ApplicationStatus;
    if (draggedApplication.status === nextStatus) return;

    const previousApplications = applications;
    const optimisticUpdate = previousApplications.map((application) =>
      application.id === draggedId
        ? {
            ...application,
            status: nextStatus,
            updatedAt: new Date().toISOString()
          }
        : application
    );

    setApplications(optimisticUpdate);
    setPendingId(draggedId);

    try {
      const response = await authRequest<StatusPatchResponse>(`/api/applications/${draggedId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus })
      });

      setApplications((current) =>
        current.map((application) => (application.id === draggedId ? response.application : application))
      );
      showToast('success', 'Application status updated.');
    } catch (requestError) {
      setApplications(previousApplications);
      showToast('error', requestError instanceof Error ? requestError.message : 'Failed to update status.');
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="space-y-6">
      {toast ? (
        <div
          className={`fixed right-5 top-5 z-50 rounded-2xl px-4 py-3 text-sm font-medium shadow-lg backdrop-blur ${
            toast.kind === 'success' ? 'bg-ink text-white' : 'bg-rose-600 text-white'
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">Pipeline</p>
          <h1 className="mt-1 text-3xl font-bold text-ink">Kanban board</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Drag applications between stages to keep your job search moving. Changes are saved immediately.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 shadow-sm">
          {applications.length} total application{applications.length === 1 ? '' : 's'}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-6">
          {STATUS_COLUMNS.map((column) => (
            <div key={column.status} className="h-[640px] animate-pulse rounded-3xl border border-slate-200 bg-slate-100" />
          ))}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="overflow-x-auto pb-2">
            <div className="grid min-w-[1280px] gap-4 lg:grid-cols-6">
              {STATUS_COLUMNS.map((column) => (
                <PipelineColumn
                  key={column.status}
                  status={column.status}
                  label={column.label}
                  accent={column.accent}
                  header={column.header}
                  applications={groupedApplications[column.status]}
                  activeId={activeId}
                  disabled={Boolean(pendingId)}
                />
              ))}
            </div>
          </div>

          <DragOverlay>
            {activeApplication ? <PipelineCard application={activeApplication} disabled /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </section>
  );
}

