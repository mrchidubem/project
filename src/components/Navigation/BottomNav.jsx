import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge } from '../ui';
import './BottomNav.css';

/**
 * BottomNav Component
 * 
 * Mobile-first bottom navigation bar with icon-based navigation.
 * Optimized for thumb reach and one-handed use.
 */
const BottomNav = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { 
      path: '/dashboard', 
      icon: '🏠', 
      label: t('dashboard'),
      ariaLabel: 'Navigate to dashboard'
    },
    { 
      path: '/medications', 
      icon: '💊', 
      label: t('medications'),
      ariaLabel: 'Navigate to medications'
    },
    { 
      path: '/adr', 
      icon: '📋', 
      label: 'ADR',
      ariaLabel: 'Navigate to ADR form'
    },
    { 
      path: '/pharmacy-finder', 
      icon: '🏥', 
      label: t('pharmacy_finder'),
      ariaLabel: 'Navigate to pharmacy finder'
    },
    { 
      path: '/settings', 
      icon: '⚙️', 
      label: t('settings'),
      ariaLabel: 'Navigate to settings'
    },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
      <div className="bottom-nav__container">
        {navItems.map((item) => {
          const active = isActive(item.path);
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`bottom-nav__item ${active ? 'bottom-nav__item--active' : ''}`}
              aria-label={item.ariaLabel}
              aria-current={active ? 'page' : undefined}
            >
              <span className="bottom-nav__icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="bottom-nav__label">
                {item.label}
              </span>
              {active && (
                <span className="bottom-nav__indicator" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
