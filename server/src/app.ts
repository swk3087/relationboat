import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import multipart from '@fastify/multipart';
import { authPlugin } from './lib/auth.js';
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

export const buildApp = () => {
  const app = Fastify({ logger: true });

  app.register(sensible);
  app.register(cors, { origin: true, credentials: true });
  app.register(multipart, { limits: { fileSize: 2 * 1024 * 1024 } });
  app.register(authPlugin);

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
  }, { prefix: config.apiPrefix });

  app.register(authRoutes, { prefix: config.apiPrefix });

  return app;
};
