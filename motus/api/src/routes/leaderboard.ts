import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { PrismaClient } from '@prisma/client';

export async function leaderboardRoutes(app: FastifyInstance, opts: FastifyPluginOptions & { prisma: PrismaClient }) {
  const prisma = opts.prisma;

  app.get('/top', async (req, reply) => {
    const rows = await prisma.score.findMany({
      orderBy: [{ points: 'desc' }],
      take: 50,
      include: { user: true, game: true }
    });
    return rows.map(r => ({
      user: r.user.username,
      points: r.points,
      durationMs: r.durationMs,
      gameId: r.gameId
    }));
  });
}
