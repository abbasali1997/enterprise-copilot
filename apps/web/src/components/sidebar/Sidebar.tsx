import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "@/contexts/authContext.tsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faComments,
  faBrain,
  type IconDefinition,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { ThemeContext, ThemeToggle } from "@/contexts/themeContext.tsx";
import "./sidebar.css";

type SidebarItemProps = {
  children: React.ReactNode;
  icon: IconDefinition;
  active?: boolean;
};

const rolesStyles = {
  OWNER:
    "bg-purple-200 dark:bg-violet-400/15 text-purple-700 dark:text-violet-200",
  ADMIN:
    "bg-gray-100 dark:bg-indigo-400/15 text-indigo-700 dark:text-indigo-200",
  MEMBER: "bg-gray-200 dark:bg-slate-400/15 text-gray-600 dark:text-slate-300",
};

const SidebarItem = ({ children, icon, active = false }: SidebarItemProps) => {
  return (
    <button
      className={`
        flex w-full items-center rounded-md px-3 py-2 text-left text-sm
        transition-colors focus-visible:outline-2 focus-visible:outline-indigo-500 dark:focus-visible:outline-cyan-300
        ${
          active
            ? "bg-gray-100 dark:bg-indigo-400/15 font-medium text-gray-950 dark:text-indigo-100"
            : "text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-950 dark:hover:text-slate-100"
        }
      `}
    >
      <span
        className={
          active
            ? "text-indigo-500 dark:text-cyan-300 font-bold text-lg"
            : "text-lg"
        }
        style={!active ? { cursor: "pointer" } : {}}
      >
        <FontAwesomeIcon icon={icon} className="mr-2" />
        {children}
      </span>
    </button>
  );
};

const AppSidebar = () => {
  const auth = useContext(AuthContext);
  const theme = useContext(ThemeContext)?.theme;
  const navigate = useNavigate();

  const signOut = () => {
    auth?.setUser(null);
    localStorage.removeItem("token");
    navigate("/");
  };
  return (
    <aside
      id="side-bar"
      className="w-full h-full flex shrink-0 flex-col border-r border-gray-200 dark:border-white/10 bg-white dark:bg-slate-950 text-gray-800 dark:text-slate-200"
    >
      <div className="p-4 cursor-pointer" onClick={() => navigate("/home")}>
        <img
          className="w-40 rounded-lg  p-2"
          src={theme === "dark" ? "/Logo-dark.png" : "/Logo-light.png"}
          alt="Company logo"
        />
      </div>

      <div className="p-4">
        <button className="rainbow-btn focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-500 dark:focus-visible:outline-cyan-300 cursor-pointer w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500">
          <FontAwesomeIcon icon={faPlus} /> New Chat
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        <SidebarItem active icon={faComments}>
          Conversations
        </SidebarItem>

        <SidebarItem icon={faBrain}>Knowledge</SidebarItem>
      </nav>

      <div className="px-4 py-3">
        <ThemeToggle />
      </div>

      <div className="mt-auto shrink-0 border-t border-gray-200 dark:border-white/10 p-3">
        {auth?.user ? (
          <details className="relative">
            <summary className="flex cursor-pointer list-none items-center gap-3 rounded-lg p-2 transition hover:bg-gray-100 dark:hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:focus-visible:outline-cyan-300 [&::-webkit-details-marker]:hidden">
              <img
                className="h-10 w-10 shrink-0 rounded-full object-cover"
                src="/Portrait.png"
                alt=""
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-lg font-medium text-gray-900 dark:text-slate-100 flex items-center">
                  <span className="p1">{auth.user.name}</span>
                  <span
                    style={{ fontSize: "0.6rem" }}
                    className={`${rolesStyles[auth.user.organization.role]} p-1 px-2 ml-2 rounded-xl`}
                  >
                    {auth.user.organization.role}
                  </span>
                </span>
                <span className="block truncate text-xs text-gray-500 dark:text-slate-400">
                  {auth.user.email}
                </span>
              </span>
              <span
                aria-hidden="true"
                className="text-gray-500 dark:text-slate-400"
              >
                ⋯
              </span>
              <span className="sr-only">Open account options</span>
            </summary>
            <div className="absolute bottom-full inset-x-0 z-50 mb-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 p-2 shadow-xl shadow-gray-300 dark:shadow-black/30">
              <Link
                to="/home"
                className="block rounded-md px-3 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/5"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={signOut}
                className="w-full rounded-md px-3 py-2 text-left text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/5"
              >
                Sign out
              </button>
            </div>
          </details>
        ) : (
          <Link
            to="/login"
            className="block w-full border border-indigo-400/30
              bg-indigo-600
              hover:bg-indigo-500 rounded-lg px-4 py-2.5 text-center text-sm font-medium text-white transition hover:text-white hover:border-indigo-400"
          >
            Log in
          </Link>
        )}
      </div>
    </aside>
  );
};

export default AppSidebar;
