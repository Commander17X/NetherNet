FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openjdk-17-jre-headless docker.io \
  && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install --omit=dev

COPY tsconfig.json ./
COPY src ./src
COPY config ./config
RUN npm run build && npm prune --omit=dev

ENV NODE_ENV=production
ENV PORT=8787
EXPOSE 8787
# Partial UDP pool; map the full 19132-19232 range in compose for production
EXPOSE 19132-19142/udp

CMD ["node", "dist/index.js"]