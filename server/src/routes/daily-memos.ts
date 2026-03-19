import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { canEditMemo, parseDateOnly } from '../utils/date.js';

const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'navy', 'purple', 'white', 'black'] as const;
type DailyMemoColor = (typeof colors)[number];
const colorSet = new Set<string>(colors);

const dailyMemoRoutes: FastifyPluginAsync = async (app) => {
  app.post('/daily-memos', async (request, reply) => {
    const body = request.body as { date?: string; content?: string; color?: DailyMemoColor; intensity?: number };
    if (!body?.date || !body.content?.trim() || !body.color || body.intensity === undefined) {
      return reply.badRequest('date, content, color, intensity are required');
    }
    if (!colorSet.has(body.color)) {
      return reply.badRequest('Invalid color');
    }
    if (!Number.isInteger(body.intensity) || body.intensity < 1 || body.intensity > 5) {
      return reply.badRequest('intensity must be an integer between 1 and 5');
    }

    const memoDate = parseDateOnly(body.date);
    return prisma.dailyMemo.upsert({
      where: { userId_memoDate: { userId: request.authUser.userId, memoDate } },
      update: {
        content: body.content.trim(),
        color: body.color,
        intensity: body.intensity,
      },
      create: {
        userId: request.authUser.userId,
        memoDate,
        content: body.content.trim(),
        color: body.color,
        intensity: body.intensity,
      },
    });
  });

  app.get('/daily-memos', async (request, reply) => {
    const { date } = request.query as { date?: string };
    if (!date) {
      return reply.badRequest('date is required');
    }
    const memoDate = parseDateOnly(date);
    return prisma.dailyMemo.findUnique({ where: { userId_memoDate: { userId: request.authUser.userId, memoDate } } });
  });

  app.get('/daily-memos/search', async (request) => {
    const { q } = request.query as { q?: string };
    return prisma.dailyMemo.findMany({
      where: {
        userId: request.authUser.userId,
        ...(q ? { content: { contains: q, mode: 'insensitive' } } : {}),
      },
      orderBy: { memoDate: 'desc' },
    });
  });

  app.patch('/daily-memos/:memoId', async (request, reply) => {
    const { memoId } = request.params as { memoId: string };
    const body = request.body as { content?: string; color?: DailyMemoColor; intensity?: number };
    const memo = await prisma.dailyMemo.findFirst({ where: { id: memoId, userId: request.authUser.userId } });
    if (!memo) return reply.notFound('Daily memo not found');
    if (!canEditMemo(memo.memoDate)) return reply.forbidden('Daily memos can only be edited on the memo date and the following day');
    if (body.color && !colorSet.has(body.color)) return reply.badRequest('Invalid color');
    if (body.intensity !== undefined && (!Number.isInteger(body.intensity) || body.intensity < 1 || body.intensity > 5)) return reply.badRequest('intensity must be an integer between 1 and 5');

    return prisma.dailyMemo.update({
      where: { id: memoId },
      data: {
        content: body.content?.trim(),
        color: body.color,
        intensity: body.intensity,
      },
    });
  });

  app.delete('/daily-memos/:memoId', async (request, reply) => {
    const { memoId } = request.params as { memoId: string };
    const memo = await prisma.dailyMemo.findFirst({ where: { id: memoId, userId: request.authUser.userId } });
    if (!memo) return reply.notFound('Daily memo not found');
    if (!canEditMemo(memo.memoDate)) return reply.forbidden('Daily memos can only be deleted on the memo date and the following day');
    await prisma.dailyMemo.delete({ where: { id: memoId } });
    return reply.code(204).send();
  });
};

export default dailyMemoRoutes;
