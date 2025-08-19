FROM node:18-slim

# Install OpenSSL, a dependency for Prisma's query engine
RUN apt-get update && apt-get install -y openssl

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Copy Prisma schema to allow client generation during npm install
COPY prisma ./prisma/

# Install app dependencies
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the application's source code
COPY . .

# The app binds to port 3001
EXPOSE 3001

# Command to run the app using ts-node-dev for hot-reloading
CMD ["npm", "run", "dev"]