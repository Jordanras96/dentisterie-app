FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy source code
COPY tsconfig.json ./
COPY src ./src

EXPOSE 4000

CMD ["npm", "run", "dev"]
