// src/layouts/AppLayout.jsx
import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import EmergencyFab from "../EmergencyFab";
import NotificationDropdown from "../NotificationDropdown";
import { clearAuthCache, getCachedUser } from "../ProtectedRoute";
// ✅ FIX: Pastikan path CSS benar
import "../../assets/style/css/AppLayout.css";

// ✅ FIX: Seragamkan dengan ProtectedRoute.jsx
import API_BASE_URL from "../../utils/api.js";

// ─── Menu Config per Role ─────────────────────────────────────────────────────
const MENUS = {
  admin: [
    {
      group: "Utama",
      items: [
        { to: "/admin/dashboard", label: "Dashboard", icon: <IconGrid /> },
        { to: "/admin/warga", label: "Manajemen Warga", icon: <IconUsers /> },
      ],
    },
    {
      group: "Keuangan",
      items: [
        { to: "/admin/iuran", label: "Iuran Warga", icon: <IconWallet /> },
        { to: "/admin/kategori-iuran", label: "Kategori Iuran", icon: <IconWallet /> },
        { to: "/admin/keuangan", label: "Rekap Keuangan", icon: <IconWallet /> },
      ],
    },
    {
      group: "Layanan",
      items: [
        { to: "/admin/laporan", label: "Laporan Warga", icon: <IconFlag /> },
        { to: "/admin/pengumuman", label: "Pengumuman", icon: <IconBell /> },
        { to: "/admin/surat", label: "Surat Pengantar", icon: <IconDoc /> },
      ],
    },
    {
      group: "Lainnya",
      items: [
        { to: "/admin/darurat", label: "Darurat", icon: <IconPhone /> },
        { to: "/pengaturan", label: "Pengaturan", icon: <IconSettings /> },
      ],
    },
  ],
  bendahara: [
    {
      group: "Utama",
      items: [
        { to: "/bendahara/dashboard", label: "Dashboard", icon: <IconGrid /> },
      ],
    },
    {
      group: "Keuangan",
      items: [
        { to: "/bendahara/iuran", label: "Iuran Warga", icon: <IconWallet /> },
        { to: "/admin/kategori-iuran", label: "Kategori Iuran", icon: <IconWallet /> },
        { to: "/bendahara/keuangan", label: "Rekap Keuangan", icon: <IconWallet /> },
      ],
    },
    {
      group: "Layanan",
      items: [
        { to: "/admin/laporan", label: "Laporan Warga", icon: <IconFlag /> },
      ],
    },
    {
      group: "Lainnya",
      items: [
        { to: "/admin/darurat", label: "Darurat", icon: <IconPhone /> },
        { to: "/pengaturan", label: "Pengaturan", icon: <IconSettings /> },
      ],
    },
  ],
  warga: [
    {
      group: "Utama",
      items: [
        { to: "/warga/dashboard", label: "Dashboard", icon: <IconGrid /> },
      ],
    },
    {
      group: "Tagihan",
      items: [
        { to: "/warga/tagihan", label: "Tagihan Saya", icon: <IconWallet /> },
      ],
    },
    {
      group: "Layanan",
      items: [
        { to: "/warga/laporan", label: "Buat Laporan", icon: <IconFlag /> },
        { to: "/warga/surat", label: "Surat Pengantar", icon: <IconDoc /> },
        { to: "/warga/pengumuman", label: "Pengumuman", icon: <IconBell /> },
      ],
    },
    {
      group: "Lainnya",
      items: [
        { to: "/warga/darurat", label: "Riwayat Darurat", icon: <IconPhone /> },
        { to: "/pengaturan", label: "Pengaturan", icon: <IconSettings /> },
      ],
    },
  ],
};

const ROLE_LABELS = {
  admin: "Admin RT",
  bendahara: "Bendahara",
  warga: "Warga",
};

// ─── Icon Components ──────────────────────────────────────────────────────────
function IconGrid() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function IconTrash() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}
function IconHeart() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
function IconWallet() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="2" y="5" width="20" height="15" rx="2" />
      <path d="M16 10h.01" />
      <path d="M2 10h20" />
    </svg>
  );
}
function IconFlag() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}
function IconBell() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function IconDoc() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}
function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
function IconMenu() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
function IconClose() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function IconChevron() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
function IconSun() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}
function IconMoon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
function IconWarning() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

// ─── Page title dari path ─────────────────────────────────────────────────────
// ✅ FIX: Gunakan exact match atau startsWith dengan slash
function usePageTitle(menus) {
  const location = useLocation();
  const allItems = menus.flatMap((g) => g.items);
  // Sort by length descending supaya path panjang dicek dulu
  const sorted = [...allItems].sort((a, b) => b.to.length - a.to.length);
  const match = sorted.find(
    (item) =>
      location.pathname === item.to ||
      location.pathname.startsWith(item.to + "/"),
  );
  return match?.label || "Dashboard";
}

// ─── Avatar Initials ──────────────────────────────────────────────────────────
function Avatar({ nama, foto_url, size = "md" }) {
  const initials = nama
    ? nama
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";
  if (foto_url) {
    return (
      <img
        src={foto_url}
        alt={nama}
        className={`apl-avatar apl-avatar--${size}`}
      />
    );
  }
  return (
    <div className={`apl-avatar apl-avatar--initials apl-avatar--${size}`}>
      {initials}
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar({ user, menus, isOpen, onClose, onLogout, loggingOut }) {
  const sidebarRef = useRef(null);

  // Close on outside click (mobile)
  useEffect(() => {
    function handleClick(e) {
      if (
        isOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`apl-overlay ${isOpen ? "apl-overlay--visible" : ""}`}
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <aside
        ref={sidebarRef}
        className={`apl-sidebar ${isOpen ? "apl-sidebar--open" : ""}`}
      >
        {/* Brand */}
        <div className="apl-brand">
          <div className="apl-brand__logo">
            <svg viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="var(--clr-primary)" />
              <path d="M20 8L28 14V26L20 32L12 26V14L20 8Z" fill="white" fillOpacity="0.95" />
              <circle cx="20" cy="20" r="4" fill="var(--clr-primary)" opacity="0.9" />
            </svg>
          </div>
          <div className="apl-brand__text">
            <span className="apl-brand__title">RT-003</span>
            <span className="apl-brand__sub">Portal Warga</span>
          </div>
          <button className="apl-sidebar__close" onClick={onClose}>
            <IconClose />
          </button>
        </div>

        {/* User card */}
        <div className="apl-user-card">
          <div className="apl-user-card__avatar">
            <Avatar nama={user?.nama} foto_url={user?.foto_url} size="md" />
          </div>
          <div className="apl-user-card__info">
            <span className="apl-user-card__name">{user?.nama || "—"}</span>
            <span className="apl-user-card__role">
              <span className={`apl-user-card__badge apl-user-card__badge--${user?.role}`} />
              {ROLE_LABELS[user?.role] || user?.role}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="apl-nav">
          {menus.map((group) => (
            <div key={group.group} className="apl-nav__group">
              <span className="apl-nav__group-label">{group.group}</span>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `apl-nav__item ${isActive ? "apl-nav__item--active" : ""}`
                  }
                  onClick={onClose}
                >
                  <span className="apl-nav__icon">{item.icon}</span>
                  <span className="apl-nav__label">{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="apl-sidebar__footer">
          <button
            className="apl-logout-btn"
            onClick={onLogout}
            disabled={loggingOut}
          >
            {loggingOut ? <span className="apl-spinner" /> : <IconLogout />}
            {loggingOut ? "Keluar..." : "Keluar"}
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────
function Topbar({
  user,
  pageTitle,
  onMenuClick,
  notifCount,
  onNotifClick,
  onAvatarClick,
  showUserDropdown,
  onLogout,
  loggingOut,
  dropdownRef,
  showNotifDropdown,
  onNotifClose,
  notifWrapRef,
}) {
  return (
    <header className="apl-topbar">
      {/* Left: hamburger + title */}
      <div className="apl-topbar__left">
        <button
          className="apl-hamburger"
          onClick={onMenuClick}
          aria-label="Toggle menu"
        >
          <IconMenu />
        </button>
        <div className="apl-topbar__title-wrap">
          <h1 className="apl-topbar__title">{pageTitle}</h1>
        </div>
      </div>

      {/* Right: notif + avatar */}
      <div className="apl-topbar__right">
        {/* Notification bell */}
        <div className="apl-notif-wrap" ref={notifWrapRef}>
          <button
            className="apl-topbar__btn"
            onClick={onNotifClick}
            aria-label="Notifikasi"
          >
            <IconBell />
            {notifCount > 0 && (
              <span className="apl-notif-badge">
                {notifCount > 9 ? "9+" : notifCount}
              </span>
            )}
          </button>
          {showNotifDropdown && <NotificationDropdown onClose={onNotifClose} />}
        </div>

        {/* Avatar dropdown */}
        <div className="apl-avatar-wrap" ref={dropdownRef}>
          <button
            className="apl-topbar__btn apl-topbar__btn--avatar"
            onClick={onAvatarClick}
          >
            <Avatar nama={user?.nama} foto_url={user?.foto_url} size="sm" />
            <span className="apl-topbar__username">
              {user?.nama?.split(" ")[0]}
            </span>
            <span
              className={`apl-topbar__chevron ${showUserDropdown ? "apl-topbar__chevron--open" : ""}`}
            >
              <IconChevron />
            </span>
          </button>

          {showUserDropdown && (
            <div className="apl-dropdown">
              <div className="apl-dropdown__header">
                <Avatar nama={user?.nama} foto_url={user?.foto_url} size="md" />
                <div>
                  <p className="apl-dropdown__name">{user?.nama}</p>
                  <p className="apl-dropdown__email">{user?.email}</p>
                </div>
              </div>
              <div className="apl-dropdown__divider" />
              <button
                className="apl-dropdown__item apl-dropdown__item--danger"
                onClick={onLogout}
                disabled={loggingOut}
              >
                <IconLogout />
                {loggingOut ? "Keluar..." : "Keluar"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// ─── Main AppLayout ───────────────────────────────────────────────────────────
export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(() => getCachedUser());
  const [authStatus, setAuthStatus] = useState(() => getCachedUser() ? "ok" : "loading");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const dropdownRef = useRef(null);
  const notifWrapRef = useRef(null);

  const menus = MENUS[user?.role] || [];
  const pageTitle = usePageTitle(menus);

  // Scroll ke atas tiap ganti halaman
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Fetch current user (skip kalo udah di-cache)
  useEffect(() => {
    if (getCachedUser()) return;
    let cancelled = false;
    async function fetchUser() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Unauthorized");
        const data = await res.json();
        if (!cancelled) {
          setUser(data.user);
          setAuthStatus("ok");
        }
      } catch {
        if (!cancelled) setAuthStatus("unauthorized");
      }
    }
    fetchUser();
    return () => {
      cancelled = true;
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowUserDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close notification dropdown on outside click (pake 'mousedown' biar gak tabrakan sama state toggle)
  useEffect(() => {
    function handleNotifClick(e) {
      if (!showNotifDropdown) return;
      if (
        notifWrapRef.current &&
        !notifWrapRef.current.contains(e.target) &&
        !e.target.closest(".notif-dropdown")
      ) {
        setShowNotifDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleNotifClick);
    return () => document.removeEventListener("mousedown", handleNotifClick);
  }, [showNotifDropdown]);

  // Close sidebar on resize to desktop
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    const root = document.querySelector(".apl-root");
    if (!root) return;
    if (sidebarOpen && window.innerWidth < 1024) {
      root.classList.add("apl-root--sidebar-open");
    } else {
      root.classList.remove("apl-root--sidebar-open");
    }
  }, [sidebarOpen]);

  // Fetch unread notification count
  useEffect(() => {
    async function fetchUnread() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/notifikasi`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          setNotifCount(data.unread_count);
        }
      } catch {}
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    clearAuthCache();
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      navigate("/login", { replace: true });
    }
  }

  // Loading state
  if (authStatus === "loading") {
    return (
      <div className="apl-loading">
        <div className="apl-loading__spinner" />
        <p className="apl-loading__text">Memuat...</p>
      </div>
    );
  }

  // Unauthorized
  if (authStatus === "unauthorized") {
    return (
      <div className="apl-error">
        <div className="apl-error__icon">
          <IconWarning />
        </div>
        <p className="apl-error__text">Sesi telah berakhir.</p>
        <button
          className="apl-error__btn"
          onClick={() => navigate("/login", { replace: true })}
        >
          Kembali ke Login
        </button>
      </div>
    );
  }

  return (
    <div className="apl-root">
      <Sidebar
        user={user}
        menus={menus}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        loggingOut={loggingOut}
      />

      <div className="apl-main">
        <Topbar
          user={user}
          pageTitle={pageTitle}
          onMenuClick={() => setSidebarOpen(true)}
          notifCount={notifCount}
          onNotifClick={() => setShowNotifDropdown((v) => !v)}
          onAvatarClick={() => setShowUserDropdown((v) => !v)}
          showUserDropdown={showUserDropdown}
          onLogout={handleLogout}
          loggingOut={loggingOut}
          dropdownRef={dropdownRef}
          showNotifDropdown={showNotifDropdown}
          onNotifClose={() => setShowNotifDropdown(false)}
          notifWrapRef={notifWrapRef}
        />

        <main className="apl-content" key={location.key}>{children}</main>
      </div>

      <EmergencyFab user={user} />
    </div>
  );
}
