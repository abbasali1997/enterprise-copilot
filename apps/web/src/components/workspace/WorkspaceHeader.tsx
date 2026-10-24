import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faEye,
  faGears,
  faSection,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

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
    <div className="rounded-xl bg-white min-h-full flex flex-col justify-between dark:bg-slate-800 dark:text-slate-100">
      <div className="flex justify-between items-center p-5 ">
        <div className="flex gap-7 items-end">
          <div className="rounded-xl w-20 h-20 bg-white flex justify-center items-center shadow-lg shadow-indigo-300 dark:shadow-slate-600">
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
            <p className="text-gray-600 text-md mt-2 dark:text-gray-300">
              Manage your workspace members and settings
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate("/workspaces/change")}
          className="cursor-pointer flex justify-around items-center font-semibold rounded-lg px-3 py-2 text-right text-sm text-gray-700 bg-gray-100 transition hover:bg-indigo-100 hover:text-indigo-700 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:bg-slate-400 dark:text-gray-900 dark:hover:bg-indigo-300"
        >
          <FontAwesomeIcon icon={faArrowsRotate} className="w-5 h-5 mr-4" />
          Switch Workspace
        </button>
      </div>

      <div className="flex gap-15 p-5 pb-0" aria-label="Workspace sections">
        {(["overview", "members", "settings"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            aria-pressed={activeTab === tab}
            onClick={() => onTabChange(tab)}
            className={`cursor-pointer text-md border-b-4 pb-2 font-bold capitalize focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
              activeTab === tab
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-300 dark:text-indigo-300"
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
