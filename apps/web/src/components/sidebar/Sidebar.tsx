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
import "./sidebar.css";

type SidebarItemProps = {
  children: React.ReactNode;
  icon: IconDefinition;
  active?: boolean;
};

const rolesStyles = {
  OWNER: "bg-purple-200 text-purple-700",
  ADMIN: "bg-indigo-200 text-indigo-700",
  MEMBER: "bg-gray-200 text-gray-700",
};

const SidebarItem = ({ children, icon, active = false }: SidebarItemProps) => {
  return (
    <button
      className={`
        flex w-full items-center rounded-md px-3 py-2 text-left text-sm
        transition-colors
        ${
          active
            ? "bg-gray-100 font-medium text-gray-950"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-950"
        }
      `}
    >
      <span
        className={
          active ? "text-indigo-500 font-bold text-lg" : "font-bold text-lg"
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
  const navigate = useNavigate();

  const signOut = () => {
    auth?.setUser(null);
    localStorage.removeItem("token");
    navigate("/");
  };
  return (
    <aside
      id="side-bar"
      className="w-full h-full flex shrink-0 flex-col border-r bg-white"
    >
      <div className="p-4 cursor-pointer" onClick={() => navigate("/")}>
        <img
          className="w-52"
          src="/Enterprise-Copilot-Logo.png"
          alt="Company logo"
        />
      </div>

      <div className="p-4">
        <button className="rainbow-btn cursor-pointer w-full rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-800">
          <FontAwesomeIcon icon={faPlus} /> New Chat
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        <SidebarItem active icon={faComments}>
          Conversations
        </SidebarItem>

        <SidebarItem icon={faBrain}>Knowledge</SidebarItem>
      </nav>

      <div className="mt-auto shrink-0 border-t border-zinc-400 p-3">
        {auth?.user ? (
          <details className="relative">
            <summary className="flex cursor-pointer list-none items-center gap-3 rounded-lg p-2 transition hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-gray-900 [&::-webkit-details-marker]:hidden">
              <img
                className="h-10 w-10 shrink-0 rounded-full object-cover"
                src="/Portrait.png"
                alt=""
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-lg font-medium text-gray-900 flex items-center">
                  <span className="p1">{auth.user.name}</span>
                  <span
                    style={{ fontSize: "0.6rem" }}
                    className={`${rolesStyles[auth.user.organization.role]} p-1 px-2 ml-2 rounded-xl`}
                  >
                    {auth.user.organization.role}
                  </span>
                </span>
                <span className="block truncate text-xs text-gray-500">
                  {auth.user.email}
                </span>
              </span>
              <span aria-hidden="true" className="text-gray-500">
                ⋯
              </span>
              <span className="sr-only">Open account options</span>
            </summary>
            <div className="absolute bottom-full inset-x-0 z-50 mb-2 rounded-lg border bg-white p-2 shadow-lg">
              <Link
                to="/"
                className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={signOut}
                className="w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              >
                Sign out
              </button>
            </div>
          </details>
        ) : (
          <Link
            to="/login"
            className="block w-full border-4
              bg-indigo-500
              hover:bg-gray-900 rounded-lg px-4 py-2.5 text-center text-sm font-medium text-white transition hover:text-white hover:border-gray-900"
          >
            Log in
          </Link>
        )}
      </div>
    </aside>
  );
};

export default AppSidebar;
