import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma.js';

const folderRoutes: FastifyPluginAsync = async (app) => {
  app.post('/folders', async (request, reply) => {
    const body = request.body as { name?: string };
    if (!body?.name?.trim()) {
      return reply.badRequest('name is required');
    }

    const folder = await prisma.folder.create({
      data: { userId: request.authUser.userId, name: body.name.trim() },
    });

    return reply.code(201).send(folder);
  });

  app.get('/folders', async (request) => prisma.folder.findMany({ where: { userId: request.authUser.userId }, orderBy: { createdAt: 'asc' } }));
};

export default folderRoutes;
