import { useState, useEffect } from "react";
import { Clock, MapPin, CheckCircle2, Loader, AlertTriangle } from "lucide-react";
import "../../assets/style/css/Darurat.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

function formatDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function RiwayatDarurat() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/darurat/saya`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) setAlerts(data.data);
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="ad-panel">
        <div className="ad-empty">
          <Loader size={32} className="ad-spin" />
          <p className="ad-empty__sub">Memuat...</p>
        </div>
      </div>
    );
  }

  const active = alerts.filter((a) => a.status === "active");
  const resolved = alerts.filter((a) => a.status === "resolved");

  return (
    <div className="ad-panel">
      <div className="ad-header">
        <div>
          <h1 className="ad-header__title">Riwayat Darurat</h1>
          <p className="ad-header__sub">Daftar sinyal darurat yang pernah Anda kirim</p>
        </div>
        {active.length > 0 && (
          <span className="ad-badge ad-badge--danger">{active.length} Aktif</span>
        )}
      </div>

      {active.length > 0 && (
        <div className="ad-list">
          <h2 style={{ fontSize: "0.85rem", fontWeight: 600, color: "#dc2626", margin: "0 0 8px" }}>
            Belum Ditangani
          </h2>
          {active.map((a) => (
            <div key={a.id} className="ad-card">
              <div className="ad-card__pulse" />
              <div className="ad-card__body">
                <div className="ad-card__top">
                  <span style={{ fontWeight: 600, color: "#dc2626", fontSize: "0.82rem" }}>AKTIF</span>
                  <span className="ad-card__time"><Clock size={12} /> {formatDate(a.created_at)}</span>
                </div>
                {a.keterangan && <p className="ad-card__keterangan">{a.keterangan}</p>}
                <div className="ad-card__coords">
                  <MapPin size={14} /> {a.latitude}, {a.longitude}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="ad-list">
        <h2 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--clr-subtitle)", margin: active.length > 0 ? "16px 0 8px" : "0 0 8px" }}>
          Riwayat {resolved.length > 0 ? `(${resolved.length})` : ""}
        </h2>
        {resolved.length === 0 ? (
          <div className="ad-empty">
            <AlertTriangle size={32} className="ad-empty__icon" />
            <p className="ad-empty__title">Belum ada riwayat</p>
            <p className="ad-empty__sub">Sinyal darurat yang Anda kirim akan muncul di sini</p>
          </div>
        ) : (
          resolved.map((a) => (
            <div key={a.id} className="ad-card">
              <div className="ad-card__body">
                <div className="ad-card__top">
                  <span style={{ fontWeight: 600, color: "var(--clr-primary)", fontSize: "0.82rem" }}>SELESAI</span>
                  <span className="ad-card__time"><Clock size={12} /> {formatDate(a.created_at)}</span>
                </div>
                {a.keterangan && <p className="ad-card__keterangan">{a.keterangan}</p>}
                {a.resolved_at && (
                  <div className="ad-card__coords">
                    <CheckCircle2 size={14} style={{ color: "var(--clr-primary)" }} />
                    Ditangani {formatDate(a.resolved_at)}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
