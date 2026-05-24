import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { RG25_PLAYERS } from './data/players';
import type { Player } from './data/players';

// ─── Constants ────────────────────────────────────────────────────────

const ROUNDS = ['R128', 'R64', 'R32', 'R16', 'QF', 'SF', 'F', 'W'];

const ROUND_LABELS: Record<string, string> = {
  R128: 'Round 1 (R128)',
  R64:  'Round 2 (R64)',
  R32:  'Round 3 (R32)',
  R16:  'Round of 16',
  QF:   'Quarter-final',
  SF:   'Semi-final',
  F:    'Final',
  W:    'Winner',
};

const TIER_COLORS: Record<string, string> = {
  W:    '#1D9E75',
  F:    '#5DCAA5',
  SF:   '#9FE1CB',
  QF:   '#0F6E56',
  R16:  '#185FA5',
  R32:  '#378ADD',
  R64:  '#85B7EB',
  R128: '#888780',
};

// ─── Password policy ─────────────────────────────────────────────────

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD as string;

function validatePassword(pw: string): string | null {
  if (pw.length < 8)                          return 'At least 8 characters required';
  if (!/[A-Z]/.test(pw))                      return 'At least one uppercase letter required';
  if (!/[0-9]/.test(pw))                      return 'At least one number required';
  if (!/[!@#$%^&*]/.test(pw))                return 'At least one special character required (!@#$%^&*)';
  return null;
}

// ─── Types ────────────────────────────────────────────────────────────

interface Team {
  id: string;
  name: string;
  player_ids: string[];
  created_at: string;
}

interface Config {
  id: number;
  tourney_name: string;
  budget_cap: number;
  points_scheme: Record<string, number>;
  submission_deadline: string | null;
  leaderboard_visible: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────

function getPlayerPoints(
  pid: string,
  results: Record<string, string>,
  scheme: Record<string, number>
): number {
  const r = results[pid];
  return r ? (scheme[r] || 0) : 0;
}

function getTeamPoints(
  team: Team,
  results: Record<string, string>,
  scheme: Record<string, number>
): number {
  return (team.player_ids || []).reduce((s, pid) => s + getPlayerPoints(pid, results, scheme), 0);
}

// ─── Shared UI components ─────────────────────────────────────────────

function Toast({ msg, ok, onDone }: { msg: string; ok: boolean; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div style={{
      position: 'fixed', top: 16, right: 16, padding: '10px 18px',
      borderRadius: 8, background: ok ? '#1D9E75' : '#E24B4A',
      color: '#fff', fontWeight: 500, fontSize: 13, zIndex: 9999,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    }}>
      {msg}
    </div>
  );
}

function Btn({
  primary, danger, small, onClick, disabled, children, style = {},
}: {
  primary?: boolean; danger?: boolean; small?: boolean;
  onClick: () => void; disabled?: boolean;
  children: React.ReactNode; style?: React.CSSProperties;
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: small ? '5px 12px' : '8px 16px',
      borderRadius: 8, border: '0.5px solid',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: small ? 12 : 13, fontWeight: 500,
      opacity: disabled ? 0.5 : 1,
      borderColor: primary ? '#0F6E56' : danger ? '#A32D2D' : '#ddd',
      background: primary ? '#1D9E75' : danger ? '#FCEBEB' : 'transparent',
      color: primary ? '#fff' : danger ? '#A32D2D' : '#444',
      ...style,
    }}>
      {children}
    </button>
  );
}

function RoundBadge({ round }: { round?: string }) {
  if (!round) return null;
  const color = TIER_COLORS[round] || '#888';
  return (
    <span style={{
      display: 'inline-block', padding: '1px 7px', borderRadius: 20,
      fontSize: 10, fontWeight: 600,
      background: color + '22', color, border: `1px solid ${color}44`,
    }}>
      {ROUND_LABELS[round]}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#fff', border: '0.5px solid #e8e8e8',
      borderRadius: 12, padding: 16, marginBottom: 16,
    }}>
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '7px 10px', borderRadius: 8,
  border: '0.5px solid #ccc', fontSize: 13, boxSizing: 'border-box',
};

// ─── Admin password gate ──────────────────────────────────────────────

function AdminGate({ onUnlock }: { onUnlock: () => void }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');

  function attempt() {
    // Validate policy first
    const policyError = validatePassword(pw);
    if (policyError) { setError(policyError); return; }
    // Check against env var
    if (pw !== ADMIN_PASSWORD) {
      setError('Wrong password');
      setPw('');
      return;
    }
    onUnlock();
  }

  return (
    <div style={{
      maxWidth: 360, margin: '60px auto', padding: 32,
      background: '#fff', border: '0.5px solid #e8e8e8',
      borderRadius: 16, textAlign: 'center',
    }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🔐</div>
      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Admin access</div>
      <div style={{ fontSize: 12, color: '#999', marginBottom: 20 }}>
        Enter the admin password to continue
      </div>
      <input
        type="password"
        value={pw}
        onChange={e => { setPw(e.target.value); setError(''); }}
        onKeyDown={e => e.key === 'Enter' && attempt()}
        placeholder="Password"
        style={{ ...inputStyle, marginBottom: 8, textAlign: 'center', letterSpacing: 2 }}
        autoFocus
      />
      {error && (
        <div style={{ fontSize: 12, color: '#E24B4A', marginBottom: 8 }}>{error}</div>
      )}
      <div style={{ fontSize: 11, color: '#bbb', marginBottom: 16 }}>
        Min 8 chars · uppercase · number · special char
      </div>
      <Btn primary onClick={attempt} style={{ width: '100%' }}>
        Unlock admin
      </Btn>
    </div>
  );
}

// ─── Pick Tab ─────────────────────────────────────────────────────────

function PickTab({
  players, config, results, toast, onSubmit,
}: {
  players: Player[];
  config: Config | null;
  results: Record<string, string>;
  toast: (msg: string, ok?: boolean) => void;
  onSubmit: () => void;
}) {
  const [teamName, setTeamName] = useState('');
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('seed');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const scheme = config?.points_scheme || {};
  const budgetCap = config?.budget_cap || 500;
  const deadline = config?.submission_deadline ? new Date(config.submission_deadline) : null;
  const isLocked = !!(deadline && new Date() > deadline);

  async function loadMyTeam(name: string) {
    if (!name.trim()) { toast('Enter your team name first', false); return; }
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('name', name.trim())
      .maybeSingle();
    if (error) { toast('Error loading team: ' + error.message, false); return; }
    if (data) {
      setPickedIds(data.player_ids || []);
      setSubmitted(true);
      toast('Your previous picks loaded!');
    } else {
      toast('No team found with that name — start picking!', false);
    }
  }

  const spent = pickedIds.reduce((s, id) => {
    const p = players.find(x => x.id === id);
    return s + (p ? p.price : 0);
  }, 0);
  const over = spent > budgetCap;
  const pct = Math.min(100, Math.round((spent / budgetCap) * 100));

  function togglePlayer(pid: string) {
    if (isLocked) { toast('Submissions are closed!', false); return; }
    const idx = pickedIds.indexOf(pid);
    if (idx >= 0) {
      setPickedIds(pickedIds.filter(x => x !== pid));
      setSubmitted(false);
    } else {
      if (pickedIds.length >= 8) { toast('Max 8 players!', false); return; }
      const p = players.find(x => x.id === pid);
      if (!p) return;
      if (spent + p.price > budgetCap) { toast('Over budget!', false); return; }
      setPickedIds([...pickedIds, pid]);
      setSubmitted(false);
    }
  }

  async function submit() {
    if (!teamName.trim()) { toast('Enter your team name first!', false); return; }
    if (pickedIds.length !== 8) { toast('Pick exactly 8 players!', false); return; }
    if (over) { toast('You are over budget!', false); return; }
    setLoading(true);
    const { error } = await supabase
      .from('teams')
      .upsert({ name: teamName.trim(), player_ids: pickedIds }, { onConflict: 'name' });
    setLoading(false);
    if (error) { toast('Error saving: ' + error.message, false); return; }
    setSubmitted(true);
    toast('Team submitted! 🎾');
    onSubmit();
  }

  let filtered = players.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.country || '').toLowerCase().includes(search.toLowerCase())
  );
  if (sortBy === 'seed')       filtered = [...filtered].sort((a, b) => (a.seed || 999) - (b.seed || 999));
  if (sortBy === 'price_desc') filtered = [...filtered].sort((a, b) => b.price - a.price);
  if (sortBy === 'price_asc')  filtered = [...filtered].sort((a, b) => a.price - b.price);

  return (
    <div>
      {isLocked && (
        <div style={{
          background: '#FAEEDA', border: '0.5px solid #FAC775',
          borderRadius: 8, padding: '10px 14px', marginBottom: 14,
          fontSize: 13, color: '#633806',
        }}>
          🔒 Submissions closed — deadline passed.
        </div>
      )}

      <Section title="Your team">
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <input
            value={teamName}
            onChange={e => setTeamName(e.target.value)}
            placeholder="Your name / team name…"
            style={{ flex: 1, minWidth: 180, padding: '8px 12px', borderRadius: 8, border: '0.5px solid #ccc', fontSize: 13 }}
          />
          <Btn onClick={() => loadMyTeam(teamName)}>Load my picks</Btn>
        </div>

        {/* Budget bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#f0f0f0', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: pct + '%', borderRadius: 3,
              background: over ? '#E24B4A' : '#1D9E75', transition: 'width 0.3s',
            }} />
          </div>
          <span style={{
            fontSize: 13, fontWeight: 600,
            color: over ? '#E24B4A' : '#1D9E75',
            minWidth: 90, textAlign: 'right',
          }}>
            {spent} / {budgetCap} cr
          </span>
        </div>
        <div style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>
          {pickedIds.length}/8 players selected
          {over && <span style={{ color: '#E24B4A', marginLeft: 8 }}>⚠ Over budget!</span>}
        </div>

        {/* Team slots */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 8, marginBottom: 14,
        }}>
          {Array.from({ length: 8 }).map((_, i) => {
            const pid = pickedIds[i];
            const p = pid ? players.find(x => x.id === pid) : null;
            const round = pid ? results[pid] : null;
            const pts = round ? (scheme[round] || 0) : 0;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                borderRadius: 8, border: '0.5px solid',
                borderStyle: p ? 'solid' : 'dashed',
                borderColor: p ? '#9FE1CB' : '#ddd',
                background: p ? '#fff' : 'transparent',
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', background: '#f0f0f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, color: '#999', flexShrink: 0,
                }}>{i + 1}</div>
                {p ? (
                  <>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 500, fontSize: 12,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: '#999' }}>
                        {p.price}cr{round ? ` · +${pts}pts` : ''}
                      </div>
                    </div>
                    {!isLocked && (
                      <button
                        onClick={() => togglePlayer(p.id)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ccc', fontSize: 16 }}
                      >×</button>
                    )}
                  </>
                ) : (
                  <span style={{ fontSize: 12, color: '#ccc' }}>Empty</span>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Btn
            primary
            onClick={submit}
            disabled={loading || isLocked || pickedIds.length !== 8 || over}
          >
            {loading ? 'Saving…' : submitted ? '✓ Saved' : '🎾 Submit team'}
          </Btn>
          {deadline && (
            <span style={{ fontSize: 12, color: '#999' }}>
              Deadline: {deadline.toLocaleString()}
            </span>
          )}
        </div>
      </Section>

      {/* Player roster */}
      <Section title={`Player roster (${players.length})`}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search player or country…"
            style={{ flex: 1, minWidth: 160, padding: '7px 12px', borderRadius: 8, border: '0.5px solid #ccc', fontSize: 13 }}
          />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{ padding: '7px 10px', borderRadius: 8, border: '0.5px solid #ccc', fontSize: 13 }}
          >
            <option value="seed">By seed</option>
            <option value="price_desc">Price ↓</option>
            <option value="price_asc">Price ↑</option>
          </select>
        </div>
        <div style={{ maxHeight: 460, overflowY: 'auto', border: '0.5px solid #f0f0f0', borderRadius: 8 }}>
          {filtered.map(p => {
            const inTeam = pickedIds.includes(p.id);
            const round = results[p.id];
            const pts = round ? (scheme[round] || 0) : 0;
            return (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                borderBottom: '0.5px solid #f8f8f8',
                background: inTeam ? '#E1F5EE' : 'transparent',
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', background: '#f5f5f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, color: '#888', flexShrink: 0, fontWeight: 500,
                }}>
                  {p.seed || '—'}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 500, fontSize: 13 }}>{p.name}</span>
                  <span style={{ fontSize: 11, color: '#aaa', marginLeft: 6 }}>{p.country}</span>
                  {round && <span style={{ marginLeft: 6 }}><RoundBadge round={round} /></span>}
                </div>
                {round && (
                  <span style={{ fontSize: 12, color: '#1D9E75', fontWeight: 600 }}>+{pts}pts</span>
                )}
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0F6E56', minWidth: 46, textAlign: 'right' }}>
                  {p.price}cr
                </span>
                {!isLocked && (
                  <Btn small onClick={() => togglePlayer(p.id)} style={{
                    borderColor: inTeam ? '#A32D2D' : '#1D9E75',
                    color: inTeam ? '#A32D2D' : '#1D9E75',
                    background: inTeam ? '#FCEBEB' : '#E1F5EE',
                  }}>
                    {inTeam ? 'Remove' : 'Pick'}
                  </Btn>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: '#aaa', fontSize: 13 }}>
              No players found
            </div>
          )}
        </div>
        <div style={{ fontSize: 11, color: '#bbb', marginTop: 6, textAlign: 'right' }}>
          {filtered.length} of {players.length} players shown
        </div>
      </Section>
    </div>
  );
}

// ─── Leaderboard Tab ──────────────────────────────────────────────────

function LeaderboardTab({
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
          {deadline && (
            <><br />Results visible after {deadline.toLocaleString()}</>
          )}
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
      {/* Points scheme reference */}
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
        ) : (
          ranked.map((t, i) => {
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
          })
        )}
      </div>
    </div>
  );
}

// ─── Admin Tab ────────────────────────────────────────────────────────

function AdminTab({
  players, setPlayers, config, setConfig,
  results, setResults, teams, setTeams, toast,
}: {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  config: Config | null;
  setConfig: React.Dispatch<React.SetStateAction<Config | null>>;
  results: Record<string, string>;
  setResults: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  teams: Team[];
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
  toast: (msg: string, ok?: boolean) => void;
}) {
  const [localScheme, setLocalScheme] = useState<Record<string, number>>(config?.points_scheme || {});
  const [newPlayer, setNewPlayer] = useState({ name: '', country: '', price: '' });
  const [playerSearch, setPlayerSearch] = useState('');
  const [saving, setSaving] = useState(false);

  async function saveConfig(updates: Partial<Config>) {
    setSaving(true);
    const newConfig = { ...config, ...updates } as Config;
    const { error } = await supabase.from('config').update(newConfig).eq('id', 1);
    setSaving(false);
    if (error) { toast('Error: ' + error.message, false); return; }
    setConfig(newConfig);
    toast('Saved!');
  }

  async function saveScheme() {
    await saveConfig({ points_scheme: localScheme });
  }

  async function loadRG25() {
    if (players.length > 0 && !window.confirm(`Replace all ${players.length} existing players with the RG25 draw (128 players)?`)) return;
    setSaving(true);
    await supabase.from('players').delete().neq('id', '__none__');
    const { error } = await supabase.from('players').insert(RG25_PLAYERS);
    setSaving(false);
    if (error) { toast('Error loading draw: ' + error.message, false); return; }
    setPlayers(RG25_PLAYERS);
    toast('Roland Garros 2025 draw loaded! (128 players)');
  }

  async function addPlayer() {
    if (!newPlayer.name || !newPlayer.price) { toast('Name and price required', false); return; }
    const p: Player = {
      id: 'p' + Date.now(),
      name: newPlayer.name.trim(),
      country: newPlayer.country.trim() || '',
      seed: null,
      price: +newPlayer.price,
    };
    const { error } = await supabase.from('players').insert(p);
    if (error) { toast('Error: ' + error.message, false); return; }
    setPlayers(prev => [...prev, p]);
    setNewPlayer({ name: '', country: '', price: '' });
    toast('Player added');
  }

  async function removePlayer(id: string) {
    if (!window.confirm('Remove this player?')) return;
    const { error } = await supabase.from('players').delete().eq('id', id);
    if (error) { toast('Error: ' + error.message, false); return; }
    setPlayers(prev => prev.filter(p => p.id !== id));
    toast('Player removed');
  }

  async function deleteTeam(id: string, name: string) {
    if (!window.confirm(`Delete team "${name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from('teams').delete().eq('id', id);
    if (error) { toast('Error: ' + error.message, false); return; }
    setTeams(prev => prev.filter(t => t.id !== id));
    toast(`Team "${name}" deleted`);
  }

  async function setResult(pid: string, round: string) {
    if (!round) {
      await supabase.from('results').delete().eq('player_id', pid);
      setResults(prev => { const n = { ...prev }; delete n[pid]; return n; });
    } else {
      await supabase.from('results').upsert({ player_id: pid, round }, { onConflict: 'player_id' });
      setResults(prev => ({ ...prev, [pid]: round }));
    }
  }

  const filteredPlayers = players.filter(p =>
    p.name.toLowerCase().includes(playerSearch.toLowerCase()) ||
    (p.country || '').toLowerCase().includes(playerSearch.toLowerCase())
  );

  return (
    <div>
      {/* Tournament settings */}
      <Section title="Tournament settings">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <Field label="Tournament name">
            <input
              defaultValue={config?.tourney_name}
              onBlur={e => saveConfig({ tourney_name: e.currentTarget.value })}
              style={inputStyle}
            />
          </Field>
          <Field label="Budget cap (credits)">
            <input
              type="number"
              defaultValue={config?.budget_cap}
              onBlur={e => saveConfig({ budget_cap: +e.currentTarget.value })}
              style={inputStyle}
            />
          </Field>
          <Field label="Submission deadline">
            <input
              type="datetime-local"
              defaultValue={config?.submission_deadline?.slice(0, 16)}
              onBlur={e => saveConfig({
                submission_deadline: e.currentTarget.value
                  ? new Date(e.currentTarget.value).toISOString()
                  : null,
              })}
              style={inputStyle}
            />
          </Field>
          <Field label="Leaderboard visibility">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
              <input
                type="checkbox"
                id="lb-visible"
                checked={!!config?.leaderboard_visible}
                onChange={e => saveConfig({ leaderboard_visible: e.target.checked })}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <label htmlFor="lb-visible" style={{ fontSize: 13, cursor: 'pointer' }}>
                {config?.leaderboard_visible ? '✅ Visible to all users' : '🔒 Hidden from users'}
              </label>
            </div>
          </Field>
        </div>
        <div style={{ fontSize: 12, color: '#999' }}>Fields save automatically on blur (click away)</div>
      </Section>

      {/* Points scheme */}
      <Section title="Points scheme">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 8, marginBottom: 12,
        }}>
          {ROUNDS.map(r => (
            <div key={r} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', background: '#f8f8f5', borderRadius: 8,
            }}>
              <span style={{ fontSize: 12, color: TIER_COLORS[r], fontWeight: 700, flex: 1 }}>{r}</span>
              <input
                type="number"
                value={localScheme[r] ?? 0}
                onChange={e => setLocalScheme(s => ({ ...s, [r]: +e.currentTarget.value }))}
                style={{ width: 56, textAlign: 'center', padding: '4px 6px', borderRadius: 6, border: '0.5px solid #ddd', fontSize: 13 }}
              />
              <span style={{ fontSize: 11, color: '#999' }}>pts</span>
            </div>
          ))}
        </div>
        <Btn primary onClick={saveScheme} disabled={saving}>Save scheme</Btn>
      </Section>

      {/* Players */}
      <Section title={`Players (${players.length})`}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <input
            value={newPlayer.name}
            onChange={e => setNewPlayer(s => ({ ...s, name: e.target.value }))}
            placeholder="Name"
            style={{ flex: 2, minWidth: 120, padding: '7px 10px', borderRadius: 8, border: '0.5px solid #ccc', fontSize: 13 }}
          />
          <input
            value={newPlayer.country}
            onChange={e => setNewPlayer(s => ({ ...s, country: e.target.value }))}
            placeholder="CTY"
            style={{ width: 70, padding: '7px 10px', borderRadius: 8, border: '0.5px solid #ccc', fontSize: 13 }}
          />
          <input
            type="number"
            value={newPlayer.price}
            onChange={e => setNewPlayer(s => ({ ...s, price: e.target.value }))}
            placeholder="Price"
            style={{ width: 80, padding: '7px 10px', borderRadius: 8, border: '0.5px solid #ccc', fontSize: 13 }}
          />
          <Btn primary onClick={addPlayer}>+ Add</Btn>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <Btn onClick={loadRG25} disabled={saving}>⬇ Load RG25 draw (128 players)</Btn>
        </div>
        <input
          value={playerSearch}
          onChange={e => setPlayerSearch(e.target.value)}
          placeholder="Search players…"
          style={{ ...inputStyle, marginBottom: 8 }}
        />
        <div style={{ maxHeight: 300, overflowY: 'auto', border: '0.5px solid #eee', borderRadius: 8 }}>
          {filteredPlayers.map(p => (
            <div key={p.id} style={{
              display: 'flex', gap: 8, alignItems: 'center',
              padding: '7px 12px', borderBottom: '0.5px solid #f8f8f8',
            }}>
              <span style={{ width: 24, fontSize: 11, color: '#aaa', textAlign: 'center', flexShrink: 0 }}>
                {p.seed || '—'}
              </span>
              <span style={{ flex: 1, fontSize: 13 }}>
                {p.name} <span style={{ color: '#bbb', fontSize: 11 }}>{p.country}</span>
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0F6E56' }}>{p.price}cr</span>
              <Btn small danger onClick={() => removePlayer(p.id)}>✕</Btn>
            </div>
          ))}
          {filteredPlayers.length === 0 && (
            <div style={{ padding: 16, color: '#aaa', textAlign: 'center', fontSize: 13 }}>
              No players. Load the RG25 draw or add manually.
            </div>
          )}
        </div>
      </Section>

      {/* Round results */}
      <Section title="Round results">
        <div style={{ fontSize: 12, color: '#999', marginBottom: 10 }}>
          Mark which round each player reached. Points update for all teams instantly.
        </div>
        <div style={{ maxHeight: 420, overflowY: 'auto' }}>
          {players.map(p => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '7px 0', borderBottom: '0.5px solid #f8f8f8',
            }}>
              <div style={{ flex: 1, fontSize: 13 }}>
                {p.name} <span style={{ color: '#ccc', fontSize: 11 }}>{p.country}</span>
              </div>
              <select
                value={results[p.id] || ''}
                onChange={e => setResult(p.id, e.currentTarget.value)}
                style={{ padding: '4px 8px', borderRadius: 6, border: '0.5px solid #ddd', fontSize: 12 }}
              >
                <option value="">No result</option>
                {ROUNDS.map(r => (
                  <option key={r} value={r}>
                    {ROUND_LABELS[r]} (+{localScheme[r] || 0}pts)
                  </option>
                ))}
              </select>
              {results[p.id] && (
                <span style={{ fontSize: 12, color: '#1D9E75', fontWeight: 700, minWidth: 40 }}>
                  +{localScheme[results[p.id]] || 0}
                </span>
              )}
            </div>
          ))}
          {players.length === 0 && (
            <div style={{ padding: 16, color: '#aaa', fontSize: 13 }}>Load players first.</div>
          )}
        </div>
      </Section>

      {/* Teams */}
      <Section title={`Teams submitted (${teams.length})`}>
        {teams.length === 0 ? (
          <div style={{ color: '#aaa', fontSize: 13 }}>No teams yet.</div>
        ) : (
          teams.map(t => (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 0', borderBottom: '0.5px solid #f8f8f8',
            }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 500, fontSize: 13 }}>{t.name}</span>
                <span style={{ fontSize: 12, color: '#999', marginLeft: 8 }}>
                  {(t.player_ids || []).length} players · {getTeamPoints(t, results, localScheme)}pts
                </span>
              </div>
              <Btn small danger onClick={() => deleteTeam(t.id, t.name)}>Delete</Btn>
            </div>
          ))
        )}
      </Section>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────

export default function FantaTennis() {
  const [tab, setTab] = useState<'pick' | 'leaderboard' | 'admin'>('pick');
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [results, setResults] = useState<Record<string, string>>({});
  const [config, setConfig] = useState<Config | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean; key: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchAll() {
    setLoading(true);
    try {
      const [{ data: pl, error: e1 }, { data: tm, error: e2 }, { data: rs, error: e3 }, { data: cf, error: e4 }] =
        await Promise.all([
          supabase.from('players').select('*').order('seed', { ascending: true, nullsFirst: false }),
          supabase.from('teams').select('*').order('created_at'),
          supabase.from('results').select('*'),
          supabase.from('config').select('*').eq('id', 1).maybeSingle(),
        ]);

      const firstError = e1 || e2 || e3 || e4;
      if (firstError) throw new Error(firstError.message);

      setPlayers((pl as Player[]) || []);
      setTeams((tm as Team[]) || []);
      const rMap: Record<string, string> = {};
      ((rs || []) as Array<{ player_id: string; round: string }>).forEach(r => {
        rMap[r.player_id] = r.round;
      });
      setResults(rMap);
      if (cf) setConfig(cf as Config);
    } catch (e) {
      setError('Could not connect to database: ' + (e as Error).message);
    }
    setLoading(false);
  }

  useEffect(() => { fetchAll(); }, []);

  // Poll every 30s for live updates
  useEffect(() => {
    const interval = setInterval(() => {
      supabase.from('teams').select('*').order('created_at')
        .then(({ data }) => { if (data) setTeams(data as Team[]); });
      supabase.from('results').select('*')
        .then(({ data }) => {
          if (data) {
            const m: Record<string, string> = {};
            (data as Array<{ player_id: string; round: string }>).forEach(r => { m[r.player_id] = r.round; });
            setResults(m);
          }
        });
      supabase.from('config').select('*').eq('id', 1).maybeSingle()
        .then(({ data }) => { if (data) setConfig(data as Config); });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok, key: Date.now() });
  }

  const tabs: { id: 'pick' | 'leaderboard' | 'admin'; label: string }[] = [
    { id: 'pick',        label: '🎾 Pick team'   },
    { id: 'leaderboard', label: '🏆 Leaderboard' },
    { id: 'admin',       label: '⚙ Admin'        },
  ];

  if (loading) return (
    <div style={{ padding: 60, textAlign: 'center', color: '#888', fontSize: 14 }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🎾</div>
      Connecting to database…
    </div>
  );

  if (error) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#A32D2D', fontSize: 13 }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
      {error}
    </div>
  );

  return (
    <div style={{
      fontFamily: 'system-ui, sans-serif', fontSize: 14, color: '#222',
      maxWidth: 1100, margin: '0 auto', padding: '16px 20px 60px',
    }}>
      {toast && (
        <Toast key={toast.key} msg={toast.msg} ok={toast.ok} onDone={() => setToast(null)} />
      )}

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        paddingBottom: 14, borderBottom: '0.5px solid #e8e8e8',
        marginBottom: 16, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' }}>
            Fanta<span style={{ color: '#1D9E75' }}>Tennis</span>
          </div>
          <div style={{ fontSize: 12, color: '#999' }}>
            {config?.tourney_name || 'Tournament'} · {teams.length} team{teams.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); if (t.id !== 'admin') setAdminUnlocked(false); }}
              style={{
                padding: '7px 16px', borderRadius: 8, border: '0.5px solid',
                cursor: 'pointer', fontSize: 13,
                fontWeight: tab === t.id ? 600 : 400,
                borderColor: tab === t.id ? '#1D9E75' : '#e0e0e0',
                background: tab === t.id ? '#E1F5EE' : 'transparent',
                color: tab === t.id ? '#0F6E56' : '#666',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {tab === 'pick' && (
        <PickTab
          players={players}
          config={config}
          results={results}
          toast={showToast}
          onSubmit={() =>
            supabase.from('teams').select('*').order('created_at')
              .then(({ data }) => { if (data) setTeams(data as Team[]); })
          }
        />
      )}
      {tab === 'leaderboard' && (
        <LeaderboardTab teams={teams} players={players} results={results} config={config} />
      )}
      {tab === 'admin' && (
        adminUnlocked
          ? <AdminTab
              players={players} setPlayers={setPlayers}
              config={config} setConfig={setConfig}
              results={results} setResults={setResults}
              teams={teams} setTeams={setTeams}
              toast={showToast}
            />
          : <AdminGate onUnlock={() => setAdminUnlocked(true)} />
      )}
    </div>
  );
}
