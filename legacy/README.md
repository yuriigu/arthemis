# Arthemis legacy — stack reduzida

Stack reduzida do legado (sem minio e sem traefik). Sobe: **brain**, **watcher**, **auth**, **front**, **postgres** + **seed** (one-shot, cria o admin).

## Subir somente o legado

```bash
cd arthemis/legacy
docker compose up -d --build
```

A seed roda sozinha após `auth`+`brain` ficarem saudáveis e cria o acesso inicial (idempotente — re-`up` não duplica).

## Acesso inicial (seed automática)

| Onde | Credencial |
|---|---|
| Front `http://localhost:5173/login` | usuário `admin` / senha `admin123` |
| API auth `POST http://localhost:6769/login/` | `{"username":"admin","password":"admin123"}` |

Sobrescrever via env (ou `.env` ao lado do compose):

```bash
SEED_ADMIN_USERNAME=admin SEED_ADMIN_PASSWORD=admin123 \
SEED_ADMIN_ROLE=admin SEED_ADMIN_EMAIL=admin@arthemis.local \
docker compose up -d --build
```

Ver o que a seed fez: `docker logs arthemis-legacy-seed`.

## Derrubar somente o legado

```bash
docker compose down
```

### Derrubar + apagar dados do banco

```bash
docker compose down -v
```

## Limpar para subir o `arthemis/apps` (sem conflito de portas)

```bash
docker compose down -v --remove-orphans
docker container prune -f
docker volume prune -f
docker image prune -af
```

## Portas expostas

| Serviço | URL |
|---|---|
| Front (dev) | http://localhost:5173 |
| Brain | http://localhost:8091 |
| Watcher | http://localhost:8092 |
| Auth | http://localhost:6769 |

> O banco PostgreSQL roda em `localhost:5432` (interna ao stack).
> Não há Traefik nem MinIO nesta versão reduzida.
