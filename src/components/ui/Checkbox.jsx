import { forwardRef } from 'react';
import './Checkbox.css';

/**
 * Checkbox Component
 * 
 * A styled checkbox with label and mobile-optimized touch targets.
 * 
 * @param {Object} props
 * @param {string} props.label - Checkbox label
 * @param {string} props.helperText - Helper text below checkbox
 * @param {string} props.error - Error message
 * @param {'sm' | 'md' | 'lg'} props.size - Checkbox size
 * @param {boolean} props.disabled - Whether checkbox is disabled
 * @param {boolean} props.checked - Whether checkbox is checked
 * @param {Function} props.onChange - Change handler
 * @param {string} props.className - Additional CSS classes
 */
const Checkbox = forwardRef(({
  label,
  helperText,
  error,
  size = 'md',
  disabled = false,
  checked,
  onChange,
  className = '',
  id,
  ...props
}, ref) => {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = Boolean(error);

  const wrapperClassNames = [
    'checkbox-wrapper',
    hasError && 'checkbox-wrapper--error',
    disabled && 'checkbox-wrapper--disabled',
    className
  ].filter(Boolean).join(' ');

  const checkboxClassNames = [
    'checkbox',
    `checkbox--${size}`
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClassNames}>
      <label htmlFor={checkboxId} className="checkbox__label-wrapper">
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          className={checkboxClassNames}
          disabled={disabled}
          checked={checked}
          onChange={onChange}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${checkboxId}-error` : 
            helperText ? `${checkboxId}-helper` : 
            undefined
          }
          {...props}
        />
        
        <span className="checkbox__custom" aria-hidden="true">
          <svg className="checkbox__icon" viewBox="0 0 16 16" fill="none">
            <path
              d="M13.5 4L6 11.5L2.5 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        
        {label && (
          <span className="checkbox__label">
            {label}
          </span>
        )}
      </label>
      
      {error && (
        <span id={`${checkboxId}-error`} className="checkbox__error" role="alert">
          {error}
        </span>
      )}
      
      {helperText && !error && (
        <span id={`${checkboxId}-helper`} className="checkbox__helper-text">
          {helperText}
        </span>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

export default Checkbox;
