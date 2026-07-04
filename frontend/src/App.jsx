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
import ManajemenWarga from "./pages/admin/ManajemenWarga";
import UangSampah from "./pages/admin/UangSampah";
import UangQurban from "./pages/admin/UangQurban";
import Keuangan from "./pages/admin/Keuangan";
import ManajemenLaporan from "./pages/admin/ManajemenLaporan";
import AdminPengumuman from "./pages/admin/Pengumuman";
import AdminSurat from "./pages/admin/Surat";
import AdminDarurat from "./pages/admin/Darurat";
import Settings from "./pages/Settings";
import LaporanWarga from "./pages/warga/LaporanWarga";
import WargaPengumuman from "./pages/warga/Pengumuman";
import WargaSurat from "./pages/warga/Surat";
import RiwayatDarurat from "./pages/warga/RiwayatDarurat";
import BendaharaDashboard from "./pages/bendahara/BendaharaDashboard";
import WargaDashboard from "./pages/warga/WargaDashboard";

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
      <Route
        path="/admin/sampah"
        element={
          <ProtectedPage allowedRoles={["admin", "bendahara"]}>
            <UangSampah />
          </ProtectedPage>
        }
      />
      <Route
        path="/admin/kurban"
        element={
          <ProtectedPage allowedRoles={["admin", "bendahara"]}>
            <UangQurban />
          </ProtectedPage>
        }
      />
      <Route
        path="/admin/keuangan"
        element={
          <ProtectedPage allowedRoles={["admin", "bendahara"]}>
            <Keuangan />
          </ProtectedPage>
        }
      />
      <Route
        path="/admin/laporan"
        element={
          <ProtectedPage allowedRoles={["admin", "bendahara"]}>
            <ManajemenLaporan />
          </ProtectedPage>
        }
      />
      <Route
        path="/admin/pengumuman"
        element={
          <ProtectedPage allowedRoles={["admin", "bendahara"]}>
            <AdminPengumuman />
          </ProtectedPage>
        }
      />
      <Route
        path="/admin/surat"
        element={
          <ProtectedPage allowedRoles={["admin", "bendahara"]}>
            <AdminSurat />
          </ProtectedPage>
        }
      />
      <Route
        path="/admin/darurat"
        element={
          <ProtectedPage allowedRoles={["admin", "bendahara"]}>
            <AdminDarurat />
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
      <Route
        path="/bendahara/sampah"
        element={
          <ProtectedPage allowedRoles={["bendahara", "admin"]}>
            <UangSampah />
          </ProtectedPage>
        }
      />
      <Route
        path="/bendahara/kurban"
        element={
          <ProtectedPage allowedRoles={["bendahara", "admin"]}>
            <UangQurban />
          </ProtectedPage>
        }
      />
      <Route
        path="/bendahara/keuangan"
        element={
          <ProtectedPage allowedRoles={["bendahara", "admin"]}>
            <Keuangan />
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
      <Route
        path="/warga/laporan"
        element={
          <ProtectedPage allowedRoles={["warga"]}>
            <LaporanWarga />
          </ProtectedPage>
        }
      />
      <Route
        path="/warga/pengumuman"
        element={
          <ProtectedPage allowedRoles={["warga"]}>
            <WargaPengumuman />
          </ProtectedPage>
        }
      />
      <Route
        path="/warga/surat"
        element={
          <ProtectedPage allowedRoles={["warga"]}>
            <WargaSurat />
          </ProtectedPage>
        }
      />
      <Route
        path="/warga/darurat"
        element={
          <ProtectedPage allowedRoles={["warga"]}>
            <RiwayatDarurat />
          </ProtectedPage>
        }
      />

      {/* ── Pengaturan (semua role) ── */}
      <Route
        path="/pengaturan"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Settings />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* ── Catch-all ── */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
