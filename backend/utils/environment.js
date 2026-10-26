import { randomBytes } from 'node:crypto';

export const configureEnvironment = () => {
  if (process.env.NODE_ENV === 'production') {
    const requiredVariables = ['MONGODB_URI', 'CORS_ORIGIN'];
    const missingVariables = requiredVariables.filter((variable) => !process.env[variable]);
    if (missingVariables.length) {
      throw new Error(`Missing required production environment variables: ${missingVariables.join(', ')}.`);
    }
  }

  if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be set to a random value of at least 32 characters in production.');
    }
    process.env.JWT_SECRET = randomBytes(48).toString('base64url');
    console.warn('JWT_SECRET is missing; using an ephemeral development secret. Sessions reset when the server restarts.');
  }

  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long.');
  }
};