import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, XCircle, Clock, Search, X, Eye } from "lucide-react";
import { rupiah } from "../../utils/rupiah.js";
import API from "../../utils/api.js";
import { BULAN } from "../../utils/bulan.js";

export default function VerifikasiIuran() {
  const now = new Date();
  const [bulan, setBulan] = useState(0);
  const [tahun, setTahun] = useState(now.getFullYear());
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({ total: 0, totalAmount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [previewImg, setPreviewImg] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ tahun: tahun.toString() });
      if (bulan) params.set("bulan", bulan.toString());
      const res = await fetch(`${API}/api/admin/iuran/verifikasi?${params}`, { credentials: "include" });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setStats(json.stats);
      }
    } catch {} finally {
      setIsLoading(false);
    }
  }, [bulan, tahun]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`${API}/api/admin/iuran/${id}/approve`, { method: "POST", credentials: "include" });
      const json = await res.json();
      if (json.success) { showToast("Pembayaran diverifikasi"); fetchData(); }
      else { showToast(json.message || "Gagal", "error"); }
    } catch { showToast("Gagal approve", "error"); }
  };

  const handleReject = async (id) => {
    const reason = prompt("Alasan penolakan (opsional):");
    try {
      const res = await fetch(`${API}/api/admin/iuran/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason: reason || "Bukti tidak valid" }),
      });
      const json = await res.json();
      if (json.success) { showToast("Pembayaran ditolak"); fetchData(); }
      else { showToast(json.message || "Gagal", "error"); }
    } catch { showToast("Gagal reject", "error"); }
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "var(--space-xl)" }}>
      {toast && <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, padding: "12px 20px", borderRadius: 8, background: toast.type === "error" ? "#dc2626" : "#16a34a", color: "#fff", fontWeight: 600, fontSize: "0.85rem" }}>{toast.msg}</div>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>Verifikasi Pembayaran</h1>
          <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--clr-subtitle)" }}>Cek dan validasi bukti transfer warga</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
        <select value={bulan} onChange={(e) => setBulan(Number(e.target.value))} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: "0.85rem" }}>
          {BULAN.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
        </select>
        <select value={tahun} onChange={(e) => setTahun(Number(e.target.value))} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: "0.85rem" }}>
          {[2024,2025,2026,2027].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <span style={{ fontSize: "0.82rem", color: "var(--clr-subtitle)" }}>{stats.total} menunggu &middot; {rupiah(stats.totalAmount)}</span>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--clr-subtitle)" }}>Memuat...</div>
      ) : data.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <CheckCircle2 size={48} style={{ opacity: 0.2, marginBottom: 12 }} />
          <p style={{ color: "var(--clr-subtitle)" }}>Tidak ada pembayaran menunggu verifikasi</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
                <th style={{ padding: "10px 12px", fontWeight: 600 }}>Warga</th>
                <th style={{ padding: "10px 12px", fontWeight: 600 }}>Kategori</th>
                <th style={{ padding: "10px 12px", fontWeight: 600 }}>Periode</th>
                <th style={{ padding: "10px 12px", fontWeight: 600 }}>Jumlah</th>
                <th style={{ padding: "10px 12px", fontWeight: 600 }}>Metode</th>
                <th style={{ padding: "10px 12px", fontWeight: 600 }}>Bukti</th>
                <th style={{ padding: "10px 12px", fontWeight: 600, textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 500 }}>{item.warga?.nama || "-"}</td>
                  <td style={{ padding: "10px 12px" }}>{item.kategori?.nama || "-"}</td>
                  <td style={{ padding: "10px 12px" }}>{item.bulan}/{item.tahun}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 700 }}>{rupiah(item.jumlah)}</td>
                  <td style={{ padding: "10px 12px" }}>{item.metode_pembayaran || "-"}</td>
                  <td style={{ padding: "10px 12px" }}>
                    {item.bukti_pembayaran_url ? (
                      <button onClick={() => setPreviewImg(item.bukti_pembayaran_url)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--clr-primary)", display: "flex", alignItems: "center", gap: 4, fontSize: "0.82rem" }}>
                        <Eye size={16} /> Lihat
                      </button>
                    ) : <span style={{ color: "var(--clr-subtitle)", fontSize: "0.82rem" }}>-</span>}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                      <button onClick={() => handleApprove(item.id)} style={{ padding: "6px 12px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                        <CheckCircle2 size={14} /> Setujui
                      </button>
                      <button onClick={() => handleReject(item.id)} style={{ padding: "6px 12px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                        <XCircle size={14} /> Tolak
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {previewImg && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)" }} onClick={() => setPreviewImg(null)}>
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewImg(null)} style={{ position: "absolute", top: -12, right: -12, background: "#dc2626", color: "#fff", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={18} />
            </button>
            <img src={previewImg} alt="Bukti pembayaran" style={{ maxWidth: "100%", maxHeight: "85vh", borderRadius: 12, objectFit: "contain" }} />
          </div>
        </div>
      )}
    </div>
  );
}