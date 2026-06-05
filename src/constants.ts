export const ROUNDS = ['R128', 'R64', 'R32', 'R16', 'QF', 'SF', 'F', 'W'];

export const ROUND_LABELS: Record<string, string> = {
  R128: 'Round 1 (R128)',
  R64:  'Round 2 (R64)',
  R32:  'Round 3 (R32)',
  R16:  'Round of 16',
  QF:   'Quarter-final',
  SF:   'Semi-final',
  F:    'Final',
  W:    'Winner',
};

export const TIER_COLORS: Record<string, string> = {
  W:    '#1D9E75',
  F:    '#5DCAA5',
  SF:   '#9FE1CB',
  QF:   '#0F6E56',
  R16:  '#185FA5',
  R32:  '#378ADD',
  R64:  '#85B7EB',
  R128: '#888780',
};
