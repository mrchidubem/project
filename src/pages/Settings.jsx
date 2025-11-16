import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Button, Card } from '../components/ui';

import LanguageSwitcher from '../components/LanguageSwitcher';
import { supportedLanguages, getCurrentLanguage } from '../i18n';
import authService from '../utils/authService';
import onboardingManager from '../utils/onboardingManager';
import './Settings.css';

const Settings = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentLanguage = getCurrentLanguage();
  const currentLang = supportedLanguages[currentLanguage];
  const user = authService.getCurrentUser();

  const handleReplayTutorial = () => {
    onboardingManager.startManualTutorial();
    window.dispatchEvent(new CustomEvent('restartOnboarding'));
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    if (window.confirm(t('settings_logout_confirm'))) {
      try {
        await authService.signOut();
        navigate('/login');
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
  };

  const settingsSections = [
    {
      title: t('settings_language_section'),
      icon: '🌍',
      items: [
        {
          label: t('settings_current_language'),
          value: `${currentLang.flag} ${currentLang.nativeName}`,
          action: null,
          component: 'language-switcher'
        }
      ]
    },
    {
      title: t('settings_privacy_section'),
      icon: '🔒',
      items: [
        {
          label: t('settings_privacy_data'),
          description: 'Manage your privacy preferences and data',
          action: () => navigate('/privacy'),
          icon: '→'
        }
      ]
    },
    {
      title: 'Analytics Dashboard',
      icon: '📊',
      items: [
        {
          label: 'View Analytics',
          description: 'Healthcare provider analytics and insights',
          action: () => navigate('/analytics'),
          icon: '→'
        }
      ]
    },
    {
      title: t('settings_help_section'),
      icon: '❓',
      items: [
        {
          label: t('settings_replay_tutorial'),
          description: t('settings_replay_tutorial_desc'),
          action: handleReplayTutorial,
          icon: '🎓'
        }
      ]
    },
    {
      title: t('settings_account_section'),
      icon: '👤',
      items: [
        {
          label: t('settings_email'),
          value: user?.email || t('settings_not_available'),
          action: null,
          icon: '📧'
        },
        {
          label: t('settings_logout'),
          description: 'Sign out of your account',
          action: handleLogout,
          icon: '🚪',
          danger: true
        }
      ]
    },
    {
      title: t('settings_about_section'),
      icon: 'ℹ️',
      items: [
        {
          label: t('settings_app_name'),
          value: 'MedAdhere',
          action: null
        },
        {
          label: t('settings_version'),
          value: '1.0.0',
          action: null
        }
      ]
    }
  ];

  return (
    <div className="settings">
      {/* Header */}
      <div className="settings__header">
        <h1 className="settings__title">{t('settings_title')}</h1>
        <p className="settings__subtitle">
          {t('settings_description')}
        </p>
      </div>

      {/* Settings Sections */}
      <div className="settings__sections">
        {settingsSections.map((section, sectionIndex) => (
          <Card key={sectionIndex} className="settings-section">
            
              <div className="settings-section__header">
                <span className="settings-section__icon">{section.icon}</span>
                <h2 className="settings-section__title">{section.title}</h2>
              </div>

              <div className="settings-section__items">
                {section.items.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className={`settings-item ${item.danger ? 'settings-item--danger' : ''}`}
                  >
                    <div className="settings-item__content">
                      <div className="settings-item__label">
                        {item.icon && item.icon !== '→' && (
                          <span className="settings-item__icon">{item.icon}</span>
                        )}
                        <span>{item.label}</span>
                      </div>
                      {item.value && (
                        <div className="settings-item__value">{item.value}</div>
                      )}
                      {item.description && (
                        <div className="settings-item__description">{item.description}</div>
                      )}
                    </div>

                    {/* Language Switcher Component */}
                    {item.component === 'language-switcher' && (
                      <div className="settings-item__action">
                        <LanguageSwitcher compact={false} />
                      </div>
                    )}

                    {/* Action Button */}
                    {item.action && !item.component && (
                      <Button
                        onClick={item.action}
                        variant={item.danger ? 'secondary' : 'secondary'}
                        size="small"
                        className={item.danger ? 'settings-item__button--danger' : ''}
                      >
                        {item.icon === '→' ? t('settings_open') : item.icon}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Settings;
