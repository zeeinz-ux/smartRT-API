import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Wallet,
  FileText,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  XCircle,
  Bell,
  Search,
  ChevronRight,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Eye,
  UserCheck,
  UserX,
  AlertTriangle,
  MoreHorizontal,
  Database,
  EyeOff,
} from "lucide-react";
import "../../assets/style/css/AdminDashboard.css";
import { getCachedUser } from "../../components/ProtectedRoute";

const API = import.meta.env.VITE_API_URL || "http://localhost:3333";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [timeRange, setTimeRange] = useState("year");
  const [filterBulan, setFilterBulan] = useState(0);
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [quickActionsHidden, setQuickActionsHidden] = useState(false);
  const quickActionsRef = useRef(null);
  const user = getCachedUser();
  const showQuickActions = user?.role && user.role !== "warga" && !quickActionsHidden;
  const [error, setError] = useState(null);

  const [stats, setStats] = useState({
    totalWarga: 0,
    wargaPending: 0,
    wargaNonOnboarded: 0,
    laporanBaru: 0,
    suratPending: 0,
    pendapatanBulanIni: 0,
  });
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [nonOnboarded, setNonOnboarded] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [tagihanStats, setTagihanStats] = useState([]);

  const bulanIndo = ["", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

  const fetchData = useCallback(async () => {
    try {
      const bulan = filterBulan || 0;
      const tahun = filterTahun;

      const [dashboardRes, rekapRes, sampahRes, qurbanRes, notifRes] = await Promise.all([
        fetch(`${API}/api/admin/dashboard`, { credentials: "include" }),
        fetch(`${API}/api/admin/keuangan/rekap?bulan=${bulan}&tahun=${tahun}`, { credentials: "include" }),
        fetch(`${API}/api/admin/sampah?bulan=${bulan || new Date().getMonth() + 1}&tahun=${tahun}`, { credentials: "include" }),
        fetch(`${API}/api/admin/qurban?tahun=${tahun}`, { credentials: "include" }),
        fetch(`${API}/api/notifikasi`, { credentials: "include" }),
      ]);

      const dashboard = await dashboardRes.json();
      const rekap = await rekapRes.json();
      const sampah = await sampahRes.json();
      const qurban = await qurbanRes.json();
      const notif = await notifRes.json();

      if (dashboard.success) {
        setStats({
          totalWarga: dashboard.stats.totalWarga,
          wargaPending: dashboard.stats.wargaPending,
          wargaNonOnboarded: dashboard.stats.wargaNonOnboarded,
          wargaVerified: dashboard.stats.wargaVerified,
          laporanBaru: 0,
          suratPending: 0,
          pendapatanBulanIni: rekap.success ? rekap.data.totalPemasukan : 0,
        });

        const pending = (dashboard.recentPending || []).map((p) => ({
          id: p.id,
          nama: p.nama,
          email: p.email,
          nik: p.nik || "-",
          alamat: p.alamat || "-",
          no_rumah: p.no_rumah || "-",
          status_huni: p.status_huni || "pemilik",
          foto_ktp_url: null,
          submitted_at: p.created_at,
          no_hp: "",
          tipe: "verifikasi",
        }));
        setPendingApprovals(pending);

        const nonOnboard = (dashboard.recentNonOnboarded || []).map((p) => ({
          id: `no-${p.id}`,
          nama: p.nama,
          email: p.email,
          nik: "-",
          alamat: "-",
          no_rumah: "-",
          status_huni: "-",
          foto_ktp_url: null,
          submitted_at: p.created_at,
          no_hp: "",
          tipe: "onboarding",
        }));
        setNonOnboarded(nonOnboard);
      }

      if (rekap.success) {
        const chart = rekap.data.chartBulanan || [];
        let filteredChart;
        if (filterBulan) {
          filteredChart = chart.filter((m) => m.bulan === filterBulan);
        } else if (timeRange === "quarter") {
          const qStart = Math.max(1, new Date().getMonth() - 2);
          filteredChart = chart.filter((m) => m.bulan >= qStart && m.bulan <= new Date().getMonth() + 1);
        } else {
          filteredChart = chart;
        }
        setMonthlyData(
          (filteredChart.length > 0 ? filteredChart : chart.slice(-5)).map((m) => ({
            month: bulanIndo[m.bulan] || `Bln ${m.bulan}`,
            income: m.pemasukan,
            expense: m.pengeluaran,
          }))
        );

        setStats((prev) => ({
          ...prev,
          pendapatanBulanIni: rekap.data.totalPemasukan,
        }));
      }

      if (sampah.success && qurban.success) {
        const sampahTotal = sampah.data?.meta?.totalIuran || 0;
        const sampahPaid = sampah.data?.meta?.totalLunas || 0;
        const sampahPending = sampahTotal > 0 ? sampahTotal - sampahPaid : 0;
        const sampahAmount = sampah.data?.meta?.totalNominal || 0;

        const qurbanTotal = qurban.data?.meta?.totalIuran || 0;
        const qurbanPaid = qurban.data?.meta?.totalLunas || 0;
        const qurbanPending = qurbanTotal > 0 ? qurbanTotal - qurbanPaid : 0;
        const qurbanAmount = qurban.data?.meta?.totalNominal || 0;

        setTagihanStats([
          { label: "Uang Sampah", total: sampahTotal, paid: sampahPaid, pending: sampahPending, amount: sampahAmount },
          { label: "Uang Qurban", total: qurbanTotal, paid: qurbanPaid, pending: qurbanPending, amount: qurbanAmount },
        ]);
      }

      if (notif.success) {
        setRecentActivities(
          (notif.data || []).slice(0, 5).map((n) => ({
            id: n.id,
            type: n.tipe || "info",
            message: n.pesan || n.judul,
            time: n.created_at,
            icon: n.tipe === "darurat" ? AlertCircle : Bell,
            color: n.tipe === "darurat" ? "danger" : "info",
          }))
        );
      }
    } catch (e) {
      console.error("Dashboard fetch error:", e);
      setError("Gagal memuat data dashboard");
    } finally {
      setIsLoading(false);
    }
  }, [filterBulan, filterTahun, timeRange]);

  // Initial fetch + refetch on filter change (tanpa loading spinner, biar gak lompat)
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Close quick action dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (quickActionsRef.current && !quickActionsRef.current.contains(e.target)) {
        setQuickActionsOpen(false);
      }
    };
    if (quickActionsOpen) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [quickActionsOpen]);

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`${API}/api/admin/warga/${id}/verify`, {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json();
      if (json.success) {
        setPendingApprovals((prev) => prev.filter((item) => item.id !== id));
        setStats((prev) => ({ ...prev, wargaPending: prev.wargaPending - 1 }));
      }
    } catch {}
  };

  const handleReject = async (id) => {
    try {
      const res = await fetch(`${API}/api/admin/warga/${id}/reject`, {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json();
      if (json.success) {
        setPendingApprovals((prev) => prev.filter((item) => item.id !== id));
        setStats((prev) => ({ ...prev, wargaPending: prev.wargaPending - 1 }));
      }
    } catch {}
  };

  const handleViewDetail = (id) => {
    navigate(`/admin/warga/${id}`);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return "-";
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    if (diffDays < 7) return `${diffDays} hari yang lalu`;
    return formatDate(dateString);
  };

  const allPending = [...pendingApprovals, ...nonOnboarded];
  const filteredApprovals = allPending.filter((item) => {
    const matchesSearch =
      item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nik.includes(searchQuery);
    const matchesFilter =
      selectedFilter === "all" ||
      (selectedFilter === "pemilik" && item.status_huni === "pemilik") ||
      (selectedFilter === "penyewa" && item.status_huni === "penyewa") ||
      (selectedFilter === "onboarding" && item.tipe === "onboarding") ||
      (selectedFilter === "verifikasi" && item.tipe === "verifikasi");
    return matchesSearch && matchesFilter;
  });

  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    trendValue,
    color,
    onClick,
  }) => (
    <div className={`stat-card stat-card--${color}`} onClick={onClick}>
      <div className="stat-card__header">
        <div className={`stat-card__icon stat-card__icon--${color}`}>
          <Icon size={22} strokeWidth={2} />
        </div>
        {trend && (
          <span className={`stat-card__trend stat-card__trend--${trend}`}>
            {trend === "up" ? (
              <ArrowUpRight size={14} />
            ) : (
              <ArrowDownRight size={14} />
            )}
            {trendValue}
          </span>
        )}
      </div>
      <div className="stat-card__content">
        <h3 className="stat-card__value">{value}</h3>
        <p className="stat-card__title">{title}</p>
        {subtitle && <p className="stat-card__subtitle">{subtitle}</p>}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="admin-dashboard admin-dashboard--loading">
        <div className="loading-spinner">
          <div className="loading-spinner__circle"></div>
          <p>Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard admin-dashboard--loading">
        <div className="loading-spinner">
          <AlertCircle size={32} />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header Section */}
      <header className="dashboard-header">
        <div className="dashboard-header__left">
          <h1 className="dashboard-header__title">Dashboard Admin</h1>
          <p className="dashboard-header__subtitle">
            Berikut ringkasan aktivitas hari ini.
          </p>
        </div>
        <div className="dashboard-header__right">
          <div className="time-filter">
            {[
              { key: "month", label: "Bulan", fn: () => { setTimeRange("month"); setFilterBulan(new Date().getMonth() + 1); } },
              { key: "quarter", label: "3 Bln", fn: () => { setTimeRange("quarter"); setFilterBulan(0); } },
              { key: "year", label: "Tahun", fn: () => { setTimeRange("year"); setFilterBulan(0); } },
            ].map((opt) => (
              <button
                key={opt.key}
                className={`time-filter__btn ${timeRange === opt.key ? "time-filter__btn--active" : ""}`}
                onClick={opt.fn}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <select
            className={`filter-select--header ${filterBulan ? "filter-select--active" : ""}`}
            value={filterBulan}
            onChange={(e) => { setFilterBulan(Number(e.target.value)); setTimeRange("custom"); }}
          >
            <option value={0}>Semua Bln</option>
            {["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"].map((nama, i) => (
              <option key={i + 1} value={i + 1}>{nama}</option>
            ))}
          </select>
          <select
            className={`filter-select--header ${filterTahun !== new Date().getFullYear() ? "filter-select--active" : ""}`}
            value={filterTahun}
            onChange={(e) => setFilterTahun(Number(e.target.value))}
          >
            {[2024, 2025, 2026, 2027].map((th) => (
              <option key={th} value={th}>{th}</option>
            ))}
          </select>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="stats-grid">
        <StatCard
          title="Total Warga"
          value={stats.totalWarga}
          subtitle={`${stats.wargaPending} menunggu verifikasi`}
          icon={Users}
          trend="up"
          trendValue="verified"
          color="primary"
          onClick={() => navigate("/admin/warga")}
        />
        <StatCard
          title="Pendapatan Bulan Ini"
          value={formatCurrency(stats.pendapatanBulanIni)}
          subtitle="Dari semua sumber"
          icon={Wallet}
          trend="up"
          trendValue=""
          color="success"
        />
        <StatCard
          title="Warga Menunggu"
          value={stats.wargaPending}
          subtitle="perlu verifikasi"
          icon={AlertCircle}
          trend="down"
          trendValue=""
          color="warning"
        />
        <StatCard
          title="Belum Onboarding"
          value={stats.wargaNonOnboarded}
          subtitle="belum isi profil"
          icon={AlertTriangle}
          trend="down"
          trendValue=""
          color="danger"
        />
        <StatCard
          title="Pengajuan Surat"
          value={stats.suratPending}
          subtitle="menunggu diproses"
          icon={FileText}
          trend="up"
          trendValue=""
          color="danger"
        />
      </section>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Left Column */}
        <div className="dashboard-grid__main">
          {/* Approval Queue */}
          <section className="dashboard-section">
            <div className="section-header">
              <div className="section-header__left">
                <div className="section-header__icon section-header__icon--warning">
                  <Clock size={20} />
                </div>
                <div>
                  <h2 className="section-header__title">
                    Antrean Warga
                  </h2>
                  <p className="section-header__subtitle">
                    {pendingApprovals.length} verifikasi + {nonOnboarded.length} onboarding
                  </p>
                </div>
              </div>
              <button
                className="btn-text"
                onClick={() => navigate("/admin/warga")}
              >
                Lihat Semua
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Search & Filter */}
            <div className="approval-filters">
              <div className="search-box">
                <Search size={18} className="search-box__icon" />
                <input
                  type="text"
                  placeholder="Cari nama atau NIK..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-box__input"
                />
              </div>
              <div className="filter-group">
                <Filter size={16} />
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Semua</option>
                  <option value="verifikasi">Menunggu Verifikasi</option>
                  <option value="onboarding">Belum Onboarding</option>
                  <option value="pemilik">Pemilik</option>
                  <option value="penyewa">Penyewa</option>
                </select>
              </div>
            </div>

            {/* Approval List */}
            <div className="approval-list">
              {filteredApprovals.length === 0 ? (
                <div className="approval-empty">
                  <CheckCircle2 size={48} className="approval-empty__icon" />
                  <p className="approval-empty__title">
                    Semua warga sudah terverifikasi!
                  </p>
                  <p className="approval-empty__subtitle">
                    Tidak ada antrean verifikasi saat ini.
                  </p>
                </div>
              ) : (
                filteredApprovals.map((item) => (
                  <div key={item.id} className="approval-item">
                    <div className="approval-item__avatar">
                      {item.nama.charAt(0).toUpperCase()}
                    </div>
                    <div className="approval-item__content">
                      <div className="approval-item__header">
                        <h4 className="approval-item__name">{item.nama}</h4>
                        <div style={{ display: "flex", gap: 6 }}>
                          {item.tipe === "onboarding" && (
                            <span className="badge badge--onboarding">Baru</span>
                          )}
                          <span className={`badge badge--${item.status_huni === "pemilik" || item.status_huni === "penyewa" ? item.status_huni : "muted"}`}>
                            {item.tipe === "onboarding" ? "Onboarding" : item.status_huni === "pemilik" ? "Pemilik" : item.status_huni === "penyewa" ? "Penyewa" : item.status_huni}
                          </span>
                        </div>
                      </div>
                      <div className="approval-item__details">
                        <span className="approval-item__detail">
                          <FileText size={14} />
                          NIK: {item.nik}
                        </span>
                        <span className="approval-item__detail">
                          <Users size={14} />
                          {item.alamat}
                        </span>
                        <span className="approval-item__detail">
                          <Clock size={14} />
                          {getTimeAgo(item.submitted_at)}
                        </span>
                      </div>
                    </div>
                    <div className="approval-item__actions">
                      <button
                        className="btn-icon btn-icon--view"
                        onClick={() => navigate("/admin/warga")}
                        title={item.tipe === "onboarding" ? "Review" : "Lihat Detail"}
                      >
                        <Eye size={18} />
                      </button>
                      {item.tipe === "verifikasi" && (
                        <>
                          <button
                            className="btn-icon btn-icon--approve"
                            onClick={() => handleApprove(item.id)}
                            title="Setujui"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                          <button
                            className="btn-icon btn-icon--reject"
                            onClick={() => handleReject(item.id)}
                            title="Tolak"
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Financial Chart Section */}
          <section className="dashboard-section">
            <div className="section-header">
              <div className="section-header__left">
                <div className="section-header__icon section-header__icon--primary">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <h2 className="section-header__title">Grafik Keuangan</h2>
                  <p className="section-header__subtitle">
                    Pemasukan vs Pengeluaran 5 bulan terakhir
                  </p>
                </div>
              </div>
            </div>
            <div className="chart-container">
              <div className="chart-bars">
                {monthlyData.map((data, index) => {
                  const maxValue = Math.max(
                    ...monthlyData.map((d) => Math.max(d.income, d.expense)),
                    1,
                  );
                  const incomeHeight = (data.income / maxValue) * 100;
                  const expenseHeight = (data.expense / maxValue) * 100;
                  return (
                    <div key={index} className="chart-bar-group">
                      <div className="chart-bar-group__bars">
                        <div
                          className="chart-bar chart-bar--income"
                          style={{ height: `${incomeHeight}%` }}
                          title={`Pemasukan: ${formatCurrency(data.income)}`}
                        >
                          <span className="chart-bar__tooltip">
                            {formatCurrency(data.income)}
                          </span>
                        </div>
                        <div
                          className="chart-bar chart-bar--expense"
                          style={{ height: `${expenseHeight}%` }}
                          title={`Pengeluaran: ${formatCurrency(data.expense)}`}
                        >
                          <span className="chart-bar__tooltip">
                            {formatCurrency(data.expense)}
                          </span>
                        </div>
                      </div>
                      <span className="chart-bar-group__label">
                        {data.month}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="chart-legend">
                <div className="chart-legend__item">
                  <span className="chart-legend__dot chart-legend__dot--income"></span>
                  <span>Pemasukan</span>
                </div>
                <div className="chart-legend__item">
                  <span className="chart-legend__dot chart-legend__dot--expense"></span>
                  <span>Pengeluaran</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="dashboard-grid__side">
          {/* Tagihan Overview */}
          <section className="dashboard-section dashboard-section--compact">
            <div className="section-header">
              <div className="section-header__left">
                <div className="section-header__icon section-header__icon--success">
                  <PieChart size={20} />
                </div>
                <div>
                  <h2 className="section-header__title">Ringkasan Iuran</h2>
                </div>
              </div>
            </div>
            <div className="tagihan-list">
              {tagihanStats.length === 0 ? (
                <div className="approval-empty" style={{ padding: "16px" }}>
                  <p className="approval-empty__subtitle">Belum ada data iuran</p>
                </div>
              ) : (
                tagihanStats.map((tagihan, index) => (
                  <div key={index} className="tagihan-item">
                    <div className="tagihan-item__info">
                      <h4 className="tagihan-item__name">{tagihan.label}</h4>
                      <p className="tagihan-item__amount">
                        {formatCurrency(tagihan.amount)}
                      </p>
                    </div>
                    <div className="tagihan-item__progress">
                      <div className="progress-bar">
                        <div
                          className="progress-bar__fill"
                          style={{
                            width: `${tagihan.total > 0 ? (tagihan.paid / tagihan.total) * 100 : 0}%`,
                          }}
                        ></div>
                      </div>
                      <div className="tagihan-item__stats">
                        <span className="tagihan-item__paid">
                          {tagihan.paid} lunas
                        </span>
                        <span className="tagihan-item__pending">
                          {tagihan.pending} pending
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Recent Activity */}
          <section className="dashboard-section dashboard-section--compact">
            <div className="section-header">
              <div className="section-header__left">
                <div className="section-header__icon section-header__icon--info">
                  <Bell size={20} />
                </div>
                <div>
                  <h2 className="section-header__title">Notifikasi Terbaru</h2>
                </div>
              </div>
            </div>
            <div className="activity-list">
              {recentActivities.length === 0 ? (
                <div className="approval-empty" style={{ padding: "16px" }}>
                  <p className="approval-empty__subtitle">Belum ada notifikasi</p>
                </div>
              ) : (
                recentActivities.map((activity) => {
                  const IconComponent = activity.icon;
                  return (
                    <div key={activity.id} className="activity-item">
                      <div
                        className={`activity-item__icon activity-item__icon--${activity.color}`}
                      >
                        <IconComponent size={16} />
                      </div>
                      <div className="activity-item__content">
                        <p className="activity-item__message">
                          {activity.message}
                        </p>
                        <span className="activity-item__time">
                          {getTimeAgo(activity.time)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Quick Actions — hanya admin & bendahara */}
          {showQuickActions && <section className="dashboard-section dashboard-section--compact">
              <div className="section-header">
                <div className="section-header__left">
                  <div>
                    <h2 className="section-header__title">Aksi Cepat</h2>
                  </div>
                </div>
                <div className="quick-actions__menu-wrap" ref={quickActionsRef}>
                  <button
                    className="quick-actions__trigger"
                    onClick={() => setQuickActionsOpen((prev) => !prev)}
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  {quickActionsOpen && (
                    <div className="quick-actions__dropdown">
                      <button
                        className="quick-actions__dropdown-item quick-actions__dropdown-item--danger"
                        onClick={() => {
                          setQuickActionsOpen(false);
                          setQuickActionsHidden(true);
                        }}
                      >
                        <EyeOff size={16} />
                        <span>Sembunyikan</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            <div className="quick-actions">
              <button
                className="quick-action"
                onClick={() => navigate("/admin/warga")}
              >
                <div className="quick-action__icon quick-action__icon--primary">
                  <Users size={20} />
                </div>
                <span className="quick-action__label">Tambah Warga</span>
              </button>
              <button
                className="quick-action"
                onClick={() => navigate("/admin/pengumuman")}
              >
                <div className="quick-action__icon quick-action__icon--warning">
                  <Bell size={20} />
                </div>
                <span className="quick-action__label">Buat Pengumuman</span>
              </button>
              <button
                className="quick-action"
                onClick={() => { window.scrollTo(0, 0); navigate("/admin/keuangan"); }}
              >
                <div className="quick-action__icon quick-action__icon--success">
                  <Wallet size={20} />
                </div>
                <span className="quick-action__label">Catat Pengeluaran</span>
              </button>
              <button
                className="quick-action"
                onClick={() => navigate("/admin/laporan")}
              >
                <div className="quick-action__icon quick-action__icon--danger">
                  <FileText size={20} />
                </div>
                <span className="quick-action__label">Lihat Laporan</span>
              </button>
              <button
                className="quick-action"
                onClick={async () => {
                  try {
                    const res = await fetch(`${API}/api/admin/sheets/setup`, {
                      method: "POST",
                      credentials: "include",
                    });
                    const json = await res.json();
                    alert(json.message || (json.success ? "Spreadsheet berhasil di-setup" : "Gagal setup spreadsheet"));
                  } catch {
                    alert("Gagal setup spreadsheet");
                  }
                }}
              >
                <div className="quick-action__icon quick-action__icon--info">
                  <Database size={20} />
                </div>
                <span className="quick-action__label">Setup Spreadsheet</span>
              </button>
            </div>
          </section>}
          {user?.role && user.role !== "warga" && quickActionsHidden && (
            <div className="quick-actions__restore">
              <button onClick={() => setQuickActionsHidden(false)}>
                <EyeOff size={14} />
                <span>Aksi Cepat disembunyikan &middot; Tampilkan</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
