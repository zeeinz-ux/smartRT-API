import { useState, useEffect, useCallback, useRef } from "react";
import { CheckCircle2, Clock, AlertCircle, Wallet, X, Upload, QrCode, Banknote } from "lucide-react";
import "../../assets/style/css/LaporanWarga.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

function rupiah(n) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

function formatDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function WargaTagihan() {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({ total: 0, lunas: 0, belumLunas: 0, pending: 0, totalTagihan: 0, totalLunas: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [showDetail, setShowDetail] = useState(null);
  const [showBayar, setShowBayar] = useState(null);
  const [metodePembayaran, setMetodePembayaran] = useState("");
  const [buktiFile, setBuktiFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentSetting, setPaymentSetting] = useState(null);
  const fileInputRef = useRef(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`${API_BASE_URL}/api/warga/tagihan?${params}`, { credentials: "include" });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setStats(json.stats);
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Fetch payment settings
  useEffect(() => {
    async function fetchPayment() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/warga/payment-settings`, { credentials: "include" });
        const json = await res.json();
        if (json.success) setPaymentSetting(json.data);
      } catch {}
    }
    fetchPayment();
  }, []);

  const handleBayar = async () => {
    if (!showBayar || !metodePembayaran) return;
    if (metodePembayaran !== "tunai" && !buktiFile) {
      alert("Bukti pembayaran wajib diupload untuk metode transfer/QRIS");
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("metode_pembayaran", metodePembayaran);
      if (buktiFile) formData.append("bukti_pembayaran", buktiFile);

      const res = await fetch(`${API_BASE_URL}/api/warga/tagihan/${showBayar.id}/bayar`, {
        method: "PATCH",
        credentials: "include",
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        setShowBayar(null);
        setMetodePembayaran("");
        setBuktiFile(null);
        fetchData();
      } else {
        alert(json.message || "Gagal mengajukan pembayaran");
      }
    } catch {
      alert("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const METODE_OPTIONS = [
    { value: "tunai", label: "Tunai", desc: "Bayar langsung ke bendahara" },
    { value: "transfer", label: "Transfer", desc: "Transfer ke nomor rekening yang ditentukan" },
    { value: "qris", label: "QRIS", desc: "Scan QR code pembayaran" },
  ];

  const statusIcon = (s) => {
    if (s === "lunas") return <CheckCircle2 size={16} />;
    if (s === "pending") return <Clock size={16} />;
    return <AlertCircle size={16} />;
  };

  const statusClass = (s) => {
    if (s === "lunas") return "badge badge--selesai";
    if (s === "pending") return "badge badge--pending";
    return "badge badge--ditolak";
  };

  const statusLabel = (s) => {
    if (s === "lunas") return "Lunas";
    if (s === "pending") return "Pending";
    return "Belum Lunas";
  };

  const BULANS = [
    { v: 1, l: "Jan" }, { v: 2, l: "Feb" }, { v: 3, l: "Mar" }, { v: 4, l: "Apr" },
    { v: 5, l: "Mei" }, { v: 6, l: "Jun" }, { v: 7, l: "Jul" }, { v: 8, l: "Agu" },
    { v: 9, l: "Sep" }, { v: 10, l: "Okt" }, { v: 11, l: "Nov" }, { v: 12, l: "Des" },
  ];

  const [tahunGrid, setTahunGrid] = useState(new Date().getFullYear());

  // Build 12-month grid status from data
  const gridStatus = {};
  const monthNames = ["","Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  for (let m = 1; m <= 12; m++) {
    const found = data.find((d) => d.tahun === tahunGrid && d.bulan === m);
    gridStatus[m] = found ? found.status : null;
  }

  const filterTags = [
    { value: "", label: "Semua" },
    { value: "belum_lunas", label: "Belum Lunas" },
    { value: "pending", label: "Pending" },
    { value: "lunas", label: "Lunas" },
  ];

  return (
    <div>
      <div className="ad-header">
        <div>
          <h1 className="ad-header__title">Tagihan Saya</h1>
          <p className="ad-header__sub">Riwayat iuran dan tagihan Anda</p>
        </div>
      </div>

      {/* 12-Month Grid */}
      <div style={{ marginTop: 20, background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>
          <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>Status Iuran {tahunGrid}</span>
          <select value={tahunGrid} onChange={(e) => setTahunGrid(Number(e.target.value))} style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: "0.8rem" }}>
            {[2024,2025,2026,2027].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 0 }}>
          {BULANS.map((b) => {
            const s = gridStatus[b.v];
            let bg = "#f3f4f6";
            let fg = "#9ca3af";
            if (s === "lunas") { bg = "#dcfce7"; fg = "#16a34a"; }
            else if (s === "pending") { bg = "#fef3c7"; fg = "#d97706"; }
            else if (s === "belum_lunas") { bg = "#fee2e2"; fg = "#dc2626"; }
            return (
              <div key={b.v} style={{ padding: "10px 4px", textAlign: "center", borderRight: "1px solid #f3f4f6", borderBottom: "1px solid #f3f4f6", background: bg }}>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: fg }}>{b.l}</div>
                <div style={{ fontSize: "0.72rem", fontWeight: 500, color: fg, marginTop: 2 }}>
                  {s === "lunas" ? "✓" : s === "pending" ? "⏳" : s === "belum_lunas" ? "○" : "-"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginTop: 20 }}>
        <div className="ad-card">
          <div className="ad-card__body" style={{ gap: 4, textAlign: "center" }}>
            <p style={{ fontSize: "0.75rem", color: "var(--clr-subtitle)" }}>Total Tagihan</p>
            <p style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>{rupiah(stats.totalTagihan)}</p>
            <p style={{ fontSize: "0.72rem", color: "var(--clr-subtitle)" }}>{stats.total} tagihan</p>
          </div>
        </div>
        <div className="ad-card">
          <div className="ad-card__body" style={{ gap: 4, textAlign: "center" }}>
            <p style={{ fontSize: "0.75rem", color: "var(--clr-subtitle)" }}>Sudah Dibayar</p>
            <p style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "#16a34a" }}>{rupiah(stats.totalLunas)}</p>
            <p style={{ fontSize: "0.72rem", color: "var(--clr-subtitle)" }}>{stats.lunas} tagihan</p>
          </div>
        </div>
        <div className="ad-card">
          <div className="ad-card__body" style={{ gap: 4, textAlign: "center" }}>
            <p style={{ fontSize: "0.75rem", color: "var(--clr-subtitle)" }}>Belum Dibayar</p>
            <p style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "#dc2626" }}>{rupiah(stats.totalTagihan - stats.totalLunas)}</p>
            <p style={{ fontSize: "0.72rem", color: "var(--clr-subtitle)" }}>{stats.belumLunas + stats.pending} tagihan</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
        {filterTags.map((tag) => (
          <button
            key={tag.value}
            onClick={() => setStatusFilter(tag.value)}
            style={{
              padding: "6px 16px", borderRadius: 20, border: "1px solid #d1d5db",
              background: statusFilter === tag.value ? "#166534" : "transparent",
              color: statusFilter === tag.value ? "#fff" : "inherit",
              cursor: "pointer", fontSize: "0.82rem", fontWeight: 500,
              transition: "all 0.15s",
            }}
          >
            {tag.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--clr-subtitle)" }}>Memuat...</div>
      ) : data.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Wallet size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ color: "var(--clr-subtitle)" }}>Belum ada tagihan</p>
        </div>
      ) : (
        <div style={{ marginTop: 16, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left" }}>
                <th style={{ padding: "10px 12px", fontWeight: 600 }}>Kategori</th>
                <th style={{ padding: "10px 12px", fontWeight: 600 }}>Periode</th>
                <th style={{ padding: "10px 12px", fontWeight: 600 }}>Jumlah</th>
                <th style={{ padding: "10px 12px", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "10px 12px", fontWeight: 600 }}>Tanggal Bayar</th>
                <th style={{ padding: "10px 12px", fontWeight: 600 }}></th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 500 }}>
                    {item.kategori?.nama || "Iuran"}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    {item.bulan ? `${item.bulan}/${item.tahun}` : item.tahun}
                  </td>
                  <td style={{ padding: "10px 12px", fontWeight: 600 }}>
                    {rupiah(item.jumlah)}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <span className={statusClass(item.status)} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      {statusIcon(item.status)} {statusLabel(item.status)}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", color: "var(--clr-subtitle)" }}>
                    {item.paid_at ? formatDate(item.paid_at) : "-"}
                  </td>
                  <td style={{ padding: "10px 12px", display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setShowDetail(showDetail?.id === item.id ? null : item)}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "var(--clr-primary)", fontSize: "0.8rem", textDecoration: "underline",
                      }}
                    >
                      Detail
                    </button>
                    {item.status === "belum_lunas" && (
                      <button
                        onClick={() => { setShowBayar(item); setMetodePembayaran(""); setBuktiFile(null); }}
                        style={{
                          background: "#166534", color: "#fff", border: "none",
                          borderRadius: 6, padding: "2px 12px", cursor: "pointer",
                          fontSize: "0.78rem", fontWeight: 600,
                        }}
                      >
                        Bayar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bayar Modal */}
      {showBayar && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.4)",
        }} onClick={() => { if (!isSubmitting) { setShowBayar(null); setMetodePembayaran(""); setBuktiFile(null); } }}>
          <div style={{
            background: "#fff", borderRadius: 12, padding: 24, width: "90%", maxWidth: 400,
            position: "relative",
          }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { setShowBayar(null); setMetodePembayaran(""); setBuktiFile(null); }} disabled={isSubmitting} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", cursor: "pointer" }}>
              <X size={20} />
            </button>
            <h3 style={{ margin: "0 0 4px", fontSize: "1rem" }}>Ajukan Pembayaran</h3>
            <p style={{ margin: "0 0 16px", fontSize: "0.82rem", color: "var(--clr-subtitle)" }}>
              {showBayar.kategori?.nama} — {rupiah(showBayar.jumlah)}
            </p>

            {paymentSetting && (
              <div style={{ background: "#1e293b", color: "#fff", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <Banknote size={16} />
                  <span style={{ fontWeight: 700, fontSize: "0.85rem", letterSpacing: 0.5 }}>{paymentSetting.nama_bank}</span>
                </div>
                <p style={{ margin: "2px 0", fontSize: "0.95rem", fontWeight: 700, letterSpacing: 1 }}>{paymentSetting.nomor_rekening}</p>
                <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.7 }}>A/N {paymentSetting.nama_penerima}</p>
                {paymentSetting.qris_path && (
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, color: "#22c55e", fontSize: "0.82rem", fontWeight: 600 }}>
                    <QrCode size={16} /> QRIS tersedia — pilih metode QRIS
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {METODE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 16px", borderRadius: 8, cursor: "pointer",
                    border: `2px solid ${metodePembayaran === opt.value ? "#166534" : "#e5e7eb"}`,
                    background: metodePembayaran === opt.value ? "#f0fdf4" : "#fff",
                    transition: "all 0.15s",
                  }}
                >
                  <input
                    type="radio"
                    name="metode"
                    value={opt.value}
                    checked={metodePembayaran === opt.value}
                    onChange={() => setMetodePembayaran(opt.value)}
                    style={{ accentColor: "#166534" }}
                  />
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: "0.85rem" }}>{opt.label}</p>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--clr-subtitle)" }}>{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            {metodePembayaran && metodePembayaran !== "tunai" && (
              <div style={{ marginTop: 16 }}>
                <p style={{ margin: "0 0 8px", fontSize: "0.82rem", fontWeight: 600 }}>
                  Upload Bukti Pembayaran
                </p>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: "2px dashed #d1d5db", borderRadius: 8, padding: 20,
                    textAlign: "center", cursor: "pointer",
                    background: buktiFile ? "#f0fdf4" : "#f9fafb",
                    borderColor: buktiFile ? "#16a34a" : "#d1d5db",
                  }}
                >
                  {buktiFile ? (
                    <div>
                      <p style={{ margin: 0, fontSize: "0.82rem", color: "#16a34a", fontWeight: 600 }}>
                        ✓ {buktiFile.name}
                      </p>
                      <p style={{ margin: "4px 0 0", fontSize: "0.72rem", color: "var(--clr-subtitle)" }}>
                        {(buktiFile.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Upload size={24} style={{ opacity: 0.3, marginBottom: 4 }} />
                      <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--clr-subtitle)" }}>
                        Klik untuk upload (JPG/PNG/PDF, max 5MB)
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  style={{ display: "none" }}
                  onChange={(e) => setBuktiFile(e.target.files[0] || null)}
                />
              </div>
            )}

            <button
              onClick={handleBayar}
              disabled={!metodePembayaran || isSubmitting || (metodePembayaran !== "tunai" && !buktiFile)}
              style={{
                width: "100%", marginTop: 20, padding: "10px 0",
                background: !metodePembayaran || isSubmitting || (metodePembayaran !== "tunai" && !buktiFile) ? "#9ca3af" : "#166534",
                color: "#fff", border: "none", borderRadius: 8,
                fontSize: "0.9rem", fontWeight: 600, cursor: !metodePembayaran || isSubmitting || (metodePembayaran !== "tunai" && !buktiFile) ? "not-allowed" : "pointer",
              }}
            >
              {isSubmitting ? "Mengirim..." : "Ajukan Pembayaran"}
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.4)",
        }} onClick={() => setShowDetail(null)}>
          <div style={{
            background: "#fff", borderRadius: 12, padding: 24, width: "90%", maxWidth: 400,
            position: "relative",
          }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowDetail(null)} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", cursor: "pointer" }}>
              <X size={20} />
            </button>
            <h3 style={{ margin: "0 0 16px", fontSize: "1rem" }}>Detail Tagihan</h3>
            <table style={{ width: "100%", fontSize: "0.85rem" }}>
              <tbody>
                <tr><td style={{ padding: "6px 8px", color: "var(--clr-subtitle)", width: 120 }}>Kategori</td><td style={{ padding: "6px 8px" }}>{showDetail.kategori?.nama || "Iuran"}</td></tr>
                <tr><td style={{ padding: "6px 8px", color: "var(--clr-subtitle)" }}>Periode</td><td style={{ padding: "6px 8px" }}>{showDetail.bulan ? `${showDetail.bulan}/${showDetail.tahun}` : showDetail.tahun}</td></tr>
                <tr><td style={{ padding: "6px 8px", color: "var(--clr-subtitle)" }}>Jumlah</td><td style={{ padding: "6px 8px", fontWeight: 600 }}>{rupiah(showDetail.jumlah)}</td></tr>
                <tr><td style={{ padding: "6px 8px", color: "var(--clr-subtitle)" }}>Status</td><td style={{ padding: "6px 8px" }}><span className={statusClass(showDetail.status)}>{statusLabel(showDetail.status)}</span></td></tr>
                <tr><td style={{ padding: "6px 8px", color: "var(--clr-subtitle)" }}>Pembayaran</td><td style={{ padding: "6px 8px" }}>{showDetail.metode_pembayaran ? showDetail.metode_pembayaran.charAt(0).toUpperCase() + showDetail.metode_pembayaran.slice(1) : "-"}</td></tr>
                <tr><td style={{ padding: "6px 8px", color: "var(--clr-subtitle)" }}>Tanggal Bayar</td><td style={{ padding: "6px 8px" }}>{showDetail.paid_at ? formatDate(showDetail.paid_at) : "-"}</td></tr>
                <tr><td style={{ padding: "6px 8px", color: "var(--clr-subtitle)" }}>Keterangan</td><td style={{ padding: "6px 8px" }}>{showDetail.keterangan || "-"}</td></tr>
                {showDetail.bukti_pembayaran_url && (
                  <tr><td style={{ padding: "6px 8px", color: "var(--clr-subtitle)" }}>Bukti</td><td style={{ padding: "6px 8px" }}><a href={showDetail.bukti_pembayaran_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--clr-primary)" }}>Lihat File</a></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}