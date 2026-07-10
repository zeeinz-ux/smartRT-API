import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, X, ChevronLeft, ChevronRight, Send, Edit3, Clock, CheckCircle2, AlertCircle, Upload, Camera, Trash } from "lucide-react";
import CameraCapture from "../../components/CameraCapture";
import { formatDateTime } from "../../utils/formatDate.js";
import "../../assets/style/css/LaporanWarga.css";
import API_BASE_URL from "../../utils/api.js";

export default function LaporanWarga() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState("");
  const [toast, setToast] = useState(null);

  const [showFormModal, setShowFormModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [form, setForm] = useState({ judul: "", isi: "", foto: "" });
  const [fotoFrom, setFotoFrom] = useState(null); // "modal" | "edit"

  const fileInputRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(statusFilter && { status: statusFilter }),
      });
      const res = await fetch(`${API_BASE_URL}/api/warga/laporan?${params}`, { credentials: "include" });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setPagination((prev) => ({ ...prev, ...json.pagination }));
      }
    } catch {
      showToast("Gagal memuat data", "error");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const uploadFile = async (file) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_BASE_URL}/api/upload`, { method: "POST", credentials: "include", body: fd });
      const json = await res.json();
      if (json.success) {
        setForm((prev) => ({ ...prev, foto: json.data.url }));
        showToast("Foto berhasil diupload");
      } else {
        showToast(json.message, "error");
      }
    } catch {
      showToast("Gagal upload foto", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  const openAddModal = () => {
    setEditing(null);
    setForm({ judul: "", isi: "", foto: "" });
    setShowFormModal(true);
  };

  const openEditModal = (item) => {
    setEditing(item);
    setForm({ judul: item.judul, isi: item.isi, foto: item.foto || "" });
    setShowEditModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const url = editing
        ? `${API_BASE_URL}/api/warga/laporan/${editing.id}`
        : `${API_BASE_URL}/api/warga/laporan`;
      const method = editing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (json.success) {
        showToast(editing ? "Laporan berhasil diupdate" : "Laporan berhasil dikirim");
        setShowFormModal(false);
        setShowEditModal(false);
        fetchData();
      } else {
        showToast(json.message || "Gagal menyimpan", "error");
      }
    } catch {
      showToast("Gagal menyimpan", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const statusIcon = (s) => {
    if (s === "diproses") return <Clock size={14} />;
    if (s === "selesai") return <CheckCircle2 size={14} />;
    return <AlertCircle size={14} />;
  };

  const statusLabel = (s) => {
    if (s === "diproses") return "Diproses";
    if (s === "selesai") return "Selesai";
    return "Ditolak";
  };

  const UploadSection = ({ source }) => (
    <div className="lw-upload-area">
      <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileSelect} hidden />
      <div className="lw-upload-buttons">
        <button type="button" className="lw-upload-btn" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          <Upload size={16} /> {uploading ? "Mengupload..." : "Pilih dari Galeri"}
        </button>
        <button type="button" className="lw-upload-btn lw-upload-btn--camera" onClick={() => { setFotoFrom(source); setShowCamera(true); }}>
          <Camera size={16} /> Kamera
        </button>
      </div>
      {form.foto && (
        <div className="lw-upload-preview">
          <img src={`${API_BASE_URL}${form.foto}`} alt="Preview" />
          <button type="button" className="lw-upload-preview__remove" onClick={() => setForm({ ...form, foto: "" })}>
            <Trash size={14} />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="laporan-warga">
      {toast && <div className={`toast toast--${toast.type}`}>{toast.message}</div>}

      <div className="lw-header">
        <div className="lw-header__left">
          <h1 className="lw-header__title">Laporan Saya</h1>
          <p className="lw-header__subtitle">Kirim dan pantau laporan anda</p>
        </div>
        <div className="lw-header__right">
          <button className="lw-btn-add" onClick={openAddModal}>
            <Plus size={16} /> Buat Laporan
          </button>
        </div>
      </div>

      <div className="lw-filters">
        <div className="lw-filter">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}>
            <option value="">Semua Status</option>
            <option value="diproses">Diproses</option>
            <option value="selesai">Selesai</option>
            <option value="ditolak">Ditolak</option>
          </select>
        </div>
      </div>

      <div className="lw-list">
        {isLoading ? (
          <div className="lw-loading"><div className="lw-loading__spinner" /><p>Memuat data...</p></div>
        ) : data.length === 0 ? (
          <div className="lw-empty">
            <p>Belum ada laporan. Klik "Buat Laporan" untuk mengirim laporan baru.</p>
          </div>
        ) : (
          data.map((item) => (
            <div key={item.id} className={`lw-card lw-card--${item.status}`}>
              <div className="lw-card__header">
                <h3 className="lw-card__title">{item.judul}</h3>
                <span className={`lw-status-badge lw-status-badge--${item.status}`}>
                  {statusIcon(item.status)} {statusLabel(item.status)}
                </span>
              </div>
              <p className="lw-card__isi">{item.isi}</p>
              {item.foto && (
                <div className="lw-card__foto">
                  <img src={`${API_BASE_URL}${item.foto}`} alt="Foto laporan" />
                </div>
              )}
              <div className="lw-card__meta">
                <span className="lw-card__date">{formatDateTime(item.created_at)}</span>
                {item.status === "diproses" && (
                  <button className="lw-btn-edit" onClick={() => openEditModal(item)}>
                    <Edit3 size={14} /> Edit
                  </button>
                )}
              </div>
              {item.tanggapan && (
                <div className="lw-card__tanggapan">
                  <strong>Tanggapan:</strong>
                  <p>{item.tanggapan}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="lw-pagination">
          <span className="lw-pagination__info">{pagination.total} laporan</span>
          <div className="lw-pagination__controls">
            <button className="lw-pagination__btn" disabled={pagination.page <= 1} onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>
              <ChevronLeft size={14} />
            </button>
            <span className="lw-pagination__page">{pagination.page} / {pagination.totalPages}</span>
            <button className="lw-pagination__btn" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL: Add Laporan ── */}
      {showFormModal && (
        <div className="modal-overlay" onClick={() => setShowFormModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Buat Laporan Baru</h2>
              <button className="modal__close" onClick={() => setShowFormModal(false)}><X size={20} /></button>
            </div>
            <form className="modal__body" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Judul Laporan *</label>
                <input type="text" value={form.judul} onChange={(e) => setForm((p) => ({ ...p, judul: e.target.value }))} required placeholder="Contoh: Jalan berlubang" />
              </div>
              <div className="form-group">
                <label>Isi Laporan *</label>
                <textarea value={form.isi} onChange={(e) => setForm((p) => ({ ...p, isi: e.target.value }))} required placeholder="Jelaskan detail laporan anda..." rows={4} />
              </div>
              <div className="form-group">
                <label>Foto (opsional)</label>
                <UploadSection source="modal" />
              </div>
              <div className="modal__footer">
                <button type="button" className="btn-secondary" onClick={() => setShowFormModal(false)}>Batal</button>
                <button type="submit" className="btn-primary" disabled={actionLoading || uploading}>
                  {actionLoading ? "Mengirim..." : <><Send size={14} /> Kirim Laporan</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Edit Laporan ── */}
      {showEditModal && editing && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Edit Laporan</h2>
              <button className="modal__close" onClick={() => setShowEditModal(false)}><X size={20} /></button>
            </div>
            <form className="modal__body" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Judul Laporan *</label>
                <input type="text" value={form.judul} onChange={(e) => setForm((p) => ({ ...p, judul: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Isi Laporan *</label>
                <textarea value={form.isi} onChange={(e) => setForm((p) => ({ ...p, isi: e.target.value }))} required rows={4} />
              </div>
              <div className="form-group">
                <label>Foto (opsional)</label>
                <UploadSection source="edit" />
              </div>
              <div className="modal__footer">
                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>Batal</button>
                <button type="submit" className="btn-primary" disabled={actionLoading || uploading}>
                  {actionLoading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCamera && (
        <CameraCapture
          onCapture={(url) => setForm((prev) => ({ ...prev, foto: url }))}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}
