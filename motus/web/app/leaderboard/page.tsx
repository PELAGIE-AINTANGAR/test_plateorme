'use client';
import { useEffect, useState } from 'react';
const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

export default function LeaderboardPage(){
  const [rows, setRows] = useState<any[]>([]);
  useEffect(()=>{
    fetch(`${API}/leaderboard/top`).then(r=>r.json()).then(setRows).catch(()=>{});
  },[]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Classement</h1>
      <div className="space-y-2">
        {rows.map((r,i)=> (
          <div key={i} className="p-3 rounded bg-white/10 flex items-center justify-between">
            <div className="font-bold">#{i+1} {r.user}</div>
            <div>{r.points} pts</div>
            <div>{Math.round(r.durationMs/1000)}s</div>
          </div>
        ))}
      </div>
      <a className="underline" href="/game">← Retour au jeu</a>
    </div>
  );
}
