# Base image for building both frontend and backend
FROM node:20-alpine AS base

# -------------------------
# Build Frontend
# -------------------------
FROM base AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# -------------------------
# Build Backend & Serve
# -------------------------
FROM base AS production
WORKDIR /app

# Copy backend
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production
COPY backend/ ./backend/

# Copy built frontend into backend's static directory (we'll serve it from Express)
COPY --from=frontend-builder /app/frontend/dist ./backend/src/public

# Set working directory to backend to run the server
WORKDIR /app/backend

# We need to expose port 5000 (which Express will use)
EXPOSE 5000

# Environment variables (MongoDB URL and Gemini API key can be overridden)
ENV PORT=5000
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]
