// src/components/common/Badge.jsx
import './Badge.css';

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  pulse = false,
  icon,
  className = '',
  ...props
}) => {
  return (
    <span
      className={`
        badge
        badge-${variant}
        badge-${size}
        ${dot ? 'badge-dot' : ''}
        ${pulse ? 'badge-pulse' : ''}
        ${className}
      `}
      {...props}
    >
      {dot && <span className="badge-dot-indicator"></span>}
      {icon && <span className="badge-icon">{icon}</span>}
      {children}
    </span>
  );
};

export default Badge;