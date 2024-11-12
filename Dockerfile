FROM oven/bun:latest AS base
WORKDIR /app

FROM base AS deps

COPY package.json .
COPY bun.lockb .

# RUN apt update && apt install python3 python3-pip make g++ -y

RUN bun install --frozen-lockfile --production

FROM base AS release

# Install packages needed for deployment
# RUN apt-get update -qq && \
#     apt-get install --no-install-recommends -y chromium chromium-sandbox && \
#     rm -rf /var/lib/apt/lists /var/cache/apt/archives

RUN bunx -y playwright@latest install --with-deps chromium
# RUN bunx -y @puppeteer/browsers install chromium@latest --path /tmp/localChromium

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ENV PLAYWRIGHT_BROSWER_PATH="/usr/bin/chromium"

ENTRYPOINT ["bun", "run", "index.ts"]