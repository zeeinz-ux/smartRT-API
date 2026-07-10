import {
  Users, Wallet, AlertCircle, AlertTriangle, DollarSign,
  BarChart3, TrendingUp, FileText, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { rupiah } from "../utils/rupiah.js";

const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, color, onClick }) => (
  <div className={`stat-card stat-card--${color}`} onClick={onClick}>
    <div className="stat-card__header">
      <div className={`stat-card__icon stat-card__icon--${color}`}>
        <Icon size={22} strokeWidth={2} />
      </div>
      {trend && (
        <span className={`stat-card__trend stat-card__trend--${trend}`}>
          {trend === "up" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
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

const ICONS = {
  Users, Wallet, AlertCircle, AlertTriangle, DollarSign, BarChart3, TrendingUp, FileText,
};

export default function StatCards({ stats, navigate }) {
  const cards = [
    { title: "Total Warga", value: stats.totalWarga, subtitle: `${stats.wargaPending} menunggu verifikasi`, icon: "Users", trend: "up", trendValue: "verified", color: "primary", onClick: () => navigate("/admin/warga") },
    { title: "Pendapatan Bulan Ini", value: rupiah(stats.pendapatanBulanIni), subtitle: "Dari semua sumber", icon: "Wallet", trend: "up", trendValue: "", color: "success" },
    { title: "Warga Menunggu", value: stats.wargaPending, subtitle: "perlu verifikasi", icon: "AlertCircle", trend: "down", trendValue: "", color: "warning" },
    { title: "Belum Onboarding", value: stats.wargaNonOnboarded, subtitle: "belum isi profil", icon: "AlertTriangle", trend: "down", trendValue: "", color: "danger" },
    { title: "Iuran Pending", value: stats.iuranPending, subtitle: "menunggu verifikasi", icon: "DollarSign", trend: "up", trendValue: "", color: "warning" },
    { title: "Total Tunggakan", value: rupiah(stats.totalTunggakan), subtitle: "belum dibayar", icon: "BarChart3", trend: "down", trendValue: "", color: "danger" },
    { title: "Kepatuhan Bulan Ini", value: `${stats.kepatuhanBulanIni}%`, subtitle: "warga lunas tepat waktu", icon: "TrendingUp", trend: stats.kepatuhanBulanIni >= 70 ? "up" : "down", trendValue: "", color: stats.kepatuhanBulanIni >= 70 ? "success" : "danger" },
    { title: "Pengajuan Surat", value: stats.suratPending, subtitle: "menunggu diproses", icon: "FileText", trend: "up", trendValue: "", color: "danger" },
  ];

  return (
    <section className="stats-grid">
      {cards.map((card, i) => (
        <StatCard key={i} {...card} icon={ICONS[card.icon]} />
      ))}
    </section>
  );
}
