import { useState, useEffect, useCallback } from "react";
import { Search, CheckCircle2, Clock, AlertCircle, ExternalLink } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3333";
const ADMIN_WA = import.meta.env.VITE_ADMIN_WA_NUMBER || "6285288888888";

const BULAN = [1,2,3,4,5,6,7,8,9,10,11,12].map((b) => ({
  value: b,
  label: ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"][b-1],
}));

function rupiah(n) { return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n); }

function statusBadge(status) {
  if (status === "lunas") return { label: "Lunas", cls: "badge badge--selesai", icon: CheckCircle2 };
  if (status === "pending") return { label: "Pending", cls: "badge badge--pending", icon: Clock };
  return { label: "Belum Bayar", cls: "badge badge--ditolak", icon: AlertCircle };
}

export default function MonitoringTagihan() {
  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());
  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ total: 0, lunas: 0, pending: 0, belumLunas: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ bulan: bulan.toString(), tahun: tahun.toString() });
      if (search) params.set("search", search);
      const res = await fetch(`${API}/api/admin/iuran/monitoring?${params}`, { credentials: "include" });
      const json = await res.json();
      if (json.success) { setData(json.data); setMeta(json.meta); }
    } catch {} finally { setIsLoading(false); }
  }, [bulan, tahun, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const buildWaLink = (item) => {
    if (!item.no_hp) return null;
    const phone = item.no_hp.startsWith("62") ? item.no_hp : `62${item.no_hp.replace(/^0+/, "")}`;
    const pesan = encodeURIComponent(
      `Halo ${item.nama}, kami mengingatkan bahwa tagihan KAS RT periode ${BULAN.find(b => b.value === bulan)?.label || bulan} ${tahun} Anda sebesar ${rupiah(item.jumlah_bulan_ini)} masih ${item.status_sekarang === "pending" ? "dalam proses" : "belum dibayar"}.\n\nTotal tunggakan: ${rupiah(item.total_tunggakan)}\n\nMohon segera diselesaikan. Terima kasih.`
    );
    return `https://api.whatsapp.com/send?phone=${phone}&text=${pesan}`;
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "var(--space-xl)" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>Monitoring Tagihan Warga</h1>
        <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--clr-subtitle)" }}>Status pembayaran iuran per warga</p>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", border: "1px solid #d1d5db", borderRadius: 8, padding: "4px 12px", flex: 1, minWidth: 200 }}>
          <Search size={18} style={{ opacity: 0.4 }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama/NIK/no. rumah" style={{ border: "none", outline: "none", flex: 1, padding: "6px 0", fontSize: "0.85rem", background: "transparent" }} />
        </div>
        <select value={bulan} onChange={(e) => setBulan(Number(e.target.value))} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: "0.85rem" }}>
          {BULAN.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
        </select>
        <select value={tahun} onChange={(e) => setTahun(Number(e.target.value))} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: "0.85rem" }}>
          {[2024,2025,2026,2027].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        <span style={{ fontSize: "0.82rem", color: "var(--clr-subtitle)" }}>Total: {meta.total} warga</span>
        <span style={{ fontSize: "0.82rem", color: "#16a34a", fontWeight: 600 }}>{meta.lunas} Lunas</span>
        <span style={{ fontSize: "0.82rem", color: "#d97706", fontWeight: 600 }}>{meta.pending} Pending</span>
        <span style={{ fontSize: "0.82rem", color: "#dc2626", fontWeight: 600 }}>{meta.belumLunas} Belum Bayar</span>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--clr-subtitle)" }}>Memuat...</div>
      ) : data.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--clr-subtitle)" }}>Belum ada data warga</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
                <th style={{ padding: "10px 12px", fontWeight: 600 }}>Warga</th>
                <th style={{ padding: "10px 12px", fontWeight: 600 }}>No. Rumah</th>
                <th style={{ padding: "10px 12px", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "10px 12px", fontWeight: 600 }}>Tagihan BLN</th>
                <th style={{ padding: "10px 12px", fontWeight: 600 }}>Total Tunggakan</th>
                <th style={{ padding: "10px 12px", fontWeight: 600 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => {
                const badge = statusBadge(item.status_sekarang);
                const Icon = badge.icon;
                const waLink = buildWaLink(item);
                return (
                  <tr key={item.warga_id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 500 }}>{item.nama}</td>
                    <td style={{ padding: "10px 12px", color: "var(--clr-subtitle)" }}>{item.no_rumah}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span className={badge.cls} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.78rem" }}>
                        <Icon size={14} /> {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>{item.jumlah_bulan_ini ? rupiah(item.jumlah_bulan_ini) : "-"}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: item.total_tunggakan > 0 ? "#dc2626" : "inherit" }}>
                      {item.total_tunggakan > 0 ? rupiah(item.total_tunggakan) : "Beres"}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {item.total_tunggakan > 0 && waLink && (
                        <a href={waLink} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "#25D366", color: "#fff", borderRadius: 6, textDecoration: "none", fontSize: "0.78rem", fontWeight: 600 }}>
                          <ExternalLink size={14} /> Nagih WA
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}