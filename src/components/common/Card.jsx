// src/components/common/Card.jsx
import './Card.css';

const Card = ({ 
  children, 
  title, 
  subtitle, 
  icon, 
  actions, 
  className = '', 
  variant = 'default',
  padding = 'normal',
  hoverable = false,
  gradient,
  ...props 
}) => {
  return (
    <div 
      className={`
        card 
        card-${variant} 
        card-padding-${padding}
        ${hoverable ? 'card-hoverable' : ''}
        ${gradient ? `card-gradient-${gradient}` : ''}
        ${className}
      `}
      {...props}
    >
      {(title || actions) && (
        <div className="card-header">
          <div className="card-header-content">
            {icon && <span className="card-icon">{icon}</span>}
            <div className="card-titles">
              {title && <h3 className="card-title">{title}</h3>}
              {subtitle && <p className="card-subtitle">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="card-actions">{actions}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  );
};

export default Card;