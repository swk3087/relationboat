import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { assertFolderOwnership, assertPersonInFolder } from '../services/folder-scope.js';

const peopleRoutes: FastifyPluginAsync = async (app) => {
  app.post('/folders/:folderId/people', async (request, reply) => {
    const { folderId } = request.params as { folderId: string };
    const body = request.body as { name?: string; phone?: string | null; memo?: string | null };

    await assertFolderOwnership(request.authUser.userId, folderId);
    if (!body?.name?.trim()) {
      return reply.badRequest('name is required');
    }

    const person = await prisma.person.create({
      data: {
        folderId,
        name: body.name.trim(),
        phone: body.phone?.trim() || null,
        memo: body.memo?.trim() || null,
      },
    });

    return reply.code(201).send(person);
  });

  app.get('/folders/:folderId/people', async (request) => {
    const { folderId } = request.params as { folderId: string };
    await assertFolderOwnership(request.authUser.userId, folderId);
    return prisma.person.findMany({ where: { folderId }, orderBy: [{ name: 'asc' }, { createdAt: 'asc' }] });
  });

  app.get('/folders/:folderId/people/:personId', async (request) => {
    const { folderId, personId } = request.params as { folderId: string; personId: string };
    await assertFolderOwnership(request.authUser.userId, folderId);
    return assertPersonInFolder(folderId, personId);
  });

  app.patch('/folders/:folderId/people/:personId', async (request, reply) => {
    const { folderId, personId } = request.params as { folderId: string; personId: string };
    const body = request.body as { name?: string; phone?: string | null; memo?: string | null };

    await assertFolderOwnership(request.authUser.userId, folderId);
    await assertPersonInFolder(folderId, personId);

    if (body.name !== undefined && !body.name.trim()) {
      return reply.badRequest('name cannot be empty');
    }

    return prisma.person.update({
      where: { id: personId },
      data: {
        name: body.name?.trim(),
        phone: body.phone === undefined ? undefined : body.phone?.trim() || null,
        memo: body.memo === undefined ? undefined : body.memo?.trim() || null,
      },
    });
  });

  app.delete('/folders/:folderId/people/:personId', async (request, reply) => {
    const { folderId, personId } = request.params as { folderId: string; personId: string };
    await assertFolderOwnership(request.authUser.userId, folderId);
    await assertPersonInFolder(folderId, personId);

    await prisma.person.delete({ where: { id: personId } });
    return reply.code(204).send();
  });
};

export default peopleRoutes;
