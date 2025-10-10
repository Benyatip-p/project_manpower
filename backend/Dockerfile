# Stage 1: Build the application
FROM golang:1.24.5 AS builder

WORKDIR /app

# Copy go.mod and go.sum to download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the application source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o /main ./cmd/api

# Stage 2: Create a minimal final image
FROM alpine:latest

WORKDIR /

# Copy the built binary from the builder stage
COPY --from=builder /main /main

# Expose port 8080
EXPOSE 8080

# Command to run the executable
CMD ["/main"]