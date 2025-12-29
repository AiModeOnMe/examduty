// src/components/common/StatsCard.jsx
import './StatsCard.css';

const StatsCard = ({
  icon,
  title,
  value,
  change,
  changeType = 'neutral',
  subtitle,
  gradient = 'primary',
  delay = 0,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`stats-card stats-gradient-${gradient} ${className}`}
      style={{ animationDelay: `${delay}s` }}
      {...props}
    >
      <div className="stats-card-inner">
        <div className="stats-icon-wrapper">
          <span className="stats-icon">{icon}</span>
        </div>
        <div className="stats-content">
          <p className="stats-title">{title}</p>
          <div className="stats-value-row">
            <span className="stats-value">{value}</span>
            {change && (
              <span className={`stats-change stats-change-${changeType}`}>
                {changeType === 'positive' && '↑'}
                {changeType === 'negative' && '↓'}
                {change}
              </span>
            )}
          </div>
          {subtitle && <p className="stats-subtitle">{subtitle}</p>}
        </div>
      </div>
      <div className="stats-bg-glow"></div>
    </div>
  );
};

export default StatsCard;