FROM oven/bun:latest

# Set up workspace directory for the entire project
WORKDIR /workspace
COPY package.json ./
COPY bun.lockb* ./
COPY tsconfig*.json ./
COPY yarn.lock* ./

# Copy shared package and other needed workspace files
COPY apps/shared /workspace/apps/shared

# Install workspace dependencies
RUN bun install

# Copy server code and package.json
COPY apps/server /workspace/apps/server

# Install server-specific dependencies
WORKDIR /workspace/apps/server
RUN bun install

# Stay in server directory as working directory
EXPOSE 3000
EXPOSE 8080

# Run the server
CMD ["bun", "run", "dev"]
