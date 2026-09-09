FROM golang:1.25-alpine AS builder

WORKDIR /build

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o /auth .

FROM golang:1.25-alpine

WORKDIR /app

COPY --from=builder /auth /auth
COPY .env ./.env

CMD ["/auth"]
