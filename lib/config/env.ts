import { z } from "zod";

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
  FIREBASE_WEB_API_KEY: z.string().min(1),
  FIREBASE_AUTH_DOMAIN: z.string().min(1),
  FIREBASE_STORAGE_BUCKET: z.string().optional().default(""),
  FIREBASE_MESSAGING_SENDER_ID: z.string().optional().default(""),
  FIREBASE_APP_ID: z.string().min(1),
  FIREBASE_MEASUREMENT_ID: z.string().optional().default(""),
  ONYX_ENCRYPTION_KEY: z.string().min(1),
  ONYX_ENCRYPTION_PROVIDER: z.enum(["local", "kms"]).default("local"),
  GOOGLE_CLOUD_KMS_KEY_NAME: z.string().optional().default(""),
  GOOGLE_CLOUD_KMS_LOCATION: z.string().optional().default(""),
  GOOGLE_CLOUD_KMS_KEY_RING: z.string().optional().default(""),
  GOOGLE_CLOUD_KMS_CRYPTO_KEY: z.string().optional().default(""),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedServerEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cachedServerEnv) {
    return cachedServerEnv;
  }

  cachedServerEnv = serverEnvSchema.parse(process.env);
  return cachedServerEnv;
}

export function getFirebaseClientEnv() {
  const env = getServerEnv();

  return {
    apiKey: env.FIREBASE_WEB_API_KEY,
    authDomain: env.FIREBASE_AUTH_DOMAIN,
    projectId: env.FIREBASE_PROJECT_ID,
    storageBucket: env.FIREBASE_STORAGE_BUCKET || undefined,
    messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID || undefined,
    appId: env.FIREBASE_APP_ID,
    measurementId: env.FIREBASE_MEASUREMENT_ID || undefined,
  };
}
