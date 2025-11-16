import './Spinner.css';

/**
 * Spinner Component
 * 
 * A circular loading spinner with wellness theme colors.
 * Mobile-optimized and accessible.
 * 
 * @param {Object} props
 * @param {'sm' | 'md' | 'lg' | 'xl'} props.size - Spinner size
 * @param {'primary' | 'secondary' | 'accent' | 'white'} props.color - Spinner color
 * @param {boolean} props.centered - Whether to center spinner
 * @param {string} props.label - Accessible label for screen readers
 * @param {string} props.className - Additional CSS classes
 */
const Spinner = ({
  size = 'md',
  color = 'primary',
  centered = false,
  label = 'Loading',
  className = '',
  ...props
}) => {
  const classNames = [
    'spinner',
    `spinner--${size}`,
    `spinner--${color}`,
    centered && 'spinner--centered',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames} role="status" aria-label={label} {...props}>
      <svg className="spinner__svg" viewBox="0 0 50 50">
        <circle
          className="spinner__circle"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="4"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
};

export default Spinner;
