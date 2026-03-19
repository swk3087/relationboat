import { prisma } from '../lib/prisma.js';

export const assertFolderOwnership = async (userId: string, folderId: string) => {
  const folder = await prisma.folder.findFirst({ where: { id: folderId, userId } });
  if (!folder) {
    throw new Error('Folder not found for current user');
  }
  return folder;
};

export const assertPersonInFolder = async (folderId: string, personId: string) => {
  const person = await prisma.person.findFirst({ where: { id: personId, folderId } });
  if (!person) {
    throw new Error('Person not found in folder');
  }
  return person;
};

export const assertRelationshipInFolder = async (folderId: string, relationshipId: string) => {
  const relationship = await prisma.relationshipEdge.findFirst({
    where: { id: relationshipId, folderId },
    include: { categories: true },
  });
  if (!relationship) {
    throw new Error('Relationship not found in folder');
  }
  return relationship;
};
