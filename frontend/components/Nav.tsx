"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
export const dynamic = "force-dynamic";

const Nav = () => {
  const [session, setSession] = useState(false);
  const [toggleDropdown, setToggleDropdown] = useState(false);
  const [toggleLogoMenu, setToggleLogoMenu] = useState(false);

  return (
    <nav className="
    flex items-center justify-between w-full px-6 py-4 relative
    bg-[var(--background)]
     border-zinc-200 dark:border-zinc-800
    transition-colors duration-300
  ">
      {/* Logo + Dropdown */}
      <div className="relative">
        <button
          onClick={() => setToggleLogoMenu((prev) => !prev)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Image
            src="/my-notion-face-portrait.png"
            alt="Logo"
            width={42}
            height={42}
            className="rounded-full"
          />
          <span className="font-bold text-lg">Mono</span>
        </button>

        {toggleLogoMenu && (
          <div className="absolute left-0 top-12 w-44 dark:bg-amber-400 bg-white shadow-md rounded-md flex flex-col z-50">
            <Link
              href="/dashboard"
              className="dropdown_link"
              onClick={() => setToggleLogoMenu(false)}
            >
              Dashboard
            </Link>

            <Link
              href="/planner"
              className="dropdown_link"
              onClick={() => setToggleLogoMenu(false)}
            >
              Planner
            </Link>

            <Link
              href="/ai-teacher"
              className="dropdown_link"
              onClick={() => setToggleLogoMenu(false)}
            >
              AI Teacher
            </Link>

            <Link
              href="/quiz"
              className="dropdown_link"
              onClick={() => setToggleLogoMenu(false)}
            >
              Quizzes
            </Link>
          </div>
        )}
      </div>

      {/* Desktop Navigation */}
      <div className="hidden sm:flex items-center gap-4">
        {session ? (
          <>
            <Link href="/profile">
              <Image
                src="/my-notion-face-portrait.png"
                alt="profile"
                width={36}
                height={36}
                className="rounded-full cursor-pointer"
              />
            </Link>
            <ThemeToggle />
            <button onClick={() => setSession(false)} className="black_btn">
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link href="/" className="text-lg font-semibold ">
              Home
            </Link>
            <ThemeToggle />
            <Link href="/sign-in" className="outline_btn">
              Sign In
            </Link>
            <Link href="/sign-up" className="black_btn">
              Sign Up
            </Link>
          </>
        )}
      </div>

      {/* Mobile Navigation */}
      <div className="sm:hidden relative">
        {session ? (
          <>
            <Image
              src="/my-notion-face-portrait.png"
              alt="profile"
              width={38}
              height={38}
              className="rounded-full cursor-pointer"
              onClick={() => setToggleDropdown((prev) => !prev)}
            />

            {toggleDropdown && (
              <div className="absolute right-0 top-12 w-40 bg-white shadow-md rounded-md flex flex-col">
                <Link
                  href="/profile"
                  className="dropdown_link"
                  onClick={() => setToggleDropdown(false)}
                >
                  My Profile
                </Link>

                <button
                  className="dropdown_link text-left"
                  onClick={() => {
                    setSession(false);
                    setToggleDropdown(false);
                  }}
                >
                  Sign Out
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex gap-2">
            <Link href="/sign-in" className="outline_btn">
              Sign In
            </Link>
            <Link href="/sign-up" className="black_btn">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Nav;
