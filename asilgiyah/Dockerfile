FROM node:20-alpine
WORKDIR /app
RUN corepack enable
COPY package.json ./
RUN pnpm install
COPY . .
RUN pnpm prisma generate && pnpm build
EXPOSE 3000
CMD ["pnpm","start"]