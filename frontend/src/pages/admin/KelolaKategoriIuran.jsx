import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Edit3, Trash2, X, AlertTriangle } from "lucide-react";
import { rupiah } from "../../utils/rupiah.js";
import "../../assets/style/css/KelolaKategoriIuran.css";
import API_BASE_URL from "../../utils/api.js";

const formatDisplay = (raw) => {
  if (!raw) return ""
  const num = raw.replace(/\D/g, "")
  if (!num) return ""
  return new Intl.NumberFormat("id-ID").format(Number(num))
}

const PERIODE_OPTIONS = [
  { value: "bulanan", label: "Bulanan" },
  { value: "tahunan", label: "Tahunan" },
  { value: "insidental", label: "Insidental" },
];

export default function KelolaKategoriIuran() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [form, setForm] = useState({ nama: "", deskripsi: "", jumlah_default: "", periode: "insidental", aktif: true });
  const [jumlahDisplay, setJumlahDisplay] = useState("");
  const jumlahDefaultRef = useRef("");

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/kategori-iuran`, { credentials: "include" });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch {
      showToast("Gagal memuat data", "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ nama: "", deskripsi: "", jumlah_default: "", periode: "insidental", aktif: true });
    setJumlahDisplay("");
    jumlahDefaultRef.current = "";
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    const raw = item.jumlahDefault ? String(item.jumlahDefault).replace(/\D/g, "") : "";
    setForm({
      nama: item.nama || "",
      deskripsi: item.deskripsi || "",
      jumlah_default: raw,
      periode: item.periode || "insidental",
      aktif: item.aktif !== false,
    });
    setJumlahDisplay(formatDisplay(raw));
    jumlahDefaultRef.current = raw;
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama.trim()) { showToast("Nama kategori wajib diisi", "error"); return; }
    setActionLoading(true);
    try {
      const rawJumlah = (form.jumlah_default || jumlahDefaultRef.current || "0").replace(/\D/g, "")
      const body = {
        nama: form.nama.trim(),
        deskripsi: form.deskripsi.trim() || null,
        jumlah_default: rawJumlah,
        periode: form.periode,
        ...(editingId && { aktif: form.aktif }),
      };
      const url = editingId
        ? `${API_BASE_URL}/api/admin/kategori-iuran/${editingId}`
        : `${API_BASE_URL}/api/admin/kategori-iuran`;
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body) });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || (editingId ? "Kategori berhasil diperbarui" : "Kategori berhasil ditambahkan"));
        setShowModal(false);
        fetchData();
      } else {
        showToast(json.message || "Gagal menyimpan", "error");
      }
    } catch {
      showToast("Gagal menyimpan kategori", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id, nama) => {
    if (!confirm(`Yakin ingin menghapus kategori "${nama}"?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/kategori-iuran/${id}`, { method: "DELETE", credentials: "include" });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || "Kategori berhasil dihapus");
        fetchData();
      } else {
        showToast(json.message || "Gagal menghapus", "error");
      }
    } catch {
      showToast("Gagal menghapus kategori", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const getPeriodeLabel = (value) => PERIODE_OPTIONS.find((o) => o.value === value)?.label || value;

  return (
    <div className="ak-container">
      {toast && <div className={`toast toast--${toast.type}`}>{toast.message}</div>}

      <div className="ak-header">
        <div className="ak-header__left">
          <h1 className="ak-header__title">Kelola Kategori Iuran</h1>
          <p className="ak-header__subtitle">Atur jenis iuran, nominal default, dan periode pembayaran</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={18} /> Tambah Kategori
        </button>
      </div>

      <div className="ak-table-section">
        {isLoading ? (
          <div className="ak-loading">
            <div className="ak-loading__spinner" />
            <p>Memuat data...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="ak-empty">
            <AlertTriangle size={48} className="ak-empty__icon" />
            <h3>Belum ada kategori iuran</h3>
            <p>Buat kategori iuran pertama untuk mulai mengelola iuran warga</p>
          </div>
        ) : (
          <div className="ak-wrapper">
            <table className="ak-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Deskripsi</th>
                  <th>Nominal Default</th>
                  <th>Periode</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.id} className={!item.aktif ? "ak-row--inactive" : ""}>
                    <td className="ak-table__nama">{item.nama}</td>
                    <td className="ak-table__desk">{item.deskripsi || "-"}</td>
                    <td className="ak-table__nominal">{rupiah(Number(item.jumlahDefault))}</td>
                    <td><span className="ak-badge ak-badge--periode">{getPeriodeLabel(item.periode)}</span></td>
                    <td>
                      <span className={`ak-badge ${item.aktif ? "ak-badge--aktif" : "ak-badge--nonaktif"}`}>
                        {item.aktif ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td>
                      <div className="ak-actions">
                        <button className="ak-action-btn" title="Edit" onClick={() => openEdit(item)}>
                          <Edit3 size={16} />
                        </button>
                        <button className="ak-action-btn ak-action-btn--delete" title="Hapus" onClick={() => handleDelete(item.id, item.nama)}>
                          <Trash2 size={16} />
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal--form" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>{editingId ? "Edit Kategori" : "Tambah Kategori"}</h2>
              <button className="modal__close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form className="modal__body" onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nama Kategori *</label>
                  <input type="text" value={form.nama} onChange={(e) => setForm((p) => ({ ...p, nama: e.target.value }))} required placeholder="Contoh: Iuran Keamanan" />
                </div>
                <div className="form-group">
                  <label>Periode</label>
                  <select value={form.periode} onChange={(e) => setForm((p) => ({ ...p, periode: e.target.value }))}>
                    {PERIODE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Nominal Default</label>
                  <div className="ak-nominal-input">
                    <span className="ak-nominal-input__prefix">Rp</span>
                    <input type="text" inputMode="numeric" value={jumlahDisplay} onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "")
                      setForm((p) => ({ ...p, jumlah_default: raw }))
                      jumlahDefaultRef.current = raw
                      setJumlahDisplay(formatDisplay(raw))
                    }} placeholder="0" />
                  </div>
                </div>
                <div className="form-group form-group--full">
                  <label>Deskripsi (opsional)</label>
                  <textarea rows={3} value={form.deskripsi} onChange={(e) => setForm((p) => ({ ...p, deskripsi: e.target.value }))} placeholder="Penjelasan singkat tentang kategori ini" />
                </div>
                {editingId && (
                  <div className="form-group">
                    <label>Status</label>
                    <select value={form.aktif} onChange={(e) => setForm((p) => ({ ...p, aktif: e.target.value === "true" }))}>
                      <option value="true">Aktif</option>
                      <option value="false">Nonaktif</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="modal__footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn-primary" disabled={actionLoading}>
                  {actionLoading ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambah Kategori"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
