import { useState, useEffect, useCallback } from "react";
import RupiahInput from "../../components/RupiahInput";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Edit3,
  Trash2,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, Sector,
} from "recharts";
import { rupiah } from "../../utils/rupiah.js";
import { formatDate } from "../../utils/formatDate.js";
import "../../assets/style/css/Keuangan.css";
import API_BASE_URL from "../../utils/api.js";
import { BULAN, BULAN_LABEL } from "../../utils/bulan.js";

const KATEGORI_PENGELUARAN = [
  "Operasional",
  "Perawatan",
  "Kebersihan",
  "Kegiatan",
  "Dana Sosial",
  "Lainnya",
];

const CHART_COLORS = ["#22c55e", "#ef4444", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export default function Keuangan() {
  const now = new Date();
  const [bulan, setBulan] = useState(() => { const s = localStorage.getItem('keuBulan'); return s ? Number(s) : now.getMonth() + 1; });
  const [tahun, setTahun] = useState(() => { const s = localStorage.getItem('keuTahun'); return s ? Number(s) : now.getFullYear(); });
  const [rekap, setRekap] = useState({ totalPemasukan: 0, totalPengeluaran: 0, saldo: 0, pemasukanSampah: 0, pemasukanQurban: 0, mutasi: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [form, setForm] = useState({ nama: "", jumlah: "", kategori: "Operasional", tanggal: "", keterangan: "" });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchRekap = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        tahun: tahun.toString(),
        ...(bulan > 0 && { bulan: bulan.toString() }),
      });
      const res = await fetch(`${API_BASE_URL}/api/admin/keuangan/rekap?${params}`, { credentials: "include" });
      const json = await res.json();
      if (json.success) setRekap(json.data);
    } catch {
      showToast("Gagal memuat data", "error");
    } finally {
      setIsLoading(false);
    }
  }, [bulan, tahun]);

  useEffect(() => { fetchRekap(); }, [fetchRekap]);

  useEffect(() => {
    localStorage.setItem('keuBulan', String(bulan));
    localStorage.setItem('keuTahun', String(tahun));
  }, [bulan, tahun]);

  const setPageOne = useCallback(() => {}, []);

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

  const openAddModal = () => {
    setEditing(null);
    setForm({ nama: "", jumlah: "", kategori: "Operasional", tanggal: now.toISOString().split("T")[0], keterangan: "" });
    setShowFormModal(true);
  };

  const openEditModal = (item) => {
    setEditing(item);
    setForm({
      nama: item.nama,
      jumlah: String(item.jumlah),
      kategori: item.kategori,
      tanggal: item.tanggal ? item.tanggal.split("T")[0] : now.toISOString().split("T")[0],
      keterangan: item.keterangan || "",
    });
    setShowFormModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const url = editing
        ? `${API_BASE_URL}/api/admin/keuangan/pengeluaran/${editing.id}`
        : `${API_BASE_URL}/api/admin/keuangan/pengeluaran`;
      const method = editing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...form, jumlah: Number(form.jumlah) }),
      });

      const json = await res.json();
      if (json.success) {
        showToast(editing ? "Pengeluaran berhasil diupdate" : "Pengeluaran berhasil dicatat");
        setShowFormModal(false);
        fetchRekap();
      } else {
        showToast(json.message || "Gagal menyimpan", "error");
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
      const res = await fetch(`${API_BASE_URL}/api/admin/keuangan/pengeluaran/${deleting.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (json.success) {
        showToast("Pengeluaran berhasil dihapus");
        setShowDeleteModal(false);
        setDeleting(null);
        fetchRekap();
      } else {
        showToast(json.message || "Gagal menghapus", "error");
      }
    } catch {
      showToast("Gagal menghapus", "error");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="keuangan">
      {toast && <div className={`toast toast--${toast.type}`}>{toast.message}</div>}

      {/* ── Header ── */}
      <div className="keu-header">
        <div className="keu-header__left">
          <h1 className="keu-header__title">Keuangan</h1>
          <p className="keu-header__subtitle">Rekap pemasukan & pengeluaran RT 003</p>
        </div>
        <div className="keu-header__right">
          <div className="keu-month-picker">
            <button className="keu-month-picker__btn" onClick={handlePrevMonth} disabled={bulan === 0}>
              <ChevronLeft size={16} />
            </button>
            <select value={bulan} onChange={(e) => { setBulan(Number(e.target.value)); }}>
              {BULAN.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
            <select value={tahun} onChange={(e) => { setTahun(Number(e.target.value)); }}>
              {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <button className="keu-month-picker__btn" onClick={handleNextMonth} disabled={bulan === 0}>
              <ChevronRight size={16} />
            </button>
          </div>
          <button className="keu-btn-add" onClick={openAddModal}>
            <Plus size={16} /> Catat Pengeluaran
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="keu-stats">
        <div className="keu-stat-card keu-stat-card--green">
          <div className="keu-stat-card__icon">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="keu-stat-card__value">{rupiah(rekap.totalPemasukan)}</div>
            <div className="keu-stat-card__label">Total Pemasukan</div>
            <div className="keu-stat-card__detail">
              Sampah: {rupiah(rekap.pemasukanSampah)} &middot; Qurban: {rupiah(rekap.pemasukanQurban)}
            </div>
          </div>
        </div>
        <div className="keu-stat-card keu-stat-card--red">
          <div className="keu-stat-card__icon">
            <TrendingDown size={24} />
          </div>
          <div>
            <div className="keu-stat-card__value">{rupiah(rekap.totalPengeluaran)}</div>
            <div className="keu-stat-card__label">Total Pengeluaran</div>
          </div>
        </div>
        <div className="keu-stat-card keu-stat-card--blue">
          <div className="keu-stat-card__icon">
            <Wallet size={24} />
          </div>
          <div>
            <div className="keu-stat-card__value" style={{ color: rekap.saldo < 0 ? "var(--clr-danger)" : undefined }}>
              {rupiah(rekap.saldo)}
            </div>
            <div className="keu-stat-card__label">Saldo</div>
          </div>
        </div>
      </div>

      {/* ── Charts ── */}
      <div className="keu-charts">
        <div className="keu-chart-card">
          <h3 className="keu-chart-card__title">Pemasukan vs Pengeluaran Per Bulan</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={rekap.chartBulanan} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--clr-border-light)" />
              <XAxis dataKey="bulan" tickFormatter={(m) => BULAN_LABEL[m]} tick={{ fontSize: 12, fill: "var(--clr-text-muted)" }} />
              <YAxis tick={{ fontSize: 12, fill: "var(--clr-text-muted)" }} tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}jt` : v >= 1000 ? `${(v / 1000).toFixed(0)}rb` : v} />
              <Tooltip formatter={(value) => rupiah(Number(value))} labelFormatter={(m) => BULAN_LABEL[m]} />
              <Legend />
              <Bar dataKey="pemasukan" name="Pemasukan" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="keu-chart-card">
          <h3 className="keu-chart-card__title">Pengeluaran per Kategori</h3>
          {rekap.chartKategori && rekap.chartKategori.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={rekap.chartKategori}
                  dataKey="jumlah"
                  nameKey="kategori"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                >
                  {rekap.chartKategori.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => rupiah(Number(value))} />
                <Legend formatter={(value) => <span style={{ color: "var(--clr-text-secondary)", fontSize: "0.8rem" }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--clr-text-muted)", fontSize: "0.9rem" }}>
              Belum ada data pengeluaran
            </div>
          )}
        </div>
      </div>

      {/* ── Mutasi ── */}
      <div className="keu-table-section">
        {isLoading ? (
          <div className="keu-loading">
            <div className="keu-loading__spinner" />
            <p>Memuat data...</p>
          </div>
        ) : (
          <>
            <div className="keu-table-header">
              <h3>Mutasi Keuangan</h3>
              <span className="keu-table-header__count">{rekap.mutasi.length} transaksi</span>
            </div>
            <div className="keu-table-wrapper">
              <table className="keu-table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Tipe</th>
                    <th>Kategori</th>
                    <th>Keterangan</th>
                    <th>Jumlah</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rekap.mutasi.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "var(--clr-text-muted)" }}>
                        Belum ada transaksi
                      </td>
                    </tr>
                  ) : (
                    rekap.mutasi.map((item, idx) => (
                      <tr key={`${item.tipe}-${item.id}-${idx}`} className={`keu-table__row--${item.tipe}`}>
                        <td className="keu-table__date">{formatDate(item.tanggal)}</td>
                        <td>
                          <span className={`keu-tipe-badge keu-tipe-badge--${item.tipe}`}>
                            {item.tipe === "pemasukan" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                            {item.tipe === "pemasukan" ? "Pemasukan" : "Pengeluaran"}
                          </span>
                        </td>
                        <td>{item.kategori}</td>
                        <td>{item.nama}</td>
                        <td className={`keu-table__jumlah keu-table__jumlah--${item.tipe}`}>
                          {item.tipe === "pemasukan" ? "+" : "-"}{rupiah(item.jumlah)}
                        </td>
                        <td>
                          {item.tipe === "pengeluaran" ? (
                            <div className="keu-actions">
                              <button className="keu-action-btn keu-action-btn--edit" title="Edit" onClick={() => openEditModal(item)}>
                                <Edit3 size={14} />
                              </button>
                              <button className="keu-action-btn keu-action-btn--delete" title="Hapus" onClick={() => openDeleteModal(item)}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: "var(--clr-text-muted)", fontSize: "0.8rem" }}>-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── MODAL: Add/Edit Pengeluaran ── */}
      {showFormModal && (
        <div className="modal-overlay" onClick={() => setShowFormModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>{editing ? "Edit Pengeluaran" : "Catat Pengeluaran"}</h2>
              <button className="modal__close" onClick={() => setShowFormModal(false)}><X size={20} /></button>
            </div>
            <form className="modal__body" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nama Pengeluaran *</label>
                <input type="text" value={form.nama} onChange={(e) => setForm((p) => ({ ...p, nama: e.target.value }))} required placeholder="Contoh: Beli kantong sampah" />
              </div>
              <div className="form-group">
                <label>Jumlah *</label>
                <RupiahInput value={form.jumlah} onChange={(v) => setForm((p) => ({ ...p, jumlah: v }))} required />
              </div>
              <div className="form-group">
                <label>Kategori</label>
                <select value={form.kategori} onChange={(e) => setForm((p) => ({ ...p, kategori: e.target.value }))}>
                  {KATEGORI_PENGELUARAN.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Tanggal *</label>
                <input type="date" value={form.tanggal} onChange={(e) => setForm((p) => ({ ...p, tanggal: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Keterangan (opsional)</label>
                <textarea value={form.keterangan} onChange={(e) => setForm((p) => ({ ...p, keterangan: e.target.value }))} placeholder="Catatan tambahan..." rows={2} />
              </div>
              <div className="modal__footer">
                <button type="button" className="btn-secondary" onClick={() => setShowFormModal(false)}>Batal</button>
                <button type="submit" className="btn-primary" disabled={actionLoading}>
                  {actionLoading ? "Menyimpan..." : editing ? "Simpan" : "Catat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Delete Confirmation ── */}
      {showDeleteModal && deleting && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal modal--small" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Hapus Pengeluaran</h2>
              <button className="modal__close" onClick={() => setShowDeleteModal(false)}><X size={20} /></button>
            </div>
            <div className="modal__body">
              <p style={{ fontSize: "0.9rem", color: "var(--clr-text-secondary)" }}>
                Yakin ingin menghapus pengeluaran <strong>{deleting.nama}</strong> sebesar {rupiah(deleting.jumlah)}?
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
    </div>
  );
}
