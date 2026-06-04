// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Footer from "./components/layouts/Footer";

import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/layouts/AppLayout";

// Auth pages
import Login from "./pages/auth/Login";
import OnBoardingform from "./pages/auth/OnBoardingform";

// Dashboard pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManajemenWarga from "./pages/admin/ManajemenWarga"; // ✅ TAMBAH

// Placeholder dashboards (buat sementara)
function BendaharaDashboard() {
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Dashboard Bendahara</h1>
      <p>Sedang dalam pengembangan...</p>
    </div>
  );
}

function WargaDashboard() {
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Dashboard Warga</h1>
      <p>Sedang dalam pengembangan...</p>
    </div>
  );
}

// Helper: wrap page dengan AppLayout + ProtectedRoute sekaligus
function ProtectedPage({ children, allowedRoles }) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      {/* ── Public ── */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      {/* ── Onboarding — perlu login, tapi tanpa AppLayout ── */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnBoardingform />
          </ProtectedRoute>
        }
      />

      {/* ── Admin ── */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedPage allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedPage>
        }
      />
      {/* ✅ TAMBAH: Route Manajemen Warga */}
      <Route
        path="/admin/warga"
        element={
          <ProtectedPage allowedRoles={["admin"]}>
            <ManajemenWarga />
          </ProtectedPage>
        }
      />

      {/* ── Bendahara ── */}
      <Route
        path="/bendahara/dashboard"
        element={
          <ProtectedPage allowedRoles={["bendahara", "admin"]}>
            <BendaharaDashboard />
          </ProtectedPage>
        }
      />

      {/* ── Warga ── */}
      <Route
        path="/warga/dashboard"
        element={
          <ProtectedPage allowedRoles={["warga"]}>
            <WargaDashboard />
          </ProtectedPage>
        }
      />

      {/* ── Catch-all ── */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
