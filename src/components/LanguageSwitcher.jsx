import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { supportedLanguages, changeLanguage, getCurrentLanguage } from "../i18n";

const LanguageSwitcher = ({ compact = false }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const currentLanguage = getCurrentLanguage();

  const handleLanguageChange = (languageCode) => {
    const success = changeLanguage(languageCode);
    if (success) {
      setIsOpen(false);
      // Optional: Show success message
      console.log(`Language changed to ${supportedLanguages[languageCode].name}`);
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.language-switcher')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentLang = supportedLanguages[currentLanguage];

  return (
    <div className="language-switcher" style={{ position: 'relative', display: 'inline-block' }}>
      {/* Language Selector Button */}
      <button
        onClick={toggleDropdown}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: compact ? '0.25rem 0.5rem' : '0.5rem 0.75rem',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: compact ? '0.875rem' : '1rem',
          color: '#495057',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#e9ecef';
          e.target.style.borderColor = '#adb5bd';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = '#f8f9fa';
          e.target.style.borderColor = '#dee2e6';
        }}
        aria-label={t('language')}
        title={`${t('language')}: ${currentLang.nativeName}`}
      >
        <span style={{ fontSize: compact ? '1rem' : '1.2rem' }}>
          {currentLang.flag}
        </span>
        {!compact && (
          <span style={{ fontWeight: '500' }}>
            {currentLang.nativeName}
          </span>
        )}
        <span style={{ 
          fontSize: '0.75rem', 
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease'
        }}>
          ▼
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '0.25rem',
            backgroundColor: '#ffffff',
            border: '1px solid #dee2e6',
            borderRadius: '6px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 1002,
            minWidth: compact ? '200px' : '220px',
            maxHeight: '300px',
            overflowY: 'auto'
          }}
        >
          {Object.entries(supportedLanguages).map(([code, lang]) => (
            <button
              key={code}
              onClick={() => handleLanguageChange(code)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                width: '100%',
                padding: '0.75rem 1rem',
                border: 'none',
                backgroundColor: code === currentLanguage ? '#e3f2fd' : 'transparent',
                color: code === currentLanguage ? '#1976d2' : '#495057',
                cursor: 'pointer',
                fontSize: '0.95rem',
                textAlign: 'left',
                transition: 'background-color 0.2s ease',
                borderBottom: '1px solid #f1f3f4'
              }}
              onMouseEnter={(e) => {
                if (code !== currentLanguage) {
                  e.target.style.backgroundColor = '#f8f9fa';
                }
              }}
              onMouseLeave={(e) => {
                if (code !== currentLanguage) {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>{lang.flag}</span>
              <span style={{ fontWeight: code === currentLanguage ? '600' : '500' }}>
                {lang.nativeName}
              </span>
              {code === currentLanguage && (
                <span style={{ 
                  marginLeft: 'auto', 
                  color: '#1976d2',
                  fontSize: '0.9rem'
                }}>
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;