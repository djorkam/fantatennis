import React from 'react';
import type { Player } from '../data/players';
import type { Team, Config } from '../types';
import { ROUNDS, TIER_COLORS } from '../constants';
import { RoundBadge } from '../ui';
import { getTeamPoints } from '../helpers';

export function LeaderboardTab({
  teams, players, results, config,
}: {
  teams: Team[];
  players: Player[];
  results: Record<string, string>;
  config: Config | null;
}) {
  const scheme = config?.points_scheme || {};
  const visible = config?.leaderboard_visible;
  const deadline = config?.submission_deadline ? new Date(config.submission_deadline) : null;
  const deadlinePassed = !!(deadline && new Date() > deadline);

  if (!visible && !deadlinePassed) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <div style={{ fontSize: 16, fontWeight: 500, color: '#444', marginBottom: 8 }}>
          Leaderboard hidden
        </div>
        <div style={{ fontSize: 13 }}>
          {teams.length} team{teams.length !== 1 ? 's' : ''} submitted so far.
          {deadline && <><br />Results visible after {deadline.toLocaleString()}</>}
        </div>
      </div>
    );
  }

  const ranked = teams
    .map(t => ({ ...t, pts: getTeamPoints(t, results, scheme) }))
    .sort((a, b) => b.pts - a.pts);

  const rankColors = [
    { bg: '#FAEEDA', color: '#633806' },
    { bg: '#F0F0EC', color: '#5F5E5A' },
    { bg: '#E6F1FB', color: '#0C447C' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {ROUNDS.filter(r => r !== 'R128').map(r => (
          <span key={r} style={{
            padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
            background: TIER_COLORS[r] + '22', color: TIER_COLORS[r],
            border: `1px solid ${TIER_COLORS[r]}44`,
          }}>
            {r} = {scheme[r] || 0}pts
          </span>
        ))}
      </div>

      <div style={{ background: '#fff', border: '0.5px solid #e8e8e8', borderRadius: 12, overflow: 'hidden' }}>
        {ranked.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#aaa', fontSize: 13 }}>
            No teams submitted yet
          </div>
        ) : ranked.map((t, i) => {
          const rc = rankColors[Math.min(i, 2)] || { bg: '#f5f5f0', color: '#888' };
          return (
            <div key={t.id} style={{ borderBottom: '0.5px solid #f5f5f5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px' }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: rc.bg, color: rc.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, flexShrink: 0,
                }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 5 }}>
                    {(t.player_ids || []).map(pid => {
                      const p = players.find(x => x.id === pid);
                      if (!p) return null;
                      const round = results[pid];
                      const pts = round ? (scheme[round] || 0) : 0;
                      return (
                        <span key={pid} style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 20,
                          background: round ? TIER_COLORS[round] + '22' : '#f5f5f0',
                          color: round ? TIER_COLORS[round] : '#666',
                          border: round ? `1px solid ${TIER_COLORS[round]}44` : 'none',
                          fontWeight: round ? 600 : 400,
                        }}>
                          {p.name}{round ? ` +${pts}` : ` ${p.price}cr`}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#1D9E75' }}>{t.pts}</div>
                  <div style={{ fontSize: 11, color: '#999' }}>points</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
