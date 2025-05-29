FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Build TypeScript
RUN npm run build

# Set environment variables
ENV NODE_ENV=production

# Run the server
ENTRYPOINT ["node", "index.js"]
