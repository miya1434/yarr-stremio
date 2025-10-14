ARG NODE_VERSION=20.11.1
ARG PNPM_VERSION=8.15.4
ARG TS_VERSION=5.3.3

# Builder stage
FROM node:${NODE_VERSION} AS build

WORKDIR /usr/src/app

RUN npm install -g typescript@${TS_VERSION}
RUN --mount=type=cache,target=/root/.npm \
    npm install -g pnpm@${PNPM_VERSION}

COPY package.json ./
COPY patches ./patches/

RUN pnpm install --ignore-scripts
RUN pnpm rebuild esbuild

COPY . .

RUN pnpm run build

# Runner stage
FROM node:${NODE_VERSION}-slim AS final

COPY package.json .
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist

ENV NODE_ENV=production

USER node

EXPOSE 58827

CMD ["npm", "start"]