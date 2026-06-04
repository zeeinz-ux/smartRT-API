// src/components/ProtectedRoute.jsx
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

export default function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const [status, setStatus] = useState("loading");
  const [user, setUser] = useState(null);
  const [requiresOnboarding, setRequiresOnboarding] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          credentials: "include",
        });

        if (!res.ok) {
          if (!cancelled) setStatus("unauthorized");
          return;
        }

        const data = await res.json();
        const currentUser = data.user;

        if (!cancelled) {
          setUser(currentUser);
          setRequiresOnboarding(data.requiresOnboarding || false);

          // Cek role jika allowedRoles diisi
          if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
            setStatus("forbidden");
          } else {
            setStatus("ok");
          }
        }
      } catch {
        if (!cancelled) setStatus("unauthorized");
      }
    }

    checkAuth();
    return () => {
      cancelled = true;
    };
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
