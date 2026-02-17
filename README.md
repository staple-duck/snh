# SNH Tree API

Production-ready HTTP API for managing hierarchical tree structures with interactive web visualization.

---

## Quick Start

**Prerequisites:** Docker & Docker Compose only

```bash
# Clone and start (no configuration needed)
git clone git@github.com:staple-duck/snh.git
cd snh
npm run start:prod
```

Wait ~30 seconds after build completes, then access:

- **Web UI:** http://localhost:4200
- **API:** http://localhost:3000/api
- **API Docs:** http://localhost:3000/api/docs
- **Health Check:** http://localhost:3000/api/health

**That's it!** The database, API, and UI are running in Docker.

---

## Running Tests

All tests run in Docker containers - **no local setup needed**:

```bash
# Run all tests (unit + e2e)
npm run test:all

# Cleanup test containers
npm run test:all:cleanup
```

Tests include:
- ✅ Unit tests for business logic (TreeService)
- ✅ E2E tests with real PostgreSQL database
- ✅ Automatic setup and teardown
- ✅ Isolated test environment (separate database on port 5433)

---

## Features

- ✅ RESTful tree CRUD operations with validation
- ✅ Interactive drag-and-drop UI (ReactFlow)
- ✅ Cycle detection & cascade deletes
- ✅ PostgreSQL 16 + Prisma ORM
- ✅ Fully Dockerized (no local dependencies)
- ✅ OpenAPI/Swagger documentation
- ✅ Comprehensive test coverage
- ✅ Exception filters for consistent error handling
- ✅ Environment validation

---

## Tech Stack

**Backend:** NestJS, Prisma ORM, PostgreSQL 16, TypeScript, class-validator  
**Frontend:** Next.js 16, ReactFlow, Axios, TypeScript  
**Infrastructure:** Docker, Docker Compose, Turborepo monorepo  

---

## API Endpoints

**GET /api/tree**  
Returns all trees as hierarchical JSON

**POST /api/tree**  
Create new node  
Body: `{ label: string, parentId?: string | null }`

**PATCH /api/tree/:id**  
Update node label or reparent  
Body: `{ label?: string, parentId?: string | null }`  
Validates circular reference prevention

**DELETE /api/tree/:id**  
Delete node and all descendants (cascade)

**Full API documentation:** http://localhost:3000/api/docs

---

## Project Structure

```
snh/
├── apps/
│   ├── api/          # NestJS backend
│   ├── api-e2e/      # E2E tests
│   └── web/          # Next.js frontend
├── libs/
│   ├── database/     # Prisma service
│   └── shared-types/ # Shared DTOs
├── prisma/           # Schema & migrations
├── docker-compose.yml       # Production services
└── docker-compose.test.yml  # Test environment
```

---

## Troubleshooting

**Docker errors or 500 responses?**

```bash
# Clean Docker state
docker compose down
docker rmi snh-api snh-web
npm run start:prod
```

**Complete cleanup if needed:**

```bash
docker system prune -a -f
npm run start:prod
```

**Port conflicts?**

```bash
# Check what's using the ports
lsof -i :3000  # API
lsof -i :4200  # Web
lsof -i :5432  # Database
```

---

## Development Mode

For local development with hot reload:

```bash
# Install dependencies
npm install

cp .env.example .env

npm run dev
```

---

## Web UI Features

- Visual node representation with automatic layout (Dagre)
- Create root nodes or child nodes
- Drag-and-drop to reparent nodes
- Delete nodes with cascade warning
- Real-time JSON data inspector
- Mobile-responsive design
- Error handling with toast notifications

---

## Environment Configuration

See `.env.example` for full configuration options.

**Key variables:**
- `NODE_ENV` - Application environment (development/production)
- `API_PORT` - API server port (default: 3000)
- `DATABASE_URL` - PostgreSQL connection string
- `BUILD_TARGET` - Docker build mode (development/production)

---

## License

ISC

## Author

Anton Goncharenko  
https://www.linkedin.com/in/anton-goncharenko-023a7288
