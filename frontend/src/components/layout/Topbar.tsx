import { Bell, Search, Menu, LogOut, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";

import { useAuthStore } from "#/stores/authStore";

export function Topbar({ title, onOpenMenu }: { title: string; onOpenMenu: () => void }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-gray-100 bg-white/80 px-4 sm:px-8 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenMenu}
          aria-label="Open navigation menu"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="truncate text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
      </div>

      <div className="flex flex-1 items-center justify-end gap-6">
        {/* Search */}
        <div className="hidden max-w-md flex-1 lg:block relative">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
           <input 
             type="text"
             placeholder="Search reports, agents, or documents..."
             className="w-full rounded-full border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-[#6C5CE7] focus:bg-white focus:ring-2 focus:ring-[#6C5CE7]/20"
           />
           <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1">
             <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-500 shadow-sm">⌘</kbd>
             <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-500 shadow-sm">K</kbd>
           </div>
        </div>

        {/* Notifications */}
        <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/20">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2.5 top-2.5 flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        {/* Profile Dropdown */}
        {user && (
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-3 rounded-full border border-gray-200 bg-white p-1 pr-3 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/20"
            >
               <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#6C5CE7] to-purple-400 text-sm font-bold text-white shadow-inner">
                  {user.full_name.charAt(0)}
               </div>
               <div className="hidden text-left sm:block">
                  <p className="text-sm font-bold text-gray-900 leading-tight">{user.full_name}</p>
                  <p className="text-xs font-medium text-gray-500 leading-tight">{user.org_name}</p>
               </div>
               <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>

            {/* Dropdown Menu */}
            {profileOpen && (
               <div className="absolute right-0 top-full mt-2 w-56 origin-top-right overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-200/50 ring-1 ring-black/5 z-50">
                  <div className="border-b border-gray-100 px-4 py-3">
                     <p className="text-sm font-bold text-gray-900">{user.full_name}</p>
                     <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <div className="p-2">
                     <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                        Profile Settings
                     </button>
                     <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                        Billing
                     </button>
                  </div>
                  <div className="border-t border-gray-100 p-2">
                     <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                     >
                        <LogOut className="h-4 w-4" />
                        Sign out
                     </button>
                  </div>
               </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
