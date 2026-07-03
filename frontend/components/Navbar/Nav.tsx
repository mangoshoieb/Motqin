"use client";

import Image from "next/image";
import Link from "next/link";
import UserMenu from "./userMenu";
import { useState } from "react";

export const dynamic = "force-dynamic";

const Nav = () => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const navLinks = [
    {
      label: "حول",
      href: "/about",
    },
    {
      label: "الرئيسية",
      href: "/",
    },
  ];
  // Temporary user object until auth is connected
  const user = {
    name: "Mono",
    image: "/my-notion-face-portrait.png",
  };
  // const user = null

  return (
    <nav className="w-full border-b border-zinc-200 bg-[var(--background)] transition-colors duration-300 dark:border-zinc-800">
      <div className="mx-auto h-16 max-w-7xl flex justify-between items-center px-3">
        {/* Left Section */}
        <div className="flex items-center justify-start">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-3 rounded-full px-2 py-1 transition hover:bg-zinc-200 dark:hover:bg-zinc-800"
              >
                <Image
                  src={user.image}
                  alt={user.name}
                  width={40}
                  height={40}
                  className="rounded-full"
                />

                <span className="font-medium">{user.name}</span>

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  {/* <path d="m6 9 6 6 6-6" /> */}
                </svg>
              </button>

              <UserMenu
                isOpen={isUserMenuOpen}
                onClose={() => setIsUserMenuOpen(false)}
              />
            </div>
          ) : (
            <div />
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center justify-end gap-3">
          {/* Center Navigation */}
          <div className="flex items-center justify-center gap-10 font-bold text-lg ">
            {navLinks.map((link, index) => {
              return (
                <Link
                  key={index}
                  href={link.href}
                  className=""
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
          {!user ? (
            <>
              <Link href="/sign-in" className="outline_btn">
                تسجيل الدخول
              </Link>

              <Link href="/sign-up" className="black_btn">
                إنشاء حساب
              </Link>
            </>
          ) : (
            <div />
          )}
        </div>
      </div>
    </nav>
  );
};

export default Nav;
