# „Energy Management System”

**„Distributed Event-Driven Microservices Platform”**  
**„Assignment 3 – WebSockets, Chat, Load Balancing”**

## „Overview”

Acest proiect implementează o „platformă distribuită de management energetic”, construită folosind o „arhitectură de microservicii orientată pe evenimente (event-driven)”.

Sistemul simulează date de consum energetic, le procesează asincron folosind un „message broker”, agregă consumul orar și livrează „notificări în timp real” și „mesaje de chat” prin „WebSocket”.

Arhitectura respectă principii cloud-native:
- „each service owns its database”
- „communication is asynchronous where possible”
- „single API Gateway (Traefik)”
- „JWT-based security”
- „scalable consumers with load balancing”

## „Architecture Summary”

### „Core Components”

| Component | Description |
|---|---|
| „Traefik” | „Reverse proxy / API Gateway” |
| „RabbitMQ” | „Message broker (topic exchanges)” |
| „PostgreSQL” | „Database per microservice” |
| „Spring Boot” | „Core backend services” |
| „Node.js” | „WebSocket + load balancer” |
| „React SPA” | „Frontend” |

## „Services”

### „auth-service”
- „login / register”
- emite „JWT”
- endpoint intern pentru ForwardAuth: `/internal/verify`
- DB: „authdb”

### „user-service”
- „profiles / roles / admin CRUD” (doar „ROLE_ADMIN”)
- publică: `user.created`, `user.deleted`
- DB: „userdb”

### „device-service”
- CRUD pentru „devices”
- „cascade delete” la ștergerea unui user
- publică: `device.created`
- consumă: `user.created`, `user.deleted`
- DB: „devicedb”

### „monitoring-service”
- consumă evenimente de măsurare din RabbitMQ
- agregă consumul „kWh / oră (UTC)”
- detectează supraconsum
- REST: `GET /api/consumption/day`
- DB: „monitoringdb”

### „monitoring-worker-2”
- al doilea consumator pentru ingest (procesare paralelă)
- scrie în aceeași DB: „monitoringdb”

## „Messaging & Realtime”

### „simulator”
- producer Python
- publică: `device.<id>.reading`
- exchange: `ems.data`

### „load-balancer”
- consumă o singură coadă brută (ex: `lb.raw`) din `ems.data`
- redistribuie „round-robin” către:
  - `monitoring.ingest.1`
  - `monitoring.ingest.2`

### „ws-service”
- WebSocket gateway
- autentificare JWT
- endpoint: `ws://app.localhost/ws?token=<JWT>`
- distribuie evenimente din `ems.ws` către clienți

### „support-service”
- chatbot „rule-based” (10 reguli) + fallback AI opțional
- REST:
  - `POST /api/support/messages`
  - `POST /api/support/admin/reply`
  - `GET  /api/support/history`
- publică evenimente chat în `ems.ws`

## „RabbitMQ”

### „Exchanges”
- `ems.data` – „device readings”
- `ems.sync` – „user/device synchronization”
- `ems.ws` – „chat & notifications”

### „Event Types”
- `user.created`
- `user.deleted`
- `device.created`
- `device.<id>.reading`
- `notify.overconsumption`
- `chat.message`

## „REST API Routing”

Toate request-urile trec prin „Traefik”.

| Path | Destination |
|---|---|
| `/` | Frontend SPA |
| `/api/auth/*` | auth-service |
| `/api/users/*` | user-service |
| `/api/devices/*` | device-service |
| `/api/consumption/*` | monitoring-service |
| `/api/support/*` | support-service |
| `/ws` | ws-service |

Regulă Traefik (ca să nu „mănânce” SPA-ul request-urile către API):

```yaml
traefik.http.routers.web.rule: Host(`app.localhost`) && !PathPrefix(`/api`)
```

Notă: în Markdown NU trebuie să „escape-uiești” caracterele `/` (scrii simplu `/api`). Backslash (`\`) se folosește doar când chiar vrei să afișezi backslash sau în contexte precum regex / escaping.

## „Swagger UI”

| Service | URL |
|---|---|
| auth-service | http://app.localhost/api/auth/swagger-ui.html |
| user-service | http://app.localhost/api/users/swagger-ui.html |
| device-service | http://app.localhost/api/devices/swagger-ui.html |
| monitoring-service | http://app.localhost/api/consumption/swagger-ui.html |

## „Local Development”

Domain: `http://app.localhost`

Start:

```bash
docker compose up --build
```

Simulator mai rapid:

```bash
INTERVAL_SECONDS=5 DEVICE_ID=7 docker compose up simulator
```

## „Quick Theory Answers (3.1)”

- „Queue vs Topic”: queue = point-to-point (un consumer pe mesaj); topic = pub/sub (broadcast către subscriber-i).
- „Point-to-Point vs Publish-Subscribe”: P2P = work queue; Pub/Sub = broadcast.
- „MOM rol”: decuplare producători/consumatori, routing, livrare fiabilă, bufferizare.

## „Contact”

„This project was developed as a Distributed Systems laboratory assignment for an Energy Management Platform.”
