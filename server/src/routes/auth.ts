import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { verifyGoogleIdToken } from '../lib/google.js';
import { issueTokenPair, verifyRefreshToken } from '../lib/auth.js';
import { unauthorized } from '../lib/app-error.js';

const authRoutes: FastifyPluginAsync = async (app) => {
  app.post('/auth/google', async (request, reply) => {
    const body = request.body as { idToken?: string };
    if (!body?.idToken) {
      return reply.badRequest('idToken is required');
    }

    let profile;
    try {
      profile = await verifyGoogleIdToken(body.idToken);
    } catch {
      throw unauthorized('Invalid Google ID token');
    }

    const user = await prisma.user.upsert({
      where: { email: profile.email },
      update: {
        name: profile.name,
        avatarUrl: profile.picture,
        googleSub: profile.sub,
      },
      create: {
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.picture,
        googleSub: profile.sub,
        settings: {
          create: {},
        },
      },
    });

    await prisma.syncAccount.upsert({
      where: { provider_providerAccountId: { provider: 'google', providerAccountId: profile.sub } },
      update: { userId: user.id },
      create: { userId: user.id, provider: 'google', providerAccountId: profile.sub },
    });

    const tokens = await issueTokenPair(app, { userId: user.id, email: user.email });
    return reply.send({ user, tokens, tokenType: 'Bearer' });
  });

  app.post('/auth/refresh', async (request, reply) => {
    try {
      const payload = await verifyRefreshToken(request);
      const tokens = await issueTokenPair(app, { userId: payload.userId, email: payload.email });
      return reply.send(tokens);
    } catch {
      return reply.unauthorized('Invalid refresh token');
    }
  });
};

export default authRoutes;
