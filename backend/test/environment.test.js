import assert from 'node:assert/strict';
import test from 'node:test';
import { configureEnvironment } from '../utils/environment.js';

test('production requires database, JWT, and frontend origin settings', () => {
  const original = {
    NODE_ENV: process.env.NODE_ENV,
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
  };

  try {
    process.env.NODE_ENV = 'production';
    delete process.env.MONGODB_URI;
    delete process.env.JWT_SECRET;
    delete process.env.CORS_ORIGIN;

    assert.throws(configureEnvironment, /MONGODB_URI, CORS_ORIGIN/);

    process.env.MONGODB_URI = 'mongodb://localhost/test';
    process.env.JWT_SECRET = 'short';
    process.env.CORS_ORIGIN = 'https://example.com';
    assert.throws(configureEnvironment, /JWT_SECRET must be at least 32 characters/);

    process.env.JWT_SECRET = 'a'.repeat(32);
    assert.doesNotThrow(configureEnvironment);
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
