FROM golang:1.21-alpine AS builder
LABEL service="cnc-mayyanks-edge-agent"
WORKDIR /app
COPY go.mod .
COPY *.go .
COPY adapters/ adapters/
RUN CGO_ENABLED=0 GOOS=linux go build -o cnc-edge-agent .

FROM alpine:3.19
WORKDIR /app
COPY --from=builder /app/cnc-edge-agent .
EXPOSE 8004
CMD ["./cnc-edge-agent"]
