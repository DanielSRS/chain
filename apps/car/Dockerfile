FROM node:24-alpine

# Set up workspace directory for the entire project
WORKDIR /workspace
COPY package.json ./
COPY yarn.lock ./
COPY .yarnrc.yml ./
COPY tsconfig*.json ./

# Copy shared package and other needed workspace files
COPY apps/shared /workspace/apps/shared

RUN corepack enable

# Install workspace dependencies
RUN yarn install

# Copy car app code
COPY apps/car /workspace/apps/car

# Install car-specific dependencies
WORKDIR /workspace/apps/car
RUN yarn install

# Expose any needed ports
EXPOSE 3001

# Run the car app
CMD ["yarn", "dev"]
# CMD ["pwd"]
