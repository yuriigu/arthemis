# Traefik 3.1 (imagem já compilada, sem build de origem).
FROM traefik:v3.1

# Configurações do traefik são montadas via bind-mount no runtime
# (via docker-compose.yml: ./traefik/traefik.yml e ./traefik/dynamic).
# O Dockerfile aqui serve apenas para manter o caminho de build consistente.
ENV TRAEFIK_API_INSECURE=true
