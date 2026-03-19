import { OAuth2Client } from 'google-auth-library';
import { config } from './config.js';

const client = new OAuth2Client(config.googleClientId, config.googleClientSecret, config.nodeEnv === 'production' ? config.googleRedirectUriProd : config.googleRedirectUriDev);

export type GoogleProfile = {
  sub: string;
  email: string;
  name: string;
  picture?: string;
};

export const verifyGoogleIdToken = async (idToken: string): Promise<GoogleProfile> => {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: config.googleClientId,
  });

  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email || !payload.name) {
    throw new Error('Invalid Google token payload');
  }

  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  };
};
