# Onyx

Onyx is a daily priority engine. It ranks what must get done today and this week without turning into a scheduler or time-blocking tool.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Firebase Auth
- Firebase Admin SDK
- Cloud Firestore

## What v1 does

- Authenticated founder/admin UI
- Ranked `/today` and `/week` planner endpoints
- Firestore-backed settings, snapshots, captures, integration config, and plugin metadata
- Server-side encrypted integration secrets
- Read-only integrations for Google Sheets, Apple Calendar ICS, Google Calendar, Asana, and Todoist
- Debug view for latest planner snapshots

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Generate a local encryption key:

```bash
openssl rand -base64 32
```

4. Fill in Firebase Admin and Firebase web app credentials in `.env.local`.

5. Start the app:

```bash
npm run dev
```

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run typecheck`
- `npm run test`

## Firebase setup

1. Create a Firebase project in the [Firebase console](https://console.firebase.google.com/).
2. In `Build -> Authentication -> Sign-in method`, enable `Email/Password`.
3. In `Authentication -> Users`, create your founder admin user with email/password.
4. In `Project settings -> General`, create a Web app if one does not already exist.
5. Copy the web app values into `.env.local`:
   - `FIREBASE_WEB_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`
   - `FIREBASE_MEASUREMENT_ID` if present
6. In `Project settings -> Service accounts`, generate a new private key for the Firebase Admin SDK.
7. Copy the service account values into `.env.local`:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
8. Generate an encryption key for server-side secret storage:

```bash
openssl rand -base64 32
```

9. Put that value into `ONYX_ENCRYPTION_KEY`.
10. Restart the dev server after changing `.env.local`.

## Firestore setup

1. In `Build -> Firestore Database`, create a Firestore database in production or development mode.
2. Pick a region close to your VPS or expected usage.
3. The app uses the Firebase Admin SDK server-side, so local development reads and writes through the service account in `.env.local`.
4. Initial data is created lazily by the app when you save settings, integrations, or planner output.
5. Current document layout:
   - `users/{userId}`
   - `users/{userId}/integrations/{provider}`
   - `users/{userId}/integration_configs/{provider}`
   - `users/{userId}/integration_secrets/{provider}`
   - `users/{userId}/planning_snapshots/{snapshotId}`
   - `users/{userId}/planning_debug/{type}`
   - `planner_settings/{userId}`
   - `captured_items/{itemId}`
   - `sponsor_projects/{projectId}`
   - `plugin_registry/{pluginId}`

## Auth flow in Onyx

1. The browser login form signs in with Firebase client SDK email/password auth.
2. The browser sends the Firebase ID token to `/api/auth/session`.
3. The server verifies it with Firebase Admin and creates an HTTP-only session cookie.
4. Admin routes and APIs verify that session cookie server-side.

## Firestore usage in Onyx

1. Server routes and planner services use Firebase Admin only.
2. The browser does not talk to Firestore directly.
3. Integration secrets are encrypted on the server before they are written to Firestore.

## Integration secret handling

- Secrets are posted over HTTPS to server routes.
- Secrets are encrypted server-side before Firestore writes.
- Firestore never stores third-party secrets in plaintext.
- Decrypted secrets stay server-side and are only used during live sync/test flows.
- `local` encryption is implemented for v1/dev.
- `kms` exists as an interface-compatible stub for future Google Cloud KMS support.

## Deployment notes

- Deploy behind a reverse proxy such as Nginx or Caddy.
- Terminate HTTPS at the proxy.
- Forward requests to the Next.js process.
- Set `APP_URL` to the external origin.
- Use a process manager such as `systemd`, `pm2`, or Docker.

## Open-source/plugin notes

- Integrations use a registry + adapter interface.
- Plugin manifests and hook interfaces are included.
- Dynamic package marketplace loading is intentionally left as a future TODO.
