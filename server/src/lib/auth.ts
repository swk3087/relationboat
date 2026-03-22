import { FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { prisma } from './prisma.js';
import { config } from './config.js';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }

  interface FastifyRequest {
    authUser: {
      userId: string;
      email: string;
    };
  }
}

type SingleUser = {
  id: string;
  email: string;
};

let singleUserPromise: Promise<SingleUser> | null = null;

const getOrCreateSingleUser = async (): Promise<SingleUser> => {
  if (!singleUserPromise) {
    singleUserPromise = (async () => {
      const user = await prisma.user.upsert({
        where: { email: config.singleUserEmail },
        update: { name: config.singleUserName },
        create: {
          email: config.singleUserEmail,
          name: config.singleUserName,
        },
        select: { id: true, email: true },
      });

      await prisma.setting.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          storageMode: config.defaultStorageMode,
        },
      });

      return user;
    })().catch((error) => {
      singleUserPromise = null;
      throw error;
    });
  }

  return singleUserPromise;
};

export const authPlugin = fp(async (app) => {
  app.decorate('authenticate', async (request: FastifyRequest, _reply: FastifyReply) => {
    const user = await getOrCreateSingleUser();
    request.authUser = { userId: user.id, email: user.email };
  });
});
