import type { Team } from './types';

export function getPlayerPoints(
  pid: string,
  results: Record<string, string>,
  scheme: Record<string, number>
): number {
  const r = results[pid];
  return r ? (scheme[r] || 0) : 0;
}

export function getTeamPoints(
  team: Team,
  results: Record<string, string>,
  scheme: Record<string, number>
): number {
  return (team.player_ids || []).reduce(
    (s, pid) => s + getPlayerPoints(pid, results, scheme),
    0
  );
}
