# arthemis-edge

API Gateway do ecossistema Arthemis usando Traefik como reverse proxy de entrada.

O gateway foi preparado para:

- rotear o microserviço `brain`
- rotear o microserviço `watcher`
- autenticar via microserviço `auth`
- hospedar BFFs no mesmo repositório e na mesma rede Docker
- centralizar CORS e middlewares HTTP na borda

## Portas definidas

- `brain`: `8081`
- `watcher`: `8082`
- `auth`: `6769
- faixa sugerida para BFFs: `8091+`
- dashboard do Traefik: `8080`
- entrada HTTP do gateway: `80`
- entrada HTTPS do gateway: `443`

## Rotas públicas

- `/brain/*` -> serviço `brain`
- `/watcher/*` -> serviço `watcher`
- `/auth/*` -> serviço `auth` 
- `/bff/<nome>/*` -> BFF correspondente

Os prefixos `/brain`, `/watcher` e `/auth` são removidos pelo Traefik antes de encaminhar a request para o serviço interno.

## Subida do gateway e auth service local

```bash
make up
```

O Traefik sobe sozinho e lê as rotas a partir dos arquivos em `traefik/dynamic`.
