const steps = [
  {
    title: 'Track every application',
    description: 'Keep roles, companies, contacts, and follow-ups organized in one clean workspace.'
  },
  {
    title: 'Stay on top of interviews',
    description: 'See what needs attention next with a CRM-style pipeline for your job search.'
  },
  {
    title: 'Move faster with clarity',
    description: 'Turn scattered notes into a focused workflow that helps you land the right role.'
  }
];

export default function App() {
  return (
    <main className="min-h-screen bg-hero-radial text-slate-900">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-16 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/70 px-4 py-2 text-sm font-medium text-brand-700 shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-brand-500" />
              Job application CRM for focused job seekers
            </div>

            <div className="space-y-5">
              <h1 className="max-w-xl text-5xl font-black tracking-tight text-ink sm:text-6xl">
                Keep your job search{' '}
                <span className="bg-gradient-to-r from-brand-600 via-sky-600 to-indigo-600 bg-clip-text text-transparent">
                  organized and moving
                </span>
                .
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                ApplyTrack helps you manage applications, follow-ups, interview stages, and company notes
                with a calm, modern workspace built for momentum.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="#features"
                className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-brand-700"
              >
                Explore features
              </a>
              <a
                href="#dashboard"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
              >
                Preview the workflow
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-tr from-brand-600/15 via-sky-500/10 to-transparent blur-3xl" />
            <div className="rounded-[2rem] border border-white/60 bg-white/80 p-5 shadow-glow backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Today&apos;s focus</p>
                  <h2 className="text-2xl font-semibold text-ink">Application pipeline</h2>
                </div>
                <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  12 active roles
                </div>
              </div>

              <div id="dashboard" className="mt-5 space-y-4">
                {[
                  ['Applied', '7 roles', 'bg-slate-50'],
                  ['Interviewing', '3 roles', 'bg-indigo-50'],
                  ['Offer', '1 role', 'bg-emerald-50']
                ].map(([label, value, tone]) => (
                  <div key={label} className={`rounded-2xl border border-slate-200 p-4 ${tone}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500">{label}</p>
                        <p className="mt-1 text-lg font-semibold text-ink">{value}</p>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-white shadow-sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <section id="features" className="mt-16 grid gap-5 md:grid-cols-3">
          {steps.map((step) => (
            <article key={step.title} className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
              <h3 className="text-lg font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
