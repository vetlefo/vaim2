# Use official Node.js image with build tools
FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Install build dependencies and clean up
RUN apt-get update && apt-get install -y python3 make g++

# Install app dependencies with native module support
COPY package*.json ./
RUN npm install --build-from-source

# Bundle app source
COPY . .

# Clean up build dependencies
RUN apt-get purge -y python3 make g++ && apt-get autoremove -y

# Expose port
EXPOSE 3000

# Run the app
CMD ["npm", "start"]