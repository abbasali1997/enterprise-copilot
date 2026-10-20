import { Link } from "react-router-dom";

const features = [
  {
    number: "01",
    title: "Start a conversation",
    description:
      "Bring your questions and ideas into a focused chat workspace.",
  },
  {
    number: "02",
    title: "Keep your work together",
    description: "Return to your conversations and pick up where you left off.",
  },
  {
    number: "03",
    title: "Work in your workspace",
    description:
      "Sign in with your team account and choose the workspace you need.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-6">
        <Link to="/" aria-label="Enterprise Copilot home">
          <img
            src="/Enterprise-Copilot-Logo.png"
            alt="Enterprise Copilot"
            className="w-40 sm:w-48"
          />
        </Link>
        <Link
          to="/login"
          className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold transition hover:border-indigo-500 hover:text-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600"
        >
          Log in
        </Link>
      </header>
      <main>
        <section className="relative overflow-hidden border-y border-indigo-100 bg-gradient-to-br from-teal-50 via-indigo-50 to-purple-100">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 sm:py-28 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="mb-5 text-sm font-semibold tracking-widest text-indigo-700 uppercase">
                Enterprise Copilot
              </p>
              <h1 className="max-w-xl text-3xl leading-tight font-semibold tracking-tight sm:text-5xl">
                Your Company Knowledge,{" "}
                <span className="text-indigo-500 font-bold">
                  Supercharged by AI
                </span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-600">
                A dedicated place to help your team find answers, create
                content, and get work done - all with the knowledge, security
                and control your business needs.
              </p>
              <Link
                to="/login"
                className="mt-8 inline-flex rounded-full bg-indigo-600 px-7 py-3.5 font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600"
              >
                Sign in to your workspace{" "}
                <span aria-hidden="true" className="ml-3">
                  &rarr;
                </span>
              </Link>
            </div>
            <div className="rounded-3xl border border-white bg-white/80 p-6 shadow-xl shadow-indigo-200/40 sm:p-8">
              <div className="mb-8 flex items-center gap-3 border-b border-slate-100 pb-5">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-xl text-indigo-600"
                >
                  ?
                </span>
                <span className="font-semibold">
                  Room to think. Space to create.
                </span>
              </div>
              <p className="text-sm font-medium text-slate-500">
                Your next conversation could start with?
              </p>
              <ul className="mt-5 space-y-3">
                {[
                  "Help me explore a new idea",
                  "Turn these notes into a clear plan",
                  "Find a fresh way to explain this",
                ].map((prompt) => (
                  <li
                    key={prompt}
                    className="rounded-2xl border border-indigo-100 bg-white px-5 py-4 text-slate-700"
                  >
                    {prompt}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-slate-500">
                Log in to start a conversation of your own.
              </p>
            </div>
          </div>
        </section>
        <section
          aria-label="Your workspace"
          className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-3"
        >
          {features.map((feature) => (
            <article key={feature.number}>
              <p className="mb-4 text-sm font-semibold text-indigo-600">
                {feature.number}
              </p>
              <h2 className="text-xl font-semibold">{feature.title}</h2>
              <p className="mt-3 leading-relaxed text-slate-600">
                {feature.description}
              </p>
            </article>
          ))}
        </section>
      </main>
      <footer className="border-t border-slate-200 px-6 py-6 text-center text-sm text-slate-500">
        Enterprise Copilot ? A workspace for your next idea.
      </footer>
    </div>
  );
}
