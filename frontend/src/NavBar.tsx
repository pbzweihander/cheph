import { useState } from "react";
import { Link, Outlet } from "react-router-dom";

import { Menu } from "./Icons";
import { useUserFromQuery } from "./QueryHooks";

export default function NavBar(): React.ReactElement {
  const [navbarOpen, setNavbarOpen] = useState(false);
  const { data: user, isLoading: isUserLoading } = useUserFromQuery();

  const onLogOut = () => {
    window.location.replace("/auth/logout");
  };

  let navItems;
  if (!isUserLoading && user) {
    navItems = (
      <>
        <li className="nav-item">
          <Link to="/tag">
            <span className="px-3 py-2 flex items-center hover:opacity-75">
              <span className="ml-2">Tags</span>
            </span>
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/upload">
            <span className="px-3 py-2 flex items-center hover:opacity-75">
              <span className="ml-2">Upload</span>
            </span>
          </Link>
        </li>
        <li className="nav-item">
          <button>
            <span className="px-3 py-2 flex items-center hover:opacity-75">
              <span className="ml-2">{user.primaryEmail}</span>
            </span>
          </button>
        </li>
        <li className="nav-item">
          <button onClick={onLogOut}>
            <span className="px-3 py-2 flex items-center hover:opacity-75">
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
          <span className="px-3 py-2 flex items-center hover:opacity-75">
            <span className="ml-2">Log in with GitHub</span>
          </span>
        </a>
      </li>
    );
  }

  return (
    <>
      <nav className="relative flex flex-wrap items-center justify-between px-2 py-3 bg-gray-100">
        <div className="container px-4 mx-auto flex flex-wrap items-center justify-between">
          <div className="w-full relative flex justify-between lg:w-auto lg:static lg:block lg:justify-start">
            <h1 className="text-4xl font-mono">cheph</h1>
            <button
              className="cursor-pointer text-xl leading-none px-3 py-1 border border-solid border-transparent rounded bg-transparent block lg:hidden outline-none focus:outline-none"
              type="button"
              onClick={() => setNavbarOpen(!navbarOpen)}
            >
              <Menu />
            </button>
          </div>
          <div
            className={
              "lg:flex flex-grow items-center" +
              (navbarOpen ? " flex" : " hidden")
            }
          >
            <ul className="flex flex-col lg:flex-row list-none lg:ml-auto">
              {navItems}
            </ul>
          </div>
        </div>
      </nav>
      <div className="h-screen w-full bg-gray-200 overflow-y-auto flex flex-col p-5">
        <Outlet />
      </div>
    </>
  );
}
