import { useState, useEffect, useCallback } from "react";
import {
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Wallet,
  QrCode,
  Edit3,
  Building,
  Banknote,
} from "lucide-react";
import RupiahInput from "../../components/RupiahInput";
import "../../assets/style/css/UangSampah.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

const BULAN = [
  { value: 0, label: "Semua Bulan" },
  { value: 1, label: "Januari" }, { value: 2, label: "Februari" },
  { value: 3, label: "Maret" }, { value: 4, label: "April" },
  { value: 5, label: "Mei" }, { value: 6, label: "Juni" },
  { value: 7, label: "Juli" }, { value: 8, label: "Agustus" },
  { value: 9, label: "September" }, { value: 10, label: "Oktober" },
  { value: 11, label: "November" }, { value: 12, label: "Desember" },
];

function rupiah(n) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

function formatDate(d) {
  if (!d) return "-";
  const date = new Date(d);
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function UangQurban() {
  const now = new Date();
  const [bulan, setBulan] = useState(() => { const s = localStorage.getItem('uqBulan'); return s ? Number(s) : now.getMonth() + 1; });
  const [tahun, setTahun] = useState(() => { const s = localStorage.getItem('uqTahun'); return s ? Number(s) : now.getFullYear(); });
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({ total: 0, lunas: 0, pending: 0, belumLunas: 0, totalAmount: 0, collectedAmount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [toast, setToast] = useState(null);

  // Modal states
  const [showBayarModal, setShowBayarModal] = useState(false);
  const [showQRISModal, setShowQRISModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedWarga, setSelectedWarga] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [defaultJumlah, setDefaultJumlah] = useState(500000);
  const [formBayar, setFormBayar] = useState({
    jumlah: 500000,
    metode_pembayaran: "tunai",
    keterangan: "",
  });

  const [formEdit, setFormEdit] = useState({
    jumlah: 0,
    status: "lunas",
    metode_pembayaran: "tunai",
    keterangan: "",
  });

  const QRIS_IMAGE_URL = `${API_BASE_URL}/images/qris.png`;

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        tahun: tahun.toString(),
        ...(bulan > 0 && { bulan: bulan.toString() }),
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });

      const res = await fetch(`${API_BASE_URL}/api/admin/qurban?${params}`, { credentials: "include" });
      const json = await res.json();

      if (json.success) {
        setData(json.data);
        setStats(json.stats);
        setPagination((prev) => ({ ...prev, ...json.pagination }));
      }
    } catch {
      showToast("Gagal memuat data", "error");
    } finally {
      setIsLoading(false);
    }
  }, [bulan, tahun, pagination.page, search, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    localStorage.setItem('uqBulan', String(bulan));
    localStorage.setItem('uqTahun', String(tahun));
  }, [bulan, tahun]);

  const setPageOne = useCallback(() => setPagination((p) => ({ ...p, page: 1 })), []);

  const handlePrevMonth = () => {
    if (bulan === 0) return;
    if (bulan === 1) { setBulan(12); setTahun((t) => t - 1); }
    else { setBulan((b) => b - 1); }
  };

  const handleNextMonth = () => {
    if (bulan === 0) return;
    if (bulan === 12) { setBulan(1); setTahun((t) => t + 1); }
    else { setBulan((b) => b + 1); }
  };

  const openBayarModal = (warga) => {
    setSelectedWarga(warga);
    setFormBayar({ jumlah: defaultJumlah, metode_pembayaran: "tunai", keterangan: "" });
    setShowBayarModal(true);
  };

  const openQRISModal = (warga) => {
    setSelectedWarga(warga);
    setShowQRISModal(true);
  };

  const handleBayarViaQRIS = async () => {
    if (!selectedWarga) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/qurban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          warga_id: selectedWarga.warga_id,
          bulan: bulan > 0 ? bulan : now.getMonth() + 1,
          tahun,
          jumlah: defaultJumlah,
          status: "pending",
          metode_pembayaran: "qris",
          keterangan: "Pembayaran via QRIS",
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast("Tagihan QRIS berhasil dibuat.");
        setShowQRISModal(false);
        fetchData();
      } else {
        showToast(json.message || "Gagal membuat tagihan", "error");
      }
    } catch {
      showToast("Gagal membuat tagihan", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBayar = async (e) => {
    e.preventDefault();
    if (!selectedWarga) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/qurban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          warga_id: selectedWarga.warga_id,
          bulan: bulan > 0 ? bulan : now.getMonth() + 1,
          tahun,
          jumlah: formBayar.jumlah,
          status: "lunas",
          metode_pembayaran: formBayar.metode_pembayaran,
          keterangan: formBayar.keterangan,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast(`Pembayaran ${selectedWarga.nama} berhasil dicatat`);
        setShowBayarModal(false);
        fetchData();
      } else {
        showToast(json.message || "Gagal mencatat pembayaran", "error");
      }
    } catch {
      showToast("Gagal mencatat pembayaran", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (warga) => {
    setSelectedWarga(warga);
    setSelectedPayment(warga.pembayaran);
    setFormEdit({
      jumlah: warga.pembayaran?.jumlah || defaultJumlah,
      status: warga.pembayaran?.status || "lunas",
      metode_pembayaran: warga.pembayaran?.metode_pembayaran || "tunai",
      keterangan: warga.pembayaran?.keterangan || "",
    });
    setShowEditModal(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!selectedPayment) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/qurban/${selectedPayment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formEdit),
      });

      const json = await res.json();
      if (json.success) {
        showToast("Pembayaran berhasil diupdate");
        setShowEditModal(false);
        fetchData();
      } else {
        showToast(json.message || "Gagal mengupdate", "error");
      }
    } catch {
      showToast("Gagal mengupdate pembayaran", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteModal = (warga) => {
    setSelectedWarga(warga);
    setSelectedPayment(warga.pembayaran);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedPayment) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/qurban/${selectedPayment.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const json = await res.json();
      if (json.success) {
        showToast("Pembayaran berhasil dihapus");
        setShowDeleteModal(false);
        fetchData();
      } else {
        showToast(json.message || "Gagal menghapus", "error");
      }
    } catch {
      showToast("Gagal menghapus pembayaran", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const aPaid = a.pembayaran?.status === "lunas";
    const bPaid = b.pembayaran?.status === "lunas";
    return aPaid - bPaid;
  });

  return (
    <div className="uang-sampah">
      {/* ── Toast ── */}
      {toast && (
        <div className={`toast toast--${toast.type}`}>{toast.message}</div>
      )}

      {/* ── Header ── */}
      <div className="us-header">
        <div className="us-header__left">
          <h1 className="us-header__title">Uang Qurban</h1>
          <p className="us-header__subtitle">
            Kelola iuran qurban tahunan warga RT 003
          </p>
        </div>
        <div className="us-header__right">
          <div className="us-month-picker">
            <button className="us-month-picker__btn" onClick={handlePrevMonth} disabled={bulan === 0}>
              <ChevronLeft size={16} />
            </button>
            <select value={bulan} onChange={(e) => { setBulan(Number(e.target.value)); setPagination((p) => ({ ...p, page: 1 })); }}>
              {BULAN.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
            <select value={tahun} onChange={(e) => { setTahun(Number(e.target.value)); setPagination((p) => ({ ...p, page: 1 })); }}>
              {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <button className="us-month-picker__btn" onClick={handleNextMonth} disabled={bulan === 0}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="us-stats">
        <div className="us-stat-card">
          <div className="us-stat-card__icon us-stat-card__icon--primary">
            <UsersIcon />
          </div>
          <div>
            <div className="us-stat-card__value">{stats.total}</div>
            <div className="us-stat-card__label">Total Warga</div>
          </div>
        </div>
        <div className="us-stat-card">
          <div className="us-stat-card__icon us-stat-card__icon--green">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="us-stat-card__value">{stats.lunas}</div>
            <div className="us-stat-card__label">Lunas</div>
          </div>
        </div>
        <div className="us-stat-card">
          <div className="us-stat-card__icon us-stat-card__icon--yellow">
            <Clock size={20} />
          </div>
          <div>
            <div className="us-stat-card__value">{stats.belumLunas}</div>
            <div className="us-stat-card__label">Belum Lunas</div>
          </div>
        </div>
        <div className="us-stat-card">
          <div className="us-stat-card__icon us-stat-card__icon--blue">
            <Wallet size={20} />
          </div>
          <div>
            <div className="us-stat-card__value">{rupiah(stats.collectedAmount)}</div>
            <div className="us-stat-card__label">Terkumpul</div>
          </div>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="us-controls">
        <div className="us-search">
          <Search size={16} className="us-search__icon" />
          <input
            className="us-search__input"
            type="text"
            placeholder="Cari warga..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
          />
        </div>
        <div className="us-filter">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}>
            <option value="">Semua Status</option>
            <option value="belum_lunas">Belum Lunas</option>
            <option value="lunas">Lunas</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* ── Table ── */}
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
                      <td colSpan={9} style={{ textAlign: "center", padding: "3rem", color: "var(--clr-text-muted)" }}>
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
                        <td style={{ fontWeight: 600 }}>
                          {warga.pembayaran ? rupiah(warga.pembayaran.jumlah) : rupiah(defaultJumlah)}
                        </td>
                        <td>
                          {warga.pembayaran?.metode_pembayaran ? (
                            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.8rem" }}>
                              {warga.pembayaran.metode_pembayaran === "qris" && <QrCode size={14} />}
                              {warga.pembayaran.metode_pembayaran === "transfer" && <Building size={14} />}
                              {warga.pembayaran.metode_pembayaran === "tunai" && <Banknote size={14} />}
                              {warga.pembayaran.metode_pembayaran.charAt(0).toUpperCase() + warga.pembayaran.metode_pembayaran.slice(1)}
                            </span>
                          ) : "-"}
                        </td>
                        <td style={{ fontSize: "0.8rem" }}>
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

            {/* ── Pagination ── */}
            {pagination.totalPages > 1 && (
              <div className="us-pagination">
                <span className="us-pagination__info">
                  Menampilkan {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} warga
                </span>
                <div className="us-pagination__controls">
                  <button className="us-pagination__btn" disabled={pagination.page <= 1} onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
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
                    return (
                      <button
                        key={pageNum}
                        className={`us-pagination__btn ${pagination.page === pageNum ? "us-pagination__btn--active" : ""}`}
                        onClick={() => setPagination((p) => ({ ...p, page: pageNum }))}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button className="us-pagination__btn" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── MODAL: Catat Pembayaran ── */}
      {showBayarModal && selectedWarga && (
        <div className="modal-overlay" onClick={() => setShowBayarModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Catat Pembayaran Qurban</h2>
              <button className="modal__close" onClick={() => setShowBayarModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form className="modal__body" onSubmit={handleBayar}>
              <div style={{ marginBottom: "var(--space-md)", fontSize: "0.9rem", color: "var(--clr-text-primary)", fontWeight: 600 }}>
                {selectedWarga.nama} — {bulan > 0 ? `${BULAN.find((b) => b.value === bulan)?.label} ` : ""}{tahun}
              </div>
              <div className="form-group">
                <label>Jumlah Pembayaran</label>
                <RupiahInput value={formBayar.jumlah} onChange={(v) => setFormBayar((p) => ({ ...p, jumlah: v }))} required />
              </div>
              <div className="form-group">
                <label>Metode Pembayaran</label>
                <select
                  value={formBayar.metode_pembayaran}
                  onChange={(e) => setFormBayar((p) => ({ ...p, metode_pembayaran: e.target.value }))}
                >
                  <option value="tunai">Tunai</option>
                  <option value="transfer">Transfer</option>
                  <option value="qris">QRIS</option>
                </select>
              </div>
              <div className="form-group">
                <label>Keterangan (opsional)</label>
                <input
                  type="text"
                  value={formBayar.keterangan}
                  onChange={(e) => setFormBayar((p) => ({ ...p, keterangan: e.target.value }))}
                  placeholder="Contoh: Bayar via WA"
                />
              </div>
              <div className="modal__footer">
                <button type="button" className="btn-secondary" onClick={() => setShowBayarModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn-primary" disabled={actionLoading}>
                  {actionLoading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: QRIS ── */}
      {showQRISModal && selectedWarga && (
        <div className="modal-overlay" onClick={() => setShowQRISModal(false)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Bayar via QRIS</h2>
              <button className="modal__close" onClick={() => setShowQRISModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal__body">
              <div className="qris-container">
                <div style={{ fontSize: "1rem", fontWeight: 600, color: "var(--clr-text-primary)" }}>
                  {selectedWarga.nama}
                </div>
                <img
                  src={QRIS_IMAGE_URL}
                  alt="QRIS"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
                <p>
                  Scan QRIS di atas untuk melakukan pembayaran.<br />
                  Nominal: <strong>{rupiah(defaultJumlah)}</strong><br />
                  <small style={{ color: "var(--clr-text-muted)" }}>
                    Setelah warga membayar, konfirmasi pembayaran di halaman ini
                  </small>
                </p>
              </div>
            </div>
            <div className="modal__footer">
              <button type="button" className="btn-secondary" onClick={() => setShowQRISModal(false)}>
                Tutup
              </button>
              <button type="button" className="btn-primary" onClick={handleBayarViaQRIS} disabled={actionLoading}>
                {actionLoading ? "Memproses..." : "Buat Tagihan QRIS"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Edit ── */}
      {showEditModal && selectedWarga && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Edit Pembayaran Qurban</h2>
              <button className="modal__close" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form className="modal__body" onSubmit={handleEdit}>
              <div style={{ marginBottom: "var(--space-md)", fontSize: "0.9rem", color: "var(--clr-text-primary)", fontWeight: 600 }}>
                {selectedWarga.nama}
              </div>
              <div className="form-group">
                <label>Jumlah</label>
                <RupiahInput value={formEdit.jumlah} onChange={(v) => setFormEdit((p) => ({ ...p, jumlah: v }))} required />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={formEdit.status} onChange={(e) => setFormEdit((p) => ({ ...p, status: e.target.value }))}>
                  <option value="lunas">Lunas</option>
                  <option value="pending">Pending</option>
                  <option value="belum_lunas">Belum Lunas</option>
                </select>
              </div>
              <div className="form-group">
                <label>Metode Pembayaran</label>
                <select value={formEdit.metode_pembayaran} onChange={(e) => setFormEdit((p) => ({ ...p, metode_pembayaran: e.target.value }))}>
                  <option value="tunai">Tunai</option>
                  <option value="transfer">Transfer</option>
                  <option value="qris">QRIS</option>
                </select>
              </div>
              <div className="form-group">
                <label>Keterangan</label>
                <input
                  type="text"
                  value={formEdit.keterangan}
                  onChange={(e) => setFormEdit((p) => ({ ...p, keterangan: e.target.value }))}
                />
              </div>
              <div className="modal__footer">
                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn-primary" disabled={actionLoading}>
                  {actionLoading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Delete Confirmation ── */}
      {showDeleteModal && selectedWarga && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal modal--small" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Hapus Pembayaran</h2>
              <button className="modal__close" onClick={() => setShowDeleteModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal__body">
              <p style={{ fontSize: "0.9rem", color: "var(--clr-text-secondary)", marginBottom: "var(--space-md)" }}>
                Yakin ingin menghapus pembayaran qurban <strong>{selectedWarga.nama}</strong>{bulan > 0 ? ` bulan ${BULAN.find((b) => b.value === bulan)?.label}` : ""} tahun {tahun}?
              </p>
            </div>
            <div className="modal__footer">
              <button type="button" className="btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Batal
              </button>
              <button type="button" className="btn-primary" style={{ background: "var(--clr-danger)" }} onClick={handleDelete} disabled={actionLoading}>
                {actionLoading ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UsersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
