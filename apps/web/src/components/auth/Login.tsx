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
    <div className=" w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Sign In To Your Organization
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Enter your email and password to continue.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-gray-700">
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
            className=" w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-700"
            >
              Password
            </label>

            <button
              type="button"
              className="text-xs font-medium text-gray-500 hover:text-gray-900"
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
            className="
                w-full
                rounded-lg
                border
                border-gray-300
                bg-white
                px-3
                py-2.5
                text-sm
                text-gray-900
                outline-none
                transition
                placeholder:text-gray-400
                focus:border-gray-900
                focus:ring-2
                focus:ring-gray-900/10
              "
          />
        </div>

        <button
          disabled={isPending || isRedirecting}
          type="submit"
          className="
              w-full
              rounded-lg
              px-4
              py-2.5
              text-sm
              font-medium
              text-white
              transition
              bg-indigo-500
              hover:bg-gray-900
              focus:outline-none
              focus:ring-2
              focus:ring-gray-900
              focus:ring-offset-2
              disabled:bg-red-900
            "
          style={{ cursor: "pointer" }}
        >
          {isRedirecting ? "Redirecting" : isPending ? "Loading..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}

export default Login;
