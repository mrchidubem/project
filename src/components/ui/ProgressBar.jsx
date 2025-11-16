import './ProgressBar.css';

/**
 * ProgressBar Component
 * 
 * A progress indicator showing completion percentage.
 * Mobile-optimized with smooth animations.
 * 
 * @param {Object} props
 * @param {number} props.value - Progress value (0-100)
 * @param {number} props.max - Maximum value (default: 100)
 * @param {'sm' | 'md' | 'lg'} props.size - Progress bar height
 * @param {'primary' | 'secondary' | 'accent' | 'success'} props.color - Progress bar color
 * @param {boolean} props.showLabel - Whether to show percentage label
 * @param {boolean} props.striped - Whether to show striped pattern
 * @param {boolean} props.animated - Whether stripes are animated
 * @param {string} props.label - Accessible label for screen readers
 * @param {string} props.className - Additional CSS classes
 */
const ProgressBar = ({
  value = 0,
  max = 100,
  size = 'md',
  color = 'primary',
  showLabel = false,
  striped = false,
  animated = false,
  label,
  className = '',
  ...props
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const roundedPercentage = Math.round(percentage);

  const wrapperClassNames = [
    'progress-wrapper',
    className
  ].filter(Boolean).join(' ');

  const barClassNames = [
    'progress-bar',
    `progress-bar--${size}`,
    `progress-bar--${color}`,
    striped && 'progress-bar--striped',
    animated && 'progress-bar--animated'
  ].filter(Boolean).join(' ');

  const ariaLabel = label || `${roundedPercentage}% complete`;

  return (
    <div className={wrapperClassNames}>
      {showLabel && (
        <div className="progress-label">
          <span className="progress-label__text">{ariaLabel}</span>
          <span className="progress-label__percentage">{roundedPercentage}%</span>
        </div>
      )}
      
      <div
        className="progress-track"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={ariaLabel}
        {...props}
      >
        <div
          className={barClassNames}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
