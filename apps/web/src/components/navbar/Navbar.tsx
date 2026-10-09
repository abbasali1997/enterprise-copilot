import { useContext, useState } from "react";
import { AuthContext } from "@/contexts/authContext.tsx";
import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const [dropDowm, setDropDown] = useState<boolean>(false);
  const authValue = useContext(AuthContext);

  const navigate = useNavigate();

  const onProfileClick = () => {
    setDropDown(!dropDowm);
  };

  const signOut = () => {
    authValue?.setUser(null);
    setDropDown(false);
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <header>
      <nav className="bg-neutral-primary h-full w-full z-20 top-0 inset-s-0 border-b border-default">
        <div className="max-w-screen flex flex-wrap items-center justify-between mx-auto p-4">
          <img
            className="w-52"
            src="/Enterprise-Copilot-logo.png"
            alt="Company logo"
          />
          {authValue?.user ? (
            <div className="flex items-center md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
              <button
                type="button"
                onClick={onProfileClick}
                className="flex text-sm bg-neutral-primary rounded-full md:me-0"
                id="user-menu-button"
                aria-expanded="false"
                data-dropdown-toggle="user-dropdown"
                data-dropdown-placement="bottom"
              >
                <span className="sr-only">Open user menu</span>
                <img
                  className="w-16 h-16 rounded-full"
                  src="/Portrait.png"
                  alt="user photo"
                />
              </button>
              <div
                style={{
                  top: "120px",
                  right: 0,
                }}
                className={
                  dropDowm
                    ? "z-50 fixed bg-white border border-default-medium rounded-base shadow-lg w-44"
                    : "z-50 fixed hidden bg-white border border-default-medium rounded-base shadow-lg w-44"
                }
                id="user-dropdown"
              >
                <div className="px-4 py-3 text-sm border-b border-default">
                  <span className="block text-heading font-medium">
                    {authValue?.user.name}
                  </span>
                  <span className="block text-body truncate">
                    {authValue?.user.email}
                  </span>
                </div>
                <ul
                  className="p-2 text-sm text-body font-medium"
                  aria-labelledby="user-menu-button"
                >
                  <li>
                    <a
                      href="#"
                      className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded"
                    >
                      Dashboard
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded"
                    >
                      Settings
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      onClick={signOut}
                      className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded"
                    >
                      Sign out
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <Link to={"/login"}>
              {" "}
              <span className="text-2xl">Log In</span>{" "}
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
