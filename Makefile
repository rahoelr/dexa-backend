AUTH_COMPOSE := auth-user-service/docker-compose.yml
ATTEND_COMPOSE := attendance-service/docker-compose.yml
GATEWAY_COMPOSE := api-gateway/docker-compose.yml
AUTH_PROJECT := auth
ATTEND_PROJECT := attendance
GATEWAY_PROJECT := gateway
AUTH_PORT ?= 3000
ATTENDANCE_PORT ?= 3001
GATEWAY_PORT ?= 8080

.PHONY: help build up down logs ps restart pull clean up-all down-all
 .PHONY: build-up

help:
	@echo "Targets:"
	@echo "  build       - Build images for all services (per-service compose)"
	@echo "  up          - Start auth, attendance, and gateway"
	@echo "  down        - Stop and remove containers (auth, attendance, gateway)"
	@echo "  logs        - Tail logs for all projects"
	@echo "  ps          - Show status of all projects"
	@echo "  restart     - Restart all projects"
	@echo "  pull        - Pull latest base images"
	@echo "  clean       - Prune unused Docker data"
	@echo "  up-all      - Alias for up"
	@echo "  down-all    - Alias for down"
	@echo "  build-up    - Build then up all services"

build:
	docker compose -p $(AUTH_PROJECT) -f $(AUTH_COMPOSE) build
	docker compose -p $(ATTEND_PROJECT) -f $(ATTEND_COMPOSE) build
	docker compose -p $(GATEWAY_PROJECT) -f $(GATEWAY_COMPOSE) build

up:
	PORT=$(AUTH_PORT) docker compose -p $(AUTH_PROJECT) -f $(AUTH_COMPOSE) up -d
	PORT=$(ATTENDANCE_PORT) docker compose -p $(ATTEND_PROJECT) -f $(ATTEND_COMPOSE) up -d
	PORT=$(GATEWAY_PORT) AUTH_SERVICE_URL=http://host.docker.internal:$(AUTH_PORT) ATTENDANCE_SERVICE_URL=http://host.docker.internal:$(ATTENDANCE_PORT) docker compose -p $(GATEWAY_PROJECT) -f $(GATEWAY_COMPOSE) up -d

down:
	docker compose -p $(GATEWAY_PROJECT) -f $(GATEWAY_COMPOSE) down -v
	docker compose -p $(ATTEND_PROJECT) -f $(ATTEND_COMPOSE) down -v
	docker compose -p $(AUTH_PROJECT) -f $(AUTH_COMPOSE) down -v

logs:
	docker compose -p $(AUTH_PROJECT) -f $(AUTH_COMPOSE) logs -f
	docker compose -p $(ATTEND_PROJECT) -f $(ATTEND_COMPOSE) logs -f
	docker compose -p $(GATEWAY_PROJECT) -f $(GATEWAY_COMPOSE) logs -f

ps:
	docker compose -p $(AUTH_PROJECT) -f $(AUTH_COMPOSE) ps
	docker compose -p $(ATTEND_PROJECT) -f $(ATTEND_COMPOSE) ps
	docker compose -p $(GATEWAY_PROJECT) -f $(GATEWAY_COMPOSE) ps

restart:
	PORT=$(AUTH_PORT) docker compose -p $(AUTH_PROJECT) -f $(AUTH_COMPOSE) restart
	PORT=$(ATTENDANCE_PORT) docker compose -p $(ATTEND_PROJECT) -f $(ATTEND_COMPOSE) restart
	PORT=$(GATEWAY_PORT) AUTH_SERVICE_URL=http://host.docker.internal:$(AUTH_PORT) ATTENDANCE_SERVICE_URL=http://host.docker.internal:$(ATTENDANCE_PORT) docker compose -p $(GATEWAY_PROJECT) -f $(GATEWAY_COMPOSE) restart

pull:
	docker compose -p $(AUTH_PROJECT) -f $(AUTH_COMPOSE) pull
	docker compose -p $(ATTEND_PROJECT) -f $(ATTEND_COMPOSE) pull
	docker compose -p $(GATEWAY_PROJECT) -f $(GATEWAY_COMPOSE) pull

clean:
	docker system prune -f

up-all: up
down-all: down

build-up:
	$(MAKE) build
	$(MAKE) up
