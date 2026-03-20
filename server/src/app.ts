import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import multipart from '@fastify/multipart';
import { Prisma } from '@prisma/client';
import { authPlugin } from './lib/auth.js';
import { AppError } from './lib/app-error.js';
import { config } from './lib/config.js';
import authRoutes from './routes/auth.js';
import peopleRoutes from './routes/people.js';
import relationshipRoutes from './routes/relationships.js';
import dailyMemoRoutes from './routes/daily-memos.js';
import settingsRoutes from './routes/settings.js';
import exportRoutes from './routes/export.js';
import folderRoutes from './routes/folders.js';
import searchRoutes from './routes/search.js';
import fontRoutes from './routes/fonts.js';
import contactsRoutes from './routes/contacts.js';

export const buildApp = () => {
  const app = Fastify({ logger: true });

  app.register(sensible);
  app.register(cors, { origin: config.appOrigin, credentials: true });
  app.register(multipart, { limits: { fileSize: 2 * 1024 * 1024 } });
  app.register(authPlugin);

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        error: error.error,
        message: error.message,
      });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return reply.status(409).send({
        statusCode: 409,
        error: 'Conflict',
        message: 'Duplicate resource.',
      });
    }

    request.log.error(error);
    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Unexpected server error',
    });
  });

  app.get('/health', async () => ({ status: 'ok', domain: config.serviceDomain }));

  app.register(async (protectedApp) => {
    protectedApp.addHook('preHandler', protectedApp.authenticate);
    protectedApp.register(folderRoutes);
    protectedApp.register(peopleRoutes);
    protectedApp.register(relationshipRoutes);
    protectedApp.register(searchRoutes);
    protectedApp.register(dailyMemoRoutes);
    protectedApp.register(settingsRoutes);
    protectedApp.register(exportRoutes);
    protectedApp.register(fontRoutes);
    protectedApp.register(contactsRoutes);
  }, { prefix: config.apiPrefix });

  app.register(authRoutes, { prefix: config.apiPrefix });

  return app;
};
