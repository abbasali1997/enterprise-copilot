import { useContext, useState, type FormEvent } from "react";
import { AuthContext } from "@/contexts/authContext.tsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faEllipsisVertical,
  faSearch,
  faUserGear,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { can, PERMISSIONS } from "@enterprise/auth/permissions";

type ChatNavbarProps = {
  onSearch?: (query: string) => void;
  onChangeWorkspace?: () => void;
};

function ChatNavbar({ onSearch, onChangeWorkspace }: ChatNavbarProps) {
  const auth = useContext(AuthContext);
  const workspace = auth?.user?.organization;
  const [search, setSearch] = useState("");
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  const logoUrl = workspace?.logoUrl;
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const canView = auth?.user?.organization
    ? can(auth?.user?.organization.role, PERMISSIONS.ORGANIZATION_VIEW)
    : false;

  const onManage = (organizationId: string) => {
    navigate(`/workspace/${organizationId}`);
    return;
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch?.(search.trim());
  };

  return (
    <header className="flex shrink-0 items-center justify-between gap-4 px-4 py-3 sm:px-6">
      <form
        role="search"
        onSubmit={handleSearch}
        className="relative w-full max-w-2/4 shadow-lg"
      >
        <label htmlFor="chat-search" className="sr-only">
          Search chats
        </label>

        <FontAwesomeIcon
          icon={faSearch}
          className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
        />

        <input
          id="chat-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search In Chat"
          className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-md text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
        />
      </form>

      <div className="flex min-w-0 max-w-[45%] shrink-0 items-center gap-5 bg-white px-10 py-1 rounded-4xl shadow-lg">
        {logoUrl && logoUrl !== failedLogo ? (
          <img
            src={logoUrl}
            alt={`${workspace.name} logo`}
            onError={() => setFailedLogo(logoUrl)}
            className="h-10 w-10 shrink-0 rounded-xl bg-white object-contain p-1"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-sm font-semibold text-indigo-700"
          >
            {workspace?.name.slice(0, 2).toUpperCase() || "WS"}
          </span>
        )}
        <div className="min-w-0 text-right">
          <p className="text-xs text-gray-500">Workspace</p>
          <p
            className="truncate text-sm font-semibold text-gray-900"
            title={workspace?.name}
          >
            {workspace?.name ?? "No workspace selected"}
          </p>
        </div>
        {workspace && (
          <div
            className="relative"
            onKeyDown={(event) => {
              if (event.key === "Escape") setMenuOpen(false);
            }}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget))
                setMenuOpen(false);
            }}
          >
            <button
              type="button"
              aria-label="Workspace options"
              aria-expanded={menuOpen}
              aria-controls="workspace-options"
              onClick={() => setMenuOpen((open) => !open)}
              className="relative z-50 flex h-8 w-8 items-center justify-center rounded-full text-xl font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-indigo-500"
            >
              <FontAwesomeIcon icon={faEllipsisVertical} />
            </button>
            {menuOpen && (
              <>
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label="Close workspace options"
                  onClick={() => setMenuOpen(false)}
                  className="fixed inset-0 z-40 cursor-default"
                />
                <ul
                  id="workspace-options"
                  aria-label="Workspace options"
                  className="absolute right-0 top-full z-50 mt-3 w-30 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg"
                >
                  {canView ? (
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onManage(workspace.id);
                        }}
                        className="flex justify-around w-full rounded-lg px-3 py-2 text-sm text-right text-gray-700 transition hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-2 focus-visible:outline-indigo-500"
                      >
                        <FontAwesomeIcon
                          icon={faUserGear}
                          className="w-5 h-5 mr-4"
                        />
                        <span>Manage</span>
                      </button>
                    </li>
                  ) : null}

                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        if (onChangeWorkspace) onChangeWorkspace();
                        else navigate("/workspaces/change");
                      }}
                      className="flex justify-around w-full rounded-lg px-3 py-2 text-right text-sm text-gray-700 transition hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-2 focus-visible:outline-indigo-500"
                    >
                      <FontAwesomeIcon
                        icon={faArrowsRotate}
                        className="w-5 h-5 mr-4"
                      />
                      <span>Change</span>
                    </button>
                  </li>
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default ChatNavbar;
