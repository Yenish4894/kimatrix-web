"use client";

import { Menu } from "lucide-react";
import { useAppSelector } from "@/store/hooks";

interface HeaderProps {
  title: string;
  onMenuToggle?: () => void;
}

export function Header({ title, onMenuToggle }: Readonly<HeaderProps>) {
  const user = useAppSelector((state) => state.auth.user);
  const initials = user?.username?.slice(0, 2).toUpperCase() || "KM";
  const displayRole = user?.userType === "super_admin" ? "Admin" : "Company";

  return (
    <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <button
          type="button"
          onClick={onMenuToggle}
          className="tap-target lg:hidden h-9 w-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 transition-colors shrink-0"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <h1 className="text-base font-semibold font-heading text-slate-800 truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">
            {initials}
          </div>
          <div>
            <p className="text-[13px] font-medium text-slate-700 leading-none">
              {user?.username}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">{displayRole}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
