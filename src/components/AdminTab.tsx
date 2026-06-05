import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { RG25_PLAYERS } from '../data/players';
import type { Player } from '../data/players';
import type { Team, Config } from '../types';
import { ROUNDS, ROUND_LABELS, TIER_COLORS } from '../constants';
import { Btn, RoundBadge, Section, Field, inputStyle } from '../ui';
import { getTeamPoints } from '../helpers';

export function AdminTab({
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
  const [selectedRound, setSelectedRound] = useState<string>('');
  const [loserIds, setLoserIds] = useState<Set<string>>(new Set());
  const [batchSearch, setBatchSearch] = useState('');
  const [batchSaving, setBatchSaving] = useState(false);

  const eligiblePlayers = players.filter(p => !results[p.id] || results[p.id] === selectedRound);
  const batchFiltered = eligiblePlayers.filter(p =>
    p.name.toLowerCase().includes(batchSearch.toLowerCase()) ||
    (p.country || '').toLowerCase().includes(batchSearch.toLowerCase())
  );
  const assignedPlayers = players.filter(p => results[p.id]);
  const roundCounts = ROUNDS.reduce((acc, r) => {
    acc[r] = players.filter(p => results[p.id] === r).length;
    return acc;
  }, {} as Record<string, number>);

  function toggleLoser(pid: string) {
    setLoserIds(prev => {
      const next = new Set(prev);
      next.has(pid) ? next.delete(pid) : next.add(pid);
      return next;
    });
  }
  function selectAll() { setLoserIds(new Set(batchFiltered.map(p => p.id))); }
  function clearSelection() { setLoserIds(new Set()); }

  async function saveBatchResults() {
    if (!selectedRound) { toast('Select a round first', false); return; }
    if (loserIds.size === 0) { toast('No players selected', false); return; }
    setBatchSaving(true);
    const rows = Array.from(loserIds).map(pid => ({ player_id: pid, round: selectedRound }));
    const { error } = await supabase.from('results').upsert(rows, { onConflict: 'player_id' });
    setBatchSaving(false);
    if (error) { toast('Error saving results: ' + error.message, false); return; }
    setResults(prev => {
      const next = { ...prev };
      loserIds.forEach(pid => { next[pid] = selectedRound; });
      return next;
    });
    toast(`${loserIds.size} player${loserIds.size !== 1 ? 's' : ''} assigned to ${selectedRound} ✓`);
    setLoserIds(new Set());
  }

  async function removeResult(pid: string) {
    const { error } = await supabase.from('results').delete().eq('player_id', pid);
    if (error) { toast('Error: ' + error.message, false); return; }
    setResults(prev => { const n = { ...prev }; delete n[pid]; return n; });
  }

  async function resetAllResults() {
    if (!window.confirm('Reset ALL round results? This cannot be undone.')) return;
    const { error } = await supabase.from('results').delete().neq('player_id', '__none__');
    if (error) { toast('Error: ' + error.message, false); return; }
    setResults({});
    setLoserIds(new Set());
    toast('All results reset');
  }

  async function saveConfig(updates: Partial<Config>) {
    setSaving(true);
    const newConfig = { ...config, ...updates } as Config;
    const { error } = await supabase.from('config').update(newConfig).eq('id', 1);
    setSaving(false);
    if (error) { toast('Error: ' + error.message, false); return; }
    setConfig(newConfig);
    toast('Saved!');
  }

  async function saveScheme() { await saveConfig({ points_scheme: localScheme }); }

  async function loadRG25() {
    if (players.length > 0 && !window.confirm(`Replace all ${players.length} existing players with the RG25 draw?`)) return;
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

  const filteredPlayers = players.filter(p =>
    p.name.toLowerCase().includes(playerSearch.toLowerCase()) ||
    (p.country || '').toLowerCase().includes(playerSearch.toLowerCase())
  );

  return (
    <div>

      <Section title="Tournament settings">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <Field label="Tournament name">
            <input defaultValue={config?.tourney_name}
              onBlur={e => saveConfig({ tourney_name: e.currentTarget.value })}
              style={inputStyle} />
          </Field>
          <Field label="Budget cap (credits)">
            <input type="number" defaultValue={config?.budget_cap}
              onBlur={e => saveConfig({ budget_cap: +e.currentTarget.value })}
              style={inputStyle} />
          </Field>
          <Field label="Submission deadline">
            <input type="datetime-local"
              defaultValue={config?.submission_deadline?.slice(0, 16)}
              onBlur={e => saveConfig({
                submission_deadline: e.currentTarget.value
                  ? new Date(e.currentTarget.value).toISOString() : null,
              })}
              style={inputStyle} />
          </Field>
          <Field label="Leaderboard visibility">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
              <input type="checkbox" id="lb-visible"
                checked={!!config?.leaderboard_visible}
                onChange={e => saveConfig({ leaderboard_visible: e.target.checked })}
                style={{ width: 16, height: 16, cursor: 'pointer' }} />
              <label htmlFor="lb-visible" style={{ fontSize: 13, cursor: 'pointer' }}>
                {config?.leaderboard_visible ? '✅ Visible to all users' : '🔒 Hidden from users'}
              </label>
            </div>
          </Field>
        </div>
        <div style={{ fontSize: 12, color: '#999' }}>Fields save automatically on blur (click away)</div>
      </Section>

      <Section title="Points scheme">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: 12 }}>
          {ROUNDS.map(r => (
            <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#f8f8f5', borderRadius: 8 }}>
              <span style={{ fontSize: 12, color: TIER_COLORS[r], fontWeight: 700, flex: 1 }}>{r}</span>
              <input type="number" value={localScheme[r] ?? 0}
                onChange={e => setLocalScheme(s => ({ ...s, [r]: +e.currentTarget.value }))}
                style={{ width: 56, textAlign: 'center', padding: '4px 6px', borderRadius: 6, border: '0.5px solid #ddd', fontSize: 13 }} />
              <span style={{ fontSize: 11, color: '#999' }}>pts</span>
            </div>
          ))}
        </div>
        <Btn primary onClick={saveScheme} disabled={saving}>Save scheme</Btn>
      </Section>

      <Section title="Round results">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {ROUNDS.map(r => (
            <div key={r}
              onClick={() => { setSelectedRound(r); setLoserIds(new Set()); setBatchSearch(''); }}
              style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                background: roundCounts[r] > 0 ? TIER_COLORS[r] + '22' : '#f5f5f0',
                color: roundCounts[r] > 0 ? TIER_COLORS[r] : '#bbb',
                border: `1px solid ${roundCounts[r] > 0 ? TIER_COLORS[r] + '44' : '#eee'}`,
                outline: selectedRound === r ? `2px solid ${TIER_COLORS[r]}` : 'none',
                outlineOffset: 1,
              }}>
              {r}{roundCounts[r] > 0 ? ` · ${roundCounts[r]}` : ''}
            </div>
          ))}
          <div style={{ fontSize: 12, color: '#999', alignSelf: 'center', marginLeft: 4 }}>
            {assignedPlayers.length}/{players.length} assigned
          </div>
        </div>

        {!selectedRound ? (
          <div style={{ padding: 24, textAlign: 'center', background: '#f8f8f5', borderRadius: 8, color: '#999', fontSize: 13 }}>
            👆 Click a round above to start entering results
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <div style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                background: TIER_COLORS[selectedRound] + '22',
                color: TIER_COLORS[selectedRound],
                border: `1px solid ${TIER_COLORS[selectedRound]}44`,
              }}>
                {ROUND_LABELS[selectedRound]}
              </div>
              <div style={{ fontSize: 12, color: '#999', flex: 1 }}>
                {eligiblePlayers.length} players without a result · select losers
              </div>
              <Btn small onClick={selectAll}>Select all</Btn>
              <Btn small onClick={clearSelection}>Clear</Btn>
            </div>

            <input value={batchSearch} onChange={e => setBatchSearch(e.target.value)}
              placeholder="Search players…" style={{ ...inputStyle, marginBottom: 8 }} />

            <div style={{ maxHeight: 360, overflowY: 'auto', border: '0.5px solid #eee', borderRadius: 8, marginBottom: 12 }}>
              {batchFiltered.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#aaa', fontSize: 13 }}>
                  {eligiblePlayers.length === 0
                    ? '✅ All players have results for this round'
                    : 'No players match your search'}
                </div>
              ) : batchFiltered.map(p => {
                const checked = loserIds.has(p.id);
                const alreadyThisRound = results[p.id] === selectedRound;
                return (
                  <div key={p.id} onClick={() => toggleLoser(p.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '9px 14px', borderBottom: '0.5px solid #f8f8f8',
                    cursor: 'pointer',
                    background: checked ? TIER_COLORS[selectedRound] + '18' : 'transparent',
                    transition: 'background 0.1s',
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                      border: `1.5px solid ${checked ? TIER_COLORS[selectedRound] : '#ccc'}`,
                      background: checked ? TIER_COLORS[selectedRound] : '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {checked && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
                    </div>
                    <div style={{ width: 24, textAlign: 'center', fontSize: 11, color: '#aaa', flexShrink: 0 }}>{p.seed || '—'}</div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</span>
                      <span style={{ fontSize: 11, color: '#bbb', marginLeft: 6 }}>{p.country}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#0F6E56' }}>{p.price}cr</span>
                    {alreadyThisRound && (
                      <span style={{ fontSize: 10, color: TIER_COLORS[selectedRound], fontWeight: 600 }}>already set</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#f8f8f5', borderRadius: 8 }}>
              <span style={{ fontSize: 13, color: '#666', flex: 1 }}>
                {loserIds.size > 0
                  ? `${loserIds.size} player${loserIds.size !== 1 ? 's' : ''} selected as losers of ${selectedRound}`
                  : 'No players selected'}
              </span>
              <Btn primary onClick={saveBatchResults} disabled={batchSaving || loserIds.size === 0}>
                {batchSaving ? 'Saving…' : `Save ${loserIds.size > 0 ? loserIds.size : ''} result${loserIds.size !== 1 ? 's' : ''}`}
              </Btn>
            </div>
          </div>
        )}

        {assignedPlayers.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '0.5px solid #f0f0f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Assigned results ({assignedPlayers.length})</div>
              <Btn small danger onClick={resetAllResults}>Reset all</Btn>
            </div>
            <div style={{ maxHeight: 200, overflowY: 'auto', border: '0.5px solid #eee', borderRadius: 8 }}>
              {assignedPlayers.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', borderBottom: '0.5px solid #f8f8f8' }}>
                  <span style={{ flex: 1, fontSize: 12 }}>{p.name} <span style={{ color: '#bbb' }}>{p.country}</span></span>
                  <RoundBadge round={results[p.id]} />
                  <button onClick={() => removeResult(p.id)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ccc', fontSize: 14, padding: '0 4px' }}
                    title="Remove result">×</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      <Section title={`Players (${players.length})`}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <input value={newPlayer.name} onChange={e => setNewPlayer(s => ({ ...s, name: e.target.value }))}
            placeholder="Name" style={{ flex: 2, minWidth: 120, padding: '7px 10px', borderRadius: 8, border: '0.5px solid #ccc', fontSize: 13 }} />
          <input value={newPlayer.country} onChange={e => setNewPlayer(s => ({ ...s, country: e.target.value }))}
            placeholder="CTY" style={{ width: 70, padding: '7px 10px', borderRadius: 8, border: '0.5px solid #ccc', fontSize: 13 }} />
          <input type="number" value={newPlayer.price} onChange={e => setNewPlayer(s => ({ ...s, price: e.target.value }))}
            placeholder="Price" style={{ width: 80, padding: '7px 10px', borderRadius: 8, border: '0.5px solid #ccc', fontSize: 13 }} />
          <Btn primary onClick={addPlayer}>+ Add</Btn>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <Btn onClick={loadRG25} disabled={saving}>⬇ Load RG25 draw (128 players)</Btn>
        </div>
        <input value={playerSearch} onChange={e => setPlayerSearch(e.target.value)}
          placeholder="Search players…" style={{ ...inputStyle, marginBottom: 8 }} />
        <div style={{ maxHeight: 300, overflowY: 'auto', border: '0.5px solid #eee', borderRadius: 8 }}>
          {filteredPlayers.map(p => (
            <div key={p.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '7px 12px', borderBottom: '0.5px solid #f8f8f8' }}>
              <span style={{ width: 24, fontSize: 11, color: '#aaa', textAlign: 'center', flexShrink: 0 }}>{p.seed || '—'}</span>
              <span style={{ flex: 1, fontSize: 13 }}>{p.name} <span style={{ color: '#bbb', fontSize: 11 }}>{p.country}</span></span>
              {results[p.id] && <RoundBadge round={results[p.id]} />}
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

      <Section title={`Teams submitted (${teams.length})`}>
        {teams.length === 0 ? (
          <div style={{ color: '#aaa', fontSize: 13 }}>No teams yet.</div>
        ) : teams.map(t => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '0.5px solid #f8f8f8' }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 500, fontSize: 13 }}>{t.name}</span>
              <span style={{ fontSize: 12, color: '#999', marginLeft: 8 }}>
                {(t.player_ids || []).length} players · {getTeamPoints(t, results, localScheme)}pts
              </span>
            </div>
            <Btn small danger onClick={() => deleteTeam(t.id, t.name)}>Delete</Btn>
          </div>
        ))}
      </Section>

    </div>
  );
}
