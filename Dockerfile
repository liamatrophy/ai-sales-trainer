# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build the Astro site
RUN npm run build

# Production stage - Node.js server with WebSocket proxy
FROM node:20-alpine

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built static files
COPY --from=build /app/dist ./dist

# Copy server file
COPY server.js ./

# Expose port 8080 (Cloud Run uses this)
EXPOSE 8080

# Start the Node.js server
CMD ["node", "server.js"]
