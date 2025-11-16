import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiLogOut, FiSettings } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import LanguageSwitcher from '../LanguageSwitcher';
import SyncStatusIndicator from '../SyncStatusIndicator';
import './Header.css';

/**
 * Header Component
 * 
 * Top navigation bar with logo, language switcher, sync status, and user menu.
 * Redesigned with wellness design system.
 */
const Header = ({ user, onLogout }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    setMenuOpen(false);
    onLogout();
  };

  const handleSettings = () => {
    setMenuOpen(false);
    navigate('/settings');
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  // Get user initials for avatar
  const getUserInitials = (email) => {
    if (!email) return '?';
    return email.charAt(0).toUpperCase();
  };

  return (
    <header className="header" role="banner">
      <div className="header__container">
        {/* Logo */}
        <div className="header__logo" role="img" aria-label="MedAdhere - Medication Adherence Tracker">
          <span className="header__logo-icon" aria-hidden="true">
            💊
          </span>
          <span className="header__logo-text">MedAdhere</span>
        </div>

        {/* Actions */}
        <div className="header__actions">
          <div className="header__language-switcher">
            <LanguageSwitcher compact={true} />
          </div>

          {user && (
            <>
              <SyncStatusIndicator compact={true} />

              {/* User Menu */}
              <div className="header__user-menu" ref={menuRef}>
                <button
                  className="header__avatar"
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label="User menu"
                  aria-expanded={menuOpen}
                >
                  {getUserInitials(user.email)}
                </button>

                {menuOpen && (
                  <div className="header__dropdown">
                    {/* User Info */}
                    <div className="header__user-info">
                      <div className="header__user-label">{t('auth_email')}</div>
                      <div className="header__user-email">{user.email}</div>
                    </div>

                    <div className="header__divider" />

                    {/* Mobile Language Switcher */}
                    <div className="header__mobile-language">
                      <LanguageSwitcher compact={false} />
                    </div>

                    <div className="header__divider header__divider--mobile" />

                    {/* Settings */}
                    <button
                      className="header__menu-item"
                      onClick={handleSettings}
                    >
                      <FiSettings size="16px" />
                      <span>{t('settings')}</span>
                    </button>

                    {/* Logout */}
                    <button
                      className="header__menu-item header__menu-item--danger"
                      onClick={handleLogout}
                    >
                      <FiLogOut size="16px" />
                      <span>{t('auth_logout')}</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
