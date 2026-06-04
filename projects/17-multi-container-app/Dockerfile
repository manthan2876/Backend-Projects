# Pull down lightweight, highly optimized base image distributions layers
FROM node:20-alpine

# Set up the internal active execution working directory inside the container runtime path bounds
WORKDIR /usr/src/app

# Clone dependency blueprints over into the filesystem context framework boundaries
COPY package*.json ./

# Execute clean production installation commands layers
RUN npm install --production

# Mount all surrounding application scripts assets over into internal work directories
COPY . .

# Announce internal network port requirements mappings to execution engines
EXPOSE 3000

# Fire up script process workers routines
CMD [ "node", "index.js" ]