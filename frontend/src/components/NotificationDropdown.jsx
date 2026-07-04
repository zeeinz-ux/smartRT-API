import { useState, useEffect, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

const API_BASE_URL = import.meta.env.DEV ? "http://localhost:3333" : "";

export default function NotificationDropdown({ onClose }) {
  const [notifs, setNotifs] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const ref = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/notifikasi`, { credentials: "include" })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setNotifs(res.data);
          setUnreadCount(res.unread_count);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleMarkRead(id) {
    await fetch(`${API_BASE_URL}/api/notifikasi/${id}/read`, {
      method: "PATCH",
      credentials: "include",
    });
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function handleMarkAllRead() {
    await fetch(`${API_BASE_URL}/api/notifikasi/read-all`, {
      method: "PATCH",
      credentials: "include",
    });
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  const typeIcons = {
    emergency: "🚨",
    pengumuman: "📢",
    info: "ℹ️",
  };

  return (
    <div className="notif-dropdown" ref={ref}>
      <div className="notif-dropdown__header">
        <h3>Notifikasi</h3>
        {unreadCount > 0 && (
          <button
            className="notif-dropdown__mark-all"
            onClick={handleMarkAllRead}
          >
            Tandai semua dibaca
          </button>
        )}
      </div>

      <div className="notif-dropdown__body">
        {loading ? (
          <div className="notif-dropdown__empty">Memuat...</div>
        ) : notifs.length === 0 ? (
          <div className="notif-dropdown__empty">
            Belum ada notifikasi
          </div>
        ) : (
          notifs.map((n) => (
            <div
              key={n.id}
              className={`notif-dropdown__item ${!n.read ? "notif-dropdown__item--unread" : ""}`}
              onClick={() => !n.read && handleMarkRead(n.id)}
            >
              <span className="notif-dropdown__icon">
                {typeIcons[n.type] || typeIcons.info}
              </span>
              <div className="notif-dropdown__content">
                <p className="notif-dropdown__title">{n.title}</p>
                {n.message && (
                  <p className="notif-dropdown__message">{n.message}</p>
                )}
                <span className="notif-dropdown__time">
                  {formatDistanceToNow(new Date(n.created_at), {
                    addSuffix: true,
                    locale: id,
                  })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
