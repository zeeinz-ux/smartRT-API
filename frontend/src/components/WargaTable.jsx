import {
  Users, Search, Filter, Plus, Download, RefreshCw,
  Eye, CheckCircle2, XCircle, Edit3, Trash2, UserX,
  ChevronLeft, ChevronRight, Home, Shield,
} from "lucide-react";
import { formatDate } from "../utils/formatDate.js";

function getStatusBadge(status) {
  if (!status) return null;
  const styles = {
    active: { bg: "#e6f7e6", color: "#2e7d32" },
    suspended: { bg: "#fde8e8", color: "#c62828" },
    pending: { bg: "#fff3e0", color: "#e65100" },
    warga: { bg: "#e3f2fd", color: "#1565c0" },
    admin: { bg: "#f3e5f5", color: "#6a1b9a" },
    bendahara: { bg: "#e8f5e9", color: "#2e7d32" },
    verified: { bg: "#e8f5e9", color: "#2e7d32" },
    rejected: { bg: "#fde8e8", color: "#c62828" },
  };
  const style = styles[status] || { bg: "#f5f5f5", color: "#666" };
  return <span className="ad-badge" style={{ background: style.bg, color: style.color }}>{status}</span>;
}

export default function WargaTable({
  wargaList, isLoading, searchQuery, onSearchChange, onSearchSubmit,
  filters, onFilterChange, pagination, onPageChange,
  actionLoading, toast,
  onViewDetail, onVerify, onOpenRejectModal, onOpenEditModal,
  onDeactivate, onHardDelete, onRefresh, onAddClick,
}) {
  return (
    <>
      {toast && (
        <div className={`toast toast--${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      <header className="mw-header">
        <div className="mw-header__left">
          <h1 className="mw-header__title">Manajemen Warga</h1>
          <p className="mw-header__subtitle">
            Kelola data warga RT-003 — {pagination.total} warga terdaftar
          </p>
        </div>
        <div className="mw-header__right">
          <button className="btn-export" onClick={() => console.log("Export")}>
            <Download size={16} /> Export
          </button>
          <button className="btn-primary" onClick={onAddClick}>
            <Plus size={18} /> Tambah Warga
          </button>
        </div>
      </header>

      <section className="mw-filters">
        <form className="mw-search" onSubmit={onSearchSubmit}>
          <Search size={18} className="mw-search__icon" />
          <input
            type="text" placeholder="Cari nama, email, atau NIK..."
            value={searchQuery} onChange={(e) => onSearchChange(e.target.value)}
            className="mw-search__input"
          />
          <button type="submit" className="mw-search__btn">Cari</button>
        </form>

        <div className="mw-filter-group">
          <div className="mw-filter">
            <Filter size={16} />
            <select value={filters.verification_status} onChange={(e) => onFilterChange("verification_status", e.target.value)}>
              <option value="">Semua Status Verifikasi</option>
              <option value="pending">Menunggu</option>
              <option value="verified">Terverifikasi</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>
          <div className="mw-filter">
            <Home size={16} />
            <select value={filters.status_huni} onChange={(e) => onFilterChange("status_huni", e.target.value)}>
              <option value="">Semua Status Huni</option>
              <option value="pemilik">Pemilik</option>
              <option value="penyewa">Penyewa</option>
            </select>
          </div>
          <div className="mw-filter">
            <Shield size={16} />
            <select value={filters.user_status} onChange={(e) => onFilterChange("user_status", e.target.value)}>
              <option value="">Semua Status Akun</option>
              <option value="active">Aktif</option>
              <option value="suspended">Nonaktif</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div className="mw-filter">
            <Users size={16} />
            <select value={filters.role} onChange={(e) => onFilterChange("role", e.target.value)}>
              <option value="">Semua Role</option>
              <option value="warga">Warga</option>
              <option value="bendahara">Bendahara</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button className="btn-refresh" onClick={onRefresh} title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>
      </section>

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
                    const isOnboarded = !!warga.profile_id;
                    const rowClass = isOnboarded
                      ? `mw-table__row--${warga.verification_status || "none"}`
                      : "mw-table__row--pending";
                    return (
                      <tr key={warga.user_id} className={`mw-table__row ${rowClass}`}>
                        <td>
                          <div className="mw-warga-cell">
                            <div className="mw-warga-cell__avatar">{warga.nama?.charAt(0).toUpperCase()}</div>
                            <div className="mw-warga-cell__info">
                              <span className="mw-warga-cell__name">{warga.nama}</span>
                              <span className="mw-warga-cell__email">{warga.email}</span>
                            </div>
                          </div>
                        </td>
                        <td>{getStatusBadge(warga.role)}</td>
                        <td className="mw-table__nik">
                          {isOnboarded ? warga.nik : <span className="mw-pending-label">Menunggu onboarding</span>}
                        </td>
                        <td className="mw-table__alamat">
                          {isOnboarded ? `${warga.alamat || "-"}${warga.no_rumah ? ` (No. ${warga.no_rumah})` : ""}` : "-"}
                        </td>
                        <td>{getStatusBadge(warga.user_status)}</td>
                        <td>
                          {isOnboarded ? getStatusBadge(warga.verification_status) : <span className="mw-pending-label">Belum isi data</span>}
                        </td>
                        <td className="mw-table__date">{formatDate(warga.created_at)}</td>
                        <td>
                          <div className="mw-actions">
                            <button className="mw-action-btn mw-action-btn--view" onClick={() => onViewDetail(warga.user_id)} title="Lihat Detail">
                              <Eye size={16} />
                            </button>
                            {isOnboarded && warga.verification_status === "pending" && (
                              <>
                                <button className="mw-action-btn mw-action-btn--approve" onClick={() => onVerify(warga.profile_id)} disabled={actionLoading} title="Verifikasi">
                                  <CheckCircle2 size={16} />
                                </button>
                                <button className="mw-action-btn mw-action-btn--reject" onClick={() => onOpenRejectModal(warga)} disabled={actionLoading} title="Tolak">
                                  <XCircle size={16} />
                                </button>
                              </>
                            )}
                            {isOnboarded && (
                              <button className="mw-action-btn mw-action-btn--edit" onClick={() => onOpenEditModal(warga)} title="Edit">
                                <Edit3 size={16} />
                              </button>
                            )}
                            <div className="mw-actions-group">
                              <button className="mw-action-btn mw-action-btn--deactivate" onClick={() => onDeactivate(warga.user_id)} disabled={actionLoading} title="Nonaktifkan">
                                <UserX size={16} />
                              </button>
                              <button className="mw-action-btn mw-action-btn--delete" onClick={() => onHardDelete(warga.user_id)} disabled={actionLoading} title="Hapus permanen">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mw-pagination">
              <span className="mw-pagination__info">
                Menampilkan {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} warga
              </span>
              <div className="mw-pagination__controls">
                <button className="mw-pagination__btn" onClick={() => onPageChange(pagination.page - 1)} disabled={pagination.page === 1}>
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <button key={page} className={`mw-pagination__btn ${page === pagination.page ? "mw-pagination__btn--active" : ""}`} onClick={() => onPageChange(page)}>
                    {page}
                  </button>
                ))}
                <button className="mw-pagination__btn" onClick={() => onPageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </>
  );
}
