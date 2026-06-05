import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Player } from '../data/players';
import type { Config } from '../types';
import { Btn, RoundBadge, Section, inputStyle } from '../ui';
import { getPlayerPoints } from '../helpers';

export function PickTab({
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
      .from('teams').select('*').eq('name', name.trim()).maybeSingle();
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
            value={teamName} onChange={e => setTeamName(e.target.value)}
            placeholder="Your name / team name…"
            style={{ flex: 1, minWidth: 180, padding: '8px 12px', borderRadius: 8, border: '0.5px solid #ccc', fontSize: 13 }}
          />
          <Btn onClick={() => loadMyTeam(teamName)}>Load my picks</Btn>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#f0f0f0', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: pct + '%', borderRadius: 3, background: over ? '#E24B4A' : '#1D9E75', transition: 'width 0.3s' }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: over ? '#E24B4A' : '#1D9E75', minWidth: 90, textAlign: 'right' }}>
            {spent} / {budgetCap} cr
          </span>
        </div>
        <div style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>
          {pickedIds.length}/8 players selected
          {over && <span style={{ color: '#E24B4A', marginLeft: 8 }}>⚠ Over budget!</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8, marginBottom: 14 }}>
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
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#999', flexShrink: 0 }}>{i + 1}</div>
                {p ? (
                  <>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: '#999' }}>{p.price}cr{round ? ` · +${pts}pts` : ''}</div>
                    </div>
                    {!isLocked && (
                      <button onClick={() => togglePlayer(p.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ccc', fontSize: 16 }}>×</button>
                    )}
                  </>
                ) : <span style={{ fontSize: 12, color: '#ccc' }}>Empty</span>}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Btn primary onClick={submit} disabled={loading || isLocked || pickedIds.length !== 8 || over}>
            {loading ? 'Saving…' : submitted ? '✓ Saved' : '🎾 Submit team'}
          </Btn>
          {deadline && (
            <span style={{ fontSize: 12, color: '#999' }}>Deadline: {deadline.toLocaleString()}</span>
          )}
        </div>
      </Section>

      <Section title={`Player roster (${players.length})`}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search player or country…"
            style={{ flex: 1, minWidth: 160, padding: '7px 12px', borderRadius: 8, border: '0.5px solid #ccc', fontSize: 13 }}
          />
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ padding: '7px 10px', borderRadius: 8, border: '0.5px solid #ccc', fontSize: 13 }}>
            <option value="seed">By seed</option>
            <option value="price_desc">Price ↓</option>
            <option value="price_asc">Price ↑</option>
          </select>
        </div>

        <div style={{ maxHeight: 460, overflowY: 'auto', border: '0.5px solid #f0f0f0', borderRadius: 8 }}>
          {filtered.map(p => {
            const inTeam = pickedIds.includes(p.id);
            const round = results[p.id];
            const pts = round ? getPlayerPoints(p.id, results, scheme) : 0;
            return (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                borderBottom: '0.5px solid #f8f8f8',
                background: inTeam ? '#E1F5EE' : 'transparent',
              }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#f5f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#888', flexShrink: 0, fontWeight: 500 }}>
                  {p.seed || '—'}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 500, fontSize: 13 }}>{p.name}</span>
                  <span style={{ fontSize: 11, color: '#aaa', marginLeft: 6 }}>{p.country}</span>
                  {round && <span style={{ marginLeft: 6 }}><RoundBadge round={round} /></span>}
                </div>
                {round && <span style={{ fontSize: 12, color: '#1D9E75', fontWeight: 600 }}>+{pts}pts</span>}
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0F6E56', minWidth: 46, textAlign: 'right' }}>{p.price}cr</span>
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
            <div style={{ padding: 24, textAlign: 'center', color: '#aaa', fontSize: 13 }}>No players found</div>
          )}
        </div>
        <div style={{ fontSize: 11, color: '#bbb', marginTop: 6, textAlign: 'right' }}>
          {filtered.length} of {players.length} players shown
        </div>
      </Section>
    </div>
  );
}
