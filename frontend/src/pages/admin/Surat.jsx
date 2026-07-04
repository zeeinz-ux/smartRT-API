import { useState, useEffect, useCallback, useRef } from "react";
import { Search, X, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Download, Trash2, Plus, Upload, FileText } from "lucide-react";
import "../../assets/style/css/AdminSurat.css";

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

export default function AdminSurat() {
  const [activeTab, setActiveTab] = useState("surat");
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState("");
  const [mineFilter, setMineFilter] = useState(false);
  const [toast, setToast] = useState(null);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [wargaList, setWargaList] = useState([]);
  const [createForm, setCreateForm] = useState({ user_id: "", jenis_surat: "", keperluan: "", keterangan: "" });
  const [createLoading, setCreateLoading] = useState(false);

  const [templates, setTemplates] = useState([]);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [uploadJenis, setUploadJenis] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [showFileName, setShowFileName] = useState("");
  const fileRef = useRef(null);

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
        ...(mineFilter && { mine: "true" }),
      });
      const res = await fetch(`${API_BASE_URL}/api/admin/surat?${params}`, { credentials: "include" });
      const json = await res.json();
      if (json.success) { setData(json.data); setPagination((prev) => ({ ...prev, ...json.pagination })); }
    } catch { showToast("Gagal memuat data", "error"); }
    finally { setIsLoading(false); }
  }, [pagination.page, statusFilter, mineFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchWarga = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/warga`, { credentials: "include" });
      const json = await res.json();
      if (json.success) setWargaList(json.data || []);
    } catch { showToast("Gagal memuat data warga", "error"); }
  };

  const openCreate = () => {
    setCreateForm({ user_id: "", jenis_surat: "", keperluan: "", keterangan: "" });
    fetchWarga();
    setShowCreateModal(true);
  };

  const handleCreate = async () => {
    if (!createForm.user_id || !createForm.jenis_surat || !createForm.keperluan) {
      showToast("Lengkapi semua field wajib", "error"); return;
    }
    setCreateLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/surat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(createForm),
      });
      const json = await res.json();
      if (json.success) { showToast("Surat berhasil dibuat"); setShowCreateModal(false); fetchData(); }
      else { showToast(json.message, "error"); }
    } catch { showToast("Gagal", "error"); }
    finally { setCreateLoading(false); }
  };

  const openDetail = (item) => {
    setSelected(item);
    setShowDetailModal(true);
  };

  const handleApprove = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/surat/${selected.id}/approve`, { method: "POST", credentials: "include" });
      const json = await res.json();
      if (json.success) {
        showToast("Surat disetujui");
        setShowDetailModal(false);
        if (json.data?.file_pdf) {
          const a = document.createElement("a");
          a.href = `${API_BASE_URL}${json.data.file_pdf}`;
          a.target = "_blank";
          a.download = json.data.file_pdf.split("/").pop();
          a.click();
        }
        fetchData();
      } else { showToast(json.message, "error"); }
    } catch { showToast("Gagal", "error"); }
    finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/surat/${selected.id}/reject`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ alasan: rejectReason }),
      });
      const json = await res.json();
      if (json.success) { showToast("Surat ditolak"); setShowRejectModal(false); setShowDetailModal(false); fetchData(); }
      else { showToast(json.message, "error"); }
    } catch { showToast("Gagal", "error"); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Hapus surat ini?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/surat/${id}`, { method: "DELETE", credentials: "include" });
      const json = await res.json();
      if (json.success) { showToast("Surat dihapus"); fetchData(); }
      else { showToast(json.message, "error"); }
    } catch { showToast("Gagal", "error"); }
  };

  const statusBadge = (s) => {
    if (s === "pending") return { label: "Pending", cls: "as-badge--pending" };
    if (s === "disetujui") return { label: "Disetujui", cls: "as-badge--approved" };
    return { label: "Ditolak", cls: "as-badge--rejected" };
  };

  const fetchTemplates = useCallback(async () => {
    setTemplateLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/surat/templates`, { credentials: "include" });
      const json = await res.json();
      if (json.success) setTemplates(json.data || []);
    } catch { showToast("Gagal memuat template", "error"); }
    finally { setTemplateLoading(false); }
  }, []);

  const handleUploadTemplate = async () => {
    if (!uploadJenis || !fileRef.current?.files?.[0]) {
      showToast("Pilih jenis surat dan file PDF", "error"); return;
    }
    setUploadLoading(true);
    try {
      const fd = new FormData();
      fd.append("jenis_surat", uploadJenis);
      fd.append("file", fileRef.current.files[0]);
      const res = await fetch(`${API_BASE_URL}/api/admin/surat/templates`, {
        method: "POST", credentials: "include", body: fd,
      });
      const json = await res.json();
      if (json.success) { showToast(json.message); setUploadJenis(""); setShowFileName(""); if (fileRef.current) fileRef.current.value = ""; fetchTemplates(); }
      else { showToast(json.message, "error"); }
    } catch { showToast("Gagal upload", "error"); }
    finally { setUploadLoading(false); }
  };

  const handleDeleteTemplate = async (tpl) => {
    if (!confirm(`Hapus template ${tpl.jenis_label}?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/surat/templates/${tpl.id}`, { method: "DELETE", credentials: "include" });
      const json = await res.json();
      if (json.success) { showToast("Template dihapus"); fetchTemplates(); }
      else { showToast(json.message, "error"); }
    } catch { showToast("Gagal", "error"); }
  };

  return (
    <div className="admin-surat">
      {toast && <div className={`toast toast--${toast.type}`}>{toast.message}</div>}

      <div className="as-header">
        <div className="as-header__left">
          <h1 className="as-header__title">Surat Pengantar</h1>
          <p className="as-header__subtitle">Kelola pengajuan surat dari warga</p>
        </div>
        <div className="as-header-tabs">
          <button className={`as-header-tab ${activeTab === "surat" ? "as-header-tab--active" : ""}`} onClick={() => setActiveTab("surat")}>
            <FileText size={16} /> Surat
          </button>
          <button className={`as-header-tab ${activeTab === "template" ? "as-header-tab--active" : ""}`} onClick={() => { setActiveTab("template"); fetchTemplates(); }}>
            <Upload size={16} /> Template
          </button>
        </div>
      </div>

      {activeTab === "surat" ? (
        <div className="as-surat-content">
          <div className="as-filters">
            <div className="as-filter-tabs">
              <button className={`as-filter-tab ${!mineFilter ? "as-filter-tab--active" : ""}`} onClick={() => { setMineFilter(false); setPagination((p) => ({ ...p, page: 1 })); }}>
                Semua Surat
              </button>
              <button className={`as-filter-tab ${mineFilter ? "as-filter-tab--active" : ""}`} onClick={() => { setMineFilter(true); setPagination((p) => ({ ...p, page: 1 })); }}>
                Surat Saya
              </button>
            </div>
            <div className="as-filter-actions">
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}>
                <option value="">Semua Status</option>
                <option value="pending">Pending</option>
                <option value="disetujui">Disetujui</option>
                <option value="ditolak">Ditolak</option>
              </select>
              <button className="as-btn-add" onClick={openCreate}>
                <Plus size={16} /> Buat Surat Baru
              </button>
            </div>
          </div>

          <div className="as-table-section">
            {isLoading ? (
              <div className="as-loading"><div className="as-loading__spinner" /><p>Memuat data...</p></div>
            ) : (
              <div className="as-table-wrapper">
                <table className="as-table">
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Warga</th>
                      <th>Jenis Surat</th>
                      <th>Keperluan</th>
                      <th>Status</th>
                      <th>Dibuat Oleh</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "var(--clr-text-muted)" }}>Belum ada pengajuan surat</td></tr>
                    ) : (
                      data.map((item) => {
                        const sb = statusBadge(item.status);
                        return (
                          <tr key={item.id} className={`as-row--${item.status}`}>
                            <td className="as-cell-date">{formatDate(item.created_at)}</td>
                            <td><strong>{item.user?.nama || "-"}</strong></td>
                            <td>{item.jenis_label}</td>
                            <td className="as-cell-keperluan">{item.keperluan}</td>
                            <td><span className={`as-badge ${sb.cls}`}>{sb.label}</span></td>
                            <td className="as-cell-creator">{item.creator?.nama || item.user?.nama || "-"}</td>
                            <td>
                              <div className="as-actions">
                                <button className="as-action-btn as-action--view" title="Detail" onClick={() => openDetail(item)}>
                                  <Search size={14} />
                                </button>
                                {item.file_pdf && (
                                  <a href={`${API_BASE_URL}${item.file_pdf}`} target="_blank" rel="noopener noreferrer" className="as-action-btn as-action--download" title="Download PDF">
                                    <Download size={14} />
                                  </a>
                                )}
                                <button className="as-action-btn as-action--delete" title="Hapus" onClick={() => handleDelete(item.id)}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {pagination.totalPages > 1 && (
              <div className="as-pagination">
                <span className="as-pagination__info">{pagination.total} surat</span>
                <div className="as-pagination__controls">
                  <button className="as-pagination__btn" disabled={pagination.page <= 1} onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>
                    <ChevronLeft size={14} />
                  </button>
                  <span className="as-pagination__page">{pagination.page} / {pagination.totalPages}</span>
                  <button className="as-pagination__btn" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="as-template-section">
          <div className="as-template-upload">
            <h3>Upload Template Baru</h3>
            <div className="as-template-upload__form">
              <select value={uploadJenis} onChange={(e) => setUploadJenis(e.target.value)}>
                <option value="">Pilih jenis surat...</option>
                {JENIS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <div className="as-file-input">
                <input type="file" accept=".pdf" ref={fileRef} id="template-file" onChange={() => setShowFileName(fileRef.current?.files?.[0]?.name || "")} />
                <label htmlFor="template-file" className="as-file-input__label"><Upload size={14} /> Pilih File</label>
                <span className="as-file-input__name">{showFileName || "Belum ada file dipilih"}</span>
              </div>
              <button className="btn btn--primary" onClick={handleUploadTemplate} disabled={uploadLoading}>
                {uploadLoading ? "Mengupload..." : <><Upload size={14} /> Upload Template</>}
              </button>
            </div>
          </div>

          <div className="as-template-list">
            <h3>Daftar Template</h3>
            {templateLoading ? (
              <div className="as-loading"><div className="as-loading__spinner" /><p>Memuat...</p></div>
            ) : templates.length === 0 ? (
              <div className="as-empty"><FileText size={48} /><p>Belum ada template</p></div>
            ) : (
              <div className="as-table-wrapper">
                <table className="as-table">
                  <thead>
                    <tr>
                      <th>Jenis Surat</th>
                      <th>Nama File</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map((tpl) => (
                      <tr key={tpl.id}>
                        <td><strong>{tpl.jenis_label}</strong></td>
                        <td className="as-cell-file">{tpl.original_name || "template.pdf"}</td>
                        <td>
                          <div className="as-actions">
                            <a href={`${API_BASE_URL}${tpl.file_path}`} target="_blank" rel="noopener noreferrer" className="as-action-btn as-action--download" title="Download">
                              <Download size={14} />
                            </a>
                            <button className="as-action-btn as-action--delete" title="Hapus" onClick={() => handleDeleteTemplate(tpl)}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Create Surat */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Buat Surat Baru</h2>
              <button className="modal__close" onClick={() => setShowCreateModal(false)}><X size={20} /></button>
            </div>
            <div className="modal__body">
              <div className="form-group">
                <label>Warga *</label>
                <select value={createForm.user_id} onChange={(e) => setCreateForm((p) => ({ ...p, user_id: e.target.value }))} required>
                  <option value="">Pilih warga...</option>
                  {wargaList
                    .filter((w) => w.role === "warga")
                    .map((w) => (
                      <option key={w.user_id} value={w.user_id}>{w.nama} — {w.email}</option>
                    ))}
                </select>
              </div>
              <div className="form-group">
                <label>Jenis Surat *</label>
                <select value={createForm.jenis_surat} onChange={(e) => setCreateForm((p) => ({ ...p, jenis_surat: e.target.value }))} required>
                  <option value="">Pilih jenis surat...</option>
                  {JENIS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Keperluan *</label>
                <input value={createForm.keperluan} onChange={(e) => setCreateForm((p) => ({ ...p, keperluan: e.target.value }))} placeholder="Contoh: Pengajuan KTP baru" />
              </div>
              <div className="form-group">
                <label>Keterangan (opsional)</label>
                <textarea value={createForm.keterangan} onChange={(e) => setCreateForm((p) => ({ ...p, keterangan: e.target.value }))} rows={3} placeholder="Catatan tambahan..." />
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={() => setShowCreateModal(false)}>Batal</button>
              <button className="btn btn--primary" onClick={handleCreate} disabled={createLoading}>
                {createLoading ? "Menyimpan..." : "Buat Surat"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Detail */}
      {showDetailModal && selected && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Detail Surat</h2>
              <button className="modal__close" onClick={() => setShowDetailModal(false)}><X size={20} /></button>
            </div>
            <div className="modal__body">
              <div className="as-detail">
                <div className="as-detail__meta">
                  <span><strong>Warga:</strong> {selected.user?.nama} ({selected.user?.email})</span>
                  <span><strong>Dibuat oleh:</strong> {selected.creator?.nama || "Warga sendiri"}</span>
                  <span><strong>Jenis:</strong> {selected.jenis_label}</span>
                  <span><strong>Keperluan:</strong> {selected.keperluan}</span>
                  <span><strong>Tanggal:</strong> {formatDate(selected.created_at)}</span>
                  <span><strong>Status:</strong> <span className={`as-badge ${statusBadge(selected.status).cls}`}>{statusBadge(selected.status).label}</span></span>
                </div>
                {selected.keterangan && (
                  <div className="as-detail__section">
                    <h4>Keterangan Tambahan</h4>
                    <p>{selected.keterangan}</p>
                  </div>
                )}
                {selected.nomor_surat && (
                  <div className="as-detail__section">
                    <h4>Nomor Surat</h4>
                    <p className="as-detail__nomor">{selected.nomor_surat}</p>
                  </div>
                )}
                {selected.alasan_tolak && (
                  <div className="as-detail__section as-detail__section--danger">
                    <h4>Alasan Ditolak</h4>
                    <p>{selected.alasan_tolak}</p>
                  </div>
                )}
                {selected.file_pdf && (
                  <a href={`${API_BASE_URL}${selected.file_pdf}`} target="_blank" rel="noopener noreferrer" className="as-detail__pdf">
                    <Download size={16} /> Download PDF
                  </a>
                )}
                {selected.qr_code && (
                  <div className="as-detail__qr">
                    <img src={`${API_BASE_URL}${selected.qr_code}`} alt="QR Code" />
                  </div>
                )}
              </div>
            </div>
            <div className="modal__footer">
              {selected.status === "pending" && (
                <>
                  <button className="btn btn--danger" onClick={() => { setRejectReason(""); setShowRejectModal(true); }}>
                    <XCircle size={14} /> Tolak
                  </button>
                  <button className="btn btn--success" onClick={handleApprove} disabled={actionLoading}>
                    {actionLoading ? "Memproses..." : <><CheckCircle2 size={14} /> Setujui & Download</>}
                  </button>
                </>
              )}
              <button className="btn btn--secondary" onClick={() => setShowDetailModal(false)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Reject */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal modal--small" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Tolak Surat</h2>
              <button className="modal__close" onClick={() => setShowRejectModal(false)}><X size={20} /></button>
            </div>
            <div className="modal__body">
              <div className="form-group">
                <label>Alasan Penolakan</label>
                <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} placeholder="Tulis alasan penolakan..." />
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={() => setShowRejectModal(false)}>Batal</button>
              <button className="btn btn--danger" onClick={handleReject} disabled={actionLoading || !rejectReason}>
                {actionLoading ? "Menyimpan..." : "Tolak Surat"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
