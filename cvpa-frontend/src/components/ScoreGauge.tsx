import { Box, Typography } from '@mui/material';

interface ScoreGaugeProps {
  score: number;
  size?: number;
}

export default function ScoreGauge({ score, size = 150 }: ScoreGaugeProps) {
  const getColor = (score: number): string => {
    if (score >= 90) return '#10B981'; // Green
    if (score >= 75) return '#3B82F6'; // Blue
    if (score >= 60) return '#F59E0B'; // Amber
    if (score >= 40) return '#F97316'; // Orange
    return '#EF4444'; // Red
  };

  const getLabel = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Moderate';
    if (score >= 40) return 'Poor';
    return 'Critical';
  };

  const color = getColor(score);
  const circumference = 2 * Math.PI * (size / 2 - 10);
  const offset = circumference - (score / 100) * circumference;

  return (
    <Box position="relative" display="inline-flex" alignItems="center" justifyContent="center">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 10}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="8"
        />
        {/* Score circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 10}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <Box
        position="absolute"
        display="flex"
        flexDirection="column"
        alignItems="center"
      >
        <Typography variant="h4" component="div" fontWeight="bold" color={color}>
          {Math.round(score)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {getLabel(score)}
        </Typography>
      </Box>
    </Box>
  );
}

