# Hivedeck Dashboard

Server monitoring and management dashboard for Hivedeck agents.

## Overview

Hivedeck Dashboard is a Next.js application that provides:

- **Server Overview** - View all connected servers at a glance
- **Real-time Metrics** - Live CPU, memory, disk, and network monitoring
- **Process Management** - View and manage running processes
- **Service Management** - Control systemd services
- **Log Viewing** - Real-time log streaming
- **Docker Management** - Container control and monitoring
- **File Browser** - Browse server file systems
- **Task Runner** - Execute pre-defined safe commands

## Quick Start

### Prerequisites

- Node.js 20+
- npm or pnpm
- A running Hivedeck Agent

### Installation

```bash
# Clone the repository
git clone https://github.com/ngenohkevin/hivedeck.git
cd hivedeck

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database path

# Set up database
npx prisma db push

# Start development server
npm run dev
```

Visit http://localhost:3000 to access the dashboard.

### Adding a Server

1. Click "Add Server" on the dashboard
2. Enter server details:
   - **Name**: Display name for the server
   - **Tailscale IP**: The server's Tailscale IP (e.g., `100.85.91.122`)
   - **Port**: Agent port (default: `8091`)
   - **API Key**: The API key configured in the agent's `.env`

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **UI**: shadcn/ui + Tailwind CSS
- **State**: Zustand
- **Database**: SQLite via Prisma
- **Charts**: Recharts
- **Icons**: Lucide React

## Project Structure

```
hivedeck/
├── prisma/
│   └── schema.prisma     # Database schema
├── src/
│   ├── app/
│   │   ├── page.tsx      # Home (server list)
│   │   ├── servers/
│   │   │   └── [id]/     # Server detail pages
│   │   ├── settings/     # Settings page
│   │   └── api/          # API routes
│   ├── components/
│   │   ├── ui/           # shadcn components
│   │   ├── layout/       # Layout components
│   │   └── dashboard/    # Dashboard components
│   ├── lib/
│   │   ├── api.ts        # API client
│   │   ├── db.ts         # Database client
│   │   └── utils.ts      # Utilities
│   ├── stores/           # Zustand stores
│   └── types/            # TypeScript types
└── .github/workflows/
    └── deploy.yml        # CI/CD pipeline
```

## Pages

| Path | Description |
|------|-------------|
| `/` | Server overview with metrics cards |
| `/servers/[id]` | Server detail with real-time metrics |
| `/servers/[id]/processes` | Process list and management |
| `/servers/[id]/services` | Systemd services |
| `/servers/[id]/logs` | Log viewer |
| `/servers/[id]/docker` | Docker containers |
| `/servers/[id]/files` | File browser |
| `/servers/[id]/tasks` | Task runner |
| `/settings` | Dashboard settings |

## Development

```bash
# Start dev server
npm run dev

# Run linter
npm run lint

# Run tests
npm test

# Build for production
npm run build

# Start production server
npm start

# Database commands
npm run db:push    # Push schema changes
npm run db:migrate # Create migration
npm run db:studio  # Open Prisma Studio
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite database path | `file:./dev.db` |
| `NODE_ENV` | Environment | `development` |

## Deployment

### Docker

```bash
# Build image
docker build -t hivedeck .

# Run container
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/app/prisma \
  -e DATABASE_URL="file:/app/prisma/prod.db" \
  hivedeck
```

### Dokploy

The dashboard deploys automatically via GitHub Actions:

1. Push to `main` branch
2. Docker image is built and pushed to GHCR
3. Dokploy pulls and deploys the new image

Required secrets:
- `DOKPLOY_API_KEY` - Dokploy API key
- `HIVEDECK_APP_ID` - Application ID in Dokploy

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/servers` | GET | List all servers |
| `/api/servers` | POST | Add a new server |
| `/api/servers/[id]` | GET | Get server details |
| `/api/servers/[id]` | PUT | Update server |
| `/api/servers/[id]` | DELETE | Remove server |

## Connecting to Agents

The dashboard connects to Hivedeck agents via Tailscale. Ensure:

1. Both dashboard and agent are on the same Tailscale network
2. The agent is running and accessible
3. The API key matches the agent's configuration

## License

MIT
