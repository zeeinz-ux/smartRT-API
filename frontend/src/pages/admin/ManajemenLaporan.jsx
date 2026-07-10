import { useState, useEffect, useCallback, useRef } from "react";
import { Search, X, ChevronLeft, ChevronRight, Send, Clock, CheckCircle2, AlertCircle, Trash2, MessageSquare, Plus, Upload, Camera, Trash } from "lucide-react";
import CameraCapture from "../../components/CameraCapture";
import { formatDateTime } from "../../utils/formatDate.js";
import "../../assets/style/css/ManajemenLaporan.css";
import API_BASE_URL from "../../utils/api.js";

export default function ManajemenLaporan() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState("");
  const [toast, setToast] = useState(null);

  const [showTanggapiModal, setShowTanggapiModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [tanggapanForm, setTanggapanForm] = useState({ status: "selesai", tanggapan: "" });

  const [wargaList, setWargaList] = useState([]);
  const [createForm, setCreateForm] = useState({ user_id: "", judul: "", isi: "", foto: "" });
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
      const res = await fetch(`${API_BASE_URL}/api/admin/laporan?${params}`, { credentials: "include" });
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

  const fetchWarga = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/warga?limit=500`, { credentials: "include" });
      const json = await res.json();
      if (json.success) setWargaList(json.data);
    } catch {}
  };

  const uploadFile = async (file) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_BASE_URL}/api/upload`, { method: "POST", credentials: "include", body: fd });
      const json = await res.json();
      if (json.success) {
        setCreateForm((prev) => ({ ...prev, foto: json.data.url }));
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

  const openCreateModal = () => {
    setCreateForm({ user_id: "", judul: "", isi: "", foto: "" });
    fetchWarga();
    setShowCreateModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.user_id) { showToast("Pilih warga tujuan", "error"); return; }
    if (!createForm.judul || !createForm.isi) { showToast("Judul dan isi wajib diisi", "error"); return; }
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/laporan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(createForm),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Laporan berhasil dibuat");
        setShowCreateModal(false);
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

  const openTanggapiModal = (item) => {
    setSelected(item);
    setTanggapanForm({ status: item.status, tanggapan: item.tanggapan || "" });
    setShowTanggapiModal(true);
  };

  const openDetailModal = (item) => {
    setSelected(item);
    setShowDetailModal(true);
  };

  const handleTanggapi = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/laporan/${selected.id}/tanggapi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(tanggapanForm),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Tanggapan berhasil dikirim");
        setShowTanggapiModal(false);
        fetchData();
      } else {
        showToast(json.message || "Gagal", "error");
      }
    } catch {
      showToast("Gagal menyimpan", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteModal = (item) => {
    setDeleting(item);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/laporan/${deleting.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (json.success) {
        showToast("Laporan berhasil dihapus");
        setShowDeleteModal(false);
        setDeleting(null);
        fetchData();
      } else {
        showToast(json.message || "Gagal", "error");
      }
    } catch {
      showToast("Gagal menghapus", "error");
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

  return (
    <div className="manajemen-laporan">
      {toast && <div className={`toast toast--${toast.type}`}>{toast.message}</div>}

      <div className="ml-header">
        <div className="ml-header__left">
          <h1 className="ml-header__title">Manajemen Laporan</h1>
          <p className="ml-header__subtitle">Kelola laporan dari warga</p>
        </div>
        <button className="ml-btn-add" onClick={openCreateModal}>
          <Plus size={16} /> Buat Laporan Baru
        </button>
      </div>

      <div className="ml-filters">
        <div className="ml-filter">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}>
            <option value="">Semua Status</option>
            <option value="diproses">Diproses</option>
            <option value="selesai">Selesai</option>
            <option value="ditolak">Ditolak</option>
          </select>
        </div>
      </div>

      <div className="ml-table-section">
        {isLoading ? (
          <div className="ml-loading"><div className="ml-loading__spinner" /><p>Memuat data...</p></div>
        ) : (
          <div className="ml-table-wrapper">
            <table className="ml-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Dari</th>
                  <th>Judul</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: "3rem", color: "var(--clr-text-muted)" }}>Belum ada laporan</td></tr>
                ) : (
                  data.map((item) => (
                    <tr key={item.id} className={`ml-table__row--${item.status}`}>
                      <td className="ml-table__date">{formatDateTime(item.created_at)}</td>
                      <td><strong>{item.user?.nama || "-"}</strong></td>
                      <td>{item.judul}</td>
                      <td>
                        <span className={`ml-status-badge ml-status-badge--${item.status}`}>
                          {statusIcon(item.status)} {statusLabel(item.status)}
                        </span>
                      </td>
                      <td>
                        <div className="ml-actions">
                          <button className="ml-action-btn ml-action-btn--view" title="Detail" onClick={() => openDetailModal(item)}>
                            <Search size={14} />
                          </button>
                          <button className="ml-action-btn ml-action-btn--respond" title="Tanggapi" onClick={() => openTanggapiModal(item)}>
                            <MessageSquare size={14} />
                          </button>
                          <button className="ml-action-btn ml-action-btn--delete" title="Hapus" onClick={() => openDeleteModal(item)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {pagination.totalPages > 1 && (
          <div className="ml-pagination">
            <span className="ml-pagination__info">{pagination.total} laporan</span>
            <div className="ml-pagination__controls">
              <button className="ml-pagination__btn" disabled={pagination.page <= 1} onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>
                <ChevronLeft size={14} />
              </button>
              <span className="ml-pagination__page">{pagination.page} / {pagination.totalPages}</span>
              <button className="ml-pagination__btn" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL: Create ── */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Buat Laporan Baru</h2>
              <button className="modal__close" onClick={() => setShowCreateModal(false)}><X size={20} /></button>
            </div>
            <form className="modal__body" onSubmit={handleCreate}>
              <div className="form-group">
                <label>Warga *</label>
                <select value={createForm.user_id} onChange={(e) => setCreateForm((p) => ({ ...p, user_id: e.target.value }))} required>
                  <option value="">Pilih warga...</option>
                  {wargaList.map((w) => <option key={w.id} value={w.id}>{w.nama} ({w.email})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Judul Laporan *</label>
                <input type="text" value={createForm.judul} onChange={(e) => setCreateForm((p) => ({ ...p, judul: e.target.value }))} required placeholder="Contoh: Jalan berlubang" />
              </div>
              <div className="form-group">
                <label>Isi Laporan *</label>
                <textarea value={createForm.isi} onChange={(e) => setCreateForm((p) => ({ ...p, isi: e.target.value }))} required placeholder="Jelaskan detail laporan..." rows={4} />
              </div>
              <div className="form-group">
                <label>Foto (opsional)</label>
                <div className="ml-upload-area">
                  <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileSelect} hidden />
                  <div className="ml-upload-buttons">
                    <button type="button" className="ml-upload-btn" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                      <Upload size={16} /> {uploading ? "Mengupload..." : "Pilih dari Galeri"}
                    </button>
                    <button type="button" className="ml-upload-btn ml-upload-btn--camera" onClick={() => setShowCamera(true)}>
                      <Camera size={16} /> Kamera
                    </button>
                  </div>
                  {createForm.foto && (
                    <div className="ml-upload-preview">
                      <img src={`${API_BASE_URL}${createForm.foto}`} alt="Preview" />
                      <button type="button" className="ml-upload-preview__remove" onClick={() => setCreateForm((p) => ({ ...p, foto: "" }))}>
                        <Trash size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Batal</button>
                <button type="submit" className="btn-primary" disabled={actionLoading || uploading}>
                  {actionLoading ? "Menyimpan..." : <><Send size={14} /> Buat Laporan</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Detail ── */}
      {showDetailModal && selected && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Detail Laporan</h2>
              <button className="modal__close" onClick={() => setShowDetailModal(false)}><X size={20} /></button>
            </div>
            <div className="modal__body">
              <div className="ml-detail">
                <div className="ml-detail__meta">
                  <span><strong>Dari:</strong> {selected.user?.nama} ({selected.user?.email})</span>
                  <span><strong>Tanggal:</strong> {formatDateTime(selected.created_at)}</span>
                  <span>
                    <strong>Status:</strong>{" "}
                    <span className={`ml-status-badge ml-status-badge--${selected.status}`}>
                      {statusIcon(selected.status)} {statusLabel(selected.status)}
                    </span>
                  </span>
                </div>
                <h3 className="ml-detail__judul">{selected.judul}</h3>
                <p className="ml-detail__isi">{selected.isi}</p>
                {selected.foto && (
                  <div className="ml-detail__foto">
                    <img src={`${API_BASE_URL}${selected.foto}`} alt="Foto laporan" />
                  </div>
                )}
                {selected.tanggapan && (
                  <div className="ml-detail__tanggapan">
                    <h4>Tanggapan</h4>
                    <p>{selected.tanggapan}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="modal__footer">
              <button type="button" className="btn-primary" style={{ background: "var(--clr-primary)" }} onClick={() => { setShowDetailModal(false); openTanggapiModal(selected); }}>
                <MessageSquare size={14} /> Tanggapi
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowDetailModal(false)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Tanggapi ── */}
      {showTanggapiModal && selected && (
        <div className="modal-overlay" onClick={() => setShowTanggapiModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Tanggapi Laporan</h2>
              <button className="modal__close" onClick={() => setShowTanggapiModal(false)}><X size={20} /></button>
            </div>
            <form className="modal__body" onSubmit={handleTanggapi}>
              <div style={{ marginBottom: "var(--space-md)", fontSize: "0.9rem", color: "var(--clr-text-primary)", fontWeight: 600 }}>
                {selected.judul} — {selected.user?.nama}
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={tanggapanForm.status} onChange={(e) => setTanggapanForm((p) => ({ ...p, status: e.target.value }))}>
                  <option value="diproses">Diproses</option>
                  <option value="selesai">Selesai</option>
                  <option value="ditolak">Ditolak</option>
                </select>
              </div>
              <div className="form-group">
                <label>Tanggapan</label>
                <textarea value={tanggapanForm.tanggapan} onChange={(e) => setTanggapanForm((p) => ({ ...p, tanggapan: e.target.value }))} rows={4} placeholder="Tulis tanggapan untuk warga..." />
              </div>
              <div className="modal__footer">
                <button type="button" className="btn-secondary" onClick={() => setShowTanggapiModal(false)}>Batal</button>
                <button type="submit" className="btn-primary" disabled={actionLoading}>
                  {actionLoading ? "Menyimpan..." : <><Send size={14} /> Kirim Tanggapan</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Delete ── */}
      {showDeleteModal && deleting && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal modal--small" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Hapus Laporan</h2>
              <button className="modal__close" onClick={() => setShowDeleteModal(false)}><X size={20} /></button>
            </div>
            <div className="modal__body">
              <p style={{ fontSize: "0.9rem", color: "var(--clr-text-secondary)" }}>
                Yakin ingin menghapus laporan <strong>{deleting.judul}</strong> dari <strong>{deleting.user?.nama}</strong>?
              </p>
            </div>
            <div className="modal__footer">
              <button type="button" className="btn-secondary" onClick={() => setShowDeleteModal(false)}>Batal</button>
              <button type="button" className="btn-primary" style={{ background: "var(--clr-danger)" }} onClick={handleDelete} disabled={actionLoading}>
                {actionLoading ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCamera && (
        <CameraCapture
          onCapture={(url) => setCreateForm((prev) => ({ ...prev, foto: url }))}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}
