import { useContext, useState } from "react";
import { AuthContext } from "@/contexts/authContext.tsx";
import { useNavigate } from "react-router-dom";
import { useTRPC } from "@/lib/trpc.ts";
import { useMutation } from "@tanstack/react-query";

const AuthPage = () => {
  const trpc = useTRPC();

  const value = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const login = useMutation(
    trpc.auth.login.mutationOptions({
      onSuccess: (data) => {
        localStorage.setItem("token", data.token);
        value?.setUser(data.user);
        navigate("/");
      },
      onError: (error) => {
        console.error(error);
      },
    }),
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    login.mutate({
      email,
      password,
    });
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Sign in to CompanyGPT
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Enter your email and password to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-gray-700"
            >
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
            disabled={login.isPending}
            type="submit"
            className="
              w-full
              rounded-lg
              bg-gray-900
              px-4
              py-2.5
              text-sm
              font-medium
              text-white
              transition
              hover:bg-gray-800
              focus:outline-none
              focus:ring-2
              focus:ring-gray-900
              focus:ring-offset-2
              disabled:bg-red-900
            "
          >
            {!login.isPending ? "Sign in" : "Loading..."}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
