# Docker Deployment Guide

This guide explains how to deploy the Notifiarr UI and irc-notify backend using Docker.

## Quick Start

1. **Copy the docker-compose.yml file** as your starting point

2. **Edit the volume paths** in `docker-compose.yml`:
   ```yaml
   volumes:
     - /path/to/config/dir:/app/config
     - /path/to/logs/dir:/logs
   ```

3. **Set your API URL and token** in `docker-compose.yml`:
   ```yaml
   environment:
     - BACKEND_API_URL=http://irc-notify-backend:3001
     - NEXT_PUBLIC_API_TOKEN=your-secure-token-here  # Generate with: openssl rand -hex 32
   ```

4. **Optional: Customize the frontend port** (default: 3000):
   ```yaml
   ports:
     - "3000:3000"  # Change first port to expose on different host port
   ```

5. **Start both services:**
   ```bash
   docker-compose up -d
   ```

6. **Access the UI:**
   Open http://localhost:3000 in your browser.

## Configuration

### API Token
Both services must use the **same API token** for authentication:
- **Backend**: Set `API_TOKEN` environment variable
- **Frontend**: Set `NEXT_PUBLIC_API_TOKEN` environment variable
- Generate a secure token: `openssl rand -hex 32`

### API URL
- **Frontend** must know how to reach the backend: set `BACKEND_API_URL` (default in Compose: `http://irc-notify-backend:3001`).

### Volume Paths
Edit the volume mounts in `docker-compose.yml` to point to your directories:
- **Config directory**: Mounted to `/app/config` in the backend
  - Contains IRC client/server configs, event handlers, sinks, etc.
- **Logs directory**: Mounted to `/logs` in the backend
  - Contains application logs and debug output

### Port Configuration
- **Frontend**: Default port 3000 (publicly accessible)
  - Change in docker-compose.yml: `ports: - "YOUR_PORT:3000"`
- **Backend**: Port 3001 (internal only, not exposed)

## Architecture

The Docker Compose setup runs two services:

1. **`irc-notify-backend`** - Backend service handling IRC connections and notifications
   - Image: `ghcr.io/hycord/irc-notify:latest`
   - Internal only (no exposed ports)
   - Communicates with frontend via internal Docker network
   
2. **`notifiarr`** - Next.js frontend UI
   - Image: `ghcr.io/hycord/notifiarr:latest`
   - Exposed on port 3000 (configurable)
  - Connects to backend via `BACKEND_API_URL` (e.g., `http://irc-notify-backend:3001`)

Both services share the same API token and communicate over a private Docker network for security.

## Docker Commands

### Using Docker Compose (Recommended)

```bash
# Start both services
docker-compose up -d

# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f notifiarr
docker-compose logs -f irc-notify-backend

# Stop all services
docker-compose down

# Pull latest images and restart
docker-compose pull
docker-compose up -d

# Restart a specific service
docker-compose restart notifiarr
```

### Using Docker Directly

```bash
# Create a network
docker network create notifiarr-network

# Run the backend
docker run -d \
  --name irc-notify-backend \
  --network notifiarr-network \
  -v $(pwd)/config:/app/config \
  -v $(pwd)/logs:/logs \
  -e ENABLE_API=true \
  -e API_PORT=3001 \
  -e API_TOKEN=your-token-here \
  ghcr.io/hycord/irc-notify:latest

# Run the frontend
docker run -d \
  --name notifiarr-ui \
  --network notifiarr-network \
  -p 3000:3000 \
  -e BACKEND_API_URL=http://irc-notify-backend:3001 \
  -e NEXT_PUBLIC_API_TOKEN=your-token-here \
  ghcr.io/hycord/notifiarr:latest

# View logs
docker logs -f notifiarr-ui
docker logs -f irc-notify-backend

# Stop and remove
docker stop notifiarr-ui irc-notify-backend
docker rm notifiarr-ui irc-notify-backend
docker network rm notifiarr-network
```

## Volume Management

### Config Directory
The config directory contains your irc-notify backend configuration:
- `config.json` - Root configuration file
- `clients/` - IRC client definitions
- `servers/` - IRC server definitions
- `events/` - Event handler configurations
- `sinks/` - Notification sink definitions

You can edit these files directly on the host, and the backend will reload automatically.

### Logs Directory
The logs directory contains application logs from the backend. Monitor these for debugging:
```bash
tail -f /path/to/logs/dir/irc-notify.log
```

### Changing Directories
Edit the volume paths directly in `docker-compose.yml`:
```yaml
volumes:
  - /your/custom/config/path:/app/config
  - /your/custom/logs/path:/logs
```

## Security Considerations

### Internal Network Communication
The backend API is **not exposed publicly**. Only the frontend (port 3000) is accessible from outside the Docker network. The backend and frontend communicate via the internal `notifiarr-network`.

### API Token Security
- Generate a strong random token: `openssl rand -hex 32`
- Never commit your `.env` file to version control
- Use the same token for both services

### Network Isolation
The backend only accepts connections from within the Docker network, preventing direct external access to the IRC backend.

## Production Deployment

For production deployments:

1. **Use specific image tags instead of `latest`:**
   ```yaml
   services:
     irc-notify-backend:
       image: ghcr.io/hycord/irc-notify:v1.0.0
     notifiarr:
       image: ghcr.io/hycord/notifiarr:v1.0.0
   ```

2. **Use a reverse proxy (nginx, Traefik, Caddy) for HTTPS**

3. **Consider using Docker secrets for the API token:**
   ```yaml
   services:
     irc-notify-backend:
       secrets:
         - api_token
       environment:
         - API_TOKEN_FILE=/run/secrets/api_token
     notifiarr:
       secrets:
         - api_token
       environment:
         - NEXT_PUBLIC_API_TOKEN_FILE=/run/secrets/api_token
   
   secrets:
     api_token:
       file: ./secrets/api_token.txt
   ```

4. **Set up proper log rotation** for the logs directory

5. **Back up the config directory regularly**

## Troubleshooting

### Frontend cannot connect to backend
Check that both containers are on the same network:
```bash
docker network inspect notifiarr-network
```

### Port already in use
Change the port mapping in `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Expose on port 3001 instead
```

### Token authentication fails
Ensure the same token is set for both services in `docker-compose.yml`:
- Backend: `API_TOKEN=your-token`
- Frontend: `NEXT_PUBLIC_API_TOKEN=your-token`

Verify the environment variables:
```bash
docker exec irc-notify-backend printenv | grep API_TOKEN
docker exec notifiarr-ui printenv | grep NEXT_PUBLIC_API_TOKEN
docker exec notifiarr-ui printenv | grep BACKEND_API_URL
```

### Backend not loading config
Verify the config directory is mounted correctly:
```bash
docker exec irc-notify-backend ls -la /app/config
```

### Container crashes on startup
Check logs for both services:
```bash
docker-compose logs irc-notify-backend
docker-compose logs notifiarr
```

### Permission issues with volumes
Ensure the directories are writable:
```bash
chmod -R 755 config logs
```

## Health Checks

Add health checks to your `docker-compose.yml`:
```yaml
services:
  notifiarr-ui:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```
