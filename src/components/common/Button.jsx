// src/components/common/Button.jsx
import './Button.css';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  return (
    <button
      type={type}
      className={`
        btn
        btn-${variant}
        btn-${size}
        ${fullWidth ? 'btn-full' : ''}
        ${loading ? 'btn-loading' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <span className="btn-spinner"></span>}
      {icon && !loading && <span className="btn-icon">{icon}</span>}
      <span className="btn-text">{children}</span>
      {iconRight && <span className="btn-icon-right">{iconRight}</span>}
    </button>
  );
};

export default Button;