# Enterprise Copilot

EnterpriseCopilot is a secure multi-tenant AI knowledge and automation platform for enterprise teams. It combines
permission-aware RAG, streaming chat, multi-provider LLM routing, MCP-based tools, human approval for write actions,
audit logs and asynchronous document ingestion.

## Requirements

- Node.js 24.
- pnpm 11 (the root package requests version `^11.0.9`).
- Docker with Docker Compose for the development database and supporting services.

Run the commands below from the repository root unless stated otherwise.

## Local development

### 1. Configure the environment

Copy `.env.example` to `.env`:

```powershell
# PowerShell
Copy-Item .env.example .env
```

```sh
# macOS / Linux
cp .env.example .env
```

Set local values in `.env`. The database URL must match the PostgreSQL credentials:

```dotenv
POSTGRES_DB=enterprise_copilot
POSTGRES_USER=developer
POSTGRES_PASSWORD=development_password
DATABASE_URL=postgresql://developer:development_password@localhost:5432/enterprise_copilot
SERVER_PORT=3000
REDIS_URL=redis://localhost:6379
S3_ENDPOINT=http://localhost:4566
S3_ACCESS_KEY=test
S3_SECRET_KEY=test
S3_BUCKET=enterprise-copilot
AWS_REGION=eu-central-1
AWS_DEFAULT_REGION=eu-central-1
```

For LocalStack, replace the example `LOCALSTACK_AUTH_TOKEN` with your own token if required by the configured image.
PostgreSQL and Redis can run without LocalStack for auth and organization development.

Authentication requires an RSA private key for RS256 JWTs. Generate a development key:

```sh
node -e "const { generateKeyPairSync } = require('node:crypto'); const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 }); console.log(privateKey.export({ type: 'pkcs8', format: 'pem' }));"
```

Paste the output into `.env` as a quoted, multiline value:

```dotenv
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
PASTE_GENERATED_KEY_CONTENT_HERE
-----END PRIVATE KEY-----"
```

Use actual line breaks in the PEM value. Signing currently normalizes literal `\n` sequences, but verification does not.
Keep `.env` and private keys out of version control.

### 2. Install dependencies

```sh
npm install --global pnpm@11
pnpm install
```

If installation fails with `ERR_PNPM_IGNORED_BUILDS` for bcrypt, update the existing entry in `pnpm-workspace.yaml` from
`bcrypt: set this to true or false` to `bcrypt: true`, then rerun installation. If prompted to approve builds, use
`pnpm approve-builds` and approve the required native dependencies.

### 3. Start the supporting services

```sh
docker compose up -d postgres redis
```

For local S3 development, also start LocalStack:

```sh
docker compose up -d localstack
```

The configured services expose PostgreSQL on port 5432, Redis on 6379, and LocalStack on 4566. Starting LocalStack does
not automatically create the S3 bucket; create the configured bucket before using uploads.

### 4. Prepare the database

Generate the Prisma client and apply the checked-in migrations:

```sh
pnpm --filter @enterprise/db generate
pnpm --filter @enterprise/db exec prisma migrate deploy --config prisma7.config.ts
```

When changing the Prisma schema during development, create a migration and regenerate the client:

```sh
pnpm --filter @enterprise/db exec prisma migrate dev --config prisma7.config.ts --name describe_your_change
pnpm --filter @enterprise/db generate
```

The custom Prisma configuration is named `prisma7.config.ts`, so pass `--config` explicitly for commands other than the
package's `generate` script.

### 5. Start the server and web app

Open two terminals at the repository root.

Server:

```sh
node --env-file=.env --import tsx --watch apps/server/src/index.ts
```

Loading `.env` before imports ensures the database and JWT helpers receive their configuration. The package also has
`pnpm --filter server dev`, which runs `tsx watch src/index.ts`; when using that command, ensure the root environment
variables are already loaded into the process.

Web app:

```sh
pnpm --filter web dev
```

| Service                  | Address                    |
|--------------------------|----------------------------|
| Web app                  | http://localhost:5173      |
| tRPC API                 | http://localhost:3000/trpc |
| LocalStack, when started | http://localhost:4566      |

The web app sends requests to `/trpc`. Vite proxies these requests to `http://localhost:3000`; update
`apps/web/vite.config.ts` if you change the server port.

## Database tools

Validate the schema:

```sh
pnpm --filter @enterprise/db exec prisma validate --config prisma7.config.ts
```

Open Prisma Studio:

```sh
pnpm --filter @enterprise/db exec prisma studio --config prisma7.config.ts
```

Optionally seed a disposable development database:

```sh
pnpm --filter @enterprise/db exec prisma db seed --config prisma7.config.ts
```

**The seed deletes existing users, organizations, conversations, and messages.** Its deletion order may need updating
when invitation records already exist. It creates organization `ORG-I` and these development accounts:

| Email                 | Password | Organization role |
|-----------------------|----------|-------------------|
| admin@example.com     | admin123 | ADMIN             |
| employee1@example.com | user123  | MEMBER            |
| employee2@example.com | user123  | MEMBER            |

## Checks

```sh
pnpm type-check
pnpm --filter server type-check
pnpm --filter web lint
```

If server type-checking reports TS5097 for `.ts` imports in workspace packages, run:

```sh
pnpm --filter server exec tsc --noEmit -p tsconfig.json --allowImportingTsExtensions
```

The package `test` scripts are placeholders and do not currently run a test suite.

## Docker application containers

The Compose file also defines `server`, `web`, and `worker` containers. The local development instructions above avoid
the current application-container configuration gaps:

- Generate the Prisma client during image creation, or generate it on the host before building so the source copy
  includes it. The generated client is gitignored and is not generated by the Dockerfile.
- The containerized web app needs its Vite proxy target changed to `http://server:3000`. Its current `localhost` target
  points to the web container itself; `VITE_API_URL` is not read by the current client/proxy code.
- The worker entry point is `apps/worker/index.ts`. Start it locally with `pnpm --filter worker dev`, or include
  `worker` in the Compose startup command. It reads `REDIS_URL`, `WORKER_QUEUE_NAME` (default: `documents`), and
  `WORKER_CONCURRENCY` (default: `5`). Only the `ping` job is implemented; document ingestion and workflow processors
  still need to be added. Unsupported jobs fail explicitly.
- Docker startup does not apply database migrations. Run them explicitly before using the API.

After addressing these items, build and start the server and web containers:

```sh
docker compose up -d --build server web
```

Run migrations inside the server container, using its container database URL:

```sh
docker compose exec server pnpm --filter @enterprise/db exec prisma migrate deploy --config prisma7.config.ts
```

Sources are copied into the images rather than bind-mounted. Rebuild after code changes:

```sh
docker compose up -d --build --no-deps server
```

## Logs and shutdown

```sh
docker compose ps
docker compose logs -f server
docker compose logs -f postgres redis
docker compose down
```

`docker compose down` preserves the named database, Redis, and LocalStack volumes. Stop local development processes with
Ctrl+C.
