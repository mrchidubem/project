import './Badge.css';

/**
 * Badge Component
 * 
 * A small label for displaying status, counts, or categories.
 * Mobile-optimized with clear visibility.
 * 
 * @param {Object} props
 * @param {'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'neutral'} props.variant - Badge color
 * @param {'sm' | 'md' | 'lg'} props.size - Badge size
 * @param {boolean} props.dot - Whether to show as a dot indicator
 * @param {boolean} props.pill - Whether to use pill shape
 * @param {React.ReactNode} props.children - Badge content
 * @param {string} props.className - Additional CSS classes
 */
const Badge = ({
  variant = 'neutral',
  size = 'md',
  dot = false,
  pill = false,
  children,
  className = '',
  ...props
}) => {
  const classNames = [
    'badge',
    `badge--${variant}`,
    `badge--${size}`,
    dot && 'badge--dot',
    pill && 'badge--pill',
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={classNames} {...props}>
      {!dot && children}
    </span>
  );
};

export default Badge;
