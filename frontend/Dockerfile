FROM node:18-slim

# Set the working directory in the container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Expose the port Vite runs on
EXPOSE 3000

# The --host flag is crucial for exposing the server outside the container
CMD ["npm", "run", "dev"]