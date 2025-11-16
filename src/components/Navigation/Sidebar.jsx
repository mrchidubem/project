import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Sidebar.css';

/**
 * Sidebar Navigation Component
 * 
 * Vertical navigation sidebar for desktop/tablet views
 * Replaces bottom navigation on larger screens
 * 
 * Features:
 * - Vertical layout on left side
 * - Active route highlighting
 * - Icon + label navigation items
 * - Responsive (hidden on mobile)
 */
const Sidebar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      path: '/dashboard',
      icon: '🏠',
      label: t('dashboard') || 'Dashboard',
      ariaLabel: 'Navigate to Dashboard'
    },
    {
      path: '/medications',
      icon: '💊',
      label: t('medications') || 'Medications',
      ariaLabel: 'Navigate to Medications'
    },
    {
      path: '/adr',
      icon: '📋',
      label: 'ADR',
      ariaLabel: 'Navigate to ADR Form'
    },
    {
      path: '/pharmacy-finder',
      icon: '🏥',
      label: t('pharmacy_finder') || 'Pharmacy Finder',
      ariaLabel: 'Navigate to Pharmacy Finder'
    },
    {
      path: '/analytics',
      icon: '📊',
      label: 'Analytics',
      ariaLabel: 'Navigate to Analytics Dashboard'
    },
    {
      path: '/settings',
      icon: '⚙️',
      label: t('settings') || 'Settings',
      ariaLabel: 'Navigate to Settings'
    }
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <aside className="sidebar" role="navigation" aria-label="Main navigation">
      <nav className="sidebar__nav">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => handleNavigation(item.path)}
            className={`sidebar__item ${isActive(item.path) ? 'sidebar__item--active' : ''}`}
            aria-label={item.ariaLabel}
            aria-current={isActive(item.path) ? 'page' : undefined}
          >
            <span className="sidebar__icon">{item.icon}</span>
            <span className="sidebar__label">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
