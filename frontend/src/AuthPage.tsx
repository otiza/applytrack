import { FormEvent, useMemo, useState } from 'react';
import { authRequest, setToken } from './auth';

type AuthMode = 'login' | 'register';

type AuthUser = {
  id: string;
  name: string;
  email: string;
};

type AuthResponse = {
  message: string;
  token: string;
  user: AuthUser;
};

type AuthPageProps = {
  mode: AuthMode;
  onAuthed: () => void;
  onSwitch: (mode: AuthMode) => void;
};

export default function AuthPage({ mode, onAuthed, onSwitch }: AuthPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const config = useMemo(
    () =>
      mode === 'login'
        ? {
            title: 'Welcome back',
            subtitle: 'Sign in to continue your focused job search workflow.',
            endpoint: '/api/auth/login',
            cta: 'Log in',
            footer: 'New to ApplyTrack?',
            switchLabel: 'Create account'
          }
        : {
            title: 'Create your account',
            subtitle: 'Start tracking applications with a clean CRM-style flow.',
            endpoint: '/api/auth/register',
            cta: 'Create account',
            footer: 'Already have an account?',
            switchLabel: 'Log in'
          },
    [mode]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const payload =
        mode === 'register'
          ? { name: name.trim(), email: email.trim(), password }
          : { email: email.trim(), password };

      const result = await authRequest<AuthResponse>(config.endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setToken(result.token);
      onAuthed();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-hero-radial px-6 py-10 text-slate-900 lg:py-16">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-2">
        <section className="rounded-3xl border border-white/70 bg-white/85 p-8 shadow-glow backdrop-blur-xl sm:p-10">
          <div className="mb-8 space-y-3">
            <div className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700">
              ApplyTrack auth
            </div>
            <h1 className="text-4xl font-black tracking-tight text-ink">{config.title}</h1>
            <p className="text-sm leading-6 text-slate-600 sm:text-base">{config.subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' ? (
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Full name</span>
                <input
                  required
                  minLength={2}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-500 transition focus:border-brand-300 focus:ring"
                  placeholder="Alex Morgan"
                />
              </label>
            ) : null}

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-500 transition focus:border-brand-300 focus:ring"
                placeholder="alex@applytrack.dev"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <input
                required
                type="password"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-500 transition focus:border-brand-300 focus:ring"
                placeholder="At least 8 characters"
              />
            </label>

            {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-400"
            >
              {isLoading ? 'Please wait...' : config.cta}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-600">
            {config.footer}{' '}
            <button
              type="button"
              onClick={() => onSwitch(mode === 'login' ? 'register' : 'login')}
              className="font-semibold text-brand-700 transition hover:text-brand-800"
            >
              {config.switchLabel}
            </button>
          </p>
        </section>

        <aside className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-8 shadow-sm sm:p-10">
          <h2 className="text-2xl font-bold text-ink">Why ApplyTrack?</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            A focused workspace to manage applications, notes, and interview momentum without clutter.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-slate-700">
            <li className="rounded-xl border border-white bg-white/80 p-3">Track status across every role.</li>
            <li className="rounded-xl border border-white bg-white/80 p-3">Save follow-up notes in one place.</li>
            <li className="rounded-xl border border-white bg-white/80 p-3">Keep priorities visible and actionable.</li>
          </ul>
        </aside>
      </div>
    </main>
  );
}

