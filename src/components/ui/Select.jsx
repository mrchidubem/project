import { forwardRef } from 'react';
import './Select.css';

/**
 * Select Component
 * 
 * A styled select dropdown with validation states and mobile optimization.
 * 
 * @param {Object} props
 * @param {string} props.label - Select label
 * @param {string} props.helperText - Helper text below select
 * @param {string} props.error - Error message
 * @param {'sm' | 'md' | 'lg'} props.size - Select size
 * @param {boolean} props.fullWidth - Whether select takes full width
 * @param {boolean} props.disabled - Whether select is disabled
 * @param {boolean} props.required - Whether select is required
 * @param {Array} props.options - Array of {value, label} objects
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.className - Additional CSS classes
 */
const Select = forwardRef(({
  label,
  helperText,
  error,
  size = 'md',
  fullWidth = true,
  disabled = false,
  required = false,
  options = [],
  placeholder = 'Select an option',
  className = '',
  id,
  ...props
}, ref) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = Boolean(error);

  const wrapperClassNames = [
    'select-wrapper',
    fullWidth && 'select-wrapper--full-width',
    className
  ].filter(Boolean).join(' ');

  const selectClassNames = [
    'select',
    `select--${size}`,
    hasError && 'select--error',
    disabled && 'select--disabled'
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClassNames}>
      {label && (
        <label htmlFor={selectId} className="select__label">
          {label}
          {required && <span className="select__required" aria-label="required">*</span>}
        </label>
      )}
      
      <div className="select__container">
        <select
          ref={ref}
          id={selectId}
          className={selectClassNames}
          disabled={disabled}
          required={required}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${selectId}-error` : 
            helperText ? `${selectId}-helper` : 
            undefined
          }
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        <span className="select__icon" aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </span>
      </div>
      
      {error && (
        <span id={`${selectId}-error`} className="select__error" role="alert">
          {error}
        </span>
      )}
      
      {helperText && !error && (
        <span id={`${selectId}-helper`} className="select__helper-text">
          {helperText}
        </span>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
