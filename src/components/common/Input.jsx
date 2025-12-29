// src/components/common/Input.jsx
import './Input.css';

const Input = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  icon,
  error,
  helper,
  required = false,
  disabled = false,
  className = '',
  size = 'md',
  ...props
}) => {
  return (
    <div className={`input-wrapper input-${size} ${error ? 'has-error' : ''} ${className}`}>
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="required-star">*</span>}
        </label>
      )}
      <div className="input-container">
        {icon && <span className="input-icon">{icon}</span>}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`input-field ${icon ? 'has-icon' : ''}`}
          {...props}
        />
      </div>
      {error && <span className="input-error">{error}</span>}
      {helper && !error && <span className="input-helper">{helper}</span>}
    </div>
  );
};

export const Select = ({
  label,
  value,
  onChange,
  icon,
  error,
  helper,
  required = false,
  disabled = false,
  className = '',
  size = 'md',
  children,
  ...props
}) => {
  return (
    <div className={`select-wrapper input-${size} ${error ? 'has-error' : ''} ${className}`}>
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="required-star">*</span>}
        </label>
      )}
      <div className="input-container">
        {icon && <span className="input-icon">{icon}</span>}
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`select-field ${icon ? 'has-icon' : ''}`}
          {...props}
        >
          {children}
        </select>
        <span className="select-arrow">▼</span>
      </div>
      {error && <span className="input-error">{error}</span>}
      {helper && !error && <span className="input-helper">{helper}</span>}
    </div>
  );
};

export const Textarea = ({
  label,
  placeholder,
  value,
  onChange,
  rows = 4,
  error,
  helper,
  required = false,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`input-wrapper ${error ? 'has-error' : ''} ${className}`}>
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="required-star">*</span>}
        </label>
      )}
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={rows}
        disabled={disabled}
        className="textarea-field"
        {...props}
      />
      {error && <span className="input-error">{error}</span>}
      {helper && !error && <span className="input-helper">{helper}</span>}
    </div>
  );
};

export default Input;