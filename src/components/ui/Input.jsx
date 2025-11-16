import { forwardRef } from 'react';
import './Input.css';

/**
 * Input Component
 * 
 * A versatile text input with validation states and mobile optimization.
 * 
 * @param {Object} props
 * @param {string} props.label - Input label
 * @param {string} props.helperText - Helper text below input
 * @param {string} props.error - Error message
 * @param {'text' | 'email' | 'password' | 'number' | 'tel' | 'url'} props.type - Input type
 * @param {'sm' | 'md' | 'lg'} props.size - Input size
 * @param {boolean} props.fullWidth - Whether input takes full width
 * @param {boolean} props.disabled - Whether input is disabled
 * @param {boolean} props.required - Whether input is required
 * @param {React.ReactNode} props.leftIcon - Icon on the left
 * @param {React.ReactNode} props.rightIcon - Icon on the right
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.className - Additional CSS classes
 */
const Input = forwardRef(({
  label,
  helperText,
  error,
  type = 'text',
  size = 'md',
  fullWidth = true,
  disabled = false,
  required = false,
  leftIcon,
  rightIcon,
  placeholder,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = Boolean(error);

  const wrapperClassNames = [
    'input-wrapper',
    fullWidth && 'input-wrapper--full-width',
    className
  ].filter(Boolean).join(' ');

  const inputClassNames = [
    'input',
    `input--${size}`,
    hasError && 'input--error',
    leftIcon && 'input--with-left-icon',
    rightIcon && 'input--with-right-icon',
    disabled && 'input--disabled'
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClassNames}>
      {label && (
        <label htmlFor={inputId} className="input__label">
          {label}
          {required && <span className="input__required" aria-label="required">*</span>}
        </label>
      )}
      
      <div className="input__container">
        {leftIcon && (
          <span className="input__icon input__icon--left" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={inputClassNames}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${inputId}-error` : 
            helperText ? `${inputId}-helper` : 
            undefined
          }
          {...props}
        />
        
        {rightIcon && (
          <span className="input__icon input__icon--right" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </div>
      
      {error && (
        <span id={`${inputId}-error`} className="input__error" role="alert">
          {error}
        </span>
      )}
      
      {helperText && !error && (
        <span id={`${inputId}-helper`} className="input__helper-text">
          {helperText}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
