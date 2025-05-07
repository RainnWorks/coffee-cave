# Multi-stage build Dockerfile for Coffee Cave
# This bundles both frontend and backend into a single image using Turborepo

# Base stage 
FROM node:22-alpine AS base
WORKDIR /app

# Install dependencies for alpine
RUN apk add --no-cache libc6-compat
RUN apk add --no-cache python3 make g++

# Enable corepack for Yarn
RUN corepack enable

# Install global dependencies
ENV YARN_VERSION=4.9.1
RUN yarn set version ${YARN_VERSION}


# Pruner stage - creates a subset of the monorepo with only what we need
FROM base AS pruner
WORKDIR /app
COPY . .

# Prune the monorepo to include only frontend and backend dependencies
# This creates a minimal version of the monorepo with only what we need to build
RUN yarn dlx turbo prune --docker "frontend" "backend"

# Installer stage - installs dependencies from the pruned monorepo
FROM base AS installer
WORKDIR /app

# Copy the pruned package files and lockfile
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/yarn.lock ./yarn.lock

# Install dependencies based on the pruned lockfile
RUN yarn install --immutable

# Copy the pruned source code
COPY --from=pruner /app/out/full/ .
COPY --from=pruner /app/.dmno ./.dmno

# Build the project with Turbo
RUN yarn dmno run -- turbo build --filter=frontend... --filter=backend...

# Production stage
FROM base AS production

# Copy the pruned package files from installer
COPY --from=installer /app/package.json ./package.json
COPY --from=installer /app/yarn.lock ./yarn.lock
COPY --from=installer /app/.yarnrc.yml ./.yarnrc.yml
COPY --from=installer /app/.yarn ./.yarn

# Copy backend and frontend package.json
COPY --from=installer /app/packages/backend/package.json ./packages/backend/package.json
COPY --from=installer /app/packages/frontend/package.json ./packages/frontend/package.json

# Install production dependencies only
RUN yarn install --immutable --production

# Copy built applications
COPY --from=installer /app/packages/backend ./packages/backend
COPY --from=installer /app/packages/frontend/.next ./packages/frontend/.next
COPY --from=installer /app/packages/frontend/public ./packages/frontend/public
COPY --from=installer /app/packages/frontend/next.config.js ./packages/frontend/next.config.js

# Create a start script for running both services
RUN echo '#!/bin/sh\n\
# Start the backend service\ncd /app/packages/backend && node ./scripts/start.js &\n\
# Wait a moment for backend to initialize\nsleep 5\n\
# Start the frontend service\ncd /app/packages/frontend && yarn start\n\
wait' > /app/start.sh && chmod +x /app/start.sh

# Expose only the frontend port externally
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
# Configure the frontend to talk to the backend within the container
ENV BACKEND_API_URL=http://localhost:1111

# Start both services
CMD ["/app/start.sh"]
