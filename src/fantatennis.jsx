import { useState, useEffect, useCallback } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://rcecxpmuxebnlsllddpv.supabase.co";
const SUPABASE_KEY = "sb_publishable_kve3UmzXSb5jkZ2mOhrOrA_J9kcWxN6";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ROUNDS = ['R128','R64','R32','R16','QF','SF','F','W'];
const ROUND_LABELS = {
  R128:'Round 1', R64:'Round 2', R32:'Round 3',
  R16:'Round of 16', QF:'Quarter-final', SF:'Semi-final', F:'Final', W:'Winner'
};
const TIER_COLORS = { W:'#1D9E75', F:'#5DCAA5', SF:'#9FE1CB', QF:'#0F6E56', R16:'#185FA5', R32:'#378ADD', R64:'#85B7EB', R128:'#888780' };

const RG25_PLAYERS = [
  {id:'p1',name:'Jannik Sinner',country:'ITA',seed:1,price:95},
  {id:'p2',name:'Alexander Zverev',country:'GER',seed:2,price:80},
  {id:'p3',name:'Carlos Alcaraz',country:'ESP',seed:3,price:90},
  {id:'p4',name:'Taylor Fritz',country:'USA',seed:4,price:65},
  {id:'p5',name:'Daniil Medvedev',country:'RUS',seed:5,price:70},
  {id:'p6',name:'Casper Ruud',country:'NOR',seed:6,price:55},
  {id:'p7',name:'Andrey Rublev',country:'RUS',seed:7,price:52},
  {id:'p8',name:'Hubert Hurkacz',country:'POL',seed:8,price:50},
  {id:'p9',name:'Alex de Minaur',country:'AUS',seed:9,price:48},
  {id:'p10',name:'Tommy Paul',country:'USA',seed:10,price:45},
  {id:'p11',name:'Stefanos Tsitsipas',country:'GRE',seed:11,price:48},
  {id:'p12',name:'Grigor Dimitrov',country:'BUL',seed:12,price:42},
  {id:'p13',name:'Holger Rune',country:'DEN',seed:13,price:42},
  {id:'p14',name:'Francisco Cerundolo',country:'ARG',seed:14,price:35},
  {id:'p15',name:'Ugo Humbert',country:'FRA',seed:15,price:32},
  {id:'p16',name:'Ben Shelton',country:'USA',seed:16,price:38},
  {id:'p17',name:'Sebastian Baez',country:'ARG',seed:17,price:30},
  {id:'p18',name:'Lorenzo Musetti',country:'ITA',seed:18,price:30},
  {id:'p19',name:'Nicolas Jarry',country:'CHI',seed:19,price:28},
  {id:'p20',name:'Karen Khachanov',country:'RUS',seed:20,price:27},
  {id:'p21',name:'Alejandro Davidovich Fokina',country:'ESP',seed:21,price:26},
  {id:'p22',name:'Tomas Machac',country:'CZE',seed:22,price:26},
  {id:'p23',name:'Fabian Marozsan',country:'HUN',seed:23,price:25},
  {id:'p24',name:'Jiri Lehecka',country:'CZE',seed:24,price:25},
  {id:'p25',name:'Jan-Lennard Struff',country:'GER',seed:25,price:22},
  {id:'p26',name:'Alexei Popyrin',country:'AUS',seed:26,price:22},
  {id:'p27',name:'Nuno Borges',country:'POR',seed:27,price:22},
  {id:'p28',name:'Felix Auger-Aliassime',country:'CAN',seed:28,price:24},
  {id:'p29',name:'Brandon Nakashima',country:'USA',seed:29,price:20},
  {id:'p30',name:'Matteo Arnaldi',country:'ITA',seed:30,price:20},
  {id:'p31',name:'Roberto Bautista Agut',country:'ESP',seed:31,price:20},
  {id:'p32',name:'Arthur Fils',country:'FRA',seed:32,price:28},
  {id:'p33',name:'Jack Draper',country:'GBR',seed:null,price:22},
  {id:'p34',name:'Flavio Cobolli',country:'ITA',seed:null,price:18},
  {id:'p35',name:'Matteo Berrettini',country:'ITA',seed:null,price:20},
  {id:'p36',name:'Denis Shapovalov',country:'CAN',seed:null,price:15},
  {id:'p37',name:'Giovanni Mpetshi Perricard',country:'FRA',seed:null,price:16},
  {id:'p38',name:'Joao Fonseca',country:'BRA',seed:null,price:14},
  {id:'p39',name:'Luciano Darderi',country:'ITA',seed:null,price:15},
  {id:'p40',name:'Alexander Bublik',country:'KAZ',seed:null,price:16},
  {id:'p41',name:'Alejandro Tabilo',country:'CHI',seed:null,price:18},
  {id:'p42',name:'Lorenzo Sonego',country:'ITA',seed:null,price:13},
  {id:'p43',name:'Gael Monfils',country:'FRA',seed:null,price:15},
  {id:'p44',name:'Alex Michelsen',country:'USA',seed:null,price:10},
  {id:'p45',name:'Botic van de Zandschulp',country:'NED',seed:null,price:13},
  {id:'p46',name:'Tallon Griekspoor',country:'NED',seed:null,price:12},
  {id:'p47',name:'Luca Van Assche',country:'FRA',seed:null,price:10},
  {id:'p48',name:'Arthur Cazaux',country:'FRA',seed:null,price:10},
  {id:'p49',name:'Corentin Moutet',country:'FRA',seed:null,price:13},
  {id:'p50',name:'Hugo Gaston',country:'FRA',seed:null,price:12},
  {id:'p51',name:'Miomir Kecmanovic',country:'SRB',seed:null,price:11},
  {id:'p52',name:'Dominic Thiem',country:'AUT',seed:null,price:10},
  {id:'p53',name:'Luca Nardi',country:'ITA',seed:null,price:9},
  {id:'p54',name:'Pablo Carreno Busta',country:'ESP',seed:null,price:14},
  {id:'p55',name:'Rinky Hijikata',country:'AUS',seed:null,price:11},
  {id:'p56',name:'Hamad Medjedovic',country:'SRB',seed:null,price:9},
  {id:'p57',name:'Mattia Bellucci',country:'ITA',seed:null,price:9},
  {id:'p58',name:'Daniel Altmaier',country:'GER',seed:null,price:10},
  {id:'p59',name:'Zizou Bergs',country:'BEL',seed:null,price:9},
  {id:'p60',name:'Benjamin Bonzi',country:'FRA',seed:null,price:10},
  {id:'p61',name:'Ethan Quinn',country:'USA',seed:null,price:10},
  {id:'p62',name:'Roman Safiullin',country:'RUS',seed:null,price:9},
  {id:'p63',name:'Alexandre Muller',country:'FRA',seed:null,price:9},
  {id:'p64',name:'Quentin Halys',country:'FRA',seed:null,price:8},
  {id:'p65',name:'Thanasi Kokkinakis',country:'AUS',seed:null,price:10},
  {id:'p66',name:'Stan Wawrinka',country:'SUI',seed:null,price:14},
  {id:'p67',name:'Christopher O\'Connell',country:'AUS',seed:null,price:10},
  {id:'p68',name:'Pedro Cachin',country:'ARG',seed:null,price:10},
  {id:'p69',name:'Dusan Lajovic',country:'SRB',seed:null,price:10},
  {id:'p70',name:'Adrian Mannarino',country:'FRA',seed:null,price:14},
  {id:'p71',name:'Yasutaka Uchiyama',country:'JPN',seed:null,price:8},
  {id:'p72',name:'Facundo Bagnis',country:'ARG',seed:null,price:7},
  {id:'p73',name:'Max Purcell',country:'AUS',seed:null,price:9},
  {id:'p74',name:'Radu Albot',country:'MDA',seed:null,price:8},
  {id:'p75',name:'Marcos Giron',country:'USA',seed:null,price:12},
  {id:'p76',name:'Thiago Monteiro',country:'BRA',seed:null,price:11},
  {id:'p77',name:'Harold Mayot',country:'FRA',seed:null,price:9},
  {id:'p78',name:'Christopher Eubanks',country:'USA',seed:null,price:12},
  {id:'p79',name:'Andrea Vavassori',country:'ITA',seed:null,price:9},
  {id:'p80',name:'Maximilian Marterer',country:'GER',seed:null,price:9},
  {id:'p81',name:'Gregoire Barrere',country:'FRA',seed:null,price:8},
  {id:'p82',name:'Benjamin Bonzi',country:'FRA',seed:null,price:8},
  {id:'p83',name:'Richard Gasquet',country:'FRA',seed:null,price:12},
  {id:'p84',name:'Dominic Stricker',country:'SUI',seed:null,price:9},
  {id:'p85',name:'Axel Geller',country:'ARG',seed:null,price:7},
  {id:'p86',name:'Nishesh Basavareddy',country:'USA',seed:null,price:7},
  {id:'p87',name:'Emilio Nava',country:'USA',seed:null,price:7},
  {id:'p88',name:'Marin Cilic',country:'CRO',seed:null,price:9},
  {id:'p89',name:'Pablo Andujar',country:'ESP',seed:null,price:7},
  {id:'p90',name:'Blaz Rola',country:'SLO',seed:null,price:7},
  {id:'p91',name:'Constant Lestienne',country:'FRA',seed:null,price:7},
  {id:'p92',name:'James Duckworth',country:'AUS',seed:null,price:8},
  {id:'p93',name:'Nikoloz Basilashvili',country:'GEO',seed:null,price:7},
  {id:'p94',name:'Taro Daniel',country:'JPN',seed:null,price:6},
  {id:'p95',name:'Marc-Andrea Huesler',country:'SUI',seed:null,price:8},
  {id:'p96',name:'Zizou Bergs',country:'BEL',seed:null,price:8},
  {id:'p97',name:'Daniel Masur',country:'GER',seed:null,price:7},
  {id:'p98',name:'Lukas Klein',country:'SVK',seed:null,price:6},
  {id:'p99',name:'Tim van Rijthoven',country:'NED',seed:null,price:8},
  {id:'p100',name:'Alejandro Tabilo',country:'CHI',seed:null,price:7},
  {id:'p101',name:'Lorenzo Sonego',country:'ITA',seed:null,price:7},
  {id:'p102',name:'Pablo Llamas Ruiz',country:'ESP',seed:null,price:7},
  {id:'p103',name:'Camilo Ugo Carabelli',country:'ARG',seed:null,price:8},
  {id:'p104',name:'Hugo Dellien',country:'BOL',seed:null,price:8},
  {id:'p105',name:'Nicolas Moreno de Alboran',country:'ESP',seed:null,price:6},
  {id:'p106',name:'Luca Pouille',country:'FRA',seed:null,price:7},
  {id:'p107',name:'Elias Ymer',country:'SWE',seed:null,price:8},
  {id:'p108',name:'Antoine Bellier',country:'SUI',seed:null,price:8},
  {id:'p109',name:'Soonwoo Kwon',country:'KOR',seed:null,price:10},
  {id:'p110',name:'Nicolas Mahut',country:'FRA',seed:null,price:9},
  {id:'p111',name:'Yannick Hanfmann',country:'GER',seed:null,price:10},
  {id:'p112',name:'Mikhail Kukushkin',country:'KAZ',seed:null,price:8},
  {id:'p113',name:'Alexandre Muller',country:'FRA',seed:null,price:8},
  {id:'p114',name:'Joao Fonseca',country:'BRA',seed:null,price:8},
  {id:'p115',name:'Qualifier A',country:'Q',seed:null,price:5},
  {id:'p116',name:'Qualifier B',country:'Q',seed:null,price:5},
  {id:'p117',name:'Qualifier C',country:'Q',seed:null,price:5},
  {id:'p118',name:'Qualifier D',country:'Q',seed:null,price:5},
  {id:'p119',name:'Qualifier E',country:'Q',seed:null,price:5},
  {id:'p120',name:'Qualifier F',country:'Q',seed:null,price:5},
  {id:'p121',name:'Qualifier G',country:'Q',seed:null,price:5},
  {id:'p122',name:'Qualifier H',country:'Q',seed:null,price:5},
  {id:'p123',name:'Lucky Loser 1',country:'LL',seed:null,price:4},
  {id:'p124',name:'Lucky Loser 2',country:'LL',seed:null,price:4},
  {id:'p125',name:'Lucky Loser 3',country:'LL',seed:null,price:4},
  {id:'p126',name:'Lucky Loser 4',country:'LL',seed:null,price:4},
  {id:'p127',name:'Wild Card 1',country:'WC',seed:null,price:4},
  {id:'p128',name:'Wild Card 2',country:'WC',seed:null,price:4},
];

function getPlayerPoints(pid, results, scheme) {
  const r = results[pid];
  return r ? (scheme[r] || 0) : 0;
}

function getTeamPoints(team, results, scheme) {
  return (team.player_ids || []).reduce((s, pid) => s + getPlayerPoints(pid, results, scheme), 0);
}

function Toast({ msg, ok, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      position:'fixed', top:16, right:16, padding:'10px 18px',
      borderRadius:8, background: ok ? '#1D9E75' : '#E24B4A',
      color:'#fff', fontWeight:500, fontSize:13, zIndex:9999
    }}>{msg}</div>
  );
}

function Btn({ primary, danger, small, onClick, disabled, children, style={} }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: small ? '5px 12px' : '8px 16px',
      borderRadius:8, border:'0.5px solid',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: small ? 12 : 13, fontWeight:500,
      opacity: disabled ? 0.5 : 1,
      borderColor: primary ? '#0F6E56' : danger ? '#A32D2D' : '#ddd',
      background: primary ? '#1D9E75' : danger ? '#FCEBEB' : 'transparent',
      color: primary ? '#fff' : danger ? '#A32D2D' : '#444',
      ...style
    }}>{children}</button>
  );
}

function RoundBadge({ round }) {
  if (!round) return null;
  const color = TIER_COLORS[round] || '#888';
  return (
    <span style={{
      display:'inline-block', padding:'1px 7px', borderRadius:20,
      fontSize:10, fontWeight:600, background:color+'22', color, border:`1px solid ${color}44`
    }}>{ROUND_LABELS[round]}</span>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ background:'#fff', border:'0.5px solid #e8e8e8', borderRadius:12, padding:16, marginBottom:16 }}>
      <div style={{ fontWeight:600, fontSize:14, marginBottom:14 }}>{title}</div>
      {children}
    </div>
  );
}

// ─── Pick Tab ─────────────────────────────────────────────────────────

function PickTab({ players, config, results, toast, onSubmit }) {
  const [teamName, setTeamName] = useState('');
  const [pickedIds, setPickedIds] = useState([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('seed');
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const scheme = config?.points_scheme || {};
  const budgetCap = config?.budget_cap || 500;
  const deadline = config?.submission_deadline ? new Date(config.submission_deadline) : null;
  const isLocked = deadline && new Date() > deadline;

  async function loadMyTeam(name) {
    if (!name.trim()) return;
    const { data } = await supabase.from('teams').select('*').eq('name', name.trim()).single();
    if (data) {
      setPickedIds(data.player_ids || []);
      setLoaded(true);
      toast('Your previous picks loaded!');
    } else {
      setPickedIds([]);
      setLoaded(true);
    }
  }

  const spent = pickedIds.reduce((s, id) => {
    const p = players.find(x => x.id === id);
    return s + (p ? p.price : 0);
  }, 0);
  const over = spent > budgetCap;
  const pct = Math.min(100, Math.round(spent / budgetCap * 100));

  function togglePlayer(pid) {
    if (isLocked) { toast('Submissions are closed!', false); return; }
    const idx = pickedIds.indexOf(pid);
    if (idx >= 0) {
      setPickedIds(pickedIds.filter(x => x !== pid));
    } else {
      if (pickedIds.length >= 8) { toast('Max 8 players!', false); return; }
      const p = players.find(x => x.id === pid);
      if (spent + p.price > budgetCap) { toast('Over budget!', false); return; }
      setPickedIds([...pickedIds, pid]);
    }
  }

  async function submit() {
    if (!teamName.trim()) { toast('Enter your team name first!', false); return; }
    if (pickedIds.length !== 8) { toast('Pick exactly 8 players!', false); return; }
    if (over) { toast('You are over budget!', false); return; }
    setLoading(true);
    const { error } = await supabase.from('teams').upsert(
      { name: teamName.trim(), player_ids: pickedIds },
      { onConflict: 'name' }
    );
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
  if (sortBy === 'seed') filtered = [...filtered].sort((a,b) => (a.seed||999)-(b.seed||999));
  else if (sortBy === 'price_desc') filtered = [...filtered].sort((a,b) => b.price-a.price);
  else if (sortBy === 'price_asc') filtered = [...filtered].sort((a,b) => a.price-b.price);

  return (
    <div>
      {isLocked && (
        <div style={{ background:'#FAEEDA', border:'0.5px solid #FAC775', borderRadius:8, padding:'10px 14px', marginBottom:14, fontSize:13, color:'#633806' }}>
          🔒 Submissions closed — deadline passed.
        </div>
      )}

      {/* Team name */}
      <Section title="Your team">
        <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
          <input value={teamName} onChange={e => setTeamName(e.target.value)}
            placeholder="Your name / team name…"
            style={{ flex:1, minWidth:180, padding:'8px 12px', borderRadius:8, border:'0.5px solid #ccc', fontSize:13 }} />
          <Btn onClick={() => loadMyTeam(teamName)}>Load my picks</Btn>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
          <div style={{ flex:1, height:6, borderRadius:3, background:'#f0f0f0', overflow:'hidden' }}>
            <div style={{ height:'100%', width:pct+'%', borderRadius:3, background: over ? '#E24B4A' : '#1D9E75', transition:'width 0.3s' }} />
          </div>
          <span style={{ fontSize:13, fontWeight:600, color: over ? '#E24B4A' : '#1D9E75', minWidth:90, textAlign:'right' }}>
            {spent} / {budgetCap} cr
          </span>
        </div>
        <div style={{ fontSize:12, color:'#999', marginBottom:12 }}>{pickedIds.length}/8 players selected</div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:8, marginBottom:14 }}>
          {Array.from({length:8}).map((_,i) => {
            const pid = pickedIds[i];
            const p = pid ? players.find(x => x.id === pid) : null;
            const round = pid ? results[pid] : null;
            const pts = round ? (scheme[round]||0) : 0;
            return (
              <div key={i} style={{
                display:'flex', alignItems:'center', gap:8, padding:'8px 10px',
                borderRadius:8, border:'0.5px solid', borderStyle: p ? 'solid' : 'dashed',
                borderColor: p ? '#9FE1CB' : '#ddd', background: p ? '#fff' : 'transparent'
              }}>
                <div style={{ width:20, height:20, borderRadius:'50%', background:'#f0f0f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#999', flexShrink:0 }}>{i+1}</div>
                {p ? (
                  <>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:500, fontSize:12, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</div>
                      <div style={{ fontSize:11, color:'#999' }}>{p.price}cr{round ? ` · +${pts}pts` : ''}</div>
                    </div>
                    {!isLocked && <button onClick={() => togglePlayer(p.id)} style={{ border:'none', background:'none', cursor:'pointer', color:'#ccc', fontSize:16, lineHeight:1 }}>×</button>}
                  </>
                ) : <span style={{ fontSize:12, color:'#ccc' }}>Empty</span>}
              </div>
            );
          })}
        </div>

        <Btn primary onClick={submit} disabled={loading || isLocked || pickedIds.length !== 8 || over}>
          {loading ? 'Saving…' : submitted ? '✓ Saved' : '🎾 Submit team'}
        </Btn>
        {deadline && (
          <span style={{ fontSize:12, color:'#999', marginLeft:12 }}>
            Deadline: {deadline.toLocaleString()}
          </span>
        )}
      </Section>

      {/* Roster */}
      <Section title="Player roster">
        <div style={{ display:'flex', gap:8, marginBottom:10 }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search player…"
            style={{ flex:1, padding:'7px 12px', borderRadius:8, border:'0.5px solid #ccc', fontSize:13 }} />
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ padding:'7px 10px', borderRadius:8, border:'0.5px solid #ccc', fontSize:13 }}>
            <option value="seed">By seed</option>
            <option value="price_desc">Price ↓</option>
            <option value="price_asc">Price ↑</option>
          </select>
        </div>
        <div style={{ maxHeight:440, overflowY:'auto', border:'0.5px solid #f0f0f0', borderRadius:8 }}>
          {filtered.map(p => {
            const inTeam = pickedIds.includes(p.id);
            const round = results[p.id];
            const pts = round ? (scheme[round]||0) : 0;
            return (
              <div key={p.id} style={{
                display:'flex', alignItems:'center', gap:10, padding:'8px 12px',
                borderBottom:'0.5px solid #f8f8f8',
                background: inTeam ? '#E1F5EE' : 'transparent'
              }}>
                <div style={{ width:24, height:24, borderRadius:'50%', background:'#f5f5f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#888', flexShrink:0 }}>
                  {p.seed || '—'}
                </div>
                <div style={{ flex:1 }}>
                  <span style={{ fontWeight:500, fontSize:13 }}>{p.name}</span>
                  <span style={{ fontSize:11, color:'#aaa', marginLeft:6 }}>{p.country}</span>
                  {round && <span style={{ marginLeft:6 }}><RoundBadge round={round} /></span>}
                </div>
                {round && <span style={{ fontSize:12, color:'#1D9E75', fontWeight:600 }}>+{pts}pts</span>}
                <span style={{ fontSize:13, fontWeight:600, color:'#0F6E56', minWidth:46, textAlign:'right' }}>{p.price}cr</span>
                {!isLocked && (
                  <Btn small onClick={() => togglePlayer(p.id)}
                    style={{ borderColor: inTeam ? '#A32D2D' : '#1D9E75', color: inTeam ? '#A32D2D' : '#1D9E75', background: inTeam ? '#FCEBEB' : '#E1F5EE' }}>
                    {inTeam ? 'Remove' : 'Pick'}
                  </Btn>
                )}
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

// ─── Leaderboard Tab ──────────────────────────────────────────────────

function LeaderboardTab({ teams, players, results, config }) {
  const scheme = config?.points_scheme || {};
  const visible = config?.leaderboard_visible;
  const deadline = config?.submission_deadline ? new Date(config.submission_deadline) : null;
  const deadlinePassed = deadline && new Date() > deadline;

  if (!visible && !deadlinePassed) {
    const teamsCount = teams.length;
    return (
      <div style={{ textAlign:'center', padding:'60px 20px', color:'#888' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🔒</div>
        <div style={{ fontSize:16, fontWeight:500, color:'#444', marginBottom:8 }}>Leaderboard hidden</div>
        <div style={{ fontSize:13 }}>
          {teamsCount} team{teamsCount !== 1 ? 's' : ''} submitted so far.
          {deadline && <><br />Results visible after {deadline.toLocaleString()}</>}
        </div>
      </div>
    );
  }

  const ranked = teams
    .map(t => ({ ...t, pts: getTeamPoints(t, results, scheme) }))
    .sort((a,b) => b.pts - a.pts);

  const rankColors = [
    { bg:'#FAEEDA', color:'#633806' },
    { bg:'#F1EFE8', color:'#5F5E5A' },
    { bg:'#E6F1FB', color:'#0C447C' },
  ];

  return (
    <div>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
        {ROUNDS.filter(r => r !== 'R128').map(r => (
          <span key={r} style={{
            padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:500,
            background:TIER_COLORS[r]+'22', color:TIER_COLORS[r], border:`1px solid ${TIER_COLORS[r]}44`
          }}>{r} = {scheme[r] || 0}pts</span>
        ))}
      </div>

      <div style={{ background:'#fff', border:'0.5px solid #e8e8e8', borderRadius:12, overflow:'hidden' }}>
        {ranked.length === 0
          ? <div style={{ padding:32, textAlign:'center', color:'#aaa', fontSize:13 }}>No teams yet</div>
          : ranked.map((t, i) => {
            const rc = rankColors[Math.min(i,2)] || { bg:'#f5f5f0', color:'#888' };
            return (
              <div key={t.id} style={{ borderBottom:'0.5px solid #f5f5f5' }}>
                <div style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px' }}>
                  <div style={{
                    width:30, height:30, borderRadius:'50%',
                    background:rc.bg, color:rc.color,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:13, fontWeight:700, flexShrink:0
                  }}>{i+1}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:14 }}>{t.name}</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:5 }}>
                      {(t.player_ids || []).map(pid => {
                        const p = players.find(x => x.id === pid);
                        if (!p) return null;
                        const round = results[pid];
                        const pts = round ? (scheme[round]||0) : 0;
                        return (
                          <span key={pid} style={{
                            fontSize:11, padding:'2px 8px', borderRadius:20,
                            background: round ? TIER_COLORS[round]+'22' : '#f5f5f0',
                            color: round ? TIER_COLORS[round] : '#666',
                            border: round ? `1px solid ${TIER_COLORS[round]}44` : 'none',
                            fontWeight: round ? 600 : 400
                          }}>
                            {p.name}{round ? ` +${pts}` : ` ${p.price}cr`}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:22, fontWeight:700, color:'#1D9E75' }}>{t.pts}</div>
                    <div style={{ fontSize:11, color:'#999' }}>points</div>
                  </div>
                </div>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}

// ─── Admin Tab ────────────────────────────────────────────────────────

function AdminTab({ players, setPlayers, config, setConfig, results, setResults, teams, toast }) {
  const [localScheme, setLocalScheme] = useState(config?.points_scheme || {});
  const [newPlayer, setNewPlayer] = useState({ name:'', country:'', price:'' });
  const [playerSearch, setPlayerSearch] = useState('');
  const [saving, setSaving] = useState(false);

  async function saveConfig(updates) {
    setSaving(true);
    const newConfig = { ...config, ...updates };
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
    if (players.length > 0 && !window.confirm('Replace all players with RG25 draw?')) return;
    setSaving(true);
    await supabase.from('players').delete().neq('id','__none__');
    const { error } = await supabase.from('players').insert(RG25_PLAYERS);
    setSaving(false);
    if (error) { toast('Error: ' + error.message, false); return; }
    setPlayers(RG25_PLAYERS);
    toast('Roland Garros 2025 draw loaded! (128 players)');
  }

  async function addPlayer() {
    if (!newPlayer.name || !newPlayer.price) { toast('Name and price required', false); return; }
    const p = { id:'p'+Date.now(), name:newPlayer.name, country:newPlayer.country||'', seed:null, price:+newPlayer.price };
    const { error } = await supabase.from('players').insert(p);
    if (error) { toast('Error: ' + error.message, false); return; }
    setPlayers([...players, p]);
    setNewPlayer({ name:'', country:'', price:'' });
    toast('Player added');
  }

  async function removePlayer(id) {
    await supabase.from('players').delete().eq('id', id);
    setPlayers(players.filter(p => p.id !== id));
  }

  async function setResult(pid, round) {
    if (!round) {
      await supabase.from('results').delete().eq('player_id', pid);
      setResults(r => { const n = {...r}; delete n[pid]; return n; });
    } else {
      await supabase.from('results').upsert({ player_id: pid, round }, { onConflict: 'player_id' });
      setResults(r => ({ ...r, [pid]: round }));
    }
  }

  const filteredPlayers = players.filter(p => p.name.toLowerCase().includes(playerSearch.toLowerCase()));

  return (
    <div>
      {/* Tournament settings */}
      <Section title="Tournament settings">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
          <div>
            <div style={{ fontSize:11, color:'#999', marginBottom:4 }}>Tournament name</div>
            <input defaultValue={config?.tourney_name} onBlur={e => saveConfig({ tourney_name: e.target.value })}
              style={{ width:'100%', padding:'7px 10px', borderRadius:8, border:'0.5px solid #ccc', fontSize:13 }} />
          </div>
          <div>
            <div style={{ fontSize:11, color:'#999', marginBottom:4 }}>Budget cap (credits)</div>
            <input type="number" defaultValue={config?.budget_cap} onBlur={e => saveConfig({ budget_cap: +e.target.value })}
              style={{ width:'100%', padding:'7px 10px', borderRadius:8, border:'0.5px solid #ccc', fontSize:13 }} />
          </div>
          <div>
            <div style={{ fontSize:11, color:'#999', marginBottom:4 }}>Submission deadline</div>
            <input type="datetime-local" defaultValue={config?.submission_deadline?.slice(0,16)}
              onBlur={e => saveConfig({ submission_deadline: e.target.value ? new Date(e.target.value).toISOString() : null })}
              style={{ width:'100%', padding:'7px 10px', borderRadius:8, border:'0.5px solid #ccc', fontSize:13 }} />
          </div>
          <div>
            <div style={{ fontSize:11, color:'#999', marginBottom:4 }}>Leaderboard visible</div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:6 }}>
              <input type="checkbox" id="lb-visible" checked={!!config?.leaderboard_visible}
                onChange={e => saveConfig({ leaderboard_visible: e.target.checked })}
                style={{ width:16, height:16, cursor:'pointer' }} />
              <label htmlFor="lb-visible" style={{ fontSize:13, cursor:'pointer' }}>
                {config?.leaderboard_visible ? 'Visible to all users' : 'Hidden from users'}
              </label>
            </div>
          </div>
        </div>
        <div style={{ fontSize:12, color:'#999' }}>Changes save automatically on blur (click away)</div>
      </Section>

      {/* Points scheme */}
      <Section title="Points scheme">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:8, marginBottom:12 }}>
          {ROUNDS.map(r => (
            <div key={r} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:'#f8f8f5', borderRadius:8 }}>
              <span style={{ fontSize:12, color:TIER_COLORS[r], fontWeight:700, flex:1 }}>{r}</span>
              <input type="number" value={localScheme[r] ?? 0}
                onChange={e => setLocalScheme(s => ({...s, [r]:+e.target.value}))}
                style={{ width:56, textAlign:'center', padding:'4px 6px', borderRadius:6, border:'0.5px solid #ddd', fontSize:13 }} />
              <span style={{ fontSize:11, color:'#999' }}>pts</span>
            </div>
          ))}
        </div>
        <Btn primary onClick={saveScheme} disabled={saving}>Save scheme</Btn>
      </Section>

      {/* Players */}
      <Section title={`Players (${players.length})`}>
        <div style={{ display:'flex', gap:8, marginBottom:10, flexWrap:'wrap' }}>
          <input value={newPlayer.name} onChange={e => setNewPlayer(s => ({...s,name:e.target.value}))}
            placeholder="Name" style={{ flex:2, minWidth:120, padding:'7px 10px', borderRadius:8, border:'0.5px solid #ccc', fontSize:13 }} />
          <input value={newPlayer.country} onChange={e => setNewPlayer(s => ({...s,country:e.target.value}))}
            placeholder="CTY" style={{ width:70, padding:'7px 10px', borderRadius:8, border:'0.5px solid #ccc', fontSize:13 }} />
          <input type="number" value={newPlayer.price} onChange={e => setNewPlayer(s => ({...s,price:e.target.value}))}
            placeholder="Price" style={{ width:80, padding:'7px 10px', borderRadius:8, border:'0.5px solid #ccc', fontSize:13 }} />
          <Btn primary onClick={addPlayer}>+ Add</Btn>
        </div>
        <div style={{ display:'flex', gap:8, marginBottom:10 }}>
          <Btn onClick={loadRG25} disabled={saving}>⬇ Load RG25 draw (128 players)</Btn>
        </div>
        <input value={playerSearch} onChange={e => setPlayerSearch(e.target.value)}
          placeholder="Search…" style={{ width:'100%', padding:'7px 10px', borderRadius:8, border:'0.5px solid #ccc', fontSize:13, marginBottom:8 }} />
        <div style={{ maxHeight:300, overflowY:'auto', border:'0.5px solid #eee', borderRadius:8 }}>
          {filteredPlayers.map(p => (
            <div key={p.id} style={{ display:'flex', gap:8, alignItems:'center', padding:'7px 12px', borderBottom:'0.5px solid #f8f8f8' }}>
              <span style={{ width:24, fontSize:11, color:'#aaa', textAlign:'center' }}>{p.seed||'—'}</span>
              <span style={{ flex:1, fontSize:13 }}>{p.name} <span style={{ color:'#bbb' }}>{p.country}</span></span>
              <span style={{ fontSize:13, fontWeight:600, color:'#0F6E56' }}>{p.price}cr</span>
              <Btn small danger onClick={() => removePlayer(p.id)}>✕</Btn>
            </div>
          ))}
          {filteredPlayers.length === 0 && <div style={{ padding:16, color:'#aaa', textAlign:'center', fontSize:13 }}>No players. Load the RG25 draw or add manually.</div>}
        </div>
      </Section>

      {/* Results */}
      <Section title="Round results">
        <div style={{ fontSize:12, color:'#999', marginBottom:10 }}>Mark which round each player reached. Points update for all teams instantly.</div>
        <div style={{ maxHeight:420, overflowY:'auto' }}>
          {players.map(p => (
            <div key={p.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:'0.5px solid #f8f8f8' }}>
              <div style={{ flex:1, fontSize:13 }}>{p.name} <span style={{ color:'#ccc', fontSize:11 }}>{p.country}</span></div>
              <select value={results[p.id] || ''}
                onChange={e => setResult(p.id, e.target.value)}
                style={{ padding:'4px 8px', borderRadius:6, border:'0.5px solid #ddd', fontSize:12 }}>
                <option value="">No result</option>
                {ROUNDS.map(r => (
                  <option key={r} value={r}>{ROUND_LABELS[r]} (+{localScheme[r]||0}pts)</option>
                ))}
              </select>
              {results[p.id] && (
                <span style={{ fontSize:12, color:'#1D9E75', fontWeight:700, minWidth:40 }}>
                  +{localScheme[results[p.id]]||0}
                </span>
              )}
            </div>
          ))}
          {players.length === 0 && <div style={{ padding:16, color:'#aaa', fontSize:13 }}>Load players first.</div>}
        </div>

        {/* Teams summary in admin */}
        <div style={{ marginTop:16, paddingTop:16, borderTop:'0.5px solid #f0f0f0' }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:8 }}>Teams submitted ({teams.length})</div>
          {teams.map(t => (
            <div key={t.id} style={{ fontSize:12, color:'#666', padding:'4px 0', borderBottom:'0.5px solid #f8f8f8' }}>
              <span style={{ fontWeight:500 }}>{t.name}</span> — {(t.player_ids||[]).length} players — {getTeamPoints(t, results, localScheme)}pts
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────

export default function FantaTennis() {
  const [tab, setTab] = useState('pick');
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [results, setResults] = useState({});
  const [config, setConfig] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchAll() {
    setLoading(true);
    try {
      const [{ data: pl }, { data: tm }, { data: rs }, { data: cf }] = await Promise.all([
        supabase.from('players').select('*').order('seed', { ascending: true, nullsFirst: false }),
        supabase.from('teams').select('*').order('created_at'),
        supabase.from('results').select('*'),
        supabase.from('config').select('*').eq('id', 1).single(),
      ]);
      setPlayers(pl || []);
      setTeams(tm || []);
      const rMap = {};
      (rs || []).forEach(r => { rMap[r.player_id] = r.round; });
      setResults(rMap);
      setConfig(cf || null);
    } catch(e) {
      setError('Could not connect to database: ' + e.message);
    }
    setLoading(false);
  }

  useEffect(() => { fetchAll(); }, []);

  // Poll for updates every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      supabase.from('teams').select('*').order('created_at').then(({ data }) => { if (data) setTeams(data); });
      supabase.from('results').select('*').then(({ data }) => {
        if (data) { const m = {}; data.forEach(r => { m[r.player_id] = r.round; }); setResults(m); }
      });
      supabase.from('config').select('*').eq('id',1).single().then(({ data }) => { if (data) setConfig(data); });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  function showToast(msg, ok=true) { setToast({ msg, ok, key: Date.now() }); }

  const tabs = [
    { id:'pick', label:'🎾 Pick team' },
    { id:'leaderboard', label:'🏆 Leaderboard' },
    { id:'admin', label:'⚙ Admin' },
  ];

  if (loading) return (
    <div style={{ padding:60, textAlign:'center', color:'#888', fontSize:14 }}>
      <div style={{ fontSize:32, marginBottom:12 }}>🎾</div>
      Connecting to database…
    </div>
  );

  if (error) return (
    <div style={{ padding:40, textAlign:'center', color:'#A32D2D', fontSize:13 }}>
      <div style={{ fontSize:32, marginBottom:12 }}>⚠️</div>
      {error}
    </div>
  );

  return (
    <div style={{ fontFamily:'system-ui, sans-serif', fontSize:14, color:'#222', paddingBottom:40 }}>
      {toast && <Toast key={toast.key} msg={toast.msg} ok={toast.ok} onDone={() => setToast(null)} />}

      <div style={{ display:'flex', alignItems:'center', gap:12, paddingBottom:14, borderBottom:'0.5px solid #e8e8e8', marginBottom:16, flexWrap:'wrap' }}>
        <div>
          <div style={{ fontSize:20, fontWeight:700, letterSpacing:'-0.5px' }}>
            Fanta<span style={{ color:'#1D9E75' }}>Tennis</span>
          </div>
          <div style={{ fontSize:12, color:'#999' }}>{config?.tourney_name || 'Tournament'} · {teams.length} teams</div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:4, flexWrap:'wrap' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding:'7px 16px', borderRadius:8, border:'0.5px solid',
              cursor:'pointer', fontSize:13, fontWeight: tab===t.id ? 600 : 400,
              borderColor: tab===t.id ? '#1D9E75' : '#e0e0e0',
              background: tab===t.id ? '#E1F5EE' : 'transparent',
              color: tab===t.id ? '#0F6E56' : '#666',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {tab === 'pick' && (
        <PickTab players={players} config={config} results={results} toast={showToast}
          onSubmit={() => supabase.from('teams').select('*').order('created_at').then(({ data }) => { if (data) setTeams(data); })} />
      )}
      {tab === 'leaderboard' && (
        <LeaderboardTab teams={teams} players={players} results={results} config={config} />
      )}
      {tab === 'admin' && (
        <AdminTab players={players} setPlayers={setPlayers} config={config} setConfig={setConfig}
          results={results} setResults={setResults} teams={teams} toast={showToast} />
      )}
    </div>
  );
}
