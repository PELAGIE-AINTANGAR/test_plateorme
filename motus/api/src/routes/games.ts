import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { z } from 'zod';
import { computeMask, difficultyToLengthRange, scoreFormula } from '../utils.js';

type GameStatus = 'in_progress' | 'won' | 'lost';
type Difficulty = 'easy' | 'medium' | 'hard';

export async function gameRoutes(app: FastifyInstance, opts: FastifyPluginOptions & { prisma: PrismaClient }) {
  const prisma = opts.prisma;

  const StartSchema = z.object({
    difficulty: z.enum(['easy','medium','hard'])
  });

  app.post('/start', { preValidation: [app.authenticate] }, async (req:any, reply) => {
    const parsed = StartSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const { difficulty } = parsed.data;
    const [minL, maxL] = difficultyToLengthRange(difficulty);

    let word: string | null = null;
    // Try up to 10 times to get a word with desired length
    for (let i=0; i<10; i++) {
      try {
        const r = await axios.get('https://random-words-api.vercel.app/word/french', { timeout: 5000 });
        const w = (r.data?.[0]?.word || '').trim();
        const clean = w.replace(/[\s\-']/g, '');
        if (clean.length >= minL && clean.length <= maxL && /^[A-Za-zÀ-ÖØ-öø-ÿ]+$/.test(clean)) {
          word = clean.normalize('NFC');
          break;
        }
      } catch {}
    }
    if (!word) {
      // fallback list
      const fallback = {
        easy: ['papa','lune','bale'],
        medium: ['orange','navire','chasse'],
        hard: ['papillon','grenadier','horlogers']
      } as const;
      const arr = fallback[difficulty];
      word = arr[Math.floor(Math.random()*arr.length)];
    }

    const createdWord = await prisma.word.upsert({
      where: { text: word! },
      create: { text: word!, length: word!.length, difficulty, language: 'fr', source: 'random-words-api' },
      update: {}
    });

    const userId = req.user?.sub;
    const game = await prisma.game.create({
      data: {
        userId,
        wordId: createdWord.id,
        difficulty,
        status: 'in_progress'
      },
      include: { word: true }
    });

    const firstLetter = game.word?.text[0] ?? '';
    return { gameId: game.id, length: game.word?.length, firstLetter };
  });

  const GuessSchema = z.object({
    guess: z.string().min(1)
  });

  app.post('/:id/guess', { preValidation: [app.authenticate] }, async (req:any, reply) => {
    const gameId = Number(req.params.id);
    const parsed = GuessSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const { guess } = parsed.data;

    const game = await prisma.game.findUnique({ where: { id: gameId }, include: { word: true, guesses: true, score: true } });
    if (!game) return reply.code(404).send({ error: 'Game not found' });
    if (game.userId !== req.user?.sub) return reply.code(403).send({ error: 'Forbidden' });
    if (!game.word) return reply.code(400).send({ error: 'No word bound to game' });
    if (game.status !== 'in_progress') return reply.code(400).send({ error: 'Game already finished' });
    if (game.guesses.length >= 6) return reply.code(400).send({ error: 'No attempts left' });

    const secret = game.word.text;
    if (guess.length !== secret.length) return reply.code(400).send({ error: 'Invalid guess length' });

    const mask = computeMask(secret.toLowerCase(), guess.toLowerCase());
    const attemptIndex = game.guesses.length + 1;
    await prisma.guess.create({
      data: { gameId: game.id, guessText: guess, resultMask: mask.join(','), attemptIndex }
    });

    let status: GameStatus = game.status;
    let endedAt = game.endedAt;
    let attemptsUsed = attemptIndex;
    if (mask.every(m => m === 'C')) {
      status = 'won';
      endedAt = new Date();
    } else if (attemptIndex >= 6) {
      status = 'lost';
      endedAt = new Date();
    }

    const updated = await prisma.game.update({
      where: { id: game.id },
      data: { status, endedAt, attemptsUsed },
      include: { word: true, guesses: { orderBy: { attemptIndex: 'asc' } } }
    });

    // score on finish
    if (status !== 'in_progress' && !game.score) {
      const durationMs = updated.startedAt && updated.endedAt ? (updated.endedAt.getTime() - updated.startedAt.getTime()) : 0;
      const points = scoreFormula(updated.difficulty, updated.attemptsUsed, durationMs);
      await prisma.score.create({
        data: { userId: updated.userId, gameId: updated.id, points, durationMs }
      });
    }

    return {
      status: updated.status,
      attemptsUsed: updated.attemptsUsed,
      guesses: updated.guesses.map(g => ({ attemptIndex: g.attemptIndex, guess: g.guessText, mask: g.resultMask.split(',') }))
    };
  });
}
