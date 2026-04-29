import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { authRequest } from '../auth';
import { useAuth } from '../context/AuthContext';

type Company = {
  id: string;
  name: string;
};

type CvDocument = {
  id: string;
  name: string;
  originalFileName: string;
  size: number;
  createdAt: string;
};

type Application = {
  id: string;
  jobTitle: string;
  companyId: string;
  cvDocumentId?: string;
  location?: string;
  salaryRange?: string;
  contractType?: string;
  status: string;
  priority: string;
  applicationDate?: string;
  interviewDate?: string;
  notes?: string;
  recruiterName?: string;
  recruiterEmail?: string;
  jobPostUrl?: string;
  cvDocument?: {
    id: string;
    name: string;
    originalFileName: string;
  };
  company: Company;
  createdAt: string;
  updatedAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  WISHLIST: 'bg-slate-100 text-slate-700',
  APPLIED: 'bg-blue-100 text-blue-700',
  INTERVIEW: 'bg-purple-100 text-purple-700',
  TECHNICAL_TEST: 'bg-orange-100 text-orange-700',
  OFFER: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700'
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'text-slate-500',
  MEDIUM: 'text-yellow-600',
  HIGH: 'text-red-600'
};

export default function Applications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [cvs, setCvs] = useState<CvDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // ── Search & filter state ──────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterCompanyId, setFilterCompanyId] = useState('');

  const hasActiveFilters = Boolean(search || filterStatus || filterPriority || filterLocation || filterCompanyId);

  function resetFilters() {
    setSearch('');
    setFilterStatus('');
    setFilterPriority('');
    setFilterLocation('');
    setFilterCompanyId('');
  }

  const uniqueLocations = useMemo(
    () => [...new Set(applications.map((a) => a.location).filter(Boolean) as string[])].sort(),
    [applications]
  );

  const filteredApplications = useMemo(() => {
    const q = search.trim().toLowerCase();
    return applications.filter((app) => {
      if (q) {
        const inTitle = app.jobTitle.toLowerCase().includes(q);
        const inCompany = app.company.name.toLowerCase().includes(q);
        const inRecruiter = (app.recruiterName ?? '').toLowerCase().includes(q);
        if (!inTitle && !inCompany && !inRecruiter) return false;
      }
      if (filterStatus && app.status !== filterStatus) return false;
      if (filterPriority && app.priority !== filterPriority) return false;
      if (filterLocation && app.location !== filterLocation) return false;
      if (filterCompanyId && app.companyId !== filterCompanyId) return false;
      return true;
    });
  }, [applications, search, filterStatus, filterPriority, filterLocation, filterCompanyId]);

  const [formData, setFormData] = useState({
    jobTitle: '',
    companyId: '',
    cvDocumentId: '',
    location: '',
    salaryRange: '',
    contractType: '',
    status: 'WISHLIST',
    priority: 'MEDIUM',
    applicationDate: '',
    interviewDate: '',
    notes: '',
    recruiterName: '',
    recruiterEmail: '',
    jobPostUrl: ''
  });

  // Load applications and companies
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');
        const [appRes, compRes, cvRes] = await Promise.all([
          authRequest<{ applications: Application[] }>('/api/applications'),
          authRequest<{ companies: Company[] }>('/api/companies'),
          authRequest<{ cvs: CvDocument[] }>('/api/cvs')
        ]);
        setApplications(appRes.applications);
        setCompanies(compRes.companies);
        setCvs(cvRes.cvs);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load applications';
        setError(errorMsg);
        console.error(err);

        // Auto-clear error after 5 seconds
        setTimeout(() => {
          setError('');
        }, 5000);
      } finally {
        setLoading(false);
      }
    };
    if (user) loadData();
  }, [user]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingId) {
        // Update
        const res = await authRequest<{ application: Application; message: string }>(
          `/api/applications/${editingId}`,
          {
            method: 'PUT',
            body: JSON.stringify(formData)
          }
        );
        setApplications((prev) =>
          prev.map((app) => (app.id === editingId ? res.application : app))
        );
        setSuccess(res.message);
      } else {
        // Create
        const res = await authRequest<{ application: Application; message: string }>(
          '/api/applications',
          {
            method: 'POST',
            body: JSON.stringify(formData)
          }
        );
        setApplications((prev) => [res.application, ...prev]);
        setSuccess(res.message);
      }

      // Reset form
      setFormData({
        jobTitle: '',
        companyId: '',
        cvDocumentId: '',
        location: '',
        salaryRange: '',
        contractType: '',
        status: 'WISHLIST',
        priority: 'MEDIUM',
        applicationDate: '',
        interviewDate: '',
        notes: '',
        recruiterName: '',
        recruiterEmail: '',
        jobPostUrl: ''
      });
      setShowForm(false);
      setEditingId(null);

      // Auto-clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save application');
    }
  };

  const handleEdit = (app: Application) => {
    setFormData({
      jobTitle: app.jobTitle,
      companyId: app.companyId,
      cvDocumentId: app.cvDocumentId || '',
      location: app.location || '',
      salaryRange: app.salaryRange || '',
      contractType: app.contractType || '',
      status: app.status,
      priority: app.priority,
      applicationDate: app.applicationDate ? new Date(app.applicationDate).toISOString().split('T')[0] : '',
      interviewDate: app.interviewDate ? new Date(app.interviewDate).toISOString().split('T')[0] : '',
      notes: app.notes || '',
      recruiterName: app.recruiterName || '',
      recruiterEmail: app.recruiterEmail || '',
      jobPostUrl: app.jobPostUrl || ''
    });
    setEditingId(app.id);
    setShowForm(true);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id: string) => {
    try {
      await authRequest(`/api/applications/${id}`, { method: 'DELETE' });
      setApplications((prev) => prev.filter((app) => app.id !== id));
      setSuccess('Application deleted successfully');
      setDeleteConfirm(null);
      setError('');

      // Auto-clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete application');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setError('');
    setSuccess('');
    setFormData({
      jobTitle: '',
      companyId: '',
      cvDocumentId: '',
      location: '',
      salaryRange: '',
      contractType: '',
      status: 'WISHLIST',
      priority: 'MEDIUM',
      applicationDate: '',
      interviewDate: '',
      notes: '',
      recruiterName: '',
      recruiterEmail: '',
      jobPostUrl: ''
    });
  };

  if (loading) {
    return (
      <section>
        <div className="flex min-h-96 items-center justify-center">
          <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            Loading applications...
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Applications</h1>
          <p className="mt-1 text-sm text-slate-600">Manage your job applications</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            + Add Application
          </button>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-xl font-bold text-slate-900">
            {editingId ? 'Edit Application' : 'New Application'}
          </h2>

          {/* Grid */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Job Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Job Title *</label>
              <input
                type="text"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleFormChange}
                required
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                placeholder="e.g., Senior React Engineer"
              />
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Company *</label>
              <select
                name="companyId"
                value={formData.companyId}
                onChange={handleFormChange}
                required
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
              >
                <option value="">Select a company</option>
                {companies.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-slate-700">CV</label>
              <select
                name="cvDocumentId"
                value={formData.cvDocumentId}
                onChange={handleFormChange}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
              >
                <option value="">No CV attached</option>
                {cvs.map((cv) => (
                  <option key={cv.id} value={cv.id}>
                    {cv.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleFormChange}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                placeholder="e.g., Remote"
              />
            </div>

            {/* Salary Range */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Salary Range</label>
              <input
                type="text"
                name="salaryRange"
                value={formData.salaryRange}
                onChange={handleFormChange}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                placeholder="e.g., $150k - $180k"
              />
            </div>

            {/* Contract Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Contract Type</label>
              <input
                type="text"
                name="contractType"
                value={formData.contractType}
                onChange={handleFormChange}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                placeholder="e.g., Full-time"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleFormChange}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
              >
                <option value="WISHLIST">Wishlist</option>
                <option value="APPLIED">Applied</option>
                <option value="INTERVIEW">Interview</option>
                <option value="TECHNICAL_TEST">Technical Test</option>
                <option value="OFFER">Offer</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleFormChange}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            {/* Application Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Application Date</label>
              <input
                type="date"
                name="applicationDate"
                value={formData.applicationDate}
                onChange={handleFormChange}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
              />
            </div>

            {/* Interview Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Interview Date</label>
              <input
                type="date"
                name="interviewDate"
                value={formData.interviewDate}
                onChange={handleFormChange}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
              />
            </div>

            {/* Recruiter Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Recruiter Name</label>
              <input
                type="text"
                name="recruiterName"
                value={formData.recruiterName}
                onChange={handleFormChange}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                placeholder="e.g., John Doe"
              />
            </div>

            {/* Recruiter Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Recruiter Email</label>
              <input
                type="email"
                name="recruiterEmail"
                value={formData.recruiterEmail}
                onChange={handleFormChange}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                placeholder="e.g., john@example.com"
              />
            </div>

            {/* Job Post URL */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Job Post URL</label>
              <input
                type="url"
                name="jobPostUrl"
                value={formData.jobPostUrl}
                onChange={handleFormChange}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                placeholder="https://..."
              />
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                rows={4}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                placeholder="Additional notes..."
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              {editingId ? 'Update Application' : 'Create Application'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── Search & filter bar ── */}
      {applications.length > 0 && (
        <div className="mb-6 space-y-3">
          {/* Search input */}
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="search"
              placeholder="Search by job title, company, or recruiter…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`rounded-lg border px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-brand-200 ${
                filterStatus ? 'border-brand-400 bg-brand-50 font-medium text-brand-700' : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              <option value="">All statuses</option>
              <option value="WISHLIST">Wishlist</option>
              <option value="APPLIED">Applied</option>
              <option value="INTERVIEW">Interview</option>
              <option value="TECHNICAL_TEST">Technical Test</option>
              <option value="OFFER">Offer</option>
              <option value="REJECTED">Rejected</option>
            </select>

            {/* Priority */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className={`rounded-lg border px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-brand-200 ${
                filterPriority ? 'border-brand-400 bg-brand-50 font-medium text-brand-700' : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              <option value="">All priorities</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {/* Location */}
            {uniqueLocations.length > 0 && (
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className={`rounded-lg border px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-brand-200 ${
                  filterLocation ? 'border-brand-400 bg-brand-50 font-medium text-brand-700' : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <option value="">All locations</option>
                {uniqueLocations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            )}

            {/* Company */}
            {companies.length > 0 && (
              <select
                value={filterCompanyId}
                onChange={(e) => setFilterCompanyId(e.target.value)}
                className={`rounded-lg border px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-brand-200 ${
                  filterCompanyId ? 'border-brand-400 bg-brand-50 font-medium text-brand-700' : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <option value="">All companies</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}

            {/* Reset + result count */}
            <div className="ml-auto flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                  Reset filters
                </button>
              )}
              <span className="text-sm text-slate-500">
                {filteredApplications.length} of {applications.length} application{applications.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {applications.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center">
          <p className="text-sm text-slate-600">No applications yet. Create one to get started!</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
          <p className="text-sm font-medium text-slate-600">No applications match your search or filters.</p>
          <button onClick={resetFilters} className="mt-3 text-sm text-brand-600 hover:underline">Clear all filters</button>
        </div>
      ) : (
        /* Applications List */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredApplications.map((app) => (
            <article
              key={app.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              {/* Header */}
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{app.jobTitle}</h3>
                  <p className="text-sm text-slate-600">{app.company.name}</p>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/applications/${app.id}`}
                    className="text-xs font-medium text-slate-500 transition hover:text-slate-800"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleEdit(app)}
                    className="text-xs font-medium text-blue-600 transition hover:text-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(app.id)}
                    className="text-xs font-medium text-red-600 transition hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Status & Priority */}
              <div className="mb-3 flex gap-2">
                <span className={`inline-block rounded-md px-2 py-1 text-xs font-medium ${STATUS_COLORS[app.status]}`}>
                  {app.status.replace(/_/g, ' ')}
                </span>
                <span className={`inline-block text-xs font-medium ${PRIORITY_COLORS[app.priority]}`}>
                  {app.priority}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-1 text-xs text-slate-600">
                {app.location && <p>📍 {app.location}</p>}
                {app.salaryRange && <p>💰 {app.salaryRange}</p>}
                {app.contractType && <p>📋 {app.contractType}</p>}
                {app.applicationDate && (
                  <p>📅 Applied {new Date(app.applicationDate).toLocaleDateString()}</p>
                )}
                {app.cvDocument && <p>📎 CV {app.cvDocument.name}</p>}
                {app.recruiterName && <p>👤 {app.recruiterName}</p>}
              </div>

              {/* Delete Confirmation */}
              {deleteConfirm === app.id && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="mb-2 text-xs font-medium text-red-700">Delete this application?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(app.id)}
                      className="flex-1 rounded px-2 py-1 text-xs font-medium text-white transition hover:bg-red-700 bg-red-600"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="flex-1 rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-700 transition hover:bg-red-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

