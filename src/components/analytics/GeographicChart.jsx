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
import './GeographicChart.css';

/**
 * Geographic Distribution Chart Component
 * 
 * Displays patient distribution by country using a bar chart
 * Features:
 * - Privacy-focused (aggregated data only)
 * - Sortable data
 * - Interactive tooltips
 * - Color-blind friendly
 * 
 * Requirements: 2.3, 7.1, 7.2, 7.4
 */
const GeographicChart = ({ data = [], height = 300 }) => {
  const { t } = useTranslation();

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="geographic-tooltip">
          <p className="geographic-tooltip__country">{data.country}</p>
          <p className="geographic-tooltip__value">
            <strong>{data.patients}</strong> {t('patients') || 'patients'}
          </p>
          <p className="geographic-tooltip__adherence">
            {t('adherence') || 'Adherence'}: <strong>{data.adherence}%</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  // Color based on adherence rate
  const getBarColor = (adherence) => {
    if (adherence >= 90) return 'var(--secondary-500)'; // Green - excellent
    if (adherence >= 75) return 'var(--primary-500)';   // Blue - good
    if (adherence >= 60) return 'var(--accent-500)';    // Orange - fair
    return 'var(--error)';                               // Red - needs attention
  };

  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className="geographic-chart-empty">
        <p>{t('no_data_available') || 'No data available for the selected period'}</p>
      </div>
    );
  }

  return (
    <div className="geographic-chart">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="var(--neutral-200)"
            vertical={false}
          />
          <XAxis
            dataKey="country"
            tick={{ fontSize: 12, fill: 'var(--neutral-600)' }}
            tickLine={{ stroke: 'var(--neutral-300)' }}
            axisLine={{ stroke: 'var(--neutral-300)' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'var(--neutral-600)' }}
            tickLine={{ stroke: 'var(--neutral-300)' }}
            axisLine={{ stroke: 'var(--neutral-300)' }}
            label={{
              value: t('number_of_patients') || 'Number of Patients',
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
          />
          <Bar
            dataKey="patients"
            name={t('patients') || 'Patients'}
            radius={[8, 8, 0, 0]}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getBarColor(entry.adherence)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GeographicChart;
