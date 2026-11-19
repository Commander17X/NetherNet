FROM eclipse-temurin:21-jre-jammy AS jre

FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*

COPY --from=jre /opt/java/openjdk /opt/java/openjdk
ENV JAVA_HOME=/opt/java/openjdk
ENV PATH="${JAVA_HOME}/bin:${PATH}"
ENV JAVA_BIN=/opt/java/openjdk/bin/java

WORKDIR /srv
COPY shared /srv/shared
COPY relay/package.json relay/package-lock.json /srv/relay/

WORKDIR /srv/relay
RUN npm ci --omit=dev \
  && mkdir -p /opt/geyser /data \
  && curl -fsSL -o /opt/geyser/Geyser-Standalone.jar \
    https://download.geysermc.org/v2/projects/geyser/versions/latest/builds/latest/downloads/standalone

COPY relay /srv/relay

ENV PORT=8787 \
    PUBLIC_HOST=127.0.0.1 \
    DATA_DIR=/data \
    GEYSER_JAR=/opt/geyser/Geyser-Standalone.jar \
    JAVA_BIN=java \
    PORT_RANGE_START=19132 \
    PORT_RANGE_END=19151 \
    SESSION_TTL_MS=1200000 \
    MAX_SESSIONS=8 \
    NODE_ENV=production

EXPOSE 8787
VOLUME ["/data"]
CMD ["npx", "tsx", "src/index.ts"]
