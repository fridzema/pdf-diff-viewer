# Multi-stage Dockerfile for PDF Diff Viewer
# Optimized for production deployment with Bun + Nuxt 3

# Stage 1: Dependencies
FROM oven/bun:1.3.4-alpine AS deps
WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile --production=false

# Stage 2: Builder
FROM oven/bun:1.3.4-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code (includes workers/ and lib/ for TypeScript compilation)
COPY . .

# Build the application (Vite handles worker bundling and asset hashing)
RUN bun run build

# Stage 3: Production runner
FROM oven/bun:1.3.4-alpine AS runner
WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nuxt

# Copy built application from builder
COPY --from=builder --chown=nuxt:nodejs /app/.output /app/.output
COPY --from=builder --chown=nuxt:nodejs /app/package.json /app/package.json

# Switch to non-root user
USER nuxt

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD bun run -e 'fetch("http://localhost:3000/").then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))'

# Start the application
CMD ["bun", "run", ".output/server/index.mjs"]
