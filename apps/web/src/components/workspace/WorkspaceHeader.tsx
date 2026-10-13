import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faGears,
  faSection,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

export type WorkspaceTab = "overview" | "members" | "settings";

type WorkspaceHeaderProps = {
  name: string;
  logo?: string;
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
};

function WorkspaceHeader({
  name,
  logo,
  activeTab,
  onTabChange,
}: WorkspaceHeaderProps) {
  const getNameInitials = (name: string) => {
    const substrings = name.split(" ");
    if (substrings.length > 1) {
      return `${substrings[0]?.charAt(0).toUpperCase()}${substrings[1]?.charAt(0).toUpperCase()}`;
    }

    return substrings[0]?.charAt(0).toUpperCase();
  };

  const getSectionIcon = (tab: WorkspaceTab) => {
    switch (tab) {
      case "overview":
        return faEye;
      case "settings":
        return faGears;
      case "members":
        return faUsers;
      default:
        return faSection;
    }
  };

  return (
    <div className="rounded-xl bg-white min-h-full flex flex-col justify-between">
      <div className="flex gap-7 p-5 items-end">
        <div className="rounded-xl w-20 h-20 bg-white flex justify-center items-center shadow-lg shadow-indigo-300">
          {logo ? (
            <img src={logo} alt={name} className="h-fit rounded-xl" />
          ) : (
            <div className="flex h-full w-full text-center bg-indigo-500 text-white font-bold text-xl items-center justify-center rounded-xl border-gray-200">
              {getNameInitials(name)}
            </div>
          )}
        </div>
        <div>
          <p className="font-bold text-3xl">{name}</p>
          <p className="text-gray-600 text-md mt-2">
            Manage your workspace members and settings
          </p>
        </div>
      </div>

      <div className="flex gap-15 p-5 pb-0" aria-label="Workspace sections">
        {(["overview", "members", "settings"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            aria-pressed={activeTab === tab}
            onClick={() => onTabChange(tab)}
            className={`text-lg border-b-4 pb-2 font-bold capitalize focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
              activeTab === tab
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-600"
            }`}
          >
            <FontAwesomeIcon icon={getSectionIcon(tab)} className="mr-2" />
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}

export default WorkspaceHeader;
