import { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";

import { Menu } from "./Icons";
import { useUserFromQuery } from "./QueryHooks";

export default function NavBar(): React.ReactElement {
  const navigate = useNavigate();
  const [navbarOpen, setNavbarOpen] = useState(false);
  const {
    data: user,
    isLoading: isUserLoading,
    remove: removeUser,
  } = useUserFromQuery();

  const onLogOut = () => {
    document.cookie = "SESSION=; Max-Age=-99999999;";
    removeUser();
    navigate("/");
  };

  let navItems;
  if (!isUserLoading && user) {
    navItems = (
      <>
        <li className="nav-item">
          <Link to="/photo">
            <span className="px-2 py-2 flex items-center hover:opacity-75">
              <span className="ml-2">Photos</span>
            </span>
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/tag">
            <span className="px-3 py-2 flex items-center hover:opacity-75">
              <span className="ml-2">Tags</span>
            </span>
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/search">
            <span className="px-2 py-2 flex items-center hover:opacity-75">
              <span className="ml-2">Search</span>
            </span>
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/upload">
            <span className="px-2 py-2 flex items-center hover:opacity-75">
              <span className="ml-2">Upload</span>
            </span>
          </Link>
        </li>
        <li className="nav-item">
          <button>
            <span className="px-2 py-2 flex items-center cursor-default">
              <span className="ml-2">{user.primaryEmail}</span>
            </span>
          </button>
        </li>
        <li className="nav-item">
          <button onClick={onLogOut}>
            <span className="px-2 py-2 flex items-center hover:opacity-75">
              <span className="ml-2">Log out</span>
            </span>
          </button>
        </li>
      </>
    );
  } else {
    navItems = (
      <li className="nav-item">
        <a href="/auth/github">
          <span className="px-2 py-2 flex items-center hover:opacity-75">
            <span className="ml-2">Log in with GitHub</span>
          </span>
        </a>
      </li>
    );
  }

  return (
    <>
      <nav
        className={
          "relative flex flex-wrap items-center justify-between px-2 py-3 bg-gray-100 md:h-[70px]" +
          (navbarOpen ? (user ? " h-[310px]" : " h-[110px]") : " h-[70px]")
        }
      >
        <div className="container px-4 mx-auto flex flex-wrap items-center justify-between">
          <div className="w-full relative flex justify-between md:w-auto md:static md:block md:justify-start">
            <h1 className="text-4xl font-mono">cheph</h1>
            <button
              className="cursor-pointer text-xl leading-none px-3 py-1 border border-solid border-transparent rounded bg-transparent block md:hidden outline-none focus:outline-none"
              type="button"
              onClick={() => setNavbarOpen(!navbarOpen)}
            >
              <Menu />
            </button>
          </div>
          <div
            className={
              "md:flex flex-grow items-center" +
              (navbarOpen ? " flex" : " hidden")
            }
          >
            <ul className="flex flex-col md:flex-row list-none md:ml-auto">
              {navItems}
            </ul>
          </div>
        </div>
      </nav>
      <div
        className={
          "md:min-h-[calc(100vh-70px)] h-full w-full bg-gray-200 flex flex-col p-5" +
          (navbarOpen
            ? user
              ? " min-h-[calc(100vh-310px)]"
              : " min-h-[calc(100vh-110px)]"
            : " min-h-[calc(100vh-70px)]")
        }
      >
        <Outlet />
      </div>
    </>
  );
}
