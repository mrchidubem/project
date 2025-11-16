import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Button, Card, Input, Alert } from '../components/ui';

import privacyManager from '../utils/privacyManager';
import authService from '../utils/authService';
import './PrivacySettings.css';

const PrivacySettings = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const privacySettings = await privacyManager.getPrivacySettings();
      setSettings(privacySettings);
    } catch (err) {
      console.error('Failed to load privacy settings:', err);
      setError(t('privacy_load_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (field) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const updatedSettings = {
        ...settings,
        [field]: !settings[field]
      };

      await privacyManager.updatePrivacySettings(updatedSettings);
      setSettings(updatedSettings);
      setSuccess(t('privacy_settings_saved'));

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to update privacy settings:', err);
      setError(t('privacy_update_error'));
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      setExporting(true);
      setError(null);
      setSuccess(null);

      await privacyManager.downloadUserData();
      setSuccess(t('privacy_export_success'));

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to export data:', err);
      setError(t('privacy_export_error'));
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setError(t('privacy_delete_confirm_mismatch'));
      return;
    }

    try {
      setDeleting(true);
      setError(null);

      await privacyManager.deleteAccountCompletely();
      
      await authService.signOut();
      navigate('/login');
    } catch (err) {
      console.error('Failed to delete account:', err);
      setError(t('privacy_delete_error'));
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="privacy-settings__loading">
        {t('loading')}...
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="privacy-settings__error">
        {t('privacy_load_error')}
      </div>
    );
  }

  return (
    <div className="privacy-settings">
      {/* Header */}
      <div className="privacy-settings__header">
        <h1 className="privacy-settings__title">🔒 {t('privacy_settings_title')}</h1>
        <p className="privacy-settings__subtitle">
          {t('privacy_settings_description')}
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert variant="success" className="privacy-settings__alert">
          ✓ {success}
        </Alert>
      )}

      {error && (
        <Alert variant="error" className="privacy-settings__alert">
          ⚠ {error}
        </Alert>
      )}

      {/* Data Sharing Controls */}
      <Card className="privacy-section">
        
          <div className="privacy-section__header">
            <h2 className="privacy-section__title">
              {t('privacy_data_sharing_title')}
            </h2>
          </div>

          <div className="privacy-section__items">
            {/* Analytics Consent */}
            <div className="privacy-toggle">
              <div className="privacy-toggle__content">
                <div className="privacy-toggle__label">
                  {t('privacy_share_analytics')}
                </div>
                <div className="privacy-toggle__description">
                  {t('privacy_share_analytics_description')}
                </div>
              </div>
              <button
                onClick={() => handleToggle('shareAnalytics')}
                disabled={saving}
                className={`toggle-switch ${settings.shareAnalytics ? 'toggle-switch--active' : ''}`}
                aria-label={t('privacy_toggle_analytics')}
              >
                <div className="toggle-switch__slider" />
              </button>
            </div>

            {/* Provider Sharing Consent */}
            <div className="privacy-toggle">
              <div className="privacy-toggle__content">
                <div className="privacy-toggle__label">
                  {t('privacy_share_providers')}
                </div>
                <div className="privacy-toggle__description">
                  {t('privacy_share_providers_description')}
                </div>
              </div>
              <button
                onClick={() => handleToggle('shareWithProviders')}
                disabled={saving}
                className={`toggle-switch ${settings.shareWithProviders ? 'toggle-switch--active' : ''}`}
                aria-label={t('privacy_toggle_providers')}
              >
                <div className="toggle-switch__slider" />
              </button>
            </div>
          </div>
        
      </Card>

      {/* Data Export */}
      <Card className="privacy-section">
        
          <div className="privacy-section__header">
            <h2 className="privacy-section__title">
              {t('privacy_data_export_title')}
            </h2>
            <p className="privacy-section__description">
              {t('privacy_data_export_description')}
            </p>
          </div>

          <Button
            onClick={handleExportData}
            disabled={exporting}
            variant="primary"
            loading={exporting}
          >
            {exporting ? t('privacy_exporting') : t('privacy_export_data')}
          </Button>
        
      </Card>

      {/* Privacy Policy */}
      <Card className="privacy-section privacy-section--info">
        
          <div className="privacy-section__header">
            <h2 className="privacy-section__title">
              {t('privacy_policy_title')}
            </h2>
            <p className="privacy-section__description">
              {t('privacy_policy_description')}
            </p>
          </div>

          <ul className="privacy-policy__list">
            <li>{t('privacy_policy_point_1')}</li>
            <li>{t('privacy_policy_point_2')}</li>
            <li>{t('privacy_policy_point_3')}</li>
            <li>{t('privacy_policy_point_4')}</li>
          </ul>
        
      </Card>

      {/* Danger Zone - Account Deletion */}
      <Card className="privacy-section privacy-section--danger">
        
          <div className="privacy-section__header">
            <h2 className="privacy-section__title">
              ⚠️ {t('privacy_danger_zone')}
            </h2>
            <p className="privacy-section__description">
              {t('privacy_delete_warning')}
            </p>
          </div>

          {!showDeleteConfirm ? (
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="secondary"
              className="danger-button"
            >
              {t('privacy_delete_account')}
            </Button>
          ) : (
            <div className="delete-confirm">
              <p className="delete-confirm__prompt">
                {t('privacy_delete_confirm_prompt')}
              </p>
              <Input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="delete-confirm__input"
              />
              <div className="delete-confirm__actions">
                <Button
                  onClick={handleDeleteAccount}
                  disabled={deleting || deleteConfirmText !== 'DELETE'}
                  variant="secondary"
                  className="danger-button"
                  loading={deleting}
                >
                  {deleting ? t('privacy_deleting') : t('privacy_confirm_delete')}
                </Button>
                <Button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}
                  disabled={deleting}
                  variant="secondary"
                >
                  {t('cancel')}
                </Button>
              </div>
            </div>
          )}
        
      </Card>
    </div>
  );
};

export default PrivacySettings;
