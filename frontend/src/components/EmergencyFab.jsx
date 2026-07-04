import { useState, useRef, useEffect } from "react";
import { AlertTriangle, Phone, MapPin, Loader, X } from "lucide-react";
import "../assets/style/css/EmergencyFab.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

export default function EmergencyFab({ user }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState(null);
  const [coordsError, setCoordsError] = useState("");
  const [activeAlertId, setActiveAlertId] = useState(null);
  const [toast, setToast] = useState(null);
  const modalRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setShowModal(false);
      }
    }
    if (showModal) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showModal]);

  // Check if user has an active alert
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function check() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/darurat/saya`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled && json.success) {
          const active = json.data.find((a) => a.status === "active");
          if (active) setActiveAlertId(active.id);
        }
      } catch {}
    }
    check();
    return () => { cancelled = true; };
  }, [user]);

  function getLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation tidak didukung browser"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }),
        (err) => {
          const messages = {
            1: "Izinkan akses lokasi di pengaturan browser",
            2: "Lokasi tidak tersedia",
            3: "Waktu habis, coba lagi",
          };
          reject(new Error(messages[err.code] || "Gagal mendapat lokasi"));
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    });
  }

  async function handleSend() {
    setLoading(true);
    setCoordsError("");
    try {
      const loc = await getLocation();
      setCoords(loc);

      const res = await fetch(`${API_BASE_URL}/api/darurat`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: loc.latitude, longitude: loc.longitude }),
      });
      const json = await res.json();

      if (json.success) {
        showToast(json.message);
        setActiveAlertId(json.data.id);
        setShowModal(false);
      } else {
        showToast(json.message, "error");
      }
    } catch (err) {
      setCoordsError(err.message);
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!activeAlertId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/darurat/${activeAlertId}/resolve`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (json.success) {
        showToast("Sinyal darurat dibatalkan");
        setActiveAlertId(null);
      }
    } catch {
      showToast("Gagal membatalkan", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {toast && (
        <div className={`efab-toast efab-toast--${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* FAB button */}
      {activeAlertId ? (
        <button
          className="efab efab--active"
          onClick={() => setShowModal(true)}
          title="Sinyal darurat aktif"
        >
          <span className="efab__pulse" />
          <Phone size={22} />
        </button>
      ) : (
        <button
          className="efab"
          onClick={() => setShowModal(true)}
          title="Tombol Darurat"
        >
          <AlertTriangle size={22} />
        </button>
      )}

      {/* Modal */}
      {showModal && (
        <div className="efab-overlay">
          <div className="efab-modal" ref={modalRef}>
            <button className="efab-modal__close" onClick={() => setShowModal(false)}>
              <X size={18} />
            </button>

            <div className="efab-modal__icon">
              {activeAlertId ? (
                <Phone size={40} className="efab-icon--active" />
              ) : (
                <AlertTriangle size={40} className="efab-icon--danger" />
              )}
            </div>

            <h2 className="efab-modal__title">
              {activeAlertId ? "Sinyal Darurat Aktif" : "Kirim Sinyal Darurat?"}
            </h2>

            <p className="efab-modal__desc">
              {activeAlertId
                ? "Sinyal daruratmu sedang diproses oleh pengurus RT. Klik tombol di bawah untuk membatalkan."
                : "Tombol ini akan mengirim sinyal darurat beserta lokasi kamu saat ini ke pengurus RT."}
            </p>

            {coords && (
              <div className="efab-coords">
                <MapPin size={14} />
                <a
                  href={`https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}
                </a>
              </div>
            )}

            {coordsError && <p className="efab-error">{coordsError}</p>}

            <div className="efab-modal__actions">
              {activeAlertId ? (
                <button
                  className="efab-btn efab-btn--cancel"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  {loading ? <Loader size={18} className="efab-spin" /> : null}
                  Batalkan Sinyal
                </button>
              ) : (
                <>
                  <button
                    className="efab-btn efab-btn--secondary"
                    onClick={() => setShowModal(false)}
                    disabled={loading}
                  >
                    Batal
                  </button>
                  <button
                    className="efab-btn efab-btn--primary"
                    onClick={handleSend}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader size={18} className="efab-spin" />
                    ) : (
                      <AlertTriangle size={18} />
                    )}
                    {loading ? "Mengirim..." : "Kirim Sinyal"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
