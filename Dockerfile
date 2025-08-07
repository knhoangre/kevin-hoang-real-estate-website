# Use Node.js 18 as the base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies including development dependencies
RUN npm install --legacy-peer-deps
RUN npm install -g nodemon

# Copy the rest of the application
COPY . .

# Expose port 5173
EXPOSE 5173

# Start the development server with nodemon
CMD ["nodemon", "--exec", "npm run dev -- --host 0.0.0.0 --port 5173", "--watch", ".", "--ext", "ts,tsx,js,jsx,json,css"]
