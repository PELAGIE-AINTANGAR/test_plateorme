import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { PrismaClient } from '@prisma/client';
import { authRoutes } from './routes/auth.js';
import { gameRoutes } from './routes/games.js';
import { leaderboardRoutes } from './routes/leaderboard.js';

const prisma = new PrismaClient();
const app = Fastify({ logger: true });

await app.register(cors, {
  origin: (origin, cb) => cb(null, true), // TODO: restreindre en prod
  credentials: true
});
await app.register(jwt, { secret: process.env.JWT_SECRET || 'change-me-super-secret' });

// Auth middleware
app.decorate('authenticate', async (request: any, reply: any) => {
  try {
    await request.jwtVerify();
  } catch {
    reply.code(401).send({ error: 'Unauthorized' });
  }
});

// 👉 Route d'accueil (pour éviter le 404 sur "/")
app.get('/', async () => ({
  name: 'motus-api',
  version: '0.1.0',
  docs: ['GET /health'],
  auth: ['POST /auth/register', 'POST /auth/login'],
  game: ['POST /games/start', 'POST /games/:id/guess'],
  leaderboard: ['GET /leaderboard/top']
}));

// Ping
app.get('/health', async () => ({ ok: true }));

// Routes
await app.register(authRoutes as any, { prefix: '/auth', prisma });
await app.register(gameRoutes as any, { prefix: '/games', prisma });
await app.register(leaderboardRoutes as any, { prefix: '/leaderboard', prisma });

// Start
const port = Number(process.env.PORT || 4000);
app.listen({ port, host: '0.0.0.0' }).catch(async (e) => {
  app.log.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

// Typage optionnel
declare module 'fastify' {
  interface FastifyInstance { authenticate: any; }
  interface FastifyRequest { user: any; jwtVerify: any; }
}
