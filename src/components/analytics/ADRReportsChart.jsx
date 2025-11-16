import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import './ADRReportsChart.css';

/**
 * ADR Reports Chart Component
 * 
 * Displays ADR reports by type using a horizontal bar chart
 * Features:
 * - Color coding by severity
 * - Interactive tooltips
 * - Sorted by frequency
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */
const ADRReportsChart = ({ data = [], height = 300 }) => {
  const { t } = useTranslation();

  // Color based on severity
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'mild':
        return 'var(--secondary-500)'; // Green
      case 'moderate':
        return 'var(--accent-500)';    // Orange
      case 'severe':
        return 'var(--error)';         // Red
      default:
        return 'var(--neutral-500)';
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="adr-tooltip">
          <p className="adr-tooltip__type">{data.type}</p>
          <p className="adr-tooltip__count">
            <strong>{data.count}</strong> {t('reports') || 'reports'}
          </p>
          <p className="adr-tooltip__severity">
            {t('severity') || 'Severity'}: 
            <span className={`severity-badge severity-badge--${data.severity}`}>
              {data.severity.charAt(0).toUpperCase() + data.severity.slice(1)}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className="adr-chart-empty">
        <p>{t('no_data_available') || 'No data available for the selected period'}</p>
      </div>
    );
  }

  return (
    <div className="adr-reports-chart">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="var(--neutral-200)"
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={{ fontSize: 12, fill: 'var(--neutral-600)' }}
            tickLine={{ stroke: 'var(--neutral-300)' }}
            axisLine={{ stroke: 'var(--neutral-300)' }}
            label={{
              value: t('number_of_reports') || 'Number of Reports',
              position: 'insideBottom',
              offset: -5,
              style: { fontSize: 12, fill: 'var(--neutral-600)' }
            }}
          />
          <YAxis
            type="category"
            dataKey="type"
            tick={{ fontSize: 12, fill: 'var(--neutral-600)' }}
            tickLine={{ stroke: 'var(--neutral-300)' }}
            axisLine={{ stroke: 'var(--neutral-300)' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              paddingTop: '20px',
              fontSize: '14px'
            }}
          />
          <Bar
            dataKey="count"
            name={t('reports') || 'Reports'}
            radius={[0, 8, 8, 0]}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getSeverityColor(entry.severity)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ADRReportsChart;
