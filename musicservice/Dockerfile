# Build stage
FROM golang:1.21-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git ca-certificates tzdata gcc musl-dev

# Set working directory
WORKDIR /app

# Copy go mod files first (for better caching)
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application with optimizations
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s -extldflags "-static"' \
    -a -installsuffix cgo \
    -o music-service ./cmd/server

# Final stage
FROM alpine:latest

# Install runtime dependencies
RUN apk --no-cache add ca-certificates tzdata wget

# Create non-root user
RUN addgroup -g 1001 appgroup && \
    adduser -u 1001 -G appgroup -s /bin/sh -D appuser

# Set working directory
WORKDIR /app

# Copy binary from builder stage
COPY --from=builder /app/music-service .

# Create uploads directory with proper permissions
RUN mkdir -p /app/uploads/audio /app/uploads/temp /app/uploads/covers && \
    chown -R appuser:appgroup /app && \
    chmod -R 755 /app/uploads

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8081

# Health check - usar GET en lugar de HEAD y curl en lugar de wget
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider --method=GET http://localhost:8081/health || exit 1

# Command to run
CMD ["./music-service"]