import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Clock, FileText } from "lucide-react";
import { formatDateLong } from "../../utils/formatDate.js";
import "../../assets/style/css/WargaPengumuman.css";
import API_BASE_URL from "../../utils/api.js";

export default function WargaPengumuman() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [toast, setToast] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const showToast = (message, type = "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: pagination.page.toString(), limit: pagination.limit.toString() });
      const res = await fetch(`${API_BASE_URL}/api/warga/pengumuman?${params}`, { credentials: "include" });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setPagination((prev) => ({ ...prev, ...json.pagination }));
      }
    } catch {
      showToast("Gagal memuat pengumuman");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="warga-pengumuman">
      {toast && <div className={`toast toast--${toast.type}`}>{toast.message}</div>}

      <div className="wp-header">
        <div className="wp-header__left">
          <h1 className="wp-header__title">Pengumuman</h1>
          <p className="wp-header__subtitle">Informasi terbaru dari pengurus RT</p>
        </div>
      </div>

      {isLoading ? (
        <div className="wp-loading"><div className="wp-loading__spinner" /><p>Memuat pengumuman...</p></div>
      ) : data.length === 0 ? (
        <div className="wp-empty">
          <div className="wp-empty__icon"><FileText size={48} /></div>
          <p>Belum ada pengumuman</p>
        </div>
      ) : (
        <>
          <div className="wp-list">
            {data.map((item) => (
              <div key={item.id} className={`wp-card ${expanded === item.id ? "wp-card--expanded" : ""}`}
                onClick={() => setExpanded(expanded === item.id ? null : item.id)}>
                <div className="wp-card__header">
                  <h3 className="wp-card__judul">{item.judul}</h3>
                  <span className="wp-card__date"><Clock size={14} /> {formatDateLong(item.published_at)}</span>
                </div>
                <div className={`wp-card__body ${expanded === item.id ? "wp-card__body--open" : ""}`}>
                  <p className="wp-card__isi">{item.isi}</p>
                  {item.file && (
                    <div className="wp-card__file-section">
                      {item.file.match(/\.(jpg|jpeg|png|webp|gif|bmp)$/i) ? (
                        <img src={`${API_BASE_URL}${item.file}`} alt={item.judul} className="wp-card__img" />
                      ) : (
                        <a href={`${API_BASE_URL}${item.file}`} target="_blank" rel="noopener noreferrer" className="wp-card__file">
                          <FileText size={16} /> Lihat Lampiran
                        </a>
                      )}
                    </div>
                  )}
                </div>
                {expanded !== item.id && (
                  <div className="wp-card__expand-hint">Klik untuk membaca selengkapnya</div>
                )}
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="wp-pagination">
              <span className="wp-pagination__info">
                Halaman {pagination.page} dari {pagination.totalPages}
              </span>
              <div className="wp-pagination__controls">
                <button className="wp-pagination__btn" disabled={pagination.page <= 1}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>
                  <ChevronLeft size={16} />
                </button>
                <span className="wp-pagination__page">{pagination.page}</span>
                <button className="wp-pagination__btn" disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
