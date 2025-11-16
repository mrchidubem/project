import { forwardRef } from 'react';
import './Card.css';

/**
 * Card Component
 * 
 * A versatile card container optimized for mobile-first design.
 * Provides consistent styling for content grouping.
 * 
 * @param {Object} props
 * @param {'sm' | 'md' | 'lg'} props.padding - Card padding size
 * @param {boolean} props.hoverable - Whether card has hover effects
 * @param {boolean} props.clickable - Whether card is clickable
 * @param {React.ReactNode} props.header - Card header content
 * @param {React.ReactNode} props.children - Card body content
 * @param {React.ReactNode} props.footer - Card footer content
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onClick - Click handler (for clickable cards)
 */
const Card = forwardRef(({
  padding = 'md',
  hoverable = false,
  clickable = false,
  header,
  children,
  footer,
  className = '',
  onClick,
  ...props
}, ref) => {
  const classNames = [
    'card',
    `card--padding-${padding}`,
    hoverable && 'card--hoverable',
    clickable && 'card--clickable',
    className
  ].filter(Boolean).join(' ');

  const CardWrapper = clickable ? 'button' : 'div';

  return (
    <CardWrapper
      ref={ref}
      className={classNames}
      onClick={onClick}
      {...props}
    >
      {header && (
        <div className="card__header">
          {header}
        </div>
      )}
      
      <div className="card__body">
        {children}
      </div>
      
      {footer && (
        <div className="card__footer">
          {footer}
        </div>
      )}
    </CardWrapper>
  );
});

Card.displayName = 'Card';

export default Card;
