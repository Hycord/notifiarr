# Notifiarr UI

Modern web interface for managing IRC notifications with the irc-notify system.

## Features

- 🎯 **Dashboard** - System overview with quick stats and actions
- 📡 **Clients** - Manage IRC client log parsers
- 🖥️ **Servers** - Configure IRC server connections
- ⚡ **Events** - Create event filters and routing rules
- 📤 **Sinks** - Set up notification destinations
- ⚙️ **Settings** - Global configuration management

## Tech Stack

- **Next.js 14+** (App Router)
- **Bun** - Fast JavaScript runtime
- **TanStack Query** - Data fetching and caching
- **shadcn/ui** - Beautiful UI components
- **Tailwind CSS** - Styling
- **React Hook Form + Zod** - Form handling and validation

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed (for local development)
- OR [Docker](https://www.docker.com/) (for containerized deployment - see [DOCKER.md](DOCKER.md))

### Local Development Setup

1. Install dependencies:
```bash
bun install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

3. Edit `.env.local` and configure:
   - `BACKEND_API_URL` - Backend API endpoint (default: http://127.0.0.1:3001)
   - `NEXT_PUBLIC_API_TOKEN` - Authentication token for the backend API

### Development

Start the development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
bun run build
bun start
```

## Docker Deployment

For production deployment with Docker (includes both frontend and backend):

1. Copy and customize `docker-compose.yml`
2. Set your API URL/token and volume paths
3. Run `docker-compose up -d`

See [DOCKER.md](DOCKER.md) for detailed instructions.

### Production (v1.0.0)
- Use versioned images instead of `latest`:
   - Backend: `ghcr.io/hycord/irc-notify:v1.0.0`
   - Frontend: `ghcr.io/hycord/notifiarr:v1.0.0`
- Ensure envs reflect the new `.env.local` scheme:
   - `BACKEND_API_URL` (e.g., `http://irc-notify-backend:3001`)
   - `NEXT_PUBLIC_API_TOKEN` (same value used by backend `API_TOKEN`)
- The provided `docker-compose.yml` is the canonical example; do not modify structure beyond volumes/ports/env values.

## Project Structure

```
├── app/                    # Next.js app router pages
│   ├── clients/           # Client management
│   ├── servers/           # Server management
│   ├── events/            # Event configuration
│   ├── sinks/             # Sink configuration
│   ├── settings/          # Settings
│   └── logs/              # Logs viewer
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── forms/            # Form components
│   └── ...               # App components
├── hooks/                 # Custom React hooks
│   └── use-config-queries.ts  # TanStack Query hooks
├── lib/                   # Utilities and libraries
│   ├── api-client.ts     # API wrapper
│   ├── schemas.ts        # Zod validation schemas
│   └── types.ts          # TypeScript types
├── docker-compose.yml     # Docker deployment config
└── DOCKER.md             # Docker deployment guide
```

## API Integration

The UI communicates with the irc-notify backend API. All requests require Bearer token authentication.

- Environment variables used by the UI:
   - `BACKEND_API_URL` – base URL for the backend API
   - `NEXT_PUBLIC_API_TOKEN` – Bearer token sent on every request

- Place env values in `.env.local` for local dev, or set them via container `environment:` in Docker.
