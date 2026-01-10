/**
 * Environment variable validation and configuration
 */

const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'] as const;

/**
 * Validate that all required environment variables are set
 */
export const validateEnv = (): void => {
  const missing: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file or environment configuration.'
    );
  }

  // Warn about weak JWT secret in development
  if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET === 'your-secret-key-change-in-production') {
    console.warn('⚠️  WARNING: Using default JWT_SECRET in production is insecure!');
  }
};


