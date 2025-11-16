import './Skeleton.css';

/**
 * Skeleton Component
 * 
 * A loading placeholder that mimics the shape of content.
 * Mobile-optimized with shimmer animation.
 * 
 * @param {Object} props
 * @param {'text' | 'title' | 'avatar' | 'thumbnail' | 'rectangle'} props.variant - Skeleton shape
 * @param {string | number} props.width - Custom width
 * @param {string | number} props.height - Custom height
 * @param {boolean} props.circle - Whether skeleton is circular
 * @param {boolean} props.animation - Whether to show shimmer animation
 * @param {number} props.count - Number of skeleton lines (for text variant)
 * @param {string} props.className - Additional CSS classes
 */
const Skeleton = ({
  variant = 'text',
  width,
  height,
  circle = false,
  animation = true,
  count = 1,
  className = '',
  ...props
}) => {
  const classNames = [
    'skeleton',
    `skeleton--${variant}`,
    circle && 'skeleton--circle',
    animation && 'skeleton--animated',
    className
  ].filter(Boolean).join(' ');

  const style = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  // Render multiple skeleton lines for text variant
  if (count > 1) {
    return (
      <div className="skeleton-group">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className={classNames}
            style={{
              ...style,
              // Last line is typically shorter
              width: index === count - 1 && !width ? '80%' : style.width
            }}
            {...props}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={classNames}
      style={style}
      {...props}
    />
  );
};

export default Skeleton;
