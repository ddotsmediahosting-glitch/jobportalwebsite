FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN npm install
COPY . .
RUN npm run build -w @uaejobs/shared && npm run prisma:generate -w @uaejobs/api && npm run build -w @uaejobs/api
EXPOSE 4000
CMD ["sh", "-c", "npm run prisma:push -w @uaejobs/api && npm run seed -w @uaejobs/api && npm run start -w @uaejobs/api"]

