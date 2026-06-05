# Use an official Node runtime as a parent image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# 🆕 CACHE BUSTING LAYER: Forces Docker to re-run everything below this line
ARG CACHE_BUST=1

# Copy package configurations and install dependencies fresh
COPY package.json ./
RUN npm install

# Copy the rest of your microservice source files
COPY . .

# Launch the service using native node execution loops
CMD ["node", "index.js"]