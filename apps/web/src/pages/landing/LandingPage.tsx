import { useContext } from "react";
import { ThemeContext, ThemeToggle } from "@/contexts/themeContext.tsx";
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
  const theme = useContext(ThemeContext)?.theme;
  return (
    <div
      id="bg-area"
      className="min-h-screen text-slate-900 dark:text-slate-100"
    >
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-6">
        <Link to="/" aria-label="Enterprise Copilot home">
          <img
            src={theme === "dark" ? "/Logo-dark.png" : "/Logo-light.png"}
            alt="Enterprise Copilot"
            className="w-40 sm:w-48"
          />
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <ThemeToggle />
          <Link
            to="/login"
            className="rounded-full border border-slate-300 bg-white dark:border-white/15 dark:bg-slate-900/80 px-5 py-2.5 text-sm font-semibold transition hover:border-indigo-500 hover:text-indigo-700 dark:hover:text-cyan-200 dark:text-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600 dark:focus-visible:outline-cyan-300"
          >
            Log in
          </Link>
        </div>
      </header>
      <main>
        <section className="relative overflow-hidden border-y border-indigo-100/50 dark:border-white/10">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 sm:py-28 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="mb-5 text-sm font-semibold tracking-widest text-indigo-700 dark:text-cyan-300 uppercase">
                Enterprise Copilot
              </p>
              <h1 className="max-w-xl text-3xl leading-tight font-semibold tracking-tight sm:text-5xl">
                Your Company Knowledge,{" "}
                <span className="text-indigo-500 dark:text-cyan-300 font-bold">
                  Supercharged by AI
                </span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                A dedicated place to help your team find answers, create
                content, and get work done - all with the knowledge, security
                and control your business needs.
              </p>
              <Link
                to="/login"
                className="mt-8 inline-flex rounded-full bg-indigo-600 px-7 py-3.5 font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600 dark:focus-visible:outline-cyan-300"
              >
                Sign in to your workspace{" "}
                <span aria-hidden="true" className="ml-3">
                  &rarr;
                </span>
              </Link>
            </div>
            <div className="rounded-3xl border border-white bg-white/80 dark:border-white/15 dark:bg-slate-900/80 p-6 shadow-xl shadow-indigo-200/40 dark:shadow-black/25 sm:p-8">
              <div className="mb-8 flex items-center gap-3 border-b border-slate-100 dark:border-white/10 pb-5">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-400/20 text-xl text-indigo-600 dark:text-cyan-300"
                >
                  ?
                </span>
                <span className="font-semibold">
                  Room to think. Space to create.
                </span>
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
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
                    className="rounded-2xl border border-indigo-100 bg-white dark:border-white/10 dark:bg-slate-900 px-5 py-4 text-slate-700 dark:text-slate-200"
                  >
                    {prompt}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
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
              <p className="mb-4 text-sm font-semibold text-indigo-600 dark:text-cyan-300">
                {feature.number}
              </p>
              <h2 className="text-xl font-semibold">{feature.title}</h2>
              <p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-300">
                {feature.description}
              </p>
            </article>
          ))}
        </section>
      </main>
      <footer className="border-t border-slate-200 dark:border-white/10 px-6 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Enterprise Copilot ? A workspace for your next idea.
      </footer>
    </div>
  );
}
