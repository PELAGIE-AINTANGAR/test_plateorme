'use client';
import { useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

export default function Page() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string|undefined>(undefined);
  const [info, setInfo] = useState<string>('');

  const register = async () => {
    setInfo('');
    const r = await fetch(`${API}/auth/register`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, username, password }) });
    if (!r.ok) { setInfo('Echec inscription'); return; }
    setInfo('Inscription ok, vous pouvez vous connecter.');
  };

  const login = async () => {
    setInfo('');
    const r = await fetch(`${API}/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password }) });
    if (!r.ok) { setInfo('Echec connexion'); return; }
    const data = await r.json();
    setToken(data.token);
    localStorage.setItem('motus_token', data.token);
    window.location.href = '/game';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Motus – Connexion</h1>
      <div className="grid grid-cols-1 gap-4">
        <input placeholder="Email" className="p-3 rounded text-black" value={email} onChange={e=>setEmail(e.target.value)} />
        <input placeholder="Nom d'utilisateur" className="p-3 rounded text-black" value={username} onChange={e=>setUsername(e.target.value)} />
        <input placeholder="Mot de passe" type="password" className="p-3 rounded text-black" value={password} onChange={e=>setPassword(e.target.value)} />
      </div>
      <div className="flex gap-3">
        <button onClick={register} className="px-4 py-2 bg-blue-600 rounded">Créer un compte</button>
        <button onClick={login} className="px-4 py-2 bg-green-600 rounded">Se connecter</button>
      </div>
      {info && <p className="text-sm opacity-80">{info}</p>}
      <p className="opacity-70">Après connexion, vous serez redirigé vers la page du jeu.</p>
    </div>
  );
}
