# slaps_and_kisses

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details on how to set up TypeScript for new packages and apps in this monorepo.

## Docker Setup

This project uses Docker Compose to manage containerized services. The following commands will help you build and run the application stack.

### Building and Running Containers

#### Build and start all services

```bash
# Build and start all main services
docker compose --profile 'runner' -f 'docker-compose.yml' up -d --build
```

### Attaching to Running Services

#### View Car Logs via logs Service

```bash
# Attach to the logs service to view real-time car logs
docker compose attach logs
```

#### Interact with the Car Application (carr)

```bash
# Attach to the carr (car-run) service to use the car application interactively
docker compose attach carr
```

#### Build and start specific services

```bash
# Build and start only the specified services
docker compose up --build mqtt-broker server
```

#### Run in detached mode

```bash
# Run services in the background
docker compose up -d
```

### Additional Service Profiles

#### Install Dependencies (for editor type support)

```bash
# Run the deps-installer service
docker compose --profile deps up
```

#### Run Car Application

```bash
# Run the car application with the runner profile
docker compose --profile runner up carr
```

### Managing Containers

```bash
# Stop all running containers
docker compose down

# Stop and remove volumes
docker compose down -v

# View container logs
docker compose logs -f

# View logs for specific service
docker compose logs -f server
```

## Service Overview

- **mqtt-broker**: MQTT message broker (Mosquitto) for communication between services
- **server**: Backend server application
- **car**: Car client application
- **deps-installer**: Utility service for installing dependencies
- **carr**: Runner for the built car application
- **logs**: Service for viewing and managing application logs
