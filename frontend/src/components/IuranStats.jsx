import { CheckCircle2, Clock, Wallet } from "lucide-react";
import { rupiah } from "../utils/rupiah.js";

function UsersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export default function IuranStats({ stats }) {
  return (
    <div className="us-stats">
      <div className="us-stat-card">
        <div className="us-stat-card__icon us-stat-card__icon--primary">
          <UsersIcon />
        </div>
        <div>
          <div className="us-stat-card__value">{stats.total}</div>
          <div className="us-stat-card__label">Total Warga</div>
        </div>
      </div>
      <div className="us-stat-card">
        <div className="us-stat-card__icon us-stat-card__icon--green">
          <CheckCircle2 size={20} />
        </div>
        <div>
          <div className="us-stat-card__value">{stats.lunas}</div>
          <div className="us-stat-card__label">Lunas</div>
        </div>
      </div>
      <div className="us-stat-card">
        <div className="us-stat-card__icon us-stat-card__icon--yellow">
          <Clock size={20} />
        </div>
        <div>
          <div className="us-stat-card__value">{stats.belumLunas}</div>
          <div className="us-stat-card__label">Belum Lunas</div>
        </div>
      </div>
      <div className="us-stat-card">
        <div className="us-stat-card__icon us-stat-card__icon--blue">
          <Wallet size={20} />
        </div>
        <div>
          <div className="us-stat-card__value">{rupiah(stats.collectedAmount)}</div>
          <div className="us-stat-card__label">Terkumpul</div>
        </div>
      </div>
    </div>
  );
}
