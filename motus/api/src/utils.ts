export function computeMask(secret: string, guess: string): ('C'|'P'|'A')[] {
  const s = secret.normalize('NFC');
  const g = guess.normalize('NFC');
  const n = s.length;
  const res: ('C'|'P'|'A')[] = Array(n).fill('A');

  const counts: Record<string, number> = {};
  for (let i = 0; i < n; i++) {
    const ch = s[i];
    counts[ch] = (counts[ch] || 0) + 1;
  }

  // First pass: correct positions
  for (let i = 0; i < n; i++) {
    if (g[i] === s[i]) {
      res[i] = 'C';
      counts[g[i]]! -= 1;
    }
  }
  // Second pass: present but misplaced
  for (let i = 0; i < n; i++) {
    if (res[i] === 'C') continue;
    const ch = g[i];
    if (counts[ch] && counts[ch] > 0) {
      res[i] = 'P';
      counts[ch] -= 1;
    } else {
      res[i] = 'A';
    }
  }
  return res;
}

export function difficultyToLengthRange(d: 'easy'|'medium'|'hard'): [number, number] {
  if (d === 'easy') return [4,5];
  if (d === 'medium') return [6,7];
  return [8, 12];
}

export function scoreFormula(difficulty: 'easy'|'medium'|'hard', attemptsUsed: number, durationMs: number): number {
  const base = difficulty === 'easy' ? 50 : difficulty === 'medium' ? 100 : 150;
  const bonus = 10 * (6 - attemptsUsed);
  const penalty = Math.floor(durationMs / 15000);
  return Math.max(0, base + bonus - penalty);
}
