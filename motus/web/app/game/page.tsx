'use client';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
const maskToEmoji = (m: ('C'|'P'|'A')[]) =>
  m.map(x => (x === 'C' ? '🟥' : x === 'P' ? '🟡' : '🟦')).join(' ');

type Mask = ('C'|'P'|'A')[];

function Cell({ ch, m }:{ ch:string, m?:'C'|'P'|'A' }){
  const base = 'cell';
  if (m === 'C') return <div className={base+' red-square'}>{ch}</div>;
  if (m === 'P') return <div className={base+' yellow-circle'}>{ch}</div>;
  if (m === 'A') return <div className={base+' blue'}>{ch}</div>;
  return <div className={base+' blue'}>{ch}</div>;
}

export default function GamePage() {
  const [token, setToken] = useState<string|undefined>();
  const [difficulty, setDifficulty] = useState<'easy'|'medium'|'hard'>('easy');
  const [gameId, setGameId] = useState<number|undefined>();
  const [length, setLength] = useState<number>(5);
  const [firstLetter, setFirstLetter] = useState<string>('');
  const [rows, setRows] = useState<{ guess: string, mask?: Mask }[]>([]);
  const [current, setCurrent] = useState('');
  const [status, setStatus] = useState<'in_progress'|'won'|'lost'>('in_progress');
  const [info, setInfo] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('motus_token') || '';
    if (!t) window.location.href = '/';
    setToken(t);
  }, []);

  const start = async () => {
    setInfo('');
    setRows([]);
    setStatus('in_progress');
    const r = await fetch(`${API}/games/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ difficulty })
    });
    if (!r.ok) { setInfo('Erreur démarrage'); return; }
    const data = await r.json();
    setGameId(data.gameId);
    setLength(data.length);
    setFirstLetter((data.firstLetter || '').toUpperCase());
  };

  const sendGuess = async () => {
    if (!gameId) return;
    if (current.length !== length) { setInfo(`Longueur attendue: ${length}`); return; }
    const r = await fetch(`${API}/games/${gameId}/guess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ guess: current })
    });
    const data = await r.json();
    if (!r.ok) { setInfo(data.error || 'Erreur'); return; }
    setRows(data.guesses);
    setStatus(data.status);
    setCurrent('');
  };

  const cols = `repeat(${length}, minmax(0, 1fr))`;
  const displayRows = Array.from({ length: 6 }, (_, i) => rows[i] || { guess: '' });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Motus – Partie</h1>
        <div className="flex gap-2 items-center">
          <select value={difficulty} onChange={e=>setDifficulty(e.target.value as any)} className="text-black p-2 rounded">
            <option value="easy">Facile (4–5)</option>
            <option value="medium">Moyen (6–7)</option>
            <option value="hard">Difficile (8+)</option>
          </select>
          <button onClick={start} className="px-3 py-2 bg-blue-600 rounded">Nouvelle partie</button>
        </div>
      </div>

      <div className="space-y-2">
        <div style={{ display:'grid', gridTemplateColumns: cols }} className="grid">
          {/* 6 lignes */}
          {displayRows.map((row, rowIdx) => {
            const letters = (rowIdx===0 && firstLetter ? (row.guess.padEnd(length).split('')) : row.guess.padEnd(length).split(''));
            return letters.map((ch, colIdx) => {
              const isFirst = colIdx === 0;
              const displayChar = (row.mask ? row.guess[colIdx] || '' : (isFirst && rowIdx===0 ? firstLetter : ch || ''));
              const m = row.mask?.[colIdx];
              return <Cell key={`${rowIdx}-${colIdx}`} ch={(displayChar||' ').toUpperCase()} m={m as any} />;
            });
          })}
        </div>
      </div>
      <div className="space-y-1">
        {rows.map((r, i) => r.mask && (
          <div key={`emoji-${i}`} className="text-lg">{maskToEmoji(r.mask as any)}</div>
        ))}
      </div>
      <div className="text-sm opacity-80 space-x-4">
        <span>🟥 bien placé</span>
        <span>🟡 mal placé</span>
        <span>🟦 absent</span>
      </div>

      {status === 'in_progress' && (
        <div className="flex gap-2">
          <input className="p-2 rounded text-black" placeholder={`Votre mot (${length})`} value={current} onChange={e=>setCurrent(e.target.value)} />
          <button onClick={sendGuess} className="px-3 py-2 bg-green-600 rounded">Valider</button>
        </div>
      )}
      {status !== 'in_progress' && (
        <div className="p-3 rounded bg-white/10">
          {status === 'won' ? 'Bravo, gagné !' : 'Perdu — retentez votre chance.'}
        </div>
      )}
      {info && <p className="opacity-80">{info}</p>}

      <div>
        <a className="underline" href="/leaderboard">Voir le classement</a>
      </div>
    </div>
  );
}
