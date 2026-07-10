import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, FileText, AlertTriangle, CheckCircle2,
  Clock, Loader, Mail, Home,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3333";

export default function WargaDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`${API}/api/warga/dashboard`, {
          credentials: "include",
        });
        const json = await res.json();
        if (json.success) setDashboard(json.dashboard);
      } catch {} finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Loader size={32} className="ad-spin" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="ad-panel">
        <div className="ad-empty">
          <AlertTriangle size={32} className="ad-empty__icon" />
          <p className="ad-empty__title">Gagal memuat data</p>
        </div>
      </div>
    );
  }

  const statusBadge = {
    pending: { label: "Menunggu Verifikasi", color: "#f59e0b", bg: "#fef3c7" },
    verified: { label: "Terverifikasi", color: "#16a34a", bg: "#dcfce7" },
    rejected: { label: "Ditolak", color: "#dc2626", bg: "#fee2e2" },
    not_registered: { label: "Belum Daftar", color: "#6b7280", bg: "#f3f4f6" },
  };

  const badge = statusBadge[dashboard.verification_status] || statusBadge.not_registered;

  return (
    <div>
      {/* Header */}
      <div className="ad-header">
        <div>
          <h1 className="ad-header__title">Dashboard Warga</h1>
          <p className="ad-header__sub">Selamat datang, {dashboard.nama}</p>
        </div>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "6px 14px", borderRadius: 20,
          fontSize: "0.78rem", fontWeight: 600,
          color: badge.color, background: badge.bg,
        }}>
          {badge.label}
        </span>
      </div>

      {/* Info Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 24 }}>
        <div className="ad-card">
          <div className="ad-card__body" style={{ gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--clr-subtitle, #6b9278)", fontSize: "0.82rem" }}>
              <User size={16} /> Email
            </div>
            <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 500 }}>{dashboard.email || "—"}</p>
          </div>
        </div>

        <div className="ad-card" onClick={() => navigate("/warga/laporan")} style={{ cursor: "pointer" }}>
          <div className="ad-card__body" style={{ gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--clr-subtitle, #6b9278)", fontSize: "0.82rem" }}>
              <FileText size={16} /> Laporan
            </div>
            <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 500 }}>
              {dashboard.laporanDraft?.length || 0} draft
            </p>
          </div>
        </div>

        <div className="ad-card" onClick={() => navigate("/warga/surat")} style={{ cursor: "pointer" }}>
          <div className="ad-card__body" style={{ gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--clr-subtitle, #6b9278)", fontSize: "0.82rem" }}>
              <Clock size={16} /> Surat Pengantar
            </div>
            <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 500 }}>
              {dashboard.suratPending?.length || 0} pending
            </p>
          </div>
        </div>

        <div className="ad-card" onClick={() => navigate("/warga/tagihan")} style={{ cursor: "pointer" }}>
          <div className="ad-card__body" style={{ gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--clr-subtitle, #6b9278)", fontSize: "0.82rem" }}>
              <Home size={16} /> Tagihan Aktif
            </div>
            <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 500 }}>
              {dashboard.aktifTagihan?.length || 0} tagihan
            </p>
          </div>
        </div>
      </div>

      {/* Status Verifikasi */}
      {dashboard.verification_status === "pending" && (
        <div className="ad-card" style={{ marginTop: 24 }}>
          <div className="ad-card__body" style={{ gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#f59e0b" }}>
              <Clock size={18} />
              <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>Verifikasi Sedang Diproses</span>
            </div>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--clr-text-secondary, #4b5563)" }}>
              Data Anda sedang diperiksa oleh admin. Anda akan mendapat notifikasi setelah verifikasi selesai.
            </p>
          </div>
        </div>
      )}

      {dashboard.verification_status === "rejected" && (
        <div className="ad-card" style={{ marginTop: 24 }}>
          <div className="ad-card__body" style={{ gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#dc2626" }}>
              <AlertTriangle size={18} />
              <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>Verifikasi Ditolak</span>
            </div>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--clr-text-secondary, #4b5563)" }}>
              Silakan hubungi admin untuk informasi lebih lanjut.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
