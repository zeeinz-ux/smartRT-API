import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wallet, TrendingUp, TrendingDown, BarChart3, PieChart,
  ArrowUpRight, ArrowDownRight, Download, Loader,
} from "lucide-react";
import { rupiah } from "../../utils/rupiah.js";
import "../../assets/style/css/AdminDashboard.css";
import { BULAN_LABEL as bulanIndo } from "../../utils/bulan.js";
import API from "../../utils/api.js";

export default function BendaharaDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`${API}/api/admin/keuangan/rekap?tahun=2026`, {
          credentials: "include",
        });
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch {} finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="admin-dashboard admin-dashboard--loading">
        <div className="loading-spinner">
          <div className="loading-spinner__circle" />
          <p>Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  const d = data || {
    totalPemasukan: 0, totalPengeluaran: 0, saldo: 0,
    pemasukanSampah: 0, pemasukanQurban: 0,
    chartBulanan: [], chartKategori: [],
  };

  const last5 = (d.chartBulanan || []).slice(-5);

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <div className="dashboard-header__left">
          <h1 className="dashboard-header__title">Dashboard Bendahara</h1>
          <p className="dashboard-header__subtitle">
            Ringkasan keuangan bulan ini
          </p>
        </div>
        <div className="dashboard-header__right">
          <button className="btn-export" onClick={() => navigate("/admin/keuangan")}>
            <BarChart3 size={16} />
            Rincian Keuangan
          </button>
        </div>
      </header>

      <section className="stats-grid">
        <div className="stat-card stat-card--primary">
          <div className="stat-card__header">
            <div className="stat-card__icon stat-card__icon--primary">
              <TrendingUp size={22} strokeWidth={2} />
            </div>
            <span className="stat-card__trend stat-card__trend--up">
              <ArrowUpRight size={14} /> pemasukan
            </span>
          </div>
          <div className="stat-card__content">
            <h3 className="stat-card__value">{rupiah(d.totalPemasukan)}</h3>
            <p className="stat-card__title">Total Pemasukan</p>
          </div>
        </div>

        <div className="stat-card stat-card--danger">
          <div className="stat-card__header">
            <div className="stat-card__icon stat-card__icon--danger">
              <TrendingDown size={22} strokeWidth={2} />
            </div>
            <span className="stat-card__trend stat-card__trend--down">
              <ArrowDownRight size={14} /> pengeluaran
            </span>
          </div>
          <div className="stat-card__content">
            <h3 className="stat-card__value">{rupiah(d.totalPengeluaran)}</h3>
            <p className="stat-card__title">Total Pengeluaran</p>
          </div>
        </div>

        <div className={`stat-card ${d.saldo >= 0 ? "stat-card--success" : "stat-card--warning"}`}>
          <div className="stat-card__header">
            <div className={`stat-card__icon ${d.saldo >= 0 ? "stat-card__icon--success" : "stat-card__icon--warning"}`}>
              <Wallet size={22} strokeWidth={2} />
            </div>
          </div>
          <div className="stat-card__content">
            <h3 className="stat-card__value">{rupiah(d.saldo)}</h3>
            <p className="stat-card__title">Saldo Bersih</p>
          </div>
        </div>

        <div className="stat-card stat-card--success">
          <div className="stat-card__header">
            <div className="stat-card__icon stat-card__icon--success">
              <PieChart size={22} strokeWidth={2} />
            </div>
          </div>
          <div className="stat-card__content">
            <h3 className="stat-card__value">{rupiah(d.pemasukanSampah)}</h3>
            <p className="stat-card__title">Iuran Sampah</p>
            <p className="stat-card__subtitle">+ Qurban {rupiah(d.pemasukanQurban)}</p>
          </div>
        </div>
      </section>

      <div className="dashboard-grid" style={{ gridTemplateColumns: "1fr" }}>
        <section className="dashboard-section">
          <div className="section-header">
            <div className="section-header__left">
              <div className="section-header__icon section-header__icon--primary">
                <BarChart3 size={20} />
              </div>
              <div>
                <h2 className="section-header__title">Pemasukan vs Pengeluaran</h2>
                <p className="section-header__subtitle">Per bulan tahun 2026</p>
              </div>
            </div>
          </div>
          <div className="chart-container">
            <div className="chart-bars">
              {last5.length === 0 ? (
                <p style={{ textAlign: "center", padding: 24, color: "#8aaa94" }}>Belum ada data keuangan</p>
              ) : (
                last5.map((m, i) => {
                  const maxVal = Math.max(...last5.map((x) => Math.max(x.pemasukan, x.pengeluaran)), 1);
                  return (
                    <div key={i} className="chart-bar-group">
                      <div className="chart-bar-group__bars">
                        <div className="chart-bar chart-bar--income" style={{ height: `${(m.pemasukan / maxVal) * 100}%` }}
                          title={`Pemasukan: ${rupiah(m.pemasukan)}`}>
                          <span className="chart-bar__tooltip">{rupiah(m.pemasukan)}</span>
                        </div>
                        <div className="chart-bar chart-bar--expense" style={{ height: `${(m.pengeluaran / maxVal) * 100}%` }}
                          title={`Pengeluaran: ${rupiah(m.pengeluaran)}`}>
                          <span className="chart-bar__tooltip">{rupiah(m.pengeluaran)}</span>
                        </div>
                      </div>
                      <span className="chart-bar-group__label">{bulanIndo[m.bulan] || m.bulan}</span>
                    </div>
                  );
                })
              )}
            </div>
            <div className="chart-legend">
              <span className="chart-legend__item"><span className="chart-legend__dot chart-legend__dot--income" /> Pemasukan</span>
              <span className="chart-legend__item"><span className="chart-legend__dot chart-legend__dot--expense" /> Pengeluaran</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
