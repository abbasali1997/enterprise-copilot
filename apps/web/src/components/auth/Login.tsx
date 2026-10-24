import React from "react";

type LoginProps = {
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  isPending: boolean;
  isRedirecting: boolean;
};

function Login({
  handleSubmit,
  email,
  setEmail,
  password,
  setPassword,
  isPending,
  isRedirecting,
}: LoginProps) {
  return (
    <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-gray-900 shadow-xl shadow-gray-200/50 dark:border-white/15 dark:bg-slate-900/90 dark:text-slate-100 dark:shadow-black/25">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight ">
          Sign In To Your Organization
        </h1>

        <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
          Enter your email and password to continue.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-slate-200">
            Email
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-white/15 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-400/60 dark:focus:ring-cyan-400/15"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-700 dark:text-slate-200"
            >
              Password
            </label>

            <button
              type="button"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-cyan-300 dark:hover:text-cyan-200 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:focus-visible:outline-cyan-300"
            >
              Forgot password?
            </button>
          </div>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-white/15 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-400/60 dark:focus:ring-cyan-400/15"
          />
        </div>

        <button
          disabled={isPending || isRedirecting}
          type="submit"
          className="rainbow-btn mt-3 w-full rounded-lg px-4 py-2.5 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:focus-visible:outline-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ cursor: "pointer" }}
        >
          {isRedirecting ? "Redirecting" : isPending ? "Loading..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}

export default Login;
