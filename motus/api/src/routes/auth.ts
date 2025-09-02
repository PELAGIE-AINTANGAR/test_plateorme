import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

export async function authRoutes(app: FastifyInstance, opts: FastifyPluginOptions & { prisma: PrismaClient }) {
  const prisma = opts.prisma;

  const RegisterSchema = z.object({
    email: z.string().email(),
    username: z.string().min(3).max(24),
    password: z.string().min(8)
  });

  app.post('/register', async (req, reply) => {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const { email, username, password } = parsed.data;
    const hash = await bcrypt.hash(password, 10);
    try {
      const user = await prisma.user.create({ data: { email, username, passwordHash: hash } });
      return { id: user.id, email: user.email, username: user.username };
    } catch (e:any) {
      return reply.code(400).send({ error: 'Email ou username déjà utilisé' });
    }
  });

  const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8)
  });

  app.post('/login', async (req, reply) => {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return reply.code(401).send({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return reply.code(401).send({ error: 'Invalid credentials' });
    const token = await reply.jwtSign({ sub: user.id, email: user.email, username: user.username });
    return { token, user: { id: user.id, email: user.email, username: user.username } };
  });
}
