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

1. Create a Firebase project.
2. Enable Email/Password in Firebase Authentication.
3. Create the founder admin account in Firebase Auth.
4. Create a service account with Firestore access.
5. Put the service account credentials into:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
6. Add the Firebase web app credentials for the login page.

## Firestore collections

- `users`
- `planner_settings`
- `integrations`
- `integration_secrets`
- `google_sheet_configs`
- `planning_snapshots`
- `captured_items`
- `sponsor_projects`
- `plugin_registry`

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
