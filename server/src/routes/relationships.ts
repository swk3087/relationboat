import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { assertFolderOwnership, assertPersonInFolder, assertRelationshipInFolder } from '../services/folder-scope.js';
import { findSimplePaths } from '../services/pathways.js';

const normalizeCategories = (categories?: string[]) => [...new Set((categories ?? []).map((value) => value.trim()).filter(Boolean))];

const relationshipRoutes: FastifyPluginAsync = async (app) => {
  app.post('/folders/:folderId/relationships', async (request, reply) => {
    const { folderId } = request.params as { folderId: string };
    const body = request.body as {
      fromPersonId?: string;
      toPersonId?: string;
      title?: string;
      memo?: string | null;
      categories?: string[];
    };

    await assertFolderOwnership(request.authUser.userId, folderId);
    if (!body.fromPersonId || !body.toPersonId || !body.title?.trim()) {
      return reply.badRequest('fromPersonId, toPersonId, and title are required');
    }

    if (body.fromPersonId === body.toPersonId) {
      return reply.badRequest('Self-loop relationships are disabled for the first release');
    }

    await assertPersonInFolder(folderId, body.fromPersonId);
    await assertPersonInFolder(folderId, body.toPersonId);

    const relationship = await prisma.relationshipEdge.create({
      data: {
        folderId,
        fromPersonId: body.fromPersonId,
        toPersonId: body.toPersonId,
        title: body.title.trim(),
        memo: body.memo?.trim() || null,
        allowSelfLoop: false,
        categories: {
          createMany: {
            data: normalizeCategories(body.categories).map((category) => ({ category })),
          },
        },
      },
      include: { categories: true },
    });

    return reply.code(201).send(relationship);
  });

  app.patch('/folders/:folderId/relationships/:relationshipId', async (request, reply) => {
    const { folderId, relationshipId } = request.params as { folderId: string; relationshipId: string };
    const body = request.body as {
      title?: string;
      memo?: string | null;
      categories?: string[];
    };

    await assertFolderOwnership(request.authUser.userId, folderId);
    await assertRelationshipInFolder(folderId, relationshipId);

    if (body.title !== undefined && !body.title.trim()) {
      return reply.badRequest('title cannot be empty');
    }

    const categories = body.categories ? normalizeCategories(body.categories) : undefined;

    return prisma.$transaction(async (tx: any) => {
      if (categories) {
        await tx.relationshipEdgeCategory.deleteMany({ where: { relationshipEdgeId: relationshipId } });
        if (categories.length > 0) {
          await tx.relationshipEdgeCategory.createMany({
            data: categories.map((category) => ({ relationshipEdgeId: relationshipId, category })),
          });
        }
      }

      return tx.relationshipEdge.update({
        where: { id: relationshipId },
        data: {
          title: body.title?.trim(),
          memo: body.memo === undefined ? undefined : body.memo?.trim() || null,
        },
        include: { categories: true },
      });
    });
  });

  app.delete('/folders/:folderId/relationships/:relationshipId', async (request, reply) => {
    const { folderId, relationshipId } = request.params as { folderId: string; relationshipId: string };
    await assertFolderOwnership(request.authUser.userId, folderId);
    await assertRelationshipInFolder(folderId, relationshipId);
    await prisma.relationshipEdge.delete({ where: { id: relationshipId } });
    return reply.code(204).send();
  });

  app.get('/folders/:folderId/relationships/search', async (request) => {
    const { folderId } = request.params as { folderId: string };
    const { fromPersonId, toPersonId, category, q } = request.query as {
      fromPersonId?: string;
      toPersonId?: string;
      category?: string;
      q?: string;
    };

    await assertFolderOwnership(request.authUser.userId, folderId);

    return prisma.relationshipEdge.findMany({
      where: {
        folderId,
        ...(fromPersonId ? { fromPersonId } : {}),
        ...(toPersonId ? { toPersonId } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { memo: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(category ? { categories: { some: { category } } } : {}),
      },
      include: { categories: true, fromPerson: true, toPerson: true },
      orderBy: { createdAt: 'desc' },
    });
  });

  app.get('/folders/:folderId/pathways', async (request, reply) => {
    const { folderId } = request.params as { folderId: string };
    const { sourceId, targetId, depth } = request.query as { sourceId?: string; targetId?: string; depth?: string };

    await assertFolderOwnership(request.authUser.userId, folderId);
    if (!sourceId || !targetId) {
      return reply.badRequest('sourceId and targetId are required');
    }

    const maxDepth = Number(depth ?? 3);
    if (!Number.isInteger(maxDepth) || maxDepth < 0 || maxDepth > 8) {
      return reply.badRequest('depth must be an integer between 0 and 8');
    }

    await assertPersonInFolder(folderId, sourceId);
    await assertPersonInFolder(folderId, targetId);

    const [nodes, edges] = await Promise.all([
      prisma.person.findMany({ where: { folderId }, select: { id: true, name: true, phone: true, memo: true } }),
      prisma.relationshipEdge.findMany({ where: { folderId }, include: { categories: true } }),
    ]);

    const pathways = findSimplePaths({
      sourceId,
      targetId,
      depth: maxDepth,
      nodes,
      edges,
    });

    return {
      sourceId,
      targetId,
      depth: maxDepth,
      graphFormat: 'relationboat.pathway.v1',
      pathways,
    };
  });
};

export default relationshipRoutes;
