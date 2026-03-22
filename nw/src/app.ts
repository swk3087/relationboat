import Fastify from 'fastify';
import crypto from 'node:crypto';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import sensible from '@fastify/sensible';
import multipart from '@fastify/multipart';
import { Prisma } from '@prisma/client';
import { authPlugin } from './lib/auth.js';
import { AppError } from './lib/app-error.js';
import { config } from './lib/config.js';
import { createSessionStore, SessionRecord } from './lib/session-store.js';
import peopleRoutes from './routes/people.js';
import relationshipRoutes from './routes/relationships.js';
import dailyMemoRoutes from './routes/daily-memos.js';
import settingsRoutes from './routes/settings.js';
import exportRoutes from './routes/export.js';
import folderRoutes from './routes/folders.js';
import searchRoutes from './routes/search.js';
import fontRoutes from './routes/fonts.js';
import contactsRoutes from './routes/contacts.js';

declare module 'fastify' {
  interface FastifyRequest {
    sessionId: string | null;
    session: SessionRecord | null;
  }
}

const passwordsMatch = (providedPassword: string): boolean => {
  const expected = Buffer.from(config.appPassword);
  const actual = Buffer.from(providedPassword ?? '');

  if (expected.length !== actual.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, actual);
};

export const buildApp = () => {
  const app = Fastify({
    logger: true,
    trustProxy: true,
    keepAliveTimeout: 65_000,
    requestTimeout: 15_000,
    bodyLimit: 2 * 1024 * 1024,
  });
  const sessionStore = createSessionStore(config.sessionTtlMs);

  app.register(cookie);
  app.register(sensible);
  app.register(cors, { origin: config.appOrigin, credentials: true });
  app.register(multipart, { limits: { fileSize: 2 * 1024 * 1024 } });
  app.register(authPlugin);

  app.addHook('preHandler', async (request, reply) => {
    const sessionId = request.cookies[config.cookieName];
    if (!sessionId) {
      request.sessionId = null;
      request.session = null;
      return;
    }

    const session = sessionStore.get(sessionId);
    if (!session) {
      reply.clearCookie(config.cookieName, { path: '/' });
      request.sessionId = null;
      request.session = null;
      return;
    }

    sessionStore.touch(sessionId);
    request.sessionId = sessionId;
    request.session = session;
  });

  app.post<{ Body: { password?: string } }>('/api/auth/login', async (request, reply) => {
    const { password } = request.body ?? {};
    if (typeof password !== 'string' || password.length === 0) {
      return reply.status(400).send({ message: 'password is required' });
    }

    if (!passwordsMatch(password)) {
      return reply.status(401).send({ message: '비밀번호가 올바르지 않습니다.' });
    }

    const sessionId = sessionStore.create({ authenticated: true });
    reply.setCookie(config.cookieName, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.cookieSecure,
      path: '/',
      maxAge: Math.floor(config.sessionTtlMs / 1000),
    });

    return reply.status(204).send();
  });

  app.get('/api/auth/session', async (request, reply) => {
    if (!request.session?.authenticated) {
      return reply.status(401).send({ message: '인증 세션이 없습니다.' });
    }

    return reply.send({ authenticated: true });
  });

  app.post('/api/auth/logout', async (request, reply) => {
    if (request.sessionId) {
      sessionStore.delete(request.sessionId);
    }

    reply.clearCookie(config.cookieName, { path: '/' });
    return reply.status(204).send();
  });

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
    protectedApp.addHook('preHandler', async (request, reply) => {
      if (!request.session?.authenticated) {
        return reply.status(401).send({ message: '비밀번호 인증이 필요합니다.' });
      }
    });
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

  return app;
};
