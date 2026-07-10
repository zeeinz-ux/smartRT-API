import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, X, ChevronLeft, ChevronRight, Edit3, Trash2, Globe, FileText, Clock, Upload, Camera, Trash } from "lucide-react";
import CameraCapture from "../../components/CameraCapture";
import { formatDateTime } from "../../utils/formatDate.js";
import "../../assets/style/css/AdminPengumuman.css";
import API_BASE_URL from "../../utils/api.js";

function nowLocalISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function AdminPengumuman() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [toast, setToast] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [publishMode, setPublishMode] = useState("draft");
  const [scheduledDate, setScheduledDate] = useState("");
  const [form, setForm] = useState({ judul: "", isi: "", file: "" });
  const [showCamera, setShowCamera] = useState(false);

  const fileInputRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: pagination.page.toString(), limit: pagination.limit.toString() });
      const res = await fetch(`${API_BASE_URL}/api/admin/pengumuman?${params}`, { credentials: "include" });
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
  }, [pagination.page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const uploadFile = async (file) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_BASE_URL}/api/upload`, { method: "POST", credentials: "include", body: fd });
      const json = await res.json();
      if (json.success) {
        setForm((prev) => ({ ...prev, file: json.data.url }));
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

  const openCreate = () => {
    setEditingId(null);
    setForm({ judul: "", isi: "", file: "" });
    setPublishMode("draft");
    setScheduledDate("");
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({ judul: item.judul, isi: item.isi, file: item.file || "" });
    if (!item.published_at) {
      setPublishMode("draft");
      setScheduledDate("");
    } else {
      const d = new Date(item.published_at);
      const isPast = d <= new Date();
      if (isPast) {
        setPublishMode("publish");
        setScheduledDate("");
      } else {
        setPublishMode("schedule");
        const local = new Date(d);
        local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
        setScheduledDate(local.toISOString().slice(0, 16));
      }
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.judul || !form.isi) { showToast("Judul dan isi wajib diisi", "error"); return; }
    setActionLoading(true);
    try {
      let scheduled_at = null;
      if (publishMode === "publish") {
        scheduled_at = new Date().toISOString();
      } else if (publishMode === "schedule") {
        if (!scheduledDate) { showToast("Pilih tanggal jadwal", "error"); setActionLoading(false); return; }
        scheduled_at = new Date(scheduledDate).toISOString();
      }

      const url = editingId
        ? `${API_BASE_URL}/api/admin/pengumuman/${editingId}`
        : `${API_BASE_URL}/api/admin/pengumuman`;
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ ...form, scheduled_at }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        setShowModal(false);
        fetchData();
      } else {
        showToast(json.message, "error");
      }
    } catch {
      showToast("Gagal menyimpan", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Hapus pengumuman ini?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/pengumuman/${id}`, { method: "DELETE", credentials: "include" });
      const json = await res.json();
      if (json.success) {
        showToast("Pengumuman berhasil dihapus");
        fetchData();
      } else {
        showToast(json.message, "error");
      }
    } catch {
      showToast("Gagal menghapus", "error");
    }
  };

  const statusLabel = (s) => {
    if (s === "published") return { label: "Published", cls: "ap-status--published", icon: Globe };
    if (s === "scheduled") return { label: "Terjadwal", cls: "ap-status--scheduled", icon: Clock };
    return { label: "Draft", cls: "ap-status--draft", icon: FileText };
  };

  return (
    <div className="admin-pengumuman">
      {toast && <div className={`toast toast--${toast.type}`}>{toast.message}</div>}

      <div className="ap-header">
        <div className="ap-header__left">
          <h1 className="ap-header__title">Pengumuman</h1>
          <p className="ap-header__subtitle">Kelola pengumuman digital untuk warga</p>
        </div>
        <button className="ap-btn-add" onClick={openCreate}>
          <Plus size={18} /> Buat Pengumuman
        </button>
      </div>

      <div className="ap-table-section">
        {isLoading ? (
          <div className="ap-loading"><div className="ap-loading__spinner" /><p>Memuat data...</p></div>
        ) : data.length === 0 ? (
          <div className="ap-empty">Belum ada pengumuman</div>
        ) : (
          <>
            <div className="ap-table-wrapper">
              <table className="ap-table">
                <thead>
                  <tr>
                    <th>Judul</th>
                    <th>Status</th>
                    <th>Dibuat</th>
                    <th className="ap-col-schedule">Jadwal/Published</th>
                    <th className="ap-col-aksi">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item) => {
                    const st = statusLabel(item.status);
                    const Icon = st.icon;
                    return (
                      <tr key={item.id} className={item.status === "draft" ? "ap-row--draft" : ""}>
                        <td className="ap-cell-judul">
                          <span className="ap-judul-text">{item.judul}</span>
                          {item.file && <FileText size={14} className="ap-file-icon" />}
                        </td>
                        <td>
                          <span className={`ap-status-badge ${st.cls}`}>
                            <Icon size={12} /> {st.label}
                          </span>
                        </td>
                        <td className="ap-cell-date">{formatDateTime(item.created_at)}</td>
                        <td className="ap-cell-date ap-col-schedule">
                          {item.status === "scheduled"
                            ? formatDateTime(item.published_at)
                            : item.status === "published"
                            ? formatDateTime(item.published_at)
                            : "-"}
                        </td>
                        <td>
                          <div className="ap-actions">
                            <button className="ap-action-btn ap-action--edit" onClick={() => openEdit(item.id)} title="Edit">
                              <Edit3 size={16} />
                            </button>
                            <button className="ap-action-btn ap-action--delete" onClick={() => handleDelete(item.id)} title="Hapus">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <div className="ap-pagination">
                <span className="ap-pagination__info">
                  Halaman {pagination.page} dari {pagination.totalPages} ({pagination.total} total)
                </span>
                <div className="ap-pagination__controls">
                  <button className="ap-pagination__btn" disabled={pagination.page <= 1}
                    onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>
                    <ChevronLeft size={16} />
                  </button>
                  <span className="ap-pagination__page">{pagination.page}</span>
                  <button className="ap-pagination__btn" disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <div className="ap-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="ap-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ap-modal__header">
              <h2>{editingId ? "Edit Pengumuman" : "Buat Pengumuman"}</h2>
              <button className="ap-modal__close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="ap-modal__body">
              <div className="ap-field">
                <label>Judul</label>
                <input type="text" value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} placeholder="Judul pengumuman" />
              </div>
              <div className="ap-field">
                <label>Isi</label>
                <textarea rows={5} value={form.isi} onChange={(e) => setForm({ ...form, isi: e.target.value })} placeholder="Isi pengumuman..." />
              </div>
              <div className="ap-field">
                <label>Foto/Gambar</label>
                <div className="ap-upload-area">
                  <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileSelect} hidden />
                  <div className="ap-upload-buttons">
                    <button type="button" className="ap-upload-btn" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                      <Upload size={18} /> {uploading ? "Mengupload..." : "Pilih dari Galeri"}
                    </button>
                    <button type="button" className="ap-upload-btn ap-upload-btn--camera" onClick={() => setShowCamera(true)}>
                      <Camera size={18} /> Kamera
                    </button>
                  </div>
                  {form.file && (
                    <div className="ap-upload-preview">
                      <img src={`${API_BASE_URL}${form.file}`} alt="Preview" className="ap-upload-preview__img" />
                      <button type="button" className="ap-upload-preview__remove" onClick={() => setForm({ ...form, file: "" })}>
                        <Trash size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="ap-publish-options">
                <label className="ap-publish-label">Publikasi</label>
                <div className="ap-publish-radio-group">
                  <label className={`ap-publish-radio ${publishMode === "draft" ? "active" : ""}`}>
                    <input type="radio" name="publishMode" value="draft" checked={publishMode === "draft"}
                      onChange={() => setPublishMode("draft")} />
                    <span className="ap-publish-radio__label">Simpan sebagai Draft</span>
                    <span className="ap-publish-radio__desc">Hanya terlihat oleh admin</span>
                  </label>
                  <label className={`ap-publish-radio ${publishMode === "schedule" ? "active" : ""}`}>
                    <input type="radio" name="publishMode" value="schedule" checked={publishMode === "schedule"}
                      onChange={() => setPublishMode("schedule")} />
                    <span className="ap-publish-radio__label">Jadwalkan</span>
                    <span className="ap-publish-radio__desc">Publikasi otomatis sesuai tanggal</span>
                  </label>
                  {publishMode === "schedule" && (
                    <div className="ap-schedule-input">
                      <input type="datetime-local" value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        min={nowLocalISO()} />
                    </div>
                  )}
                  <label className={`ap-publish-radio ${publishMode === "publish" ? "active" : ""}`}>
                    <input type="radio" name="publishMode" value="publish" checked={publishMode === "publish"}
                      onChange={() => setPublishMode("publish")} />
                    <span className="ap-publish-radio__label">Publikasikan Sekarang</span>
                    <span className="ap-publish-radio__desc">Langsung tampil ke warga</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="ap-modal__footer">
              <button className="ap-btn ap-btn--secondary" onClick={() => setShowModal(false)}>Batal</button>
              <button className="ap-btn ap-btn--primary" onClick={handleSubmit} disabled={actionLoading || uploading}>
                {actionLoading ? "Menyimpan..." : editingId ? "Simpan" : "Buat"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCamera && (
        <CameraCapture
          onCapture={(url) => setForm((prev) => ({ ...prev, file: url }))}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}
