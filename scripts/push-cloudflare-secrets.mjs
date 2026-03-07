import { execFileSync } from "node:child_process";
import process from "node:process";

const ENV_PATH = process.env.CF_ENV_FILE || ".env.local";
const REQUIRED_KEYS = [
  "APP_URL",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "FIREBASE_WEB_API_KEY",
  "FIREBASE_AUTH_DOMAIN",
  "FIREBASE_STORAGE_BUCKET",
  "FIREBASE_MESSAGING_SENDER_ID",
  "FIREBASE_APP_ID",
  "FIREBASE_MEASUREMENT_ID",
  "ONYX_ENCRYPTION_PROVIDER",
  "ONYX_ENCRYPTION_KEY",
  "GOOGLE_CLOUD_KMS_KEY_NAME",
  "GOOGLE_CLOUD_KMS_LOCATION",
  "GOOGLE_CLOUD_KMS_KEY_RING",
  "GOOGLE_CLOUD_KMS_CRYPTO_KEY"
];

process.loadEnvFile(ENV_PATH);

for (const key of REQUIRED_KEYS) {
  const value = process.env[key];

  if (value === undefined) {
    console.warn(`Skipping ${key}: not set in ${ENV_PATH}`);
    continue;
  }

  console.log(`Uploading ${key}`);
  execFileSync("npx", ["wrangler", "secret", "put", key], {
    input: value,
    stdio: ["pipe", "inherit", "inherit"],
  });
}
