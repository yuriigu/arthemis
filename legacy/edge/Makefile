up: gateway auth

down:
	docker compose down
	docker compose -f services/auth/docker-compose.yml down

logs:
	docker compose logs -f traefik

gateway:
	docker compose up -d

auth:
	$(MAKE) -C services/auth up
