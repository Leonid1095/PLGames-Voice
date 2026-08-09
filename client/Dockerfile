# ============================================
# Stage 1: Build the web client
# ============================================
FROM node:24-alpine AS builder

RUN apk add --no-cache git python3 make g++

# Enable corepack but pin no version here: it takes pnpm from package.json's
# "packageManager", which makes that field the single source of truth. Pinning
# a second version in this file is what let the image build with 10.28.1 while
# anyone running pnpm locally got 10.10.0 out of the packageManager field — and
# a lockfile written by one and installed by the other does not survive.
RUN corepack enable

WORKDIR /build

# Copy workspace config files for dependency resolution
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./

# Copy all package.json files for workspace packages
COPY packages/stoat.js/package.json packages/stoat.js/
COPY packages/solid-livekit-components/package.json packages/solid-livekit-components/
COPY packages/js-lingui-solid/packages/babel-plugin-lingui-macro/package.json packages/js-lingui-solid/packages/babel-plugin-lingui-macro/
COPY packages/js-lingui-solid/packages/babel-plugin-extract-messages/package.json packages/js-lingui-solid/packages/babel-plugin-extract-messages/
COPY packages/js-lingui-solid/packages/jest-mocks/package.json packages/js-lingui-solid/packages/jest-mocks/
COPY packages/client/package.json packages/client/

# Copy panda config needed by client's "prepare" lifecycle script (panda codegen)
COPY packages/client/panda.config.ts packages/client/

# Install dependencies. --frozen-lockfile makes pnpm-lock.yaml authoritative:
# without it the lockfile in the repo was advisory, the image quietly
# re-resolved whatever it liked, and a drifted lock only showed up as a build
# failure much later.
RUN pnpm install --frozen-lockfile

# Submodules:
# In CI: actions/checkout@v4 with submodules: recursive handles this automatically.
# Locally: run `git submodule update --init --recursive` before `docker build`.
COPY packages/ packages/

# Build sub-dependencies (stoat.js, livekit-components, lingui plugins, panda css etc)
RUN pnpm --filter stoat.js build && \
  pnpm --filter solid-livekit-components build && \
  pnpm --filter @lingui-solid/babel-plugin-lingui-macro build && \
  pnpm --filter @lingui-solid/babel-plugin-extract-messages build && \
  pnpm --filter client exec lingui compile --typescript && \
  pnpm --filter client exec node scripts/copyAssets.mjs && \
  pnpm --filter client exec panda codegen 

# Build the client with placeholder env vars for runtime injection 
# these are replaced by inject.js at container run startup
ENV VITE_API_URL=__VITE_API_URL__
ENV VITE_WS_URL=__VITE_WS_URL__
ENV VITE_MEDIA_URL=__VITE_MEDIA_URL__
ENV VITE_PROXY_URL=__VITE_PROXY_URL__
ENV VITE_GIFBOX_URL=__VITE_GIFBOX_URL__
ENV VITE_HCAPTCHA_SITEKEY=__VITE_HCAPTCHA_SITEKEY__
ENV VITE_GIPHY_API_KEY=__VITE_GIPHY_API_KEY__
ENV BASE_PATH=/

ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN pnpm --filter client exec vite build

# ============================================
# Stage 2: Minimal runtime image
# ============================================
FROM node:24-alpine

WORKDIR /app

# Copy the server package and install dependencies
COPY docker/package.json docker/inject.js ./
RUN npm install --omit=dev

# Copy built static assets stage 1
COPY --from=builder /build/packages/client/dist ./dist

# inject.js rewrites assets into dist_injected/ at startup, so /app must be
# writable by the runtime user. node:alpine ships a `node` user (uid 1000);
# drop root entirely.
RUN chown -R node:node /app

EXPOSE 5000

# Runtime env vars (overridden by Helm chart / docker run)
ENV VITE_API_URL=""
ENV VITE_WS_URL=""
ENV VITE_MEDIA_URL=""
ENV VITE_PROXY_URL=""
ENV VITE_GIFBOX_URL=""
ENV VITE_HCAPTCHA_SITEKEY=""
ENV VITE_GIPHY_API_KEY=""
ENV REVOLT_PUBLIC_URL=""

USER node
CMD ["npm", "start"]
