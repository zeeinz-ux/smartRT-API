import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  Filter,
  Plus,
  Eye,
  CheckCircle2,
  XCircle,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Home,
  Phone,
  Mail,
  FileText,
  Shield,
  Clock,
  AlertCircle,
  UserCheck,
  UserX,
  ArrowUpDown,
  Download,
  RefreshCw,
  MoreHorizontal,
} from "lucide-react";
import "../../assets/style/css/ManajemenWarga.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

export default function ManajemenWarga() {
  const navigate = useNavigate();
  const [wargaList, setWargaList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    verification_status: "",
    status_huni: "",
    user_status: "",
    role: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [selectedWarga, setSelectedWarga] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Form states
  const [addForm, setAddForm] = useState({
    nama: "",
    email: "",
    no_hp: "",
    password: "",
    role: "warga",
  });

  const [editForm, setEditForm] = useState({
    nama: "",
    no_hp: "",
    alamat: "",
    no_rumah: "",
    status_huni: "",
    user_status: "",
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchWarga = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(filters.verification_status && {
          verification_status: filters.verification_status,
        }),
        ...(filters.status_huni && { status_huni: filters.status_huni }),
        ...(filters.user_status && { status: filters.user_status }),
      });

      const res = await fetch(
        `${API_BASE_URL}/api/admin/warga?${queryParams}`,
        {
          credentials: "include",
        },
      );

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          navigate("/login");
          return;
        }
        throw new Error("Failed to fetch");
      }

      const data = await res.json();
      if (data.success) {
        setWargaList(data.data);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error("Fetch error:", error);
      showToast("Gagal mengambil data warga", "error");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, searchQuery, filters, navigate]);

  useEffect(() => {
    fetchWarga();
  }, [fetchWarga]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchWarga();
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/warga/${id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      if (data.success) {
        setSelectedWarga(data.data);
        setShowDetailModal(true);
      }
    } catch {
      showToast("Gagal mengambil detail warga", "error");
    }
  };

  const handleVerify = async (id) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/warga/${id}/verify`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchWarga();
        if (showDetailModal) setShowDetailModal(false);
      } else {
        showToast(data.message, "error");
      }
    } catch {
      showToast("Gagal verifikasi warga", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id) => {
    if (!rejectReason.trim()) {
      showToast("Alasan penolakan wajib diisi", "error");
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/warga/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setShowRejectModal(false);
        setRejectReason("");
        fetchWarga();
        if (showDetailModal) setShowDetailModal(false);
      } else {
        showToast(data.message, "error");
      }
    } catch {
      showToast("Gagal menolak verifikasi", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddWarga = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/warga`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(addForm),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setShowAddModal(false);
        setAddForm({
          nama: "",
          email: "",
          no_hp: "",
          password: "",
          role: "warga",
        });
        fetchWarga();
      } else {
        showToast(data.message, "error");
      }
    } catch {
      showToast("Gagal menambah warga", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditWarga = async (e) => {
    e.preventDefault();
    if (!selectedWarga) return;
    setActionLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/admin/warga/${selectedWarga.user_id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(editForm),
        },
      );
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setShowEditModal(false);
        fetchWarga();
        if (showDetailModal) {
          handleViewDetail(selectedWarga.user_id);
        }
      } else {
        showToast(data.message, "error");
      }
    } catch {
      showToast("Gagal update warga", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleHardDelete = async (id) => {
    if (!confirm("Yakin ingin menghapus warga ini PERMANEN? Semua data termasuk histori pembayaran akan hilang. Tindakan ini tidak bisa dibatalkan!")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/warga/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchWarga();
        if (showDetailModal) setShowDetailModal(false);
      } else {
        showToast(data.message, "error");
      }
    } catch {
      showToast("Gagal menghapus warga", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirm("Yakin ingin menonaktifkan akun warga ini? Data tetap tersimpan tapi warga tidak bisa login.")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/warga/${id}/deactivate`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchWarga();
        if (showDetailModal) setShowDetailModal(false);
      } else {
        showToast(data.message, "error");
      }
    } catch {
      showToast("Gagal menonaktifkan warga", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (warga) => {
    setSelectedWarga(warga);
    setEditForm({
      nama: warga.nama || "",
      no_hp: warga.no_hp || "",
      alamat: warga.alamat || "",
      no_rumah: warga.no_rumah || "",
      status_huni: warga.status_huni || "",
      user_status: warga.user_status || "",
    });
    setShowEditModal(true);
  };

  const openRejectModal = (warga) => {
    setSelectedWarga(warga);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: "#fef3c7", color: "#d97706", text: "Menunggu" },
      verified: { bg: "#dcfce7", color: "#16a34a", text: "Terverifikasi" },
      rejected: { bg: "#fee2e2", color: "#dc2626", text: "Ditolak" },
      active: { bg: "#dcfce7", color: "#16a34a", text: "Aktif" },
      suspended: { bg: "#fee2e2", color: "#dc2626", text: "Nonaktif" },
      pemilik: { bg: "#dbeafe", color: "#2563eb", text: "Pemilik" },
      penyewa: { bg: "#e0e7ff", color: "#4f46e5", text: "Penyewa" },
    };
    const style = styles[status] || styles.pending;
    return (
      <span
        className="status-badge"
        style={{ background: style.bg, color: style.color }}
      >
        {style.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="manajemen-warga">
      {/* Toast */}
      {toast && (
        <div className={`toast toast--${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="mw-header">
        <div className="mw-header__left">
          <h1 className="mw-header__title">Manajemen Warga</h1>
          <p className="mw-header__subtitle">
            Kelola data warga RT-003 — {pagination.total} warga terdaftar
          </p>
        </div>
        <div className="mw-header__right">
          <button className="btn-export" onClick={() => console.log("Export")}>
            <Download size={16} />
            Export
          </button>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={18} />
            Tambah Warga
          </button>
        </div>
      </header>

      {/* Filters */}
      <section className="mw-filters">
        <form className="mw-search" onSubmit={handleSearch}>
          <Search size={18} className="mw-search__icon" />
          <input
            type="text"
            placeholder="Cari nama, email, atau NIK..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mw-search__input"
          />
          <button type="submit" className="mw-search__btn">
            Cari
          </button>
        </form>

        <div className="mw-filter-group">
          <div className="mw-filter">
            <Filter size={16} />
            <select
              value={filters.verification_status}
              onChange={(e) =>
                handleFilterChange("verification_status", e.target.value)
              }
            >
              <option value="">Semua Status Verifikasi</option>
              <option value="pending">Menunggu</option>
              <option value="verified">Terverifikasi</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>

          <div className="mw-filter">
            <Home size={16} />
            <select
              value={filters.status_huni}
              onChange={(e) =>
                handleFilterChange("status_huni", e.target.value)
              }
            >
              <option value="">Semua Status Huni</option>
              <option value="pemilik">Pemilik</option>
              <option value="penyewa">Penyewa</option>
            </select>
          </div>

          <div className="mw-filter">
            <Shield size={16} />
            <select
              value={filters.user_status}
              onChange={(e) =>
                handleFilterChange("user_status", e.target.value)
              }
            >
              <option value="">Semua Status Akun</option>
              <option value="active">Aktif</option>
              <option value="suspended">Nonaktif</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="mw-filter">
            <Users size={16} />
            <select
              value={filters.role}
              onChange={(e) =>
                handleFilterChange("role", e.target.value)
              }
            >
              <option value="">Semua Role</option>
              <option value="warga">Warga</option>
              <option value="bendahara">Bendahara</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button className="btn-refresh" onClick={fetchWarga} title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>
      </section>

      {/* Table */}
      <section className="mw-table-section">
        {isLoading ? (
          <div className="mw-loading">
            <div className="mw-loading__spinner"></div>
            <p>Memuat data warga...</p>
          </div>
        ) : wargaList.length === 0 ? (
          <div className="mw-empty">
            <Users size={48} className="mw-empty__icon" />
            <h3>Tidak ada data warga</h3>
            <p>Coba ubah filter atau tambah warga baru</p>
          </div>
        ) : (
          <>
            <div className="mw-table-wrapper">
              <table className="mw-table">
                <thead>
                    <tr>
                      <th>Nama / Email</th>
                      <th>Role</th>
                      <th>NIK</th>
                      <th>Alamat</th>
                      <th>Status Akun</th>
                      <th>Verifikasi</th>
                      <th>Tanggal Daftar</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wargaList.map((warga) => {
                      const isOnboarded = !!warga.profile_id
                      const rowClass = isOnboarded
                        ? `mw-table__row--${warga.verification_status || 'none'}`
                        : 'mw-table__row--pending'

                      return (
                    <tr
                      key={warga.user_id}
                      className={`mw-table__row ${rowClass}`}
                    >
                      <td>
                        <div className="mw-warga-cell">
                          <div className="mw-warga-cell__avatar">
                            {warga.nama?.charAt(0).toUpperCase()}
                          </div>
                          <div className="mw-warga-cell__info">
                            <span className="mw-warga-cell__name">
                              {warga.nama}
                            </span>
                            <span className="mw-warga-cell__email">
                              {warga.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>{getStatusBadge(warga.role)}</td>
                      <td className="mw-table__nik">
                        {isOnboarded ? warga.nik : (
                          <span className="mw-pending-label">Menunggu onboarding</span>
                        )}
                      </td>
                      <td className="mw-table__alamat">
                        {isOnboarded ? `${warga.alamat || '-'}${warga.no_rumah ? ` (No. ${warga.no_rumah})` : ''}` : '-'}
                      </td>
                      <td>{getStatusBadge(warga.user_status)}</td>
                      <td>
                        {isOnboarded ? getStatusBadge(warga.verification_status) : (
                          <span className="mw-pending-label">Belum isi data</span>
                        )}
                      </td>
                      <td className="mw-table__date">
                        {formatDate(warga.created_at)}
                      </td>
                      <td>
                        <div className="mw-actions">
                          <button
                            className="mw-action-btn mw-action-btn--view"
                            onClick={() => handleViewDetail(warga.user_id)}
                            title="Lihat Detail"
                          >
                            <Eye size={16} />
                          </button>
                          {isOnboarded && warga.verification_status === "pending" && (
                            <>
                              <button
                                className="mw-action-btn mw-action-btn--approve"
                                onClick={() => handleVerify(warga.profile_id)}
                                disabled={actionLoading}
                                title="Verifikasi"
                              >
                                <CheckCircle2 size={16} />
                              </button>
                              <button
                                className="mw-action-btn mw-action-btn--reject"
                                onClick={() => openRejectModal(warga)}
                                disabled={actionLoading}
                                title="Tolak"
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          )}
                          {isOnboarded && (
                            <button
                              className="mw-action-btn mw-action-btn--edit"
                              onClick={() => openEditModal(warga)}
                              title="Edit"
                            >
                              <Edit3 size={16} />
                            </button>
                          )}
                          <div className="mw-actions-group">
                            <button
                              className="mw-action-btn mw-action-btn--deactivate"
                              onClick={() => handleDeactivate(warga.user_id)}
                              disabled={actionLoading}
                              title="Nonaktifkan"
                            >
                              <UserX size={16} />
                            </button>
                            <button
                              className="mw-action-btn mw-action-btn--delete"
                              onClick={() => handleHardDelete(warga.user_id)}
                              disabled={actionLoading}
                              title="Hapus permanen"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                    )})}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mw-pagination">
              <span className="mw-pagination__info">
                Menampilkan {(pagination.page - 1) * pagination.limit + 1} -{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                dari {pagination.total} warga
              </span>
              <div className="mw-pagination__controls">
                <button
                  className="mw-pagination__btn"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from(
                  { length: pagination.totalPages },
                  (_, i) => i + 1,
                ).map((page) => (
                  <button
                    key={page}
                    className={`mw-pagination__btn ${page === pagination.page ? "mw-pagination__btn--active" : ""}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                ))}
                <button
                  className="mw-pagination__btn"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Detail Modal */}
      {showDetailModal && selectedWarga && (
        <div
          className="modal-overlay"
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="modal modal--detail"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal__header">
              <h2>Detail Warga</h2>
              <button
                className="modal__close"
                onClick={() => setShowDetailModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal__body">
              <div className="detail-avatar">
                {selectedWarga.nama?.charAt(0).toUpperCase()}
              </div>
              <h3 className="detail-name">{selectedWarga.nama}</h3>
              <p className="detail-email">{selectedWarga.email}</p>

              <div className="detail-grid">
                <div className="detail-item">
                  <FileText size={16} />
                  <div>
                    <label>NIK</label>
                    <span>{selectedWarga.nik || "-"}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <FileText size={16} />
                  <div>
                    <label>KK</label>
                    <span>{selectedWarga.kk || "-"}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <Phone size={16} />
                  <div>
                    <label>No. HP</label>
                    <span>{selectedWarga.no_hp || "-"}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <Home size={16} />
                  <div>
                    <label>Alamat</label>
                    <span>
                      {selectedWarga.alamat || "-"}{" "}
                      {selectedWarga.no_rumah &&
                        `(No. ${selectedWarga.no_rumah})`}
                    </span>
                  </div>
                </div>
                <div className="detail-item">
                  <Shield size={16} />
                  <div>
                    <label>Status Huni</label>
                    <span>{getStatusBadge(selectedWarga.status_huni)}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <Clock size={16} />
                  <div>
                    <label>Tanggal Daftar</label>
                    <span>{formatDate(selectedWarga.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="detail-verification">
                <h4>Status Verifikasi</h4>
                <div className="detail-verification__status">
                  {getStatusBadge(selectedWarga.verification_status)}
                  {selectedWarga.verification_status === "rejected" &&
                    selectedWarga.rejection_reason && (
                      <p className="detail-rejection">
                        Alasan: {selectedWarga.rejection_reason}
                      </p>
                    )}
                </div>
              </div>
            </div>
            <div className="modal__footer">
              {selectedWarga.verification_status === "pending" && (
                <>
                  <button
                    className="btn-success"
                    onClick={() => handleVerify(selectedWarga.id)}
                    disabled={actionLoading}
                  >
                    <CheckCircle2 size={18} />
                    Verifikasi
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => openRejectModal(selectedWarga)}
                    disabled={actionLoading}
                  >
                    <XCircle size={18} />
                    Tolak
                  </button>
                </>
              )}
              <button
                className="btn-secondary"
                onClick={() => setShowDetailModal(false)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div
            className="modal modal--form"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal__header">
              <h2>Tambah Warga Baru</h2>
              <button
                className="modal__close"
                onClick={() => setShowAddModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <form className="modal__body" onSubmit={handleAddWarga}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nama Lengkap *</label>
                  <input
                    type="text"
                    value={addForm.nama}
                    onChange={(e) =>
                      setAddForm((prev) => ({ ...prev, nama: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={(e) =>
                      setAddForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>No. HP *</label>
                  <input
                    type="tel"
                    value={addForm.no_hp}
                    onChange={(e) =>
                      setAddForm((prev) => ({ ...prev, no_hp: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    value={addForm.password}
                    onChange={(e) =>
                      setAddForm((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={addForm.role}
                    onChange={(e) =>
                      setAddForm((prev) => ({ ...prev, role: e.target.value }))
                    }
                  >
                    <option value="warga">Warga</option>
                    <option value="bendahara">Bendahara</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              {addForm.role === "warga" ? (
              <div className="form-info">
                <AlertCircle size={16} />
                <span>
                  Warga akan login dan mengisi data lengkap (NIK, KK, alamat, foto KTP) melalui
                  form onboarding. Admin kemudian memverifikasi data tersebut.
                </span>
              </div>
              ) : (
              <div className="form-info">
                <AlertCircle size={16} />
                <span>
                  Akun {addForm.role} akan langsung aktif tanpa perlu onboarding.
                </span>
              </div>
              )}
              <div className="modal__footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedWarga && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div
            className="modal modal--form"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal__header">
              <h2>Edit Warga</h2>
              <button
                className="modal__close"
                onClick={() => setShowEditModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <form className="modal__body" onSubmit={handleEditWarga}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nama</label>
                  <input
                    type="text"
                    value={editForm.nama}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, nama: e.target.value }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>No. HP</label>
                  <input
                    type="tel"
                    value={editForm.no_hp}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        no_hp: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="form-group form-group--full">
                  <label>Alamat</label>
                  <input
                    type="text"
                    value={editForm.alamat}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        alamat: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>No. Rumah</label>
                  <input
                    type="text"
                    value={editForm.no_rumah}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        no_rumah: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Status Huni</label>
                  <select
                    value={editForm.status_huni}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        status_huni: e.target.value,
                      }))
                    }
                  >
                    <option value="">Pilih...</option>
                    <option value="pemilik">Pemilik</option>
                    <option value="penyewa">Penyewa</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status Akun</label>
                  <select
                    value={editForm.user_status}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        user_status: e.target.value,
                      }))
                    }
                  >
                    <option value="">Pilih...</option>
                    <option value="active">Aktif</option>
                    <option value="suspended">Nonaktif</option>
                  </select>
                </div>
              </div>
              <div className="modal__footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedWarga && (
        <div
          className="modal-overlay"
          onClick={() => setShowRejectModal(false)}
        >
          <div
            className="modal modal--small"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal__header">
              <h2>Tolak Verifikasi Warga</h2>
              <button
                className="modal__close"
                onClick={() => setShowRejectModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal__body">
              <p className="reject-info">
                Anda akan menolak verifikasi warga{" "}
                <strong>{selectedWarga.nama}</strong>. Warga ini akan
                dinonaktifkan.
              </p>
              <div className="form-group">
                <label>Alasan Penolakan *</label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Contoh: NIK tidak valid, data tidak lengkap, dll."
                  required
                />
              </div>
            </div>
            <div className="modal__footer">
              <button
                className="btn-secondary"
                onClick={() => setShowRejectModal(false)}
              >
                Batal
              </button>
              <button
                className="btn-danger"
                onClick={() => handleReject(selectedWarga.id)}
                disabled={actionLoading || !rejectReason.trim()}
              >
                {actionLoading ? "Memproses..." : "Tolak Verifikasi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
