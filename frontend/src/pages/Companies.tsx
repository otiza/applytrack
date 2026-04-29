import { useEffect, useMemo, useState } from 'react';
import { authRequest } from '../auth';

type Company = {
  id: string;
  name: string;
  website?: string | null;
  location?: string | null;
  industry?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

type CompaniesResponse = { companies: Company[] };
type CompanyResponse = { company: Company };

type FormState = {
  name: string;
  website: string;
  location: string;
  industry: string;
  notes: string;
};

const emptyForm: FormState = {
  name: '',
  website: '',
  location: '',
  industry: '',
  notes: ''
};

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const editingCompany = useMemo(() => companies.find((company) => company.id === editingId) ?? null, [companies, editingId]);

  async function loadCompanies() {
    setLoading(true);
    setError(null);
    try {
      const res = await authRequest<CompaniesResponse>('/api/companies');
      setCompanies(res.companies);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load companies.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCompanies();
  }, []);

  useEffect(() => {
    if (!editingCompany) {
      setForm(emptyForm);
      return;
    }

    setForm({
      name: editingCompany.name,
      website: editingCompany.website ?? '',
      location: editingCompany.location ?? '',
      industry: editingCompany.industry ?? '',
      notes: editingCompany.notes ?? ''
    });
  }, [editingCompany]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name.trim(),
      website: form.website.trim() || undefined,
      location: form.location.trim() || undefined,
      industry: form.industry.trim() || undefined,
      notes: form.notes.trim() || undefined
    };

    try {
      if (editingId) {
        const res = await authRequest<CompanyResponse>(`/api/companies/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setCompanies((current) => current.map((company) => (company.id === editingId ? res.company : company)));
        showToast('Company updated.');
      } else {
        const res = await authRequest<CompanyResponse>('/api/companies', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setCompanies((current) => [res.company, ...current]);
        showToast('Company created.');
      }
      setEditingId(null);
      setForm(emptyForm);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to save company.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleteLoading(true);
    setError(null);
    try {
      await authRequest(`/api/companies/${deleteId}`, { method: 'DELETE' });
      setCompanies((current) => current.filter((company) => company.id !== deleteId));
      showToast('Company deleted.');
      if (editingId === deleteId) {
        setEditingId(null);
        setForm(emptyForm);
      }
      setDeleteId(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to delete company.');
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      {toast ? (
        <div className="fixed right-5 top-5 z-50 rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">Companies</h1>
          <p className="mt-1 text-sm text-slate-600">Manage your CRM company list.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setForm(emptyForm);
          }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-brand-200 hover:text-brand-700"
        >
          New company
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ink">{companies.length} companies</h2>
              <p className="text-sm text-slate-500">Sorted by most recently updated</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : companies.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <h3 className="text-lg font-semibold text-ink">No companies yet</h3>
              <p className="mt-2 text-sm text-slate-600">Add your first company to start tracking outreach and interviews.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {companies.map((company) => (
                <article key={company.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 shadow-sm transition hover:shadow-md">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-ink">{company.name}</h3>
                      <div className="mt-1 flex flex-wrap gap-2 text-sm text-slate-600">
                        {company.industry ? <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">{company.industry}</span> : null}
                        {company.location ? <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">{company.location}</span> : null}
                        {company.website ? (
                          <a
                            href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full bg-white px-2.5 py-1 text-brand-700 ring-1 ring-slate-200 hover:text-brand-800"
                          >
                            Website
                          </a>
                        ) : null}
                      </div>
                      {company.notes ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{company.notes}</p> : null}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(company.id)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-brand-200 hover:text-brand-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteId(company.id)}
                        className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-sm font-medium text-rose-700 shadow-sm transition hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-ink">{editingId ? 'Edit company' : 'Create company'}</h2>
            <p className="text-sm text-slate-500">Professional CRM-style company form.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Name</label>
              <input
                required
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-500 transition focus:border-brand-300 focus:ring"
                placeholder="Acme Analytics"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Website</label>
              <input
                value={form.website}
                onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-500 transition focus:border-brand-300 focus:ring"
                placeholder="https://example.com"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Location</label>
                <input
                  value={form.location}
                  onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-500 transition focus:border-brand-300 focus:ring"
                  placeholder="Remote"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Industry</label>
                <input
                  value={form.industry}
                  onChange={(event) => setForm((current) => ({ ...current, industry: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-500 transition focus:border-brand-300 focus:ring"
                  placeholder="Software"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Notes</label>
              <textarea
                rows={5}
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-500 transition focus:border-brand-300 focus:ring"
                placeholder="Hiring manager info, interview context, internal notes..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-400"
              >
                {saving ? 'Saving...' : editingId ? 'Update company' : 'Create company'}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm(emptyForm);
                  }}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700"
                >
                  Cancel edit
                </button>
              ) : null}
            </div>
          </form>
        </div>
      </div>

      {deleteId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-ink">Delete company?</h3>
            <p className="mt-2 text-sm text-slate-600">This action cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => void handleDelete()}
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
