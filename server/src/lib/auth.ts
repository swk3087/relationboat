import { FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import jwt, { SignOptions } from 'jsonwebtoken';
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
      refreshTokenId?: string;
    };
  }
}

type JwtPayload = {
  userId: string;
  email: string;
  refreshTokenId?: string;
};

export const authPlugin = fp(async (app) => {
  await app.register(fastifyJwt, {
    secret: config.jwtAccessSecret,
  });

  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const payload = await request.jwtVerify<JwtPayload>();
      const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { id: true, email: true } });
      if (!user) {
        return reply.unauthorized('User no longer exists');
      }
      request.authUser = { userId: user.id, email: user.email, refreshTokenId: payload.refreshTokenId };
    } catch {
      return reply.unauthorized('Authentication required');
    }
  });
});

export const issueTokenPair = async (_app: unknown, payload: { userId: string; email: string }) => {
  const refreshTokenRecord = await prisma.refreshToken.create({
    data: {
      userId: payload.userId,
      token: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  const accessToken = jwt.sign({ ...payload, refreshTokenId: refreshTokenRecord.id }, config.jwtAccessSecret, {
    expiresIn: config.jwtAccessExpiresIn as SignOptions['expiresIn'],
  });
  const refreshToken = jwt.sign({ ...payload, refreshTokenId: refreshTokenRecord.id }, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiresIn as SignOptions['expiresIn'],
  });

  await prisma.refreshToken.update({
    where: { id: refreshTokenRecord.id },
    data: { token: refreshToken },
  });

  return { accessToken, refreshToken };
};

export const verifyRefreshToken = async (request: FastifyRequest): Promise<JwtPayload & { refreshTokenId: string }> => {
  const authorization = request.headers.authorization;
  const token = authorization?.replace('Bearer ', '');
  if (!token) {
    throw new Error('Missing refresh token');
  }

  const payload = jwt.verify(token, config.jwtRefreshSecret) as JwtPayload & { refreshTokenId: string };
  const refreshToken = await prisma.refreshToken.findUnique({ where: { id: payload.refreshTokenId } });

  if (!refreshToken || refreshToken.token !== token || refreshToken.expiresAt < new Date()) {
    throw new Error('Invalid refresh token');
  }

  return payload;
};
