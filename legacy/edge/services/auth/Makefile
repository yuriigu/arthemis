up: docker docs api

docker:
	docker compose up -d

api:
	go fmt ./... ; go run .

docs:
	swag init -g ./main.go -o ./docs

clean:
	rm -rf ./docs ; docker compose down
