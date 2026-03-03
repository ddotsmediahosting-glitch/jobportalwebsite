FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY tsconfig.base.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
RUN npm install
COPY . .
RUN npm run build -w @uaejobs/shared && npm run build -w @uaejobs/web
EXPOSE 5173
CMD ["npm", "run", "preview", "-w", "@uaejobs/web"]
