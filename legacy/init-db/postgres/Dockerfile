# PostgreSQL 16 — build a partir do Debian (sem puxar imagem oficial do postgres).
FROM debian:bookworm-slim AS postgres

ENV PG_MAJOR=16
ENV LANG=C.UTF-8
ENV DEBIAN_FRONTEND=noninteractive

# Instala o PostgreSQL a partir do repositório Debian
RUN apt-get update && apt-get install -y --no-install-recommends postgresql-$PG_MAJOR && rm -rf /var/lib/apt/lists/*

# Script de inicialização: garante que o cluster existe e o servidor sobe
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER postgres
WORKDIR /var/lib/postgresql/data

EXPOSE 5432

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["postgres"]
