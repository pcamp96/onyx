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
- Contextual `contentPrompts` suggestions embedded near the end of planning outputs for build-in-public posting ideas
- Firestore-backed settings, snapshots, captures, integration config, and plugin metadata
- GPT Setup page for generating a canonical Custom GPT action configuration and a dedicated API key
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
   - `users/{userId}/gpt_api_credentials/default`
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
5. GPT-facing founder endpoints can also authenticate with a dedicated `X-Onyx-API-Key` token created from `/gpt-setup`.

## GPT Setup

- Visit `/gpt-setup` after signing in.
- Generate a GPT API key for your user. The plaintext token is shown once and then stored only as a hash.
- Import the canonical action schema from `/api/openapi.json`.
- If you prefer a pasteable version, use `/api/openapi.yaml`.
- In Custom GPT action auth, choose API Key and set the header name to `X-Onyx-API-Key`.
- Paste the generated instruction block from the GPT Setup page into your Custom GPT instructions.
- Rotate or revoke the GPT token from the same page whenever you need to replace access.
- `APP_URL` must be the externally reachable HTTPS origin for schema import and GPT action calls to work correctly in self-hosted deployments.

## Content prompts

Onyx now adds optional `contentPrompts` suggestions to planning output. The planner keeps them secondary to execution priorities and chooses them from live context such as ranked tasks, weekly pace, blockers, recent wins, and inferred project context.

Current behavior:

- `/today` returns 3 to 5 prompt candidates optimized for progress updates, build-in-public posts, lessons, and behind-the-scenes content.
- `/week` returns 5 to 10 prompt candidates optimized for story arcs, reflections, vision, and strategic lessons.
- Downstream renderers can call the same generator in `ideas` or `stats` mode to produce experiment-oriented or metric-oriented prompts without creating a separate command system.

Example `/today` section:

```md
## Content Prompts

1. [Build in public] Onyx
Prompt: Today I pushed how Onyx turns ranked work into a clearer daily plan. The hard part was deciding which tradeoffs should stay visible to the founder.
Hook: Building Onyx is forcing me to make real tradeoffs instead of collecting ideas.

2. [Behind the scenes] The Laser Workshop
Prompt: Behind the scenes on The Laser Workshop: interviewing laser shops about quoting friction keeps revealing hidden operational pain. The messy part nobody sees is deciding what to fix first.
Hook: The visible output of The Laser Workshop is usually the easy part.
```

Example `/week` section:

```md
## Content Prompts

1. [Story] Onyx
Prompt: A real story from this week in Onyx: refining the daily planning workflow changed how I think about founder-facing software. It started with trying to make priorities feel less passive.
Hook: The interesting part of building Onyx is how often the plan changes once the work starts.

2. [Founder reflection] Unbrella
Prompt: Founder reflection from Unbrella: privacy-first UX only works when the product feels simpler, not more ideological. I'm rethinking what trust should look like inside a weather app.
Hook: The longer I build, the more I realize leverage comes from better judgment, not more motion.
```

Example `ideas` mode section:

```md
## Content Prompts

1. [Problem/Solution] The Laser Workshop
Prompt: I keep seeing the same problem in The Laser Workshop: laser shops lose time in custom quoting and follow-up. My current fix is testing a simpler intake flow with clearer defaults.
Hook: A lot of product direction gets clearer once the underlying bottleneck is obvious.

2. [Curiosity/question] Onyx
Prompt: Question I'm exploring in Onyx: how much planning should an AI operator do before it starts hiding useful tradeoffs? Right now I suspect the answer is less than most productivity tools assume.
Hook: I learn faster when I publish the open question before I have the polished answer.
```

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

## Cloudflare Pages deployment

Onyx is configured to deploy to Cloudflare through OpenNext and Wrangler. The Cloudflare build path is:

- `npm run deploy`

Recommended project setup:

- Root directory: `/`
- Build command: `npm run build`
- Deploy command: `npm run deploy`

Required Cloudflare runtime secrets match `.env.example`:

- `APP_URL`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_WEB_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_MEASUREMENT_ID`
- `ONYX_ENCRYPTION_PROVIDER`
- `ONYX_ENCRYPTION_KEY`
- `GOOGLE_CLOUD_KMS_KEY_NAME`
- `GOOGLE_CLOUD_KMS_LOCATION`
- `GOOGLE_CLOUD_KMS_KEY_RING`
- `GOOGLE_CLOUD_KMS_CRYPTO_KEY`

To push secrets from `.env.local` with the CLI:

```bash
npm run cf:secrets:push
```

To use a different env file:

```bash
CF_ENV_FILE=.env.production npm run cf:secrets:push
```

## Open-source/plugin notes

- Integrations use a registry + adapter interface.
- Plugin manifests and hook interfaces are included.
- Dynamic package marketplace loading is intentionally left as a future TODO.
