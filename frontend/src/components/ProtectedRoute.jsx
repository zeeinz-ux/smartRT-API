// src/components/ProtectedRoute.jsx
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

// Cache auth di module level biar gak fetch ulang tiap ganti route
let cachedUser = null;
let cachedRequiresOnboarding = false;
let fetchPromise = null;

export function getCachedUser() {
  return cachedUser;
}

export function clearAuthCache() {
  cachedUser = null;
  cachedRequiresOnboarding = false;
  fetchPromise = null;
}

async function fetchAuth() {
  if (fetchPromise) return fetchPromise;
  fetchPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        credentials: "include",
      });
      if (!res.ok) { clearAuthCache(); return null; }
      const data = await res.json();
      cachedUser = data.user;
      cachedRequiresOnboarding = data.requiresOnboarding || false;
      return data;
    } catch {
      clearAuthCache();
      return null;
    }
  })();
  return fetchPromise;
}

export default function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const [status, setStatus] = useState(() => {
    if (cachedUser) return "ok";
    return "loading";
  });
  const [user, setUser] = useState(cachedUser);
  const [requiresOnboarding, setRequiresOnboarding] = useState(cachedRequiresOnboarding);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      const data = await fetchAuth();
      if (cancelled) return;

      if (!cachedUser) {
        setStatus("unauthorized");
        return;
      }

      setUser(cachedUser);
      setRequiresOnboarding(cachedRequiresOnboarding);

      // Admin super user — bisa akses semuanya
      if (allowedRoles && cachedUser.role !== "admin" && !allowedRoles.includes(cachedUser.role)) {
        setStatus("forbidden");
      } else {
        setStatus("ok");
      }
    }

    if (!cachedUser) {
      checkAuth();
    } else {
      // Refresh di background — kalau session expired (clearAuthCache dipanggil), redirect
      fetchAuth().then((data) => {
        if (cancelled) return;
        if (!data) { setStatus("unauthorized"); return; }
        if (allowedRoles && cachedUser.role !== "admin" && !allowedRoles.includes(cachedUser.role)) {
          setStatus("forbidden");
        }
      });
    }

    return () => { cancelled = true; };
  }, [allowedRoles]);

  if (status === "loading") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#eaf5ee",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            border: "3px solid #d4eddc",
            borderTop: "3px solid #4a8c5c",
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (status === "unauthorized") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (status === "forbidden") {
    const roleHome = {
      admin: "/admin/dashboard",
      bendahara: "/bendahara/dashboard",
      warga: "/warga/dashboard",
    };
    return <Navigate to={roleHome[user?.role] || "/login"} replace />;
  }

  // ✅ TAMBAHAN: Redirect ke onboarding kalau warga belum onboarding
  if (requiresOnboarding && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // ✅ TAMBAHAN: Cegah warga yang sudah onboarding akses /onboarding lagi
  if (!requiresOnboarding && location.pathname === "/onboarding") {
    const roleHome = {
      admin: "/admin/dashboard",
      bendahara: "/bendahara/dashboard",
      warga: "/warga/dashboard",
    };
    return <Navigate to={roleHome[user?.role] || "/warga/dashboard"} replace />;
  }

  return children;
}
