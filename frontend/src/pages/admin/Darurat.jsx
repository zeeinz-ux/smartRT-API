import { useState, useEffect, useCallback, useRef } from "react";
import { Phone, MapPin, Clock, CheckCircle2, Loader, ExternalLink, AlertTriangle } from "lucide-react";
import "../../assets/style/css/Darurat.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

function formatDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function timeAgo(d) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return formatDate(d);
}

export default function AdminDarurat() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("active");
  const prevCountRef = useRef(0);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchActive = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/darurat/active`, {
        credentials: "include",
      });
      const json = await res.json();
      if (json.success) {
        setAlerts(json.data);
        // Notify on new alert
        if (prevCountRef.current > 0 && json.data.length > prevCountRef.current) {
          showToast("Sinyal darurat baru masuk!", "alert");
        }
        prevCountRef.current = json.data.length;
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/laporan?limit=50`, {
        credentials: "include",
      });
      const json = await res.json();
      if (json.success) {
        setHistory(json.data.filter((l) => l.status === "selesai" || l.status === "ditolak"));
      }
    } catch {}
  }, []);

  // Poll every 5s for active alerts
  useEffect(() => {
    fetchActive();
    const interval = setInterval(fetchActive, 5000);
    return () => clearInterval(interval);
  }, [fetchActive]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  async function handleResolve(id) {
    setResolvingId(id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/darurat/${id}/resolve`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (json.success) {
        showToast("Sinyal darurat telah ditangani");
        setAlerts((prev) => prev.filter((a) => a.id !== id));
        prevCountRef.current -= 1;
      } else {
        showToast(json.message, "error");
      }
    } catch {
      showToast("Gagal menangani sinyal", "error");
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <div className="ad-panel">
      {toast && (
        <div className={`ad-toast ad-toast--${toast.type}`}>
          {toast.type === "alert" ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="ad-header">
        <div>
          <h1 className="ad-header__title">Darurat</h1>
          <p className="ad-header__sub">Pantau sinyal darurat warga secara real-time</p>
        </div>
        <div className="ad-badge-group">
          <span className={`ad-badge ${alerts.length > 0 ? "ad-badge--danger" : "ad-badge--safe"}`}>
            {alerts.length > 0 ? `${alerts.length} Aktif` : "Aman"}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="ad-tabs">
        <button
          className={`ad-tab ${activeTab === "active" ? "ad-tab--active" : ""}`}
          onClick={() => setActiveTab("active")}
        >
          <Phone size={16} />
          Aktif {alerts.length > 0 && <span className="ad-tab__count">{alerts.length}</span>}
        </button>
      </div>

      {/* Active Alerts */}
      {activeTab === "active" && (
        <>
          {loading ? (
            <div className="ad-empty">
              <Loader size={24} className="ad-spin" />
              <p>Memuat...</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="ad-empty">
              <CheckCircle2 size={40} className="ad-empty__icon" />
              <p className="ad-empty__title">Tidak ada sinyal darurat aktif</p>
              <p className="ad-empty__sub">Semua warga dalam keadaan aman</p>
            </div>
          ) : (
            <div className="ad-list">
              {alerts.map((alert) => (
                <div key={alert.id} className="ad-card">
                  <div className="ad-card__pulse" />
                  <div className="ad-card__body">
                    <div className="ad-card__top">
                      <span className="ad-card__name">{alert.user?.nama || "—"}</span>
                      <span className="ad-card__time">
                        <Clock size={12} />
                        {timeAgo(alert.created_at)}
                      </span>
                    </div>
                    {alert.user?.no_hp && (
                      <span className="ad-card__phone">{alert.user.no_hp}</span>
                    )}
                    <div className="ad-card__coords">
                      <MapPin size={14} />
                      <a
                        href={`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {Number(alert.latitude).toFixed(6)}, {Number(alert.longitude).toFixed(6)}
                        <ExternalLink size={12} />
                      </a>
                    </div>
                    {alert.keterangan && (
                      <p className="ad-card__keterangan">{alert.keterangan}</p>
                    )}
                    <button
                      className="ad-card__resolve"
                      onClick={() => handleResolve(alert.id)}
                      disabled={resolvingId === alert.id}
                    >
                      {resolvingId === alert.id ? (
                        <Loader size={16} className="ad-spin" />
                      ) : (
                        <CheckCircle2 size={16} />
                      )}
                      {resolvingId === alert.id ? "Memproses..." : "Tandai Selesai"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
