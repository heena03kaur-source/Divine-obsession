import React from "react";
import { LogOut, Settings, Trash2, Edit, User, ShieldCheck, Heart } from "lucide-react";
import { Post } from "../types";

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string, subTab?: string, resetPostToEdit?: boolean) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  userEmail: string;
  onLogout: () => void;
  onOpenLogin: () => void;
  openSettingsMenu: boolean;
  setOpenSettingsMenu: (open: boolean) => void;
  posts: Post[];
  selectedNiche: string | null;
  setSelectedNiche: (niche: string | null) => void;
  adminSubTab: string;
  savedPostIds?: string[];
}

export function Navbar({
  currentTab,
  setCurrentTab,
  isAuthenticated,
  isAdmin,
  userEmail,
  onLogout,
  onOpenLogin,
  openSettingsMenu,
  setOpenSettingsMenu,
  posts,
  selectedNiche,
  setSelectedNiche,
  adminSubTab,
  savedPostIds = [],
}: NavbarProps) {
  React.useEffect(() => {
    const handleClose = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#account-menu-trigger") && !target.closest("#settings-dropdown") &&
          !target.closest("#account-menu-trigger-mobile") && !target.closest("#settings-dropdown-mobile")) {
        setOpenSettingsMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClose);
    return () => document.removeEventListener("mousedown", handleClose);
  }, [setOpenSettingsMenu]);

  const initials = userEmail ? userEmail[0].toUpperCase() : "U";

  const handleLogoClick = () => {
    setCurrentTab("blogs");
    setOpenSettingsMenu(false);
  };

  return (
    <nav className="sticky top-0 z-40 bg-[#FAF9F6] border-b border-[#7DB095]/10 backdrop-blur-md bg-opacity-95 transition-all duration-300">
      {/* Desktop view */}
      <div className="hidden md:flex max-w-6xl mx-auto h-20 px-6 md:px-12 items-center justify-between">
        {/* Left Links */}
        <div className="flex-1 flex items-center gap-6 md:gap-8 justify-start font-sans" id="nav-links">
          <button
            onClick={() => {
              setCurrentTab("blogs");
              setOpenSettingsMenu(false);
            }}
            className={`font-semibold text-xs md:text-sm tracking-widest uppercase hover:text-[#7DB095] transition-colors duration-200 cursor-pointer ${
              currentTab === "blogs" || currentTab === "detail" ? "text-[#7DB095]" : "text-gray-400"
            }`}
          >
            Blogs
          </button>
          <button
            onClick={() => {
              setCurrentTab("topics");
              setOpenSettingsMenu(false);
            }}
            className={`font-medium text-xs md:text-sm tracking-widest uppercase hover:text-[#7DB095] transition-colors duration-200 cursor-pointer ${
              currentTab === "topics" ? "text-[#7DB095]" : "text-gray-400"
            }`}
          >
            Topics
          </button>
          <button
            onClick={() => {
              setCurrentTab("read-list");
              setOpenSettingsMenu(false);
            }}
            className={`font-medium text-xs md:text-sm tracking-widest uppercase hover:text-[#7DB095] transition-colors duration-200 cursor-pointer flex items-center gap-1.5 ${
              currentTab === "read-list" ? "text-rose-500 font-bold" : "text-gray-400"
            }`}
          >
            <span>Read List</span>
            <div className={`relative px-1.5 py-0.5 rounded-full text-[9px] font-bold font-mono transition-all ${
              savedPostIds.length > 0
                ? (currentTab === "read-list" ? "bg-rose-500 text-white animate-pulse" : "bg-rose-50 border border-rose-100 text-rose-500")
                : "bg-gray-100 text-gray-400"
            }`}>
              {savedPostIds.length}
            </div>
          </button>
        </div>

        {/* Center Logo */}
        <div className="flex-1 flex justify-center text-center">
          <div onClick={handleLogoClick} className="cursor-pointer group flex items-center justify-center gap-2" id="logo-brand">
            <h1
              className="text-xl md:text-2xl font-serif italic text-gray-800 tracking-tight group-hover:text-[#7DB095] transition-colors duration-200"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Divine obsession
            </h1>
          </div>
        </div>

        {/* Right Auth Group */}
        <div className="flex-1 flex justify-end items-center gap-3 relative" id="auth-group">
          {isAuthenticated ? (
            <>
              <button
                onClick={() => {
                  if (isAdmin) {
                    setCurrentTab("admin-dashboard", "traffic");
                  }
                  setOpenSettingsMenu(!openSettingsMenu);
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#7DB095]/15 hover:border-[#7DB095]/40 hover:bg-[#7DB095]/5 rounded-xl transition-all duration-200 cursor-pointer focus:outline-none"
                id="account-menu-trigger"
                aria-expanded={openSettingsMenu}
              >
                <div className="w-6 h-6 rounded-full bg-[#7DB095] text-[#FAF9F6] text-xs font-semibold flex items-center justify-center select-none uppercase font-mono">
                  {initials}
                </div>
                <span className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-widest hidden sm:inline">
                  {isAdmin ? "Admin" : "Reader"}
                </span>
              </button>

              {openSettingsMenu && (
                <div
                  className="absolute right-0 top-12 w-52 bg-white rounded-xl shadow-xl border border-[#7DB095]/10 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 font-sans"
                  id="settings-dropdown"
                >
                  {isAdmin ? (
                    <>
                      <div className="px-3 py-1.5 border-b border-gray-100/60 mb-1 text-left">
                        <p className="text-[10px] uppercase tracking-wider text-[#7DB095] font-mono font-bold">
                          Owner Mode
                        </p>
                        <p className="text-[9px] text-gray-400 font-sans truncate mt-0.5">
                          {userEmail}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setOpenSettingsMenu(false);
                          setCurrentTab("admin-dashboard", "traffic");
                        }}
                        className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors duration-150 hover:bg-[#7DB095]/10 hover:text-[#7DB095] cursor-pointer ${
                          currentTab === "admin-dashboard" && adminSubTab !== "dustbin"
                            ? "text-[#7DB095] bg-[#7DB095]/5 font-semibold"
                            : "text-gray-700"
                        }`}
                        id="btn-admin-dashboard"
                      >
                        Settings & Analytics
                      </button>
                      <button
                        onClick={() => {
                          setOpenSettingsMenu(false);
                          setCurrentTab("admin-dashboard", "dustbin");
                        }}
                        className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors duration-150 hover:bg-[#7DB095]/10 hover:text-[#7DB095] cursor-pointer ${
                          currentTab === "admin-dashboard" && adminSubTab === "dustbin"
                            ? "text-[#7DB095] bg-[#7DB095]/5 font-semibold"
                            : "text-gray-700"
                        }`}
                        id="btn-navbar-dustbin"
                      >
                        Archived Blogs (Dustbin)
                      </button>
                      <button
                        onClick={() => {
                          setOpenSettingsMenu(false);
                          setCurrentTab("write", undefined, true);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors duration-150 hover:bg-[#7DB095]/10 hover:text-[#7DB095] cursor-pointer ${
                          currentTab === "write" ? "text-[#7DB095] bg-[#7DB095]/5 font-medium" : "text-gray-700"
                        }`}
                        id="btn-write-blog"
                      >
                        Write New Blog
                      </button>
                      <button
                        onClick={() => {
                          setOpenSettingsMenu(false);
                          setCurrentTab("settings-edit");
                        }}
                        className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors duration-150 hover:bg-[#7DB095]/10 hover:text-[#7DB095] cursor-pointer ${
                          currentTab === "settings-edit" ? "text-[#7DB095] bg-[#7DB095]/5 font-medium" : "text-gray-700"
                        }`}
                        id="btn-change-creds"
                      >
                        Change Email & Password
                      </button>
                    </>
                  ) : (
                    <div className="px-3 py-1.5 border-b border-gray-100/60 mb-1 text-left">
                      <p className="text-[10px] uppercase tracking-wider text-gray-450 font-mono font-semibold">
                        Signed In
                      </p>
                      <p className="text-[10px] text-gray-500 font-sans truncate font-medium mt-0.5" title={userEmail}>
                        {userEmail}
                      </p>
                      <p className="text-[9px] uppercase tracking-wider text-[#7DB095] font-bold mt-1">
                        Reader Account
                      </p>
                    </div>
                  )}
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={() => {
                      setOpenSettingsMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150 cursor-pointer font-medium flex items-center gap-2"
                    id="btn-logout"
                  >
                    <LogOut size={13} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-[#7DB095] border-2 border-[#7DB095]/20 hover:border-[#7DB095] hover:bg-[#7DB095]/5 rounded-full transition-all duration-300 cursor-pointer shrink-0"
              id="btn-navbar-signin"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Mobile view */}
      <div className="flex md:hidden flex-col w-full p-4 pb-0 gap-3">
        <div className="flex items-center justify-between w-full">
          <div onClick={handleLogoClick} className="cursor-pointer" id="logo-brand-mobile">
            <h1
              className="text-lg font-serif italic text-gray-800 tracking-tight"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Divine obsession
            </h1>
          </div>

          <div className="flex items-center gap-2 mt-0.5 relative">
            {isAuthenticated ? (
              <div className="relative" id="mobile-auth-dropdown-wrapper">
                <button
                  onClick={() => {
                    if (isAdmin) {
                      setCurrentTab("admin-dashboard", "traffic");
                    }
                    setOpenSettingsMenu(!openSettingsMenu);
                  }}
                  className="flex items-center gap-1.5 px-2 py-1 bg-[#7DB095]/10 border border-[#7DB095]/30 rounded-xl transition-all cursor-pointer"
                  id="account-menu-trigger-mobile"
                >
                  <div className="w-6 h-6 rounded-full bg-[#7DB095] text-[#FAF9F6] text-xs font-semibold flex items-center justify-center select-none uppercase font-mono">
                    {initials}
                  </div>
                </button>

              {openSettingsMenu && (
                <div
                  className="absolute right-0 top-9 w-48 bg-white rounded-xl shadow-xl border border-[#7DB095]/10 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 font-sans"
                  id="settings-dropdown-mobile"
                >
                  {isAdmin ? (
                    <>
                      <div className="px-3 py-1.5 border-b border-gray-100/60 mb-1 text-left">
                        <p className="text-[10px] uppercase tracking-wider text-[#7DB095] font-mono font-bold">
                          Owner Mode
                        </p>
                        <p className="text-[9px] text-gray-400 font-sans truncate mt-0.5">
                          {userEmail}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setOpenSettingsMenu(false);
                          setCurrentTab("admin-dashboard", "traffic");
                        }}
                        className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors duration-150 hover:bg-[#7DB095]/10 hover:text-[#7DB095] cursor-pointer ${
                          currentTab === "admin-dashboard" && adminSubTab !== "dustbin"
                            ? "text-[#7DB095] bg-[#7DB095]/5 font-semibold"
                            : "text-gray-700"
                        }`}
                        id="btn-admin-dashboard-mobile"
                      >
                        Settings & Analytics
                      </button>
                      <button
                        onClick={() => {
                          setOpenSettingsMenu(false);
                          setCurrentTab("admin-dashboard", "dustbin");
                        }}
                        className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors duration-150 hover:bg-[#7DB095]/10 hover:text-[#7DB095] cursor-pointer ${
                          currentTab === "admin-dashboard" && adminSubTab === "dustbin"
                            ? "text-[#7DB095] bg-[#7DB095]/5 font-semibold"
                            : "text-gray-700"
                        }`}
                        id="btn-navbar-dustbin-mobile"
                      >
                        Archived Blogs (Dustbin)
                      </button>
                      <button
                        onClick={() => {
                          setOpenSettingsMenu(false);
                          setCurrentTab("write", undefined, true);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors duration-150 hover:bg-[#7DB095]/10 hover:text-[#7DB095] cursor-pointer ${
                          currentTab === "write" ? "text-[#7DB095] bg-[#7DB095]/5  font-medium" : "text-gray-700"
                        }`}
                        id="btn-write-blog-mobile"
                      >
                        Write New Blog
                      </button>
                      <button
                        onClick={() => {
                          setOpenSettingsMenu(false);
                          setCurrentTab("settings-edit");
                        }}
                        className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors duration-150 hover:bg-[#7DB095]/10 hover:text-[#7DB095] cursor-pointer ${
                          currentTab === "settings-edit" ? "text-[#7DB095] bg-[#7DB095]/5 font-medium" : "text-gray-700"
                        }`}
                        id="btn-change-creds-mobile"
                      >
                        Change Credentials
                      </button>
                    </>
                  ) : (
                    <div className="px-3 py-1.5 border-b border-gray-100/60 mb-1 text-left">
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-mono font-semibold">
                        Signed In
                      </p>
                      <p className="text-[10px] text-gray-500 font-sans truncate font-medium mt-0.5" title={userEmail}>
                        {userEmail}
                      </p>
                      <p className="text-[9px] uppercase tracking-wider text-[#7DB095] font-bold mt-1">
                        Reader Account
                      </p>
                    </div>
                  )}
                  <div className="border-t border-gray-100 my-1 font-sans"></div>
                  <button
                    onClick={() => {
                      setOpenSettingsMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150 cursor-pointer font-medium flex items-center gap-2"
                    id="btn-logout-mobile"
                  >
                    <LogOut size={13} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
              </div>
          ) : (
              <button
                onClick={onOpenLogin}
                className="px-3 py-1.5 text-[10.5px] font-extrabold uppercase tracking-widest text-[#7DB095] border border-[#7DB095]/20 hover:border-[#7DB095] bg-white rounded-full transition-all cursor-pointer shrink-0"
                id="btn-navbar-signin-mobile"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Nav Tabs */}
        <div className="flex items-center justify-center gap-1 px-2 border-t border-[#7DB095]/10 pt-2 pb-1.5 w-full overflow-x-auto scrollbar-none" id="nav-links-mobile">
          <button
            onClick={() => {
              setCurrentTab("blogs");
              setOpenSettingsMenu(false);
            }}
            className={`px-3 py-1 text-[11px] tracking-widest uppercase font-bold transition-all cursor-pointer pb-1.5 border-b-2 ${
              currentTab === "blogs" || currentTab === "detail"
                ? "text-[#7DB095] border-[#7DB095]"
                : "text-gray-400 border-transparent hover:text-gray-600"
            }`}
          >
            Blogs
          </button>
          <button
            onClick={() => {
              setCurrentTab("topics");
              setOpenSettingsMenu(false);
            }}
            className={`px-3 py-1 text-[11px] tracking-widest uppercase font-bold transition-all cursor-pointer pb-1.5 border-b-2 ${
              currentTab === "topics"
                ? "text-[#7DB095] border-[#7DB095]"
                : "text-gray-400 border-transparent hover:text-gray-600"
            }`}
          >
            Topics
          </button>
          <button
            onClick={() => {
              setCurrentTab("read-list");
              setOpenSettingsMenu(false);
            }}
            className={`px-3 py-1 text-[11px] tracking-widest uppercase font-bold transition-all cursor-pointer pb-1.5 border-b-2 flex items-center gap-1 leading-none ${
              currentTab === "read-list"
                ? "text-rose-500 border-rose-500 font-bold"
                : "text-gray-400 border-transparent hover:text-gray-600"
            }`}
          >
            <span>Read List</span>
            <span className={`px-1 py-0.5 rounded-full text-[9px] font-bold ${
              savedPostIds.length > 0
                ? (currentTab === "read-list" ? "bg-rose-500 text-white" : "bg-rose-50 border border-rose-100 text-rose-500")
                : "bg-gray-100 text-gray-400"
            }`}>
              {savedPostIds.length}
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}
