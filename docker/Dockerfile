# -------------------------------------------------------
# Stage 1 — install dependencies
# -------------------------------------------------------
FROM node:20-alpine AS deps

WORKDIR /app
COPY package*.json ./
RUN npm ci

# -------------------------------------------------------
# Stage 2 — build the Next.js app
# -------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_ vars must be available at build time (they get baked into the JS bundle)
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# -------------------------------------------------------
# Stage 3 — lean runtime image
# next.config.js output: 'standalone' creates a minimal
# self-contained server in .next/standalone — no need to
# copy all of node_modules into the final image
# -------------------------------------------------------
FROM node:20-alpine AS runtime

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only what the standalone build needs
COPY --from=builder /app/public                    ./public
COPY --from=builder /app/.next/standalone          ./
COPY --from=builder /app/.next/static              ./.next/static

USER appuser

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "server.js"]
