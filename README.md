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
S3_ENDPOINT=http://localhost:9000
S3_PUBLIC_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=rustfsadmin
S3_SECRET_KEY=rustfsadmin
RUSTFS_ACCESS_KEY=rustfsadmin
RUSTFS_SECRET_KEY=rustfsadmin
S3_BUCKET=enterprise-copilot
AWS_REGION=eu-central-1
AWS_DEFAULT_REGION=eu-central-1
```

RustFS provides local S3-compatible storage. No LocalStack account or token is needed.
The local server reads `S3_ACCESS_KEY` and `S3_SECRET_KEY`; Compose uses `RUSTFS_ACCESS_KEY` and
`RUSTFS_SECRET_KEY` for RustFS, bucket initialization, and the application containers. Keep both pairs matched
if you change the development defaults. PostgreSQL and Redis can run without RustFS for auth and organization development.

Authentication uses HS256 with one shared secret. Generate a random secret:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Paste it into `.env`:

```dotenv
JWT_SECRET=PASTE_GENERATED_SECRET_HERE
```

Use the same secret for signing and verification. Keep `.env` out of version control.
After switching from RSA tokens, clear the stored browser token and sign in again.

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

For document uploads, also start RustFS and its initialization service:

```sh
docker compose up -d rustfs rustfs-init
```

The configured services expose PostgreSQL on port 5432, Redis on 6379, the RustFS S3 API on 9000, and the
RustFS console on 9001. The storage ports are bound to localhost.

The one-shot `rustfs-init` service waits for RustFS to become healthy, creates the configured `S3_BUCKET`
(default: `enterprise-copilot`) if missing, and configures bucket CORS for `http://localhost:5173` and
`http://127.0.0.1:5173`. An `Exited (0)` status for this service means initialization succeeded.
The server and worker containers wait for initialization before starting.

Open http://localhost:9001 and sign in with `RUSTFS_ACCESS_KEY` and `RUSTFS_SECRET_KEY`
(default: `rustfsadmin` / `rustfsadmin`) to browse buckets and uploaded documents.

| Setting | Server on the host | Server in Docker Compose |
|---------|--------------------|--------------------------|
| `S3_ENDPOINT` | `http://localhost:9000` | `http://rustfs:9000` |
| `S3_PUBLIC_ENDPOINT` | `http://localhost:9000` | `http://localhost:9000` |

The public endpoint is used to sign browser upload URLs; it must be reachable from your browser.
Do not replace the hostname after signing. Remove any old port 4566 override from `.env`.
If you change the frontend origin, update both RustFS's allowed origins and the bucket CORS rules in Compose,
then recreate `rustfs` and `rustfs-init`.

RustFS stores files in the `rustfs_data` volume. Existing LocalStack objects are not migrated automatically;
the legacy `localstack_data` volume is retained.

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
| RustFS S3 API            | http://localhost:9000      |
| RustFS console           | http://localhost:9001      |

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
- The web app's Vite proxy reads `VITE_API_URL` from the process environment. Compose sets it to `http://server:3000`; local development defaults to `http://localhost:3000`.
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
docker compose logs -f postgres redis rustfs
docker compose logs rustfs-init
docker compose down
```

`docker compose down` preserves the named database, Redis, and RustFS volumes. Stop local development processes with
Ctrl+C.
