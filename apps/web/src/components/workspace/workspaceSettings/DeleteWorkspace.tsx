import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function DeleteWorkspace() {
  return (
    <>
      <div className="flex min-w-0 flex-col justify-around gap-4 h-full">
        <div>
          <p className="text-lg text-red-700 font-bold">Delete Workspace</p>
          <p className="text-md text-gray-600">
            Permanently delete this workspace and all its data. This action can
            not be undone.
          </p>
        </div>

        <button className="cursor-pointer text-xl bg-transparent border border-red-700 hover:bg-gray-900 rounded-lg px-4 py-2.5 text-center text-sm font-medium text-red-700 transition hover:text-white hover:bg-red-700">
          <FontAwesomeIcon
            icon={faTriangleExclamation}
            className="text-2xl mr-2"
          />
          Delete Permanently
        </button>
      </div>
    </>
  );
}

export default DeleteWorkspace;
