import { useState, useEffect, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight, X, CheckCircle2, Clock, AlertCircle, Wallet, Plus, Edit3, Banknote, QrCode, CreditCard } from "lucide-react";
import RupiahInput from "../../components/RupiahInput";
import "../../assets/style/css/AdminIuran.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";
const QRIS_IMAGE_URL = import.meta.env.VITE_QRIS_IMAGE_URL || `${API_BASE_URL}/images/qris.png`;

const BULAN = [
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
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminIuran() {
  const now = new Date();
  const [bulan, setBulan] = useState(() => { const s = localStorage.getItem('iuBulan'); return s ? Number(s) : now.getMonth() + 1; });
  const [tahun, setTahun] = useState(() => { const s = localStorage.getItem('iuTahun'); return s ? Number(s) : now.getFullYear(); });
  const [kategoriList, setKategoriList] = useState([]);
  const [kategoriId, setKategoriId] = useState("");
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({ total: 0, lunas: 0, pending: 0, belumLunas: 0, totalAmount: 0, collectedAmount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showQris, setShowQris] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({
    warga_id: "", kategori_id: "", bulan: null, tahun: now.getFullYear(),
    jumlah: "", status: "lunas", metode_pembayaran: "tunai", keterangan: "",
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => { localStorage.setItem('iuBulan', String(bulan)); }, [bulan]);
  useEffect(() => { localStorage.setItem('iuTahun', String(tahun)); }, [tahun]);

  // Fetch kategori
  useEffect(() => {
    async function fetchKategori() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/kategori-iuran`, { credentials: "include" });
        const json = await res.json();
        if (json.success) setKategoriList(json.data);
      } catch {}
    }
    fetchKategori();
  }, []);

  // Set kategori_id default ke yang pertama
  useEffect(() => {
    if (!kategoriId && kategoriList.length > 0) {
      setKategoriId(kategoriList[0].id);
    }
  }, [kategoriList, kategoriId]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        bulan: bulan.toString(),
        tahun: tahun.toString(),
        page: page.toString(),
        limit: "50",
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(kategoriId && { kategori_id: kategoriId }),
      });
      const res = await fetch(`${API_BASE_URL}/api/admin/iuran?${params}`, { credentials: "include" });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setStats(json.stats);
        setPagination(json.pagination);
      }
    } catch {} finally {
      setIsLoading(false);
    }
  }, [bulan, tahun, search, page, statusFilter, kategoriId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleSubmit(e) {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = {
        warga_id: form.warga_id,
        kategori_id: kategoriId,
        bulan: form.bulan || null,
        tahun: form.tahun,
        jumlah: Number(form.jumlah),
        status: form.status,
        metode_pembayaran: form.metode_pembayaran || null,
        keterangan: form.keterangan || null,
      };
      const res = await fetch(`${API_BASE_URL}/api/admin/iuran`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Pembayaran berhasil dicatat");
        setShowModal(false);
        setForm({ warga_id: "", kategori_id: "", bulan: null, tahun: now.getFullYear(), jumlah: "", status: "lunas", metode_pembayaran: "tunai", keterangan: "" });
        fetchData();
      } else {
        showToast(json.message || "Gagal", "error");
      }
    } catch { showToast("Gagal menyimpan", "error"); } finally { setActionLoading(false); }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = {};
      if (form.jumlah) payload.jumlah = Number(form.jumlah);
      if (form.status) payload.status = form.status;
      if (form.metode_pembayaran) payload.metode_pembayaran = form.metode_pembayaran;
      if (form.keterangan !== undefined) payload.keterangan = form.keterangan;
      const res = await fetch(`${API_BASE_URL}/api/admin/iuran/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Pembayaran berhasil diupdate");
        setShowEditModal(false);
        setEditingId(null);
        fetchData();
      } else { showToast(json.message || "Gagal", "error"); }
    } catch { showToast("Gagal update", "error"); } finally { setActionLoading(false); }
  }

  async function handleDelete(id) {
    if (!confirm("Hapus pembayaran ini?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/iuran/${id}`, { method: "DELETE", credentials: "include" });
      const json = await res.json();
      if (json.success) { showToast("Berhasil dihapus"); fetchData(); }
      else { showToast(json.message || "Gagal", "error"); }
    } catch { showToast("Gagal hapus", "error"); }
  }

  function openEdit(item) {
    setEditingId(item.pembayaran?.id);
    setForm({
      warga_id: item.warga_id,
      kategori_id: kategoriId,
      bulan: null,
      tahun: now.getFullYear(),
      jumlah: item.pembayaran?.jumlah?.toString() || "",
      status: item.pembayaran?.status || "lunas",
      metode_pembayaran: item.pembayaran?.metode_pembayaran || "tunai",
      keterangan: item.pembayaran?.keterangan || "",
    });
    setShowEditModal(true);
  }

  const selectedKategori = kategoriList.find((k) => k.id === kategoriId);
  const isBulanan = selectedKategori?.periode === "bulanan";
  const isTahunan = selectedKategori?.periode === "tahunan";

  return (
    <div className="ai-container">
      {toast && <div className={`ai-toast ai-toast--${toast.type}`}>{toast.message}</div>}

      <div className="ai-header">
        <div>
          <h1 className="ai-title">Iuran Warga</h1>
          <p className="ai-subtitle">Kelola semua iuran warga dalam satu tempat</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            value={kategoriId}
            onChange={(e) => { setKategoriId(e.target.value); setPage(1); }}
            style={{
              padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db",
              fontSize: "0.85rem", background: "#fff",
            }}
          >
            <option value="">Semua Kategori</option>
            {kategoriList.map((k) => (
              <option key={k.id} value={k.id}>{k.nama}</option>
            ))}
          </select>
          <button className="ai-btn ai-btn--primary" onClick={() => {
            setForm({ warga_id: "", kategori_id: kategoriId, bulan: isBulanan ? now.getMonth() + 1 : null, tahun: now.getFullYear(), jumlah: selectedKategori?.jumlah_default || "", status: "lunas", metode_pembayaran: "tunai", keterangan: "" });
            setShowModal(true);
          }}>
            <Plus size={18} /> Catat Pembayaran
          </button>
        </div>
      </div>

      {/* Period Filter */}
      <div className="ai-period">
        {isBulanan && (
          <select value={bulan} onChange={(e) => { setBulan(Number(e.target.value)); setPage(1); }}>
            {BULAN.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
        )}
        <select value={tahun} onChange={(e) => { setTahun(Number(e.target.value)); setPage(1); }}>
          {[2024, 2025, 2026, 2027].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Stats */}
      <div className="ai-stats">
        <div className="ai-stat ai-stat--total">
          <Wallet size={24} />
          <div><span className="ai-stat__num">{rupiah(stats.totalAmount)}</span><span className="ai-stat__label">Total Iuran</span></div>
        </div>
        <div className="ai-stat ai-stat--success">
          <CheckCircle2 size={24} />
          <div><span className="ai-stat__num">{stats.lunas}</span><span className="ai-stat__label">Lunas</span></div>
        </div>
        <div className="ai-stat ai-stat--warning">
          <Clock size={24} />
          <div><span className="ai-stat__num">{stats.pending}</span><span className="ai-stat__label">Pending</span></div>
        </div>
        <div className="ai-stat ai-stat--danger">
          <AlertCircle size={24} />
          <div><span className="ai-stat__num">{stats.belumLunas}</span><span className="ai-stat__label">Belum Lunas</span></div>
        </div>
        <div className="ai-stat ai-stat--info">
          <Wallet size={24} />
          <div><span className="ai-stat__num">{rupiah(stats.collectedAmount)}</span><span className="ai-stat__label">Terkumpul</span></div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="ai-toolbar">
        <div className="ai-search">
          <Search size={18} />
          <input placeholder="Cari nama/NIK..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="ai-filter-group">
          {["", "belum_lunas", "pending", "lunas"].map((s) => (
            <button key={s} className={`ai-filter-btn ${statusFilter === s ? "ai-filter-btn--active" : ""}`} onClick={() => { setStatusFilter(s); setPage(1); }}>
              {s === "" ? "Semua" : s.charAt(0).toUpperCase() + s.slice(1).replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="ai-table-wrap">
        {isLoading ? (
          <div className="ai-loading">Memuat...</div>
        ) : (
          <table className="ai-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>NIK</th>
                <th>No. Rumah</th>
                <th>Jumlah</th>
                <th>Status</th>
                <th>Metode</th>
                <th>Tanggal Bayar</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 24, color: "var(--clr-subtitle)" }}>Belum ada data</td></tr>
              ) : data.map((item) => (
                <tr key={item.warga_id}>
                  <td style={{ fontWeight: 500 }}>{item.nama}</td>
                  <td>{item.nik || "-"}</td>
                  <td>{item.no_rumah || "-"}</td>
                  <td style={{ fontWeight: 700 }}>{item.pembayaran ? rupiah(item.pembayaran.jumlah) : "-"}</td>
                  <td>
                    {item.pembayaran ? (
                      <span className={`ai-badge ai-badge--${item.pembayaran.status}`}>
                        {item.pembayaran.status === "lunas" && <CheckCircle2 size={14} />}
                        {item.pembayaran.status === "pending" && <Clock size={14} />}
                        {item.pembayaran.status === "belum_lunas" && <AlertCircle size={14} />}
                        {item.pembayaran.status === "lunas" ? "Lunas" : item.pembayaran.status === "pending" ? "Pending" : "Belum Lunas"}
                      </span>
                    ) : <span className="ai-badge ai-badge--belum_lunas"><AlertCircle size={14} /> Belum Bayar</span>}
                  </td>
                  <td>{item.pembayaran?.metode_pembayaran || "-"}</td>
                  <td>{item.pembayaran?.paid_at ? formatDate(item.pembayaran.paid_at) : "-"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      {item.pembayaran ? (
                        <>
                          <button className="ai-action ai-action--edit" onClick={() => openEdit(item)} title="Edit">
                            <Edit3 size={16} />
                          </button>
                          <button className="ai-action ai-action--delete" onClick={() => handleDelete(item.pembayaran.id)} title="Hapus">
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <button className="ai-action ai-action--add" onClick={() => {
                          setForm({
                            warga_id: item.warga_id,
                            kategori_id: kategoriId,
                            bulan: isBulanan ? now.getMonth() + 1 : null,
                            tahun: now.getFullYear(),
                            jumlah: selectedKategori?.jumlah_default || "",
                            status: "lunas",
                            metode_pembayaran: "tunai",
                            keterangan: "",
                          });
                          setShowModal(true);
                        }} title="Bayar">
                          <Plus size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="ai-pagination">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={18} /></button>
          <span>Halaman {page} dari {pagination.totalPages}</span>
          <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}><ChevronRight size={18} /></button>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="ai-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="ai-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ai-modal__header">
              <h3>Catat Pembayaran {selectedKategori?.nama || "Iuran"}</h3>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="ai-modal__body">
                <div className="ai-field">
                  <label>Warga</label>
                  <select value={form.warga_id} onChange={(e) => setForm({ ...form, warga_id: e.target.value })} required>
                    <option value="">Pilih Warga</option>
                    {data.map((d) => (
                      <option key={d.warga_id} value={d.warga_id}>{d.nama} - {d.no_rumah || "-"}</option>
                    ))}
                  </select>
                </div>
                {isBulanan && (
                  <div className="ai-field">
                    <label>Bulan</label>
                    <select value={form.bulan || ""} onChange={(e) => setForm({ ...form, bulan: Number(e.target.value) })}>
                      {BULAN.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                    </select>
                  </div>
                )}
                <div className="ai-field">
                  <label>Jumlah (Rp)</label>
                  <RupiahInput value={form.jumlah} onChange={(v) => setForm({ ...form, jumlah: v })} required />
                </div>
                <div className="ai-field">
                  <label>Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="lunas">Lunas</option>
                    <option value="pending">Pending</option>
                    <option value="belum_lunas">Belum Lunas</option>
                  </select>
                </div>
                <div className="ai-field">
                  <label>Metode Pembayaran</label>
                  <select value={form.metode_pembayaran} onChange={(e) => setForm({ ...form, metode_pembayaran: e.target.value })}>
                    <option value="tunai">Tunai</option>
                    <option value="transfer">Transfer</option>
                    <option value="qris">QRIS</option>
                  </select>
                </div>
                <div className="ai-field">
                  <label>Keterangan</label>
                  <textarea value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} rows={2} />
                </div>
              </div>
              <div className="ai-modal__footer">
                <button type="button" className="ai-btn" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="ai-btn ai-btn--primary" disabled={actionLoading}>
                  {actionLoading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="ai-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="ai-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ai-modal__header">
              <h3>Edit Pembayaran</h3>
              <button onClick={() => setShowEditModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="ai-modal__body">
                <div className="ai-field">
                  <label>Jumlah (Rp)</label>
                  <RupiahInput value={form.jumlah} onChange={(v) => setForm({ ...form, jumlah: v })} />
                </div>
                <div className="ai-field">
                  <label>Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="lunas">Lunas</option>
                    <option value="pending">Pending</option>
                    <option value="belum_lunas">Belum Lunas</option>
                  </select>
                </div>
                <div className="ai-field">
                  <label>Metode Pembayaran</label>
                  <select value={form.metode_pembayaran} onChange={(e) => setForm({ ...form, metode_pembayaran: e.target.value })}>
                    <option value="tunai">Tunai</option>
                    <option value="transfer">Transfer</option>
                    <option value="qris">QRIS</option>
                  </select>
                </div>
                <div className="ai-field">
                  <label>Keterangan</label>
                  <textarea value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} rows={2} />
                </div>
              </div>
              <div className="ai-modal__footer">
                <button type="button" className="ai-btn" onClick={() => setShowEditModal(false)}>Batal</button>
                <button type="submit" className="ai-btn ai-btn--primary" disabled={actionLoading}>
                  {actionLoading ? "Menyimpan..." : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QRIS Modal */}
      {showQris && (
        <div className="ai-modal-overlay" onClick={() => setShowQris(false)}>
          <div className="ai-modal ai-modal--small" onClick={(e) => e.stopPropagation()}>
            <div className="ai-modal__header">
              <h3><QrCode size={20} /> QRIS</h3>
              <button onClick={() => setShowQris(false)}><X size={20} /></button>
            </div>
            <div style={{ textAlign: "center", padding: 24 }}>
              <img src={QRIS_IMAGE_URL} alt="QRIS" style={{ width: 200, height: 200, background: "#f3f4f6", borderRadius: 12 }} />
              <p style={{ marginTop: 12, fontSize: "0.85rem", color: "var(--clr-subtitle)" }}>Scan QR di atas untuk membayar</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}