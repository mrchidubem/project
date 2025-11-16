import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import './AdherenceTrendChart.css';

/**
 * Adherence Trend Chart Component
 * 
 * Displays adherence rates over time using a line chart
 * Features:
 * - Responsive design
 * - Interactive tooltips
 * - Color-blind friendly colors
 * - Smooth animations
 * 
 * Requirements: 2.2, 7.1, 7.2, 7.3, 7.4, 7.5
 */
const AdherenceTrendChart = ({ data = [], height = 300 }) => {
  const { t } = useTranslation();

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="adherence-tooltip">
          <p className="adherence-tooltip__label">{label}</p>
          <p className="adherence-tooltip__value">
            <span className="adherence-tooltip__dot" />
            {t('adherence') || 'Adherence'}: <strong>{payload[0].value}%</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className="adherence-chart-empty">
        <p>{t('no_data_available') || 'No data available for the selected period'}</p>
      </div>
    );
  }

  return (
    <div className="adherence-trend-chart">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="var(--neutral-200)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: 'var(--neutral-600)' }}
            tickLine={{ stroke: 'var(--neutral-300)' }}
            axisLine={{ stroke: 'var(--neutral-300)' }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: 'var(--neutral-600)' }}
            tickLine={{ stroke: 'var(--neutral-300)' }}
            axisLine={{ stroke: 'var(--neutral-300)' }}
            label={{
              value: t('adherence_rate') || 'Adherence Rate (%)',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: 12, fill: 'var(--neutral-600)' }
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              paddingTop: '20px',
              fontSize: '14px'
            }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="adherence"
            name={t('adherence_rate') || 'Adherence Rate'}
            stroke="var(--primary-500)"
            strokeWidth={3}
            dot={{
              fill: 'var(--primary-500)',
              strokeWidth: 2,
              r: 4,
              stroke: 'var(--neutral-0)'
            }}
            activeDot={{
              r: 6,
              fill: 'var(--primary-600)',
              stroke: 'var(--neutral-0)',
              strokeWidth: 2
            }}
            animationDuration={500}
            animationEasing="ease-in-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AdherenceTrendChart;
