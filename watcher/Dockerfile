# Build Stage
FROM golang:1.25-alpine AS builder

WORKDIR /build

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o /api ./api/

# wkhtmltopdf bin source
FROM surnet/alpine-wkhtmltopdf:3.19.0-0.12.6-full AS wkhtmltopdf-bin

# Final Stage
FROM golang:1.25-alpine

# Install wkhtmltopdf runtime dependencies and fonts
RUN apk add --no-cache \
    libstdc++ \
    libx11 \
    libxrender \
    libxext \
    libssl3 \
    ca-certificates \
    fontconfig \
    freetype \
    ttf-dejavu \
    ttf-droid \
    ttf-freefont \
    ttf-liberation

# Copy wkhtmltopdf binary and shared libraries
COPY --from=wkhtmltopdf-bin /bin/wkhtmltopdf /bin/wkhtmltopdf
COPY --from=wkhtmltopdf-bin /bin/libwkhtmltox* /usr/lib/

WORKDIR /app
COPY --from=builder /api /app/api
CMD ["/app/api"]
