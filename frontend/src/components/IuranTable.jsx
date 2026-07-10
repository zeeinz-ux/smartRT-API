import {
  Search, ChevronLeft, ChevronRight, CheckCircle2, Clock,
  AlertCircle, QrCode, Banknote, Building, Edit3, Trash2,
} from "lucide-react";
import { rupiah } from "../utils/rupiah.js";

export default function IuranTable({
  title, subtitle, bulan, tahun, BULAN, now,
  search, statusFilter, pagination, sortedData, isLoading, defaultJumlah,
  onSearchChange, onStatusFilterChange, onBulanChange, onTahunChange,
  onPrevMonth, onNextMonth, onPageChange,
  openBayarModal, openQRISModal, openEditModal, openDeleteModal,
  prevDisabled, nextDisabled, formatDate,
}) {
  const handleSearch = (e) => {
    onSearchChange(e.target.value);
    onPageChange(1);
  };

  const renderPageNumbers = () => {
    if (pagination.totalPages <= 1) return null;
    const pages = [];
    const maxVisible = Math.min(pagination.totalPages, 5);
    for (let i = 0; i < maxVisible; i++) {
      let pageNum;
      if (pagination.totalPages <= 5) {
        pageNum = i + 1;
      } else if (pagination.page <= 3) {
        pageNum = i + 1;
      } else if (pagination.page >= pagination.totalPages - 2) {
        pageNum = pagination.totalPages - 4 + i;
      } else {
        pageNum = pagination.page - 2 + i;
      }
      pages.push(
        <button
          key={pageNum}
          className={`us-pagination__btn ${pagination.page === pageNum ? "us-pagination__btn--active" : ""}`}
          onClick={() => onPageChange(pageNum)}
        >
          {pageNum}
        </button>
      );
    }
    return pages;
  };

  return (
    <>
      <div className="us-header">
        <div className="us-header__left">
          <h1 className="us-header__title">{title}</h1>
          <p className="us-header__subtitle">{subtitle}</p>
        </div>
        <div className="us-header__right">
          <div className="us-month-picker">
            <button className="us-month-picker__btn" onClick={onPrevMonth} disabled={prevDisabled}>
              <ChevronLeft size={16} />
            </button>
            <select value={bulan} onChange={(e) => { onBulanChange(Number(e.target.value)); onPageChange(1); }}>
              {BULAN.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
            <select value={tahun} onChange={(e) => { onTahunChange(Number(e.target.value)); onPageChange(1); }}>
              {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <button className="us-month-picker__btn" onClick={onNextMonth} disabled={nextDisabled}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="us-controls">
        <div className="us-search">
          <Search size={16} className="us-search__icon" />
          <input
            className="us-search__input"
            type="text"
            placeholder="Cari warga..."
            value={search}
            onChange={handleSearch}
          />
        </div>
        <div className="us-filter">
          <select value={statusFilter} onChange={(e) => { onStatusFilterChange(e.target.value); onPageChange(1); }}>
            <option value="">Semua Status</option>
            <option value="belum_lunas">Belum Lunas</option>
            <option value="lunas">Lunas</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      <div className="us-table-section">
        {isLoading ? (
          <div className="us-loading">
            <div className="us-loading__spinner" />
            <p>Memuat data...</p>
          </div>
        ) : (
          <>
            <div className="us-wrapper">
              <table className="us-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Nama Warga</th>
                    <th>NIK</th>
                    <th>No Rumah</th>
                    <th>Status</th>
                    <th>Jumlah</th>
                    <th>Metode</th>
                    <th>Tgl Bayar</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center text-muted" style={{ padding: "3rem" }}>
                        Tidak ada data warga
                      </td>
                    </tr>
                  ) : (
                    sortedData.map((warga, idx) => (
                      <tr key={warga.warga_id}>
                        <td>{(pagination.page - 1) * pagination.limit + idx + 1}</td>
                        <td className="us-table__nama">{warga.nama}</td>
                        <td className="us-table__nik">{warga.nik || "-"}</td>
                        <td>{warga.no_rumah || "-"}</td>
                        <td>
                          {warga.pembayaran ? (
                            <span className={`status-badge status-badge--${warga.pembayaran.status}`}>
                              {warga.pembayaran.status === "lunas" && <CheckCircle2 size={12} />}
                              {warga.pembayaran.status === "pending" && <Clock size={12} />}
                              {warga.pembayaran.status === "belum_lunas" && <AlertCircle size={12} />}
                              {warga.pembayaran.status === "lunas" ? "Lunas" : warga.pembayaran.status === "pending" ? "Pending" : "Belum Lunas"}
                            </span>
                          ) : (
                            <span className="status-badge status-badge--belum_lunas">
                              <AlertCircle size={12} /> Belum Lunas
                            </span>
                          )}
                        </td>
                        <td className="fw-600">
                          {warga.pembayaran ? rupiah(warga.pembayaran.jumlah) : rupiah(defaultJumlah)}
                        </td>
                        <td>
                          {warga.pembayaran?.metode_pembayaran ? (
                            <span className="flex-center text-xs">
                              {warga.pembayaran.metode_pembayaran === "qris" && <QrCode size={14} />}
                              {warga.pembayaran.metode_pembayaran === "transfer" && <Building size={14} />}
                              {warga.pembayaran.metode_pembayaran === "tunai" && <Banknote size={14} />}
                              {warga.pembayaran.metode_pembayaran.charAt(0).toUpperCase() + warga.pembayaran.metode_pembayaran.slice(1)}
                            </span>
                          ) : "-"}
                        </td>
                        <td className="text-xs">
                          {warga.pembayaran?.paid_at ? formatDate(warga.pembayaran.paid_at) : "-"}
                        </td>
                        <td>
                          <div className="us-actions">
                            {!warga.pembayaran ? (
                              <>
                                <button className="us-action-btn us-action-btn--pay" title="Catat Bayar" onClick={() => openBayarModal(warga)}>
                                  <Banknote size={16} />
                                </button>
                                <button className="us-action-btn us-action-btn--pay" title="Bayar via QRIS" onClick={() => openQRISModal(warga)}>
                                  <QrCode size={16} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button className="us-action-btn us-action-btn--edit" title="Edit" onClick={() => openEditModal(warga)}>
                                  <Edit3 size={16} />
                                </button>
                                <button className="us-action-btn us-action-btn--delete" title="Hapus" onClick={() => openDeleteModal(warga)}>
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <div className="us-pagination">
                <span className="us-pagination__info">
                  Menampilkan {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} warga
                </span>
                <div className="us-pagination__controls">
                  <button className="us-pagination__btn" disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)}>
                    <ChevronLeft size={14} />
                  </button>
                  {renderPageNumbers()}
                  <button className="us-pagination__btn" disabled={pagination.page >= pagination.totalPages} onClick={() => onPageChange(pagination.page + 1)}>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
