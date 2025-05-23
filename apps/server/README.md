# Elysia with Bun runtime

## Architecture Overview

This server app is built using the [Elysia](https://elysiajs.com/) framework running on the [Bun](https://bun.sh/) runtime. It is organized as a modular, scalable backend for handling EV charging, user, and station management, with MQTT support for real-time communication.

### Key Features

- Modular route organization for charging, payments, registration, and station info
- MQTT server integration for real-time updates
- State machine for startup and process management
- TypeScript-first codebase with shared types and schemas
- Utility modules for logging, data processing, and route computation

## Project Organization

```
apps/server/
├── Dockerfile
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── index.ts            # Entry point
    ├── main.ts             # Main server bootstrap
    ├── mqtt-server.ts      # MQTT server logic
    ├── server.ts           # HTTP server setup
    ├── data/               # Data and commit logic
    ├── machines/           # State machines (e.g., startup)
    ├── routes/             # API route handlers
    ├── schemas/            # Zod schemas for validation
    └── utils/              # Utilities (logger, route generator, etc.)
```

### Folders and Files

- **src/routes/**: Contains all API endpoints (e.g., `startCharging.ts`, `payment.ts`, `registerCar.ts`)
- **src/machines/**: State machine logic for server startup and process management
- **src/schemas/**: Zod schemas for validating car, user, station, and location data
- **src/utils/**: Helper modules for logging, route computation, and more
- **src/mqtt-server.ts**: Handles MQTT protocol for real-time communication
- **src/server.ts**: Sets up the HTTP server and integrates routes
- **src/main.ts**: Main entry for server startup

## Development

To start the development server run:

```bash
bun run dev
```

Open http://localhost:3000/ with your browser to see the result.

## Important Information

- **MQTT**: The server supports MQTT for real-time updates between clients and stations.
- **Type Safety**: All data models and API payloads are validated using Zod schemas.
- **Extensibility**: New routes and features can be added by creating new files in `src/routes/` and registering them in `server.ts`.
- **State Machines**: Startup and other processes are managed using XState machines in `src/machines/`.
- **Shared Types**: Common types and utilities are shared via the `shared/` package.

For more details, see the code in each directory and the comments within the source files.
