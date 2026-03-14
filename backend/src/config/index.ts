import dotenv from 'dotenv';
dotenv.config();

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  isProduction: process.env.NODE_ENV === 'production',

  db: {
    url: required('DATABASE_URL'),
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  email: {
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'noreply@uaejobs.local',
  },

  storage: {
    provider: (process.env.STORAGE_PROVIDER || 'local') as 'local' | 's3',
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    s3: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      region: process.env.AWS_REGION || 'me-central-1',
      bucket: process.env.AWS_BUCKET || 'uaejobs-uploads',
      endpoint: process.env.AWS_ENDPOINT,
    },
  },

  billing: {
    provider: (process.env.BILLING_PROVIDER || 'mock') as 'mock' | 'stripe',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },

  cors: {
    origin: (process.env.FRONTEND_URL || 'http://localhost:5173')
      .split(',')
      .map((o) => o.trim())
      .concat([
        'http://ddotsmediajobs.com',
        'https://ddotsmediajobs.com',
        'http://www.ddotsmediajobs.com',
        'https://www.ddotsmediajobs.com',
        'http://194.164.151.202',
      ]),
  },

  ai: {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    model: 'claude-sonnet-4-6',
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    whatsappFrom: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886', // Twilio sandbox default
    webhookUrl: process.env.TWILIO_WEBHOOK_URL || '',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },

  uploadLimits: {
    maxFileSizeMb: 10,
    allowedMimeTypes: {
      resume: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      image: ['image/jpeg', 'image/png', 'image/webp'],
      document: ['application/pdf', 'image/jpeg', 'image/png'],
    },
  },
} as const;
