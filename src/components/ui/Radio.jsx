import { forwardRef } from 'react';
import './Radio.css';

/**
 * Radio Component
 * 
 * A styled radio button with label and mobile-optimized touch targets.
 * 
 * @param {Object} props
 * @param {string} props.label - Radio label
 * @param {string} props.helperText - Helper text below radio
 * @param {string} props.error - Error message
 * @param {'sm' | 'md' | 'lg'} props.size - Radio size
 * @param {boolean} props.disabled - Whether radio is disabled
 * @param {boolean} props.checked - Whether radio is checked
 * @param {Function} props.onChange - Change handler
 * @param {string} props.name - Radio group name
 * @param {string} props.value - Radio value
 * @param {string} props.className - Additional CSS classes
 */
const Radio = forwardRef(({
  label,
  helperText,
  error,
  size = 'md',
  disabled = false,
  checked,
  onChange,
  name,
  value,
  className = '',
  id,
  ...props
}, ref) => {
  const radioId = id || `radio-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = Boolean(error);

  const wrapperClassNames = [
    'radio-wrapper',
    hasError && 'radio-wrapper--error',
    disabled && 'radio-wrapper--disabled',
    className
  ].filter(Boolean).join(' ');

  const radioClassNames = [
    'radio',
    `radio--${size}`
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClassNames}>
      <label htmlFor={radioId} className="radio__label-wrapper">
        <input
          ref={ref}
          id={radioId}
          type="radio"
          className={radioClassNames}
          disabled={disabled}
          checked={checked}
          onChange={onChange}
          name={name}
          value={value}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${radioId}-error` : 
            helperText ? `${radioId}-helper` : 
            undefined
          }
          {...props}
        />
        
        <span className="radio__custom" aria-hidden="true">
          <span className="radio__dot"></span>
        </span>
        
        {label && (
          <span className="radio__label">
            {label}
          </span>
        )}
      </label>
      
      {error && (
        <span id={`${radioId}-error`} className="radio__error" role="alert">
          {error}
        </span>
      )}
      
      {helperText && !error && (
        <span id={`${radioId}-helper`} className="radio__helper-text">
          {helperText}
        </span>
      )}
    </div>
  );
});

Radio.displayName = 'Radio';

export default Radio;
