import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Button, Select, Spinner, Alert } from '../components/ui';
import AdherenceTrendChart from '../components/analytics/AdherenceTrendChart';
import MedicationTypesChart from '../components/analytics/MedicationTypesChart';
import GeographicChart from '../components/analytics/GeographicChart';
import ADRReportsChart from '../components/analytics/ADRReportsChart';
import authService from '../utils/authService';
import './AnalyticsDashboard.css';

/**
 * Analytics Dashboard for Healthcare Providers
 * 
 * Displays aggregated, anonymized patient adherence data for:
 * - NGOs
 * - Clinics
 * - Hospitals
 * - Pharmacies
 * 
 * Features:
 * - Overall adherence metrics
 * - Adherence trends over time
 * - Medication type distribution
 * - Geographic distribution
 * - ADR reports analysis
 * - Date range filtering
 * - Data export functionality
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2, 4.3, 4.4, 5.1
 */
const AnalyticsDashboard = () => {
  const { t } = useTranslation();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('30'); // days
  const [analyticsData, setAnalyticsData] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  // Check if user has provider access
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  /**
   * Check if current user has healthcare provider access
   */
  useEffect(() => {
    const checkProviderAccess = async () => {
      try {
        const user = authService.getCurrentUser();
        
        if (!user) {
          setHasAccess(false);
          setCheckingAccess(false);
          return;
        }

        // TODO: Implement proper role-based access control
        // For now, allow all authenticated users to view analytics
        // In production, check user role/permissions from database
        setHasAccess(true);
        setCheckingAccess(false);
      } catch (err) {
        console.error('Error checking provider access:', err);
        setHasAccess(false);
        setCheckingAccess(false);
      }
    };

    checkProviderAccess();
  }, []);

  /**
   * Fetch analytics data from database
   */
  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Calculate date range
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      // Fetch aggregated data
      // TODO: Implement getAggregatedData in databaseService
      // For now, use mock data
      const mockData = generateMockAnalyticsData(parseInt(dateRange));
      
      setAnalyticsData(mockData);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate mock analytics data for development
   * TODO: Replace with real database queries
   */
  const generateMockAnalyticsData = (days) => {
    return {
      overview: {
        overallAdherence: 87.5,
        activePatients: 1234,
        avgMedicationsPerPatient: 3.2,
        totalADRReports: 456,
        adherenceTrend: 2.3 // percentage change
      },
      adherenceTrend: generateMockTrendData(days),
      medicationTypes: [
        { name: 'Antibiotics', value: 35, count: 432 },
        { name: 'Antihypertensives', value: 28, count: 346 },
        { name: 'Analgesics', value: 18, count: 222 },
        { name: 'Antidiabetics', value: 12, count: 148 },
        { name: 'Others', value: 7, count: 86 }
      ],
      geographicDistribution: [
        { country: 'Nigeria', patients: 567, adherence: 89 },
        { country: 'Kenya', patients: 234, adherence: 85 },
        { country: 'Ghana', patients: 189, adherence: 91 },
        { country: 'Tanzania', patients: 156, adherence: 83 },
        { country: 'Uganda', patients: 88, adherence: 87 }
      ],
      adrReports: [
        { type: 'Nausea', count: 89, severity: 'mild' },
        { type: 'Dizziness', count: 67, severity: 'mild' },
        { type: 'Headache', count: 54, severity: 'moderate' },
        { type: 'Fatigue', count: 43, severity: 'mild' },
        { type: 'Rash', count: 38, severity: 'moderate' },
        { type: 'Stomach Pain', count: 32, severity: 'moderate' }
      ]
    };
  };

  /**
   * Generate mock trend data
   */
  const generateMockTrendData = (days) => {
    const data = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Generate realistic adherence data with some variation
      const baseAdherence = 85;
      const variation = Math.random() * 15 - 5; // -5 to +10
      const adherence = Math.max(70, Math.min(100, baseAdherence + variation));
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        adherence: Math.round(adherence * 10) / 10
      });
    }
    
    return data;
  };

  /**
   * Handle date range change
   */
  const handleDateRangeChange = (e) => {
    setDateRange(e.target.value);
  };

  /**
   * Handle refresh button click
   */
  const handleRefresh = () => {
    fetchAnalyticsData();
  };

  /**
   * Handle data export
   */
  const handleExport = () => {
    if (!analyticsData) return;

    try {
      const dataStr = JSON.stringify(analyticsData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting data:', err);
      alert('Failed to export data');
    }
  };

  // Load data on mount and when date range changes
  useEffect(() => {
    if (hasAccess && !checkingAccess) {
      fetchAnalyticsData();
    }
  }, [dateRange, hasAccess, checkingAccess]);

  // Show loading state while checking access
  if (checkingAccess) {
    return (
      <div className="analytics-dashboard">
        <div className="analytics-dashboard__loading">
          <Spinner size="large" />
          <p>{t('checking_access') || 'Checking access...'}</p>
        </div>
      </div>
    );
  }

  // Show access denied message
  if (!hasAccess) {
    return (
      <div className="analytics-dashboard">
        <Card className="analytics-dashboard__access-denied">
          <div className="access-denied">
            <div className="access-denied__icon">🔒</div>
            <h2 className="access-denied__title">
              {t('analytics_access_denied') || 'Access Denied'}
            </h2>
            <p className="access-denied__message">
              {t('analytics_access_denied_message') || 
                'You do not have permission to view the analytics dashboard. This feature is available to healthcare providers only.'}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard page-enter">
      {/* Header */}
      <div className="analytics-dashboard__header">
        <div className="analytics-dashboard__title-section">
          <h1 className="analytics-dashboard__title">
            {t('analytics_dashboard') || 'Analytics Dashboard'}
          </h1>
          <p className="analytics-dashboard__subtitle">
            {t('analytics_subtitle') || 'Aggregated Patient Adherence Insights'}
          </p>
        </div>

        {/* Controls */}
        <div className="analytics-dashboard__controls">
          <Select
            value={dateRange}
            onChange={handleDateRangeChange}
            className="analytics-dashboard__date-range"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="180">Last 6 months</option>
            <option value="365">Last year</option>
          </Select>

          <Button
            variant="secondary"
            size="small"
            onClick={handleExport}
            disabled={!analyticsData || loading}
          >
            {t('export_data') || 'Export Data'}
          </Button>

          <Button
            variant="primary"
            size="small"
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? t('refreshing') || 'Refreshing...' : t('refresh') || 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Last Refresh Time */}
      {lastRefresh && (
        <div className="analytics-dashboard__last-refresh">
          {t('last_updated') || 'Last updated'}: {lastRefresh.toLocaleTimeString()}
        </div>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <div className="analytics-dashboard__loading">
          <Spinner size="large" />
          <p>{t('loading_analytics') || 'Loading analytics data...'}</p>
        </div>
      )}

      {/* Dashboard Content */}
      {!loading && analyticsData && (
        <div className="analytics-dashboard__content">
          {/* Metric Cards Section */}
          <div className="analytics-dashboard__metrics">
            <Card className="metric-card">
              <div className="metric-card__icon">📈</div>
              <div className="metric-card__content">
                <div className="metric-card__value">
                  {analyticsData.overview.overallAdherence}%
                </div>
                <div className="metric-card__label">
                  {t('overall_adherence') || 'Overall Adherence'}
                </div>
                {analyticsData.overview.adherenceTrend !== 0 && (
                  <div className={`metric-card__change ${analyticsData.overview.adherenceTrend > 0 ? 'positive' : 'negative'}`}>
                    {analyticsData.overview.adherenceTrend > 0 ? '↑' : '↓'} 
                    {Math.abs(analyticsData.overview.adherenceTrend)}%
                  </div>
                )}
              </div>
            </Card>

            <Card className="metric-card">
              <div className="metric-card__icon">👥</div>
              <div className="metric-card__content">
                <div className="metric-card__value">
                  {analyticsData.overview.activePatients.toLocaleString()}
                </div>
                <div className="metric-card__label">
                  {t('active_patients') || 'Active Patients'}
                </div>
              </div>
            </Card>

            <Card className="metric-card">
              <div className="metric-card__icon">💊</div>
              <div className="metric-card__content">
                <div className="metric-card__value">
                  {analyticsData.overview.avgMedicationsPerPatient}
                </div>
                <div className="metric-card__label">
                  {t('avg_medications') || 'Avg Medications/Patient'}
                </div>
              </div>
            </Card>

            <Card className="metric-card">
              <div className="metric-card__icon">⚠️</div>
              <div className="metric-card__content">
                <div className="metric-card__value">
                  {analyticsData.overview.totalADRReports}
                </div>
                <div className="metric-card__label">
                  {t('total_adr_reports') || 'Total ADR Reports'}
                </div>
              </div>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="analytics-dashboard__charts">
            <Card className="chart-card">
              <div className="chart-card__header">
                <h3 className="chart-card__title">
                  {t('adherence_trend') || 'Adherence Trend'}
                </h3>
                <p className="chart-card__subtitle">
                  {t('daily_adherence_rates') || 'Daily adherence rates over time'}
                </p>
              </div>
              <div className="chart-card__body">
                <AdherenceTrendChart 
                  data={analyticsData.adherenceTrend} 
                  height={300}
                />
              </div>
            </Card>

            <Card className="chart-card">
              <div className="chart-card__header">
                <h3 className="chart-card__title">
                  {t('medication_types') || 'Medication Types'}
                </h3>
                <p className="chart-card__subtitle">
                  {t('distribution_by_type') || 'Distribution by medication type'}
                </p>
              </div>
              <div className="chart-card__body">
                <MedicationTypesChart 
                  data={analyticsData.medicationTypes} 
                  height={300}
                />
              </div>
            </Card>

            <Card className="chart-card">
              <div className="chart-card__header">
                <h3 className="chart-card__title">
                  {t('geographic_distribution') || 'Geographic Distribution'}
                </h3>
                <p className="chart-card__subtitle">
                  {t('patients_by_country') || 'Patients by country'}
                </p>
              </div>
              <div className="chart-card__body">
                <GeographicChart 
                  data={analyticsData.geographicDistribution} 
                  height={300}
                />
              </div>
            </Card>

            <Card className="chart-card">
              <div className="chart-card__header">
                <h3 className="chart-card__title">
                  {t('adr_reports_by_type') || 'ADR Reports by Type'}
                </h3>
                <p className="chart-card__subtitle">
                  {t('common_side_effects') || 'Most common side effects'}
                </p>
              </div>
              <div className="chart-card__body">
                <ADRReportsChart 
                  data={analyticsData.adrReports} 
                  height={300}
                />
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
