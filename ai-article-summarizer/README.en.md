[简体中文](./README.md) | English

# AI Article Summarizer

AI Article Summarizer is a reading-tools workbench built on Next.js 16. It combines AI article summarization, summary history, and Markdown-to-HTML conversion: after a user submits a public article URL, the server fetches the static HTML, extracts the main content, calls the DeepSeek Chat Completions API to generate summaries in three lengths, and saves the summary history to a SQLite-compatible database; users can also export Markdown notes to styled, syntax-highlighted HTML at `/markdown`.

## Project Overview

This project targets the "quickly understand long articles" and "organize reading notes" scenarios, providing a complete web workflow from URL to summary history and from Markdown to HTML export:

- **URL input and validation**: The home page provides an article URL input box that supports `http://` and `https://` links.
- **Article fetching and content extraction**: The backend fetches static HTML and extracts summarizable main content from the page.
- **Three summary lengths**: Generates a one-line summary, a short summary, and a detailed summary to suit different reading depths.
- **History**: Saves the URL, title, excerpt, the three summaries, and the necessary metadata, and supports reviewing them from the history page.
- **Markdown to HTML**: Includes Markdown rendering merged in from `md2html`, supporting safe HTML escaping, link recognition, and code highlighting.
- **Security boundaries**: Server-side modules isolate secrets such as the API key and database connection; the fetching logic includes SSRF protection, timeouts, and redirect and response-size limits.
- **Vercel friendly**: Uses Route Handlers on the Node.js Runtime, does not depend on a full Chromium, and parses static HTML without executing JavaScript.

Tech stack:

- Next.js 16 App Router
- React 19.2
- TypeScript strict mode
- Tailwind CSS
- Drizzle ORM
- SQLite-compatible storage (local SQLite file / production Turso, libSQL, etc.)
- DeepSeek Chat Completions API (called via the OpenAI-compatible SDK)
- MarkdownIt + highlight.js
- Vitest + ESLint

## Screenshot Placeholders

> The current README reserves placeholder spots for screenshots. When adding real screenshots, place the images in a public documentation asset directory inside the repository (for example, `docs/images/`) and update the links below.

### Home page: enter a URL and generate a summary

![Home page screenshot placeholder](docs/images/home-placeholder.png)

### Summary result: switch between three lengths

![Summary result screenshot placeholder](docs/images/summary-placeholder.png)

### History: view previously generated summaries

![History screenshot placeholder](docs/images/history-placeholder.png)

### Markdown tool: convert and download HTML

![Markdown tool screenshot placeholder](docs/images/markdown-placeholder.png)

## Installation and Running Steps

### 1. Prepare the environment

Recommended:

- Node.js 20+
- pnpm (this repo includes a `pnpm-lock.yaml`; if your team standardizes on npm, you can run the same-named `npm run ...` scripts)

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Copy the environment variable example file:

```bash
cp .env.example .env.local
```

Then fill in `.env.local` as needed; see "Environment Variable Configuration" below.

### 4. Initialize or migrate the database

The default local database address is `file:./data/summaries.db`. It is recommended to run the database migration before the first run:

```bash
pnpm db:migrate
```

To regenerate migrations from the Drizzle schema:

```bash
pnpm db:generate
```

### 5. Start the development server

```bash
pnpm dev
```

Once started, open:

- Home page: `http://localhost:3000`
- History: `http://localhost:3000/history`
- Markdown to HTML: `http://localhost:3000/markdown`

### 6. Run verification commands

After code or documentation changes, it is recommended to run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Environment Variable Configuration

The project reads configuration from `.env.local` or the deployment platform's environment variables. Refer to `.env.example`:

```bash
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat

DATABASE_URL=file:./data/summaries.db
```

| Variable | Required | Default / Example | Description |
| --- | --- | --- | --- |
| `DEEPSEEK_API_KEY` | Yes | `sk-...` | DeepSeek API key. Read only on the server; do not commit it to Git. Without it, the backend cannot generate real summaries. |
| `DEEPSEEK_BASE_URL` | No | `https://api.deepseek.com` | DeepSeek OpenAI-compatible API address. Usually fine to keep the default. |
| `DEEPSEEK_MODEL` | No | `deepseek-chat` | The DeepSeek model name used to generate summaries. |
| `DATABASE_URL` | Yes | `file:./data/summaries.db` | SQLite-compatible database connection address. Locally you can use a SQLite file; for production, a managed service such as Turso/libSQL is recommended. |

Security notes:

- Do not commit `.env.local`, the DeepSeek API key, the production database URL, or any tokens to the repository.
- Do not read the API key, database connection, or other secrets in Client Components.
- In production, configure least-privilege credentials for the database and rotate them regularly using the platform's secrets management capabilities.

## API Overview

### `POST /api/summarize`

Generates and saves the summary for the given URL.

Example request:

```json
{
  "url": "https://example.com/article"
}
```

The response returns the saved summary record, with the summary fields located at:

- `summaries.one_line`
- `summaries.short`
- `summaries.detailed`

### `GET /api/history`

Returns the most recent summary records. Supported query parameters:

- `page`: page number
- `limit`: items per page, default 50, maximum 50

### `GET /api/history/[id]`

Returns the details of a single summary.

### `POST /api/markdown/render`

Converts Markdown into an HTML fragment and a complete HTML document.

Example request:

```json
{
  "title": "Reading Notes",
  "markdown": "# Heading\n\nBody content"
}
```

Response fields:

- `document`: a complete HTML document that can be downloaded and saved directly.
- `fragment`: an HTML fragment that can be embedded into a page.
- `output_filename`: a default HTML file name generated from the title.

## Deploying to Vercel

### 1. Prepare a production database

The Vercel Serverless environment is not suitable for relying on a persistent local file database. For production deployment, it is recommended to prepare a SQLite-compatible managed database, such as Turso/libSQL, and obtain a production-ready `DATABASE_URL`.

> If the chosen database also requires an additional token, first confirm whether the current code already integrates the corresponding variable; do not add variables that are not yet implemented to public documentation.

### 2. Push the code to a Git platform

Push the repository to GitHub, GitLab, or Bitbucket so that Vercel can import it.

### 3. Import the project in Vercel

1. Sign in to the Vercel Dashboard.
2. Click **Add New... → Project**.
3. Select this repository.
4. Choose **Next.js** as the Framework Preset.
5. Keep the default build settings, or adjust them per your team's conventions:
   - Install Command: `pnpm install`
   - Build Command: `pnpm build`
   - Output Directory: the Next.js default is fine

### 4. Configure environment variables

In the Vercel project's **Settings → Environment Variables**, add:

- `DEEPSEEK_API_KEY`
- `DEEPSEEK_BASE_URL` (optional, default `https://api.deepseek.com`)
- `DEEPSEEK_MODEL` (optional, default `deepseek-chat`)
- `DATABASE_URL`

It is recommended to configure appropriate databases and API keys for at least the **Production** and **Preview** environments separately.

### 5. Run the database migration

Before or after deployment, run the migration against the production database according to your team's process:

```bash
pnpm db:migrate
```

You can run it after temporarily setting the production `DATABASE_URL` locally, or integrate it into your team's existing CI/CD migration step. Before running, confirm the target database and credentials to avoid accidentally affecting local or production data.

### 6. Deploy and verify

1. Click **Deploy** in Vercel.
2. After the deployment completes, visit the production URL.
3. Verify that the home page, history page, and `POST /api/summarize` work correctly.
4. If summary generation fails, first check the Vercel environment variables, the DeepSeek API key, the database connection, and any security error messages in the function logs.

## Common Scripts

```bash
pnpm dev        # Start the local development server
pnpm build      # Build the production version
pnpm start      # Start the production server
pnpm lint       # Run ESLint
pnpm typecheck  # Run TypeScript type checking
pnpm test       # Run Vitest tests
pnpm db:generate # Generate Drizzle migrations
pnpm db:migrate  # Apply database migrations
```
