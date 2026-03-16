export function StatCard({ emoji, label, value, bg }) {
  return (
    <div className="hd-stat-card">
      <div className="hd-stat-card__icon" style={{ background: bg }}>{emoji}</div>
      <div>
        <div className="hd-stat-card__value">{value}</div>
        <div className="hd-stat-card__label">{label}</div>
      </div>
    </div>
  );
}