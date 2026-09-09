# Build Stage
FROM golang:1.25-alpine AS builder

WORKDIR /build

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o /api ./api/

# Final Stage
FROM golang:1.25-alpine

COPY --from=builder /api /api
CMD ["/api"]
