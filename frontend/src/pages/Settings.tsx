import { useEffect, useRef, useState } from 'react';
import { authRequest, buildApiUrl, getToken } from '../auth';
import { useAuth } from '../context/AuthContext';

// ─── Toast ────────────────────────────────────────────────────────────────────

type ToastKind = 'success' | 'error';

function useToast() {
  const [toast, setToast] = useState<{ kind: ToastKind; message: string } | null>(null);
  const timer = useRef<number | null>(null);

  function show(kind: ToastKind, message: string) {
    if (timer.current) window.clearTimeout(timer.current);
    setToast({ kind, message });
    timer.current = window.setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  return { toast, show };
}

// ─── Settings page ────────────────────────────────────────────────────────────

export default function Settings() {
  const { user, setUser } = useAuth();
  const { toast, show } = useToast();

  type CvDocument = {
    id: string;
    name: string;
    originalFileName: string;
    mimeType: string;
    size: number;
    createdAt: string;
  };

  // ── Profile form state ──
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // ── Password form state ──
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // ── CV library state ──
  const [cvs, setCvs] = useState<CvDocument[]>([]);
  const [cvsLoading, setCvsLoading] = useState(true);
  const [cvsError, setCvsError] = useState<string | null>(null);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [newCvName, setNewCvName] = useState('');
  const [newCvFile, setNewCvFile] = useState<File | null>(null);
  const [deletingCvId, setDeletingCvId] = useState<string | null>(null);

  // Seed profile form from auth context once loaded
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    async function loadCvs() {
      try {
        setCvsLoading(true);
        setCvsError(null);
        const res = await authRequest<{ cvs: CvDocument[] }>('/api/cvs');
        setCvs(res.cvs);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load CV library.';
        setCvsError(msg);
      } finally {
        setCvsLoading(false);
      }
    }

    if (user) {
      void loadCvs();
    }
  }, [user]);

  function formatBytes(size: number) {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }

  function validateCvFile(file: File) {
    const allowedMimeTypes = new Set([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]);
    const extension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = new Set(['pdf', 'doc', 'docx']);

    if (!allowedMimeTypes.has(file.type) || !extension || !allowedExtensions.has(extension)) {
      return 'Only PDF, DOC, and DOCX files are allowed.';
    }

    if (file.size > 5 * 1024 * 1024) {
      return 'Maximum file size is 5MB.';
    }

    return null;
  }

  async function handleCvUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!newCvFile) {
      show('error', 'Please choose a CV file to upload.');
      return;
    }

    const validationError = validateCvFile(newCvFile);
    if (validationError) {
      show('error', validationError);
      return;
    }

    setUploadingCv(true);
    setCvsError(null);
    try {
      const formData = new FormData();
      if (newCvName.trim()) {
        formData.append('name', newCvName.trim());
      }
      formData.append('file', newCvFile);

      const res = await authRequest<{ message: string; cv: CvDocument }>('/api/cvs', {
        method: 'POST',
        body: formData
      });

      setCvs((prev) => [res.cv, ...prev]);
      setNewCvName('');
      setNewCvFile(null);
      const fileInput = document.getElementById('settings-cv-file') as HTMLInputElement | null;
      if (fileInput) fileInput.value = '';
      show('success', res.message);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to upload CV.';
      setCvsError(msg);
      show('error', msg);
    } finally {
      setUploadingCv(false);
    }
  }

  async function handleCvDelete(cvId: string) {
    setDeletingCvId(cvId);
    setCvsError(null);
    try {
      const res = await authRequest<{ message: string }>(`/api/cvs/${cvId}`, { method: 'DELETE' });
      setCvs((prev) => prev.filter((cv) => cv.id !== cvId));
      show('success', res.message);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete CV.';
      setCvsError(msg);
      show('error', msg);
    } finally {
      setDeletingCvId(null);
    }
  }

  async function handleCvDownload(cv: CvDocument) {
    try {
      const token = getToken();
      if (!token) {
        show('error', 'You are not authenticated.');
        return;
      }

      const response = await fetch(buildApiUrl(`/api/cvs/${cv.id}/download`), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        let errorMessage = 'Failed to download CV.';
        try {
          const payload = await response.json();
          if (payload?.error) errorMessage = payload.error;
        } catch {
          // Keep fallback message when response body is not JSON.
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = cv.originalFileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      show('success', `Downloaded ${cv.originalFileName}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to download CV.';
      show('error', msg);
    }
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileSaving(true);
    try {
      const res = await authRequest<{ message: string; user: { id: string; name: string; email: string; createdAt?: string } }>(
        '/api/auth/profile',
        { method: 'PUT', body: JSON.stringify({ name: name.trim(), email: email.trim() }) }
      );
      // Update global auth state so Header shows new name immediately
      setUser(res.user);
      show('success', res.message);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile.';
      setProfileError(msg);
      show('error', msg);
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await authRequest<{ message: string }>(
        '/api/auth/password',
        { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword, confirmPassword }) }
      );
      show('success', res.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update password.';
      setPasswordError(msg);
      show('error', msg);
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <section className="space-y-6">

      {/* Toast */}
      {toast ? (
        <div
          className={`fixed right-5 top-5 z-50 rounded-2xl px-4 py-3 text-sm font-medium shadow-lg backdrop-blur ${
            toast.kind === 'success' ? 'bg-ink text-white' : 'bg-rose-600 text-white'
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">Account</p>
        <h1 className="mt-1 text-3xl font-bold text-ink">Settings</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Manage your profile and account security.</p>
      </div>

      {/* ── Profile form ── */}
      <form onSubmit={handleProfileSave} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-base font-semibold text-ink">Profile</h2>
        <p className="mb-5 text-sm text-slate-500">Update your display name and email address.</p>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="settings-name">
              Full name
            </label>
            <input
              id="settings-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={60}
              disabled={profileSaving}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="settings-email">
              Email address
            </label>
            <input
              id="settings-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={profileSaving}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60"
            />
          </div>
        </div>

        {profileError ? (
          <p className="mt-3 text-sm text-rose-600">{profileError}</p>
        ) : null}

        <div className="mt-5">
          <button
            type="submit"
            disabled={profileSaving}
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {profileSaving ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </form>

      {/* ── Password form ── */}
      <form onSubmit={handlePasswordSave} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-base font-semibold text-ink">Change password</h2>
        <p className="mb-5 text-sm text-slate-500">Choose a strong password of at least 8 characters.</p>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700" htmlFor="settings-current-pw">
              Current password
            </label>
            <input
              id="settings-current-pw"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={passwordSaving}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60 sm:max-w-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="settings-new-pw">
              New password
            </label>
            <input
              id="settings-new-pw"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              disabled={passwordSaving}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="settings-confirm-pw">
              Confirm new password
            </label>
            <input
              id="settings-confirm-pw"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              disabled={passwordSaving}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60"
            />
          </div>
        </div>

        {passwordError ? (
          <p className="mt-3 text-sm text-rose-600">{passwordError}</p>
        ) : null}

        <div className="mt-5">
          <button
            type="submit"
            disabled={passwordSaving}
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {passwordSaving ? 'Saving…' : 'Change password'}
          </button>
        </div>
      </form>

      {/* ── CV library ── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-base font-semibold text-ink">CV Library</h2>
        <p className="mb-5 text-sm text-slate-500">Upload multiple CV versions and attach them to applications.</p>

        <form onSubmit={handleCvUpload} className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-slate-700" htmlFor="settings-cv-name">
              CV name
            </label>
            <input
              id="settings-cv-name"
              type="text"
              value={newCvName}
              onChange={(e) => setNewCvName(e.target.value)}
              maxLength={120}
              placeholder="e.g., Product-focused CV"
              disabled={uploadingCv}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-slate-700" htmlFor="settings-cv-file">
              File (PDF, DOC, DOCX)
            </label>
            <input
              id="settings-cv-file"
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              required
              disabled={uploadingCv}
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setNewCvFile(file);
              }}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-brand-700 disabled:opacity-60"
            />
          </div>
          <div className="sm:col-span-1 sm:flex sm:items-end">
            <button
              type="submit"
              disabled={uploadingCv}
              className="w-full rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploadingCv ? 'Uploading…' : 'Upload CV'}
            </button>
          </div>
        </form>

        {cvsError ? <p className="mt-3 text-sm text-rose-600">{cvsError}</p> : null}

        <div className="mt-5">
          {cvsLoading ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">Loading CV library...</div>
          ) : cvs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
              <p className="text-sm font-medium text-slate-600">No CVs uploaded yet.</p>
              <p className="mt-1 text-xs text-slate-500">Upload your first CV to attach it to applications.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cvs.map((cv) => (
                <article key={cv.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{cv.name}</p>
                    <p className="text-xs text-slate-500">{cv.originalFileName}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Uploaded {new Date(cv.createdAt).toLocaleDateString()} • {formatBytes(cv.size)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleCvDownload(cv)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Download
                    </button>
                    <button
                      type="button"
                      disabled={deletingCvId === cv.id}
                      onClick={() => handleCvDelete(cv.id)}
                      className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingCvId === cv.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </section>
  );
}


