import path from 'node:path';
import { FastifyPluginAsync } from 'fastify';
import { badRequest } from '../lib/app-error.js';
import { prisma } from '../lib/prisma.js';
import { assertFolderOwnership } from '../services/folder-scope.js';
import { parseVcardContacts } from '../services/vcard.js';

const allowedExtensions = new Set(['.vcf', '.vcard']);
const maxExistingCheckChunk = 100;

const asUniqueKey = (name: string, phone: string | null) => `${name.toLowerCase()}|${phone ?? ''}`;

const contactsRoutes: FastifyPluginAsync = async (app) => {
  app.post('/folders/:folderId/contacts/import', async (request, reply) => {
    const { folderId } = request.params as { folderId: string };
    await assertFolderOwnership(request.authUser.userId, folderId);

    const file = await request.file();
    if (!file) {
      return reply.badRequest('VCF file is required');
    }

    const extension = path.extname(file.filename).toLowerCase();
    if (!allowedExtensions.has(extension)) {
      throw badRequest('Only .vcf or .vcard files are supported');
    }

    const rawContacts = parseVcardContacts(await file.toBuffer());
    const candidates = rawContacts.filter((item) => Boolean(item.name.trim() || item.phone));
    if (candidates.length === 0) {
      throw badRequest('No valid contacts were found in the uploaded file');
    }

    const existingKeys = new Set<string>();

    for (let index = 0; index < candidates.length; index += maxExistingCheckChunk) {
      const batch = candidates.slice(index, index + maxExistingCheckChunk);
      const existing = await prisma.person.findMany({
        where: {
          folderId,
          OR: batch.map((item) => ({ name: item.name, phone: item.phone })),
        },
        select: { name: true, phone: true },
      });

      for (const person of existing) {
        existingKeys.add(asUniqueKey(person.name, person.phone));
      }
    }

    const toCreate = candidates
      .filter((item) => !existingKeys.has(asUniqueKey(item.name, item.phone)))
      .map((item) => ({
        folderId,
        name: item.name,
        phone: item.phone,
        memo: item.memo,
      }));

    if (toCreate.length > 0) {
      await prisma.person.createMany({ data: toCreate });
    }

    return {
      detected: candidates.length,
      imported: toCreate.length,
      skippedDuplicates: candidates.length - toCreate.length,
      preview: toCreate.slice(0, 20),
    };
  });
};

export default contactsRoutes;
