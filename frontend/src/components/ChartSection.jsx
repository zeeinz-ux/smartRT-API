import { BarChart3 } from "lucide-react";
import { rupiah } from "../utils/rupiah.js";

export default function ChartSection({ monthlyData }) {
  if (!monthlyData || monthlyData.length === 0) return null;

  const maxValue = Math.max(...monthlyData.map((d) => Math.max(d.income, d.expense)), 1);

  return (
    <section className="dashboard-section">
      <div className="section-header">
        <div className="section-header__left">
          <div className="section-header__icon section-header__icon--primary">
            <BarChart3 size={20} />
          </div>
          <div>
            <h2 className="section-header__title">Grafik Keuangan</h2>
            <p className="section-header__subtitle">Pemasukan vs Pengeluaran 5 bulan terakhir</p>
          </div>
        </div>
      </div>
      <div className="chart-container">
        <div className="chart-bars">
          {monthlyData.map((data, index) => {
            const incomeHeight = (data.income / maxValue) * 100;
            const expenseHeight = (data.expense / maxValue) * 100;
            return (
              <div key={index} className="chart-bar-group">
                <div className="chart-bar-group__bars">
                  <div
                    className="chart-bar chart-bar--income"
                    style={{ height: `${incomeHeight}%` }}
                    title={`Pemasukan: ${rupiah(data.income)}`}
                  >
                    <span className="chart-bar__tooltip">{rupiah(data.income)}</span>
                  </div>
                  <div
                    className="chart-bar chart-bar--expense"
                    style={{ height: `${expenseHeight}%` }}
                    title={`Pengeluaran: ${rupiah(data.expense)}`}
                  >
                    <span className="chart-bar__tooltip">{rupiah(data.expense)}</span>
                  </div>
                </div>
                <span className="chart-bar-group__label">{data.month}</span>
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
  );
}
