ROOT_COMPOSE := docker-compose.yml
ROOT_PROJECT := dexa-backend

.PHONY: help build up down logs ps build-up

help:
	@echo "Targets:"
	@echo "  build    - Build images (root compose)"
	@echo "  up       - Start full stack (root compose)"
	@echo "  down     - Stop stack (root compose)"
	@echo "  logs     - Tail logs (root compose)"
	@echo "  ps       - Show status (root compose)"
	@echo "  build-up - Build then up (root compose)"

build:
	docker compose -p $(ROOT_PROJECT) -f $(ROOT_COMPOSE) build

up:
	docker compose -p $(ROOT_PROJECT) -f $(ROOT_COMPOSE) up -d

down:
	docker compose -p $(ROOT_PROJECT) -f $(ROOT_COMPOSE) down

logs:
	docker compose -p $(ROOT_PROJECT) -f $(ROOT_COMPOSE) logs -f

ps:
	docker compose -p $(ROOT_PROJECT) -f $(ROOT_COMPOSE) ps

build-up:
	$(MAKE) build
	$(MAKE) up
