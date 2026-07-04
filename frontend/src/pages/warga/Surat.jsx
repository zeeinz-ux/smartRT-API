import { useState, useEffect, useCallback } from "react";
import { Plus, X, ChevronLeft, ChevronRight, Clock, CheckCircle2, AlertCircle, Download, FileText, Send } from "lucide-react";
import "../../assets/style/css/WargaSurat.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

function formatDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const JENIS_OPTIONS = [
  { value: "domisili", label: "Surat Keterangan Domisili" },
  { value: "kk", label: "Surat Pengantar KK" },
  { value: "ktp", label: "Surat Pengantar KTP" },
  { value: "tidak_mampu", label: "Surat Keterangan Tidak Mampu" },
  { value: "usaha", label: "Surat Keterangan Usaha" },
  { value: "izin_keramaian", label: "Surat Izin Keramaian" },
  { value: "lainnya", label: "Surat Keterangan Lainnya" },
];

export default function WargaSurat() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState("");
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [form, setForm] = useState({ jenis_surat: "", keperluan: "", keterangan: "" });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: pagination.page.toString(), limit: pagination.limit.toString(), ...(statusFilter && { status: statusFilter }) });
      const res = await fetch(`${API_BASE_URL}/api/warga/surat?${params}`, { credentials: "include" });
      const json = await res.json();
      if (json.success) { setData(json.data); setPagination((prev) => ({ ...prev, ...json.pagination })); }
    } catch { showToast("Gagal memuat data", "error"); }
    finally { setIsLoading(false); }
  }, [pagination.page, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.jenis_surat || !form.keperluan) { showToast("Lengkapi semua field", "error"); return; }
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/warga/surat`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) { showToast("Pengajuan berhasil dikirim"); setShowForm(false); setForm({ jenis_surat: "", keperluan: "", keterangan: "" }); fetchData(); }
      else { showToast(json.message, "error"); }
    } catch { showToast("Gagal", "error"); }
    finally { setActionLoading(false); }
  };

  const statusBadge = (s) => {
    if (s === "pending") return { label: "Pending", icon: Clock, cls: "ws-badge--pending" };
    if (s === "disetujui") return { label: "Disetujui", icon: CheckCircle2, cls: "ws-badge--approved" };
    return { label: "Ditolak", icon: AlertCircle, cls: "ws-badge--rejected" };
  };

  return (
    <div className="warga-surat">
      {toast && <div className={`toast toast--${toast.type}`}>{toast.message}</div>}

      <div className="ws-header">
        <div className="ws-header__left">
          <h1 className="ws-header__title">Surat Pengantar</h1>
          <p className="ws-header__subtitle">Ajukan surat pengantar secara online</p>
        </div>
        <button className="ws-btn-add" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Ajukan Surat
        </button>
      </div>

      <div className="ws-filters">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}>
          <option value="">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="disetujui">Disetujui</option>
          <option value="ditolak">Ditolak</option>
        </select>
      </div>

      {isLoading ? (
        <div className="ws-loading"><div className="ws-loading__spinner" /><p>Memuat data...</p></div>
      ) : data.length === 0 ? (
        <div className="ws-empty"><FileText size={48} /><p>Belum ada pengajuan surat</p></div>
      ) : (
        <>
          <div className="ws-list">
            {data.map((item) => {
              const sb = statusBadge(item.status);
              const Icon = sb.icon;
              return (
                <div key={item.id} className={`ws-card ws-card--${item.status}`}>
                  <div className="ws-card__header">
                    <div className="ws-card__info">
                      <h3 className="ws-card__jenis">{item.jenis_label}</h3>
                      <p className="ws-card__keperluan">{item.keperluan}</p>
                    </div>
                    <span className={`ws-badge ${sb.cls}`}><Icon size={12} /> {sb.label}</span>
                  </div>
                  {item.keterangan && <p className="ws-card__keterangan">{item.keterangan}</p>}
                  <div className="ws-card__footer">
                    <span className="ws-card__date">{formatDate(item.created_at)}</span>
                    <div className="ws-card__actions">
                      {item.nomor_surat && <span className="ws-card__nomor">{item.nomor_surat}</span>}
                      {item.file_pdf && (
                        <a href={`${API_BASE_URL}${item.file_pdf}`} target="_blank" rel="noopener noreferrer" className="ws-card__download" title="Download PDF">
                          <Download size={14} /> PDF
                        </a>
                      )}
                    </div>
                  </div>
                  {item.status === "ditolak" && item.alasan_tolak && (
                    <div className="ws-card__alasan">
                      <strong>Alasan:</strong> {item.alasan_tolak}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {pagination.totalPages > 1 && (
            <div className="ws-pagination">
              <span className="ws-pagination__info">{pagination.total} surat</span>
              <div className="ws-pagination__controls">
                <button className="ws-pagination__btn" disabled={pagination.page <= 1} onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>
                  <ChevronLeft size={14} />
                </button>
                <span className="ws-pagination__page">{pagination.page} / {pagination.totalPages}</span>
                <button className="ws-pagination__btn" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Ajukan Surat Pengantar</h2>
              <button className="modal__close" onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form className="modal__body" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Jenis Surat *</label>
                <select value={form.jenis_surat} onChange={(e) => setForm((p) => ({ ...p, jenis_surat: e.target.value }))} required>
                  <option value="">Pilih jenis surat...</option>
                  {JENIS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Keperluan *</label>
                <input type="text" value={form.keperluan} onChange={(e) => setForm((p) => ({ ...p, keperluan: e.target.value }))} required placeholder="Contoh: Pembuatan KTP" />
              </div>
              <div className="form-group">
                <label>Keterangan Tambahan (opsional)</label>
                <textarea value={form.keterangan} onChange={(e) => setForm((p) => ({ ...p, keterangan: e.target.value }))} rows={3} placeholder="Informasi tambahan jika diperlukan..." />
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--secondary" onClick={() => setShowForm(false)}>Batal</button>
                <button type="submit" className="btn btn--primary" disabled={actionLoading}>
                  {actionLoading ? "Mengirim..." : <><Send size={14} /> Ajukan Surat</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
