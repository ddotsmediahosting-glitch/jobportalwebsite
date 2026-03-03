import "dotenv/config";

const required = ["DATABASE_URL", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "REDIS_URL"] as const;

for (const key of required) {
  if (process.env.NODE_ENV === "test") {
    continue;
  }
  if (!process.env[key]) {
    throw new Error(`Missing env var: ${key}`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL as string,
  redisUrl: process.env.REDIS_URL as string,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET as string,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET as string,
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || "15m",
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL || "30d",
  webUrl: process.env.WEB_URL || "http://localhost:5173",
  enableMessaging: process.env.ENABLE_MESSAGING === "true",
  requireEmployerVerification: process.env.REQUIRE_EMPLOYER_VERIFICATION_FOR_PUBLISH !== "false",
  storageDriver: process.env.STORAGE_DRIVER || "local",
  localUploadDir: process.env.LOCAL_UPLOAD_DIR || "apps/api/uploads",
  stripeProvider: process.env.STRIPE_PROVIDER || "mock"
};
