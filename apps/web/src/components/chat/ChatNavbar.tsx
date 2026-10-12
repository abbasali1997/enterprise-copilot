import { useContext, useState, type FormEvent } from "react";
import { AuthContext } from "@/contexts/authContext.tsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";

type ChatNavbarProps = {
  onSearch?: (query: string) => void;
};

function ChatNavbar({ onSearch }: ChatNavbarProps) {
  const auth = useContext(AuthContext);
  const workspace = auth?.user?.organization;
  const [search, setSearch] = useState("");
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  const logoUrl = workspace?.logoUrl;

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch?.(search.trim());
  };

  return (
    <header className="flex shrink-0 items-center justify-between gap-4 px-4 py-3 sm:px-6">
      <form
        role="search"
        onSubmit={handleSearch}
        className="relative w-full max-w-md shadow-lg"
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
          placeholder="Search chats..."
          className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
        />
      </form>

      <div className="flex min-w-0 max-w-[45%] shrink-0 items-center gap-3 bg-white px-10 py-1 rounded-4xl shadow-lg">
        <div className="min-w-0 text-right">
          <p className="text-xs text-gray-500">Workspace</p>
          <p
            className="truncate text-sm font-semibold text-gray-900"
            title={workspace?.name}
          >
            {workspace?.name ?? "No workspace selected"}
          </p>
        </div>
        {logoUrl && logoUrl !== failedLogo ? (
          <img
            src={logoUrl}
            alt={`${workspace.name} logo`}
            onError={() => setFailedLogo(logoUrl)}
            className="h-10 w-10 shrink-0 rounded-xl border border-gray-200 bg-white object-contain p-1"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-sm font-semibold text-indigo-700"
          >
            {workspace?.name.slice(0, 2).toUpperCase() || "WS"}
          </span>
        )}
      </div>
    </header>
  );
}

export default ChatNavbar;
