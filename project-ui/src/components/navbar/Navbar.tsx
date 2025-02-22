// import { Link } from 'react-router-dom';

import { useNavigate } from "react-router-dom";
import Icon from "../../assets/stormtrooper.png";
import ToggleDarkTheme from "../buttons/ToggleDarkTheme";

export default function Navbar() {
  const navigate = useNavigate(); // use to navigate to another page "navigate('/')"
  return (
    <nav className="bg-white dark:bg-zinc-900 sticky w-full z-20 top-0 start-0 border-b border-gray-300 dark:border-gray-600">
      <div className="w-full flex flex-wrap items-center justify-around p-4">
        <a
          href="/"
          className="flex items-center space-x-3 rtl:space-x-reverse group"
        >
          <img src={Icon} className="h-8" alt="navIcon"></img>
          <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">
            Clankeye
          </span>
        </a>
        <div className="flex md:order-2 gap-x-4">
          <ToggleDarkTheme />

          <button
            onClick={() => {}}
            type="button"
            id="btnLogin"
            className="text-white bg-zinc-800 hover:bg-zinc-900 focus:ring-4 focus:outline-none focus:ring-thunderbird-500 font-medium rounded-md text-md px-5 py-2 text-center transition ease-in-out duration-200"
          >
            Login
          </button>

          {/* <button
            data-collapse-toggle="navbar-sticky"
            type="button"
            className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
            aria-controls="navbar-sticky"
            aria-expanded="false"
          >
            <span className="sr-only">Open main menu</span>
          </button> */}
        </div>
        <div
          className="items-center justify-between hidden w-full md:flex md:w-auto md:order-1"
          id="navbar-sticky"
        >
          <ul className="flex flex-col p-4 md:p-0 mt-4 text-xl font-semibold border border-gray-100 rounded-lg bg-gray-50 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-transparent dark:border-gray-700">
            <li>
              <a
                href="/"
                className="block py-2 px-3 text-zinc-700 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-thunderbird-600 md:p-0 md:dark:hover:text-thunderbird-500 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
              >
                Services
              </a>
            </li>
            <li>
              <a
                href="/"
                className="block py-2 px-3 text-zinc-700 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-thunderbird-600 md:p-0 md:dark:hover:text-thunderbird-500 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
              >
                Contact
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
