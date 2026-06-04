import { useState, useEffect } from "react";
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
  Download,
  Eye,
  UserCheck,
  UserX,
  MoreHorizontal,
} from "lucide-react";
import "../../assets/style/css/AdminDashboard.css";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("7d");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - nanti diganti dengan API call
  const [stats, setStats] = useState({
    totalWarga: 142,
    wargaBaru: 8,
    totalTagihan: 2840000,
    tagihanLunas: 1980000,
    laporanBaru: 12,
    suratPending: 5,
    wargaPending: 3,
    pendapatanBulanIni: 4500000,
  });

  const [pendingApprovals, setPendingApprovals] = useState([
    {
      id: 1,
      nama: "Budi Santoso",
      nik: "3201234567890123",
      alamat: "Jl. Mawar No. 12, RT 003",
      no_rumah: "12",
      status_huni: "pemilik",
      foto_ktp_url: null,
      submitted_at: "2026-05-01T10:30:00",
      email: "budi.santoso@email.com",
      no_hp: "081234567890",
    },
    {
      id: 2,
      nama: "Siti Aminah",
      nik: "3201234567890456",
      alamat: "Jl. Melati No. 8, RT 003",
      no_rumah: "8",
      status_huni: "penyewa",
      foto_ktp_url: null,
      submitted_at: "2026-04-30T14:15:00",
      email: "siti.aminah@email.com",
      no_hp: "081298765432",
    },
    {
      id: 3,
      nama: "Ahmad Rizki",
      nik: "3201234567890789",
      alamat: "Jl. Anggrek No. 15, RT 003",
      no_rumah: "15",
      status_huni: "pemilik",
      foto_ktp_url: null,
      submitted_at: "2026-04-29T09:00:00",
      email: "ahmad.rizki@email.com",
      no_hp: "081345678901",
    },
  ]);

  const [recentActivities, setRecentActivities] = useState([
    {
      id: 1,
      type: "warga_verified",
      message: "Warga Budi Santoso telah diverifikasi",
      time: "10 menit yang lalu",
      icon: UserCheck,
      color: "success",
    },
    {
      id: 2,
      type: "payment",
      message: "Pembayaran uang sampah Rp 150.000 dari Ibu Siti",
      time: "1 jam yang lalu",
      icon: Wallet,
      color: "primary",
    },
    {
      id: 3,
      type: "report",
      message: 'Laporan baru: "Lampu jalan mati di Gang Mawar"',
      time: "2 jam yang lalu",
      icon: FileText,
      color: "warning",
    },
    {
      id: 4,
      type: "surat",
      message: "Surat pengantar diajukan oleh Pak Ahmad",
      time: "3 jam yang lalu",
      icon: FileText,
      color: "info",
    },
    {
      id: 5,
      type: "warga_rejected",
      message: "Pendaftaran warga Dedi ditolak - NIK tidak valid",
      time: "5 jam yang lalu",
      icon: UserX,
      color: "danger",
    },
  ]);

  const [monthlyData] = useState([
    { month: "Jan", income: 3200000, expense: 2100000 },
    { month: "Feb", income: 3800000, expense: 2400000 },
    { month: "Mar", income: 4100000, expense: 2800000 },
    { month: "Apr", income: 3600000, expense: 2200000 },
    { month: "Mei", income: 4500000, expense: 3100000 },
  ]);

  const [tagihanStats] = useState([
    {
      label: "Uang Sampah",
      total: 180,
      paid: 156,
      pending: 24,
      amount: 1800000,
    },
    { label: "Uang Kurban", total: 45, paid: 32, pending: 13, amount: 9600000 },
    {
      label: "Iuran Keamanan",
      total: 142,
      paid: 128,
      pending: 14,
      amount: 2840000,
    },
  ]);

  useEffect(() => {
    // Simulate API loading
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleApprove = async (id) => {
    // TODO: API call to approve warga
    setPendingApprovals((prev) => prev.filter((item) => item.id !== id));
    // Add to activity log
    const approved = pendingApprovals.find((item) => item.id === id);
    if (approved) {
      setRecentActivities((prev) => [
        {
          id: Date.now(),
          type: "warga_verified",
          message: `Warga ${approved.nama} telah diverifikasi`,
          time: "Baru saja",
          icon: UserCheck,
          color: "success",
        },
        ...prev.slice(0, 4),
      ]);
    }
  };

  const handleReject = async (id) => {
    // TODO: API call to reject warga
    setPendingApprovals((prev) => prev.filter((item) => item.id !== id));
  };

  const handleViewDetail = (id) => {
    // TODO: Navigate to warga detail page
    console.log("View detail:", id);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeAgo = (dateString) => {
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

  const filteredApprovals = pendingApprovals.filter((item) => {
    const matchesSearch =
      item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nik.includes(searchQuery);
    const matchesFilter =
      selectedFilter === "all" || item.status_huni === selectedFilter;
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

  return (
    <div className="admin-dashboard">
      {/* Header Section */}
      <header className="dashboard-header">
        <div className="dashboard-header__left">
          <h1 className="dashboard-header__title">Dashboard Admin</h1>
          <p className="dashboard-header__subtitle">
            Selamat datang kembali, Ketua RT-003. Berikut ringkasan aktivitas
            hari ini.
          </p>
        </div>
        <div className="dashboard-header__right">
          <div className="time-filter">
            {["7d", "30d", "90d", "1y"].map((range) => (
              <button
                key={range}
                className={`time-filter__btn ${timeRange === range ? "time-filter__btn--active" : ""}`}
                onClick={() => setTimeRange(range)}
              >
                {range === "7d"
                  ? "7 Hari"
                  : range === "30d"
                    ? "30 Hari"
                    : range === "90d"
                      ? "3 Bulan"
                      : "1 Tahun"}
              </button>
            ))}
          </div>
          <button
            className="btn-export"
            onClick={() => console.log("Export report")}
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="stats-grid">
        <StatCard
          title="Total Warga"
          value={stats.totalWarga}
          subtitle={`+${stats.wargaBaru} baru bulan ini`}
          icon={Users}
          trend="up"
          trendValue="5.6%"
          color="primary"
          onClick={() => navigate("/admin/warga")}
        />
        <StatCard
          title="Pendapatan Bulan Ini"
          value={formatCurrency(stats.pendapatanBulanIni)}
          subtitle="Dari semua sumber"
          icon={Wallet}
          trend="up"
          trendValue="12.3%"
          color="success"
        />
        <StatCard
          title="Tagihan Belum Lunas"
          value={formatCurrency(stats.totalTagihan - stats.tagihanLunas)}
          subtitle={`${Math.round(((stats.totalTagihan - stats.tagihanLunas) / stats.totalTagihan) * 100)}% dari total`}
          icon={AlertCircle}
          trend="down"
          trendValue="3.2%"
          color="warning"
        />
        <StatCard
          title="Laporan Warga"
          value={stats.laporanBaru}
          subtitle={`${stats.laporanBaru} belum ditangani`}
          icon={FileText}
          trend="up"
          trendValue="8.1%"
          color="danger"
          onClick={() => navigate("/admin/laporan")}
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
                    Antrean Verifikasi Warga
                  </h2>
                  <p className="section-header__subtitle">
                    {pendingApprovals.length} warga menunggu persetujuan
                  </p>
                </div>
              </div>
              <button
                className="btn-text"
                onClick={() => navigate("/admin/warga/verifikasi")}
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
                  <option value="all">Semua Status</option>
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
                        <span className={`badge badge--${item.status_huni}`}>
                          {item.status_huni === "pemilik"
                            ? "Pemilik"
                            : "Penyewa"}
                        </span>
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
                        onClick={() => handleViewDetail(item.id)}
                        title="Lihat Detail"
                      >
                        <Eye size={18} />
                      </button>
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
                  <h2 className="section-header__title">Ringkasan Tagihan</h2>
                </div>
              </div>
            </div>
            <div className="tagihan-list">
              {tagihanStats.map((tagihan, index) => (
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
                          width: `${(tagihan.paid / tagihan.total) * 100}%`,
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
              ))}
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
                  <h2 className="section-header__title">Aktivitas Terbaru</h2>
                </div>
              </div>
            </div>
            <div className="activity-list">
              {recentActivities.map((activity) => {
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
                        {activity.time}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Quick Actions */}
          <section className="dashboard-section dashboard-section--compact">
            <div className="section-header">
              <div className="section-header__left">
                <div className="section-header__icon section-header__icon--primary">
                  <MoreHorizontal size={20} />
                </div>
                <div>
                  <h2 className="section-header__title">Aksi Cepat</h2>
                </div>
              </div>
            </div>
            <div className="quick-actions">
              <button
                className="quick-action"
                onClick={() => navigate("/admin/warga/tambah")}
              >
                <div className="quick-action__icon quick-action__icon--primary">
                  <Users size={20} />
                </div>
                <span className="quick-action__label">Tambah Warga</span>
              </button>
              <button
                className="quick-action"
                onClick={() => navigate("/admin/pengumuman/baru")}
              >
                <div className="quick-action__icon quick-action__icon--warning">
                  <Bell size={20} />
                </div>
                <span className="quick-action__label">Buat Pengumuman</span>
              </button>
              <button
                className="quick-action"
                onClick={() => navigate("/admin/keuangan/catat")}
              >
                <div className="quick-action__icon quick-action__icon--success">
                  <Wallet size={20} />
                </div>
                <span className="quick-action__label">Catat Transaksi</span>
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
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
