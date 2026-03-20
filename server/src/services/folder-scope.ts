import { prisma } from '../lib/prisma.js';
import { notFound } from '../lib/app-error.js';

export const assertFolderOwnership = async (userId: string, folderId: string) => {
  const folder = await prisma.folder.findFirst({ where: { id: folderId, userId } });
  if (!folder) {
    throw notFound('Folder not found for current user');
  }
  return folder;
};

export const assertPersonInFolder = async (folderId: string, personId: string) => {
  const person = await prisma.person.findFirst({ where: { id: personId, folderId } });
  if (!person) {
    throw notFound('Person not found in folder');
  }
  return person;
};

export const assertRelationshipInFolder = async (folderId: string, relationshipId: string) => {
  const relationship = await prisma.relationshipEdge.findFirst({
    where: { id: relationshipId, folderId },
    include: { categories: true },
  });
  if (!relationship) {
    throw notFound('Relationship not found in folder');
  }
  return relationship;
};
