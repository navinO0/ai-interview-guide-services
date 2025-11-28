# Use official Node LTS as the base image
FROM node:18-alpine


# Create app directory
WORKDIR /usr/src/app


# Install app dependencies
COPY package*.json ./
RUN npm ci --only=production


# Copy app source
COPY . .


# Expose port (change if your app uses a different port)
EXPOSE 3000


# Start the app
CMD ["node", "server.js"]