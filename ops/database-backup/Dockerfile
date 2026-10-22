# syntax=docker/dockerfile:1
ARG POSTGRES_MAJOR=16
FROM node:22-bookworm-slim AS dependencies
WORKDIR /app
COPY ops/database-backup/package.json ops/database-backup/package-lock.json ./
RUN --mount=type=secret,id=proxy_ca \
    if [ -f /run/secrets/proxy_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/proxy_ca; fi; \
    npm ci --omit=dev --ignore-scripts --strict-ssl=true

FROM postgres:${POSTGRES_MAJOR}-bookworm
COPY --from=dependencies /usr/local/bin/node /usr/local/bin/node
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --chmod=0444 scripts/database-backup.mjs ./database-backup.mjs
USER postgres
ENTRYPOINT []
CMD ["node", "/app/database-backup.mjs", "backup"]
