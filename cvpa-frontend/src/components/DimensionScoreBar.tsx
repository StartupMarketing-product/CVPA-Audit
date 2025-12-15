import { Box, Typography, LinearProgress } from '@mui/material';

interface DimensionScoreBarProps {
  label: string;
  score: number;
  weight: number;
}

export default function DimensionScoreBar({ label, score, weight }: DimensionScoreBarProps) {
  const getColor = (score: number): string => {
    if (score >= 90) return '#10B981';
    if (score >= 75) return '#3B82F6';
    if (score >= 60) return '#F59E0B';
    if (score >= 40) return '#F97316';
    return '#EF4444';
  };

  return (
    <Box mb={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="body1" fontWeight="medium">
          {label}
        </Typography>
        <Typography variant="body1" fontWeight="bold" color={getColor(score)}>
          {Math.round(score)}/100
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={score}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: '#E5E7EB',
          '& .MuiLinearProgress-bar': {
            backgroundColor: getColor(score),
            borderRadius: 4,
          },
        }}
      />
      <Typography variant="caption" color="text.secondary" mt={0.5}>
        Weight: {(weight * 100).toFixed(0)}% of overall score
      </Typography>
    </Box>
  );
}

