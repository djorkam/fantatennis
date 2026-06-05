import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import type { Player } from './data/players';
import type { Team, Config } from './types';
import { Toast } from './ui';
import { AdminGate } from './components/AdminGate';
import { AdminTab } from './components/AdminTab';
import { PickTab } from './components/PickTab';
import { LeaderboardTab } from './components/LeaderboardTab';

type TabId = 'pick' | 'leaderboard' | 'admin';

const TABS: { id: TabId; label: string }[] = [
  { id: 'pick',        label: '🎾 Pick team'   },
  { id: 'leaderboard', label: '🏆 Leaderboard' },
  { id: 'admin',       label: '⚙ Admin'        },
];

export default function FantaTennis() {
  const [tab, setTab]                 = useState<TabId>('pick');
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [players,  setPlayers]  = useState<Player[]>([]);
  const [teams,    setTeams]    = useState<Team[]>([]);
  const [results,  setResults]  = useState<Record<string, string>>({});
  const [config,   setConfig]   = useState<Config | null>(null);
  const [toast,    setToast]    = useState<{ msg: string; ok: boolean; key: number } | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  // ── Initial fetch ───────────────────────────────────────────────────

  async function fetchAll() {
    setLoading(true);
    try {
      const [
        { data: pl, error: e1 },
        { data: tm, error: e2 },
        { data: rs, error: e3 },
        { data: cf, error: e4 },
      ] = await Promise.all([
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
      ((rs || []) as Array<{ player_id: string; round: string }>)
        .forEach(r => { rMap[r.player_id] = r.round; });
      setResults(rMap);
      if (cf) setConfig(cf as Config);
    } catch (e) {
      setError('Could not connect to database: ' + (e as Error).message);
    }
    setLoading(false);
  }

  useEffect(() => { fetchAll(); }, []);

  // ── Poll every 30s ──────────────────────────────────────────────────

  useEffect(() => {
    const interval = setInterval(() => {
      supabase.from('teams').select('*').order('created_at')
        .then(({ data }) => { if (data) setTeams(data as Team[]); });
      supabase.from('results').select('*')
        .then(({ data }) => {
          if (data) {
            const m: Record<string, string> = {};
            (data as Array<{ player_id: string; round: string }>)
              .forEach(r => { m[r.player_id] = r.round; });
            setResults(m);
          }
        });
      supabase.from('config').select('*').eq('id', 1).maybeSingle()
        .then(({ data }) => { if (data) setConfig(data as Config); });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok, key: Date.now() });
  }

  function switchTab(id: TabId) {
    setTab(id);
    if (id !== 'admin') setAdminUnlocked(false);
  }

  // ── Loading / error ─────────────────────────────────────────────────

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

  // ── Render ──────────────────────────────────────────────────────────

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
          {TABS.map(t => (
            <button key={t.id} onClick={() => switchTab(t.id)} style={{
              padding: '7px 16px', borderRadius: 8, border: '0.5px solid',
              cursor: 'pointer', fontSize: 13,
              fontWeight: tab === t.id ? 600 : 400,
              borderColor: tab === t.id ? '#1D9E75' : '#e0e0e0',
              background:  tab === t.id ? '#E1F5EE' : 'transparent',
              color:       tab === t.id ? '#0F6E56' : '#666',
            }}>
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
        <LeaderboardTab
          teams={teams}
          players={players}
          results={results}
          config={config}
        />
      )}
      {tab === 'admin' && (
        adminUnlocked
          ? <AdminTab
              players={players}  setPlayers={setPlayers}
              config={config}    setConfig={setConfig}
              results={results}  setResults={setResults}
              teams={teams}      setTeams={setTeams}
              toast={showToast}
            />
          : <AdminGate onUnlock={() => setAdminUnlocked(true)} />
      )}
    </div>
  );
}
