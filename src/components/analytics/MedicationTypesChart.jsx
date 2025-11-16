import { useTranslation } from 'react-i18next';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';
import './MedicationTypesChart.css';

/**
 * Medication Types Chart Component
 * 
 * Displays medication distribution by type using a donut chart
 * Features:
 * - Color-blind friendly palette
 * - Interactive tooltips
 * - Percentage labels
 * - Smooth animations
 * 
 * Requirements: 2.2, 7.1, 7.2, 7.3, 7.4, 7.5
 */
const MedicationTypesChart = ({ data = [], height = 300 }) => {
  const { t } = useTranslation();

  // Color-blind friendly color palette
  const COLORS = [
    'var(--primary-500)',    // Blue
    'var(--secondary-500)',  // Green
    'var(--accent-500)',     // Orange
    '#9C27B0',               // Purple
    '#00BCD4',               // Cyan
    '#795548'                // Brown
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="medication-tooltip">
          <p className="medication-tooltip__name">{data.name}</p>
          <p className="medication-tooltip__value">
            <strong>{data.value}%</strong> ({data.count} {t('patients') || 'patients'})
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label for pie slices
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Only show label if percentage is significant enough
    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize="14"
        fontWeight="600"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className="medication-chart-empty">
        <p>{t('no_data_available') || 'No data available for the selected period'}</p>
      </div>
    );
  }

  return (
    <div className="medication-types-chart">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={100}
            innerRadius={60}
            fill="#8884d8"
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            wrapperStyle={{
              fontSize: '14px',
              paddingTop: '20px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MedicationTypesChart;
