import { Bell } from "lucide-react";

export default function RecentActivity({ activities, getTimeAgo }) {
  return (
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
        {activities.length === 0 ? (
          <div className="approval-empty">
            <p className="approval-empty__subtitle">Belum ada notifikasi</p>
          </div>
        ) : (
          activities.map((activity) => {
            const IconComponent = activity.icon;
            return (
              <div key={activity.id} className="activity-item">
                <div className={`activity-item__icon activity-item__icon--${activity.color}`}>
                  <IconComponent size={16} />
                </div>
                <div className="activity-item__content">
                  <p className="activity-item__message">{activity.message}</p>
                  <span className="activity-item__time">{getTimeAgo(activity.time)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
